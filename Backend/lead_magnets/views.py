from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.db import transaction
from .models import (
    LeadMagnet, Lead, Download, FirmProfile, LeadMagnetGeneration,
    FormaAIConversation, TemplateSelection
)
from .serializers import (
    LeadMagnetSerializer, LeadSerializer, DashboardStatsSerializer,
    FirmProfileSerializer, LeadMagnetGenerationSerializer, CreateLeadMagnetSerializer
)
from .services import APITemplateService

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's lead magnets
        user_lead_magnets = LeadMagnet.objects.filter(owner=user)
        
        # Calculate stats
        total_lead_magnets = user_lead_magnets.count()
        active_lead_magnets = user_lead_magnets.filter(
            Q(status='completed') | Q(status='in-progress')
        ).count()
        
        # Get total downloads for user's lead magnets
        total_downloads = Download.objects.filter(
            lead_magnet__owner=user
        ).count()
        
        # Get total leads generated for user's lead magnets
        leads_generated = Lead.objects.filter(
            lead_magnet__owner=user
        ).count()
        
        stats = {
            'total_lead_magnets': total_lead_magnets,
            'active_lead_magnets': active_lead_magnets,
            'total_downloads': total_downloads,
            'leads_generated': leads_generated
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

class LeadMagnetListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadMagnetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnet.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class LeadMagnetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeadMagnetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LeadMagnet.objects.filter(owner=self.request.user)

class FirmProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FirmProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = FirmProfile.objects.get_or_create(user=self.request.user)
        return profile

class CreateLeadMagnetView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateLeadMagnetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        data = serializer.validated_data
        
        # Update or create firm profile if provided
        if 'firm_profile' in data:
            profile, created = FirmProfile.objects.get_or_create(user=user)
            firm_serializer = FirmProfileSerializer(profile, data=data['firm_profile'], partial=True)
            if firm_serializer.is_valid():
                firm_serializer.save()
        
        # Create the lead magnet
        lead_magnet = LeadMagnet.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            owner=user,
            status='in-progress'
        )
        
        # Create the generation data
        generation_data = data['generation_data']
        LeadMagnetGeneration.objects.create(
            lead_magnet=lead_magnet,
            **generation_data
        )
        
        # Return the created lead magnet
        return Response(
            LeadMagnetSerializer(lead_magnet).data,
            status=status.HTTP_201_CREATED
        )

class ListTemplatesView(APIView):
    """Get all available PDF templates from APITemplate.io with preview images"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            template_service = APITemplateService()
            templates = template_service.list_templates(include_previews=True)
            
            return Response({
                'success': True,
                'templates': templates,
                'count': len(templates)
            })
        except ValueError as e:
            # API key not configured
            return Response({
                'success': False,
                'error': 'API configuration error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            # Network or API errors
            return Response({
                'success': False,
                'error': 'Failed to fetch templates from APITemplate.io',
                'details': str(e)
            }, status=status.HTTP_502_BAD_GATEWAY)

class SelectTemplateView(APIView):
    """Handle template selection for a lead magnet"""
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        lead_magnet_id = request.data.get('lead_magnet_id')
        template_id = request.data.get('template_id')
        template_name = request.data.get('template_name')
        template_thumbnail = request.data.get('template_thumbnail', '')
        captured_answers = request.data.get('captured_answers', {})
        source = request.data.get('source', 'create-lead-magnet')
        
        if not all([lead_magnet_id, template_id, template_name]):
            return Response({
                'error': 'lead_magnet_id, template_id, and template_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate source is one of the permitted choices
        valid_sources = [choice[0] for choice in TemplateSelection.SOURCE_CHOICES]
        if source not in valid_sources:
            return Response({
                'error': f'Invalid source. Must be one of: {", ".join(valid_sources)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the lead magnet
            lead_magnet = LeadMagnet.objects.get(id=lead_magnet_id, owner=request.user)
            
            # Create or update template selection
            template_selection, created = TemplateSelection.objects.update_or_create(
                lead_magnet=lead_magnet,
                defaults={
                    'user': request.user,
                    'template_id': template_id,
                    'template_name': template_name,
                    'template_thumbnail': template_thumbnail,
                    'captured_answers': captured_answers,
                    'source': source,
                    'status': 'template-selected'
                }
            )
            
            return Response({
                'success': True,
                'template_selection_id': template_selection.id,
                'message': 'Template selected successfully'
            }, status=status.HTTP_201_CREATED)
            
        except LeadMagnet.DoesNotExist:
            return Response({
                'error': 'Lead magnet not found'
            }, status=status.HTTP_404_NOT_FOUND)

class FormaAIConversationView(APIView):
    """Handle Forma AI conversations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        message = request.data.get('message')
        files = request.data.get('files', [])
        conversation_id = request.data.get('conversation_id')
        
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create conversation
        if conversation_id:
            try:
                conversation = FormaAIConversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
            except FormaAIConversation.DoesNotExist:
                return Response({
                    'error': 'Conversation not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            conversation = FormaAIConversation.objects.create(
                user=request.user,
                messages=[]
            )
        
        # Add user message to conversation
        conversation.messages.append({
            'role': 'user',
            'content': message,
            'files': files
        })
        
        # TODO: Send to OpenAI/Perplexity when API key is available
        # For now, just store the message
        ai_response = "I've received your message. AI integration will be added when the OpenAI API key is configured."
        
        conversation.messages.append({
            'role': 'assistant',
            'content': ai_response
        })
        
        conversation.save()
        
        return Response({
            'success': True,
            'conversation_id': conversation.id,
            'response': ai_response,
            'messages': conversation.messages
        })
