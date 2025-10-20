import os
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.db import transaction
from django.conf import settings
from django.http import HttpResponse
from .models import (
    LeadMagnet, Lead, Download, FirmProfile, LeadMagnetGeneration,
    FormaAIConversation, TemplateSelection
)
from .serializers import (
    LeadMagnetSerializer, LeadSerializer, DashboardStatsSerializer,
    FirmProfileSerializer, LeadMagnetGenerationSerializer, CreateLeadMagnetSerializer
)
from .services import DocRaptorService

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
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LeadMagnet
from .serializers import CreateLeadMagnetSerializer, LeadMagnetSerializer


class CreateLeadMagnetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateLeadMagnetSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            lead_magnet = serializer.save()
            return Response(
                LeadMagnetSerializer(lead_magnet).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class CreateLeadMagnetView(APIView):
#     permission_classes = [permissions.IsAuthenticated]
    
#     @transaction.atomic
#     def post(self, request):
#         serializer = CreateLeadMagnetSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         user = request.user
#         data = serializer.validated_data
        
#         # Update or create firm profile if provided
#         if 'firm_profile' in data:
#             profile, created = FirmProfile.objects.get_or_create(user=user)
#             firm_serializer = FirmProfileSerializer(profile, data=data['firm_profile'], partial=True)
#             if firm_serializer.is_valid():
#                 firm_serializer.save()
        
#         # Create the lead magnet
#         lead_magnet = LeadMagnet.objects.create(
#             title=data['title'],
#             description=data.get('description', ''),
#             owner=user,
#             status='in-progress'
#         )
        
#         # Create the generation data
#         generation_data = data['generation_data']
#         LeadMagnetGeneration.objects.create(
#             lead_magnet=lead_magnet,
#             **generation_data
#         )
        
        # Return the created lead magnet
        return Response(
            LeadMagnetSerializer(lead_magnet).data,
            status=status.HTTP_201_CREATED
        )

class ListTemplatesView(APIView):
    """Get all available PDF templates from DocRaptor service"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            template_service = DocRaptorService()
            templates = template_service.list_templates()

            # Add preview URLs
            for template in templates:
                template_id = template['id']
                preview_filename = f"{template_id}.jpg"
                preview_path = os.path.join(settings.MEDIA_ROOT, 'template_previews', preview_filename)

                if os.path.exists(preview_path):
                    template['preview_url'] = request.build_absolute_uri(
                        f"{settings.MEDIA_URL}template_previews/{preview_filename}"
                    )
                else:
                    # fallback to default preview
                    template['preview_url'] = request.build_absolute_uri(
                        f"{settings.MEDIA_URL}template_previews/default.jpg"
                    )

            return Response({
                'success': True,
                'templates': templates,
                'count': len(templates)
            })

        except ValueError as e:
            return Response({
                'success': False,
                'error': 'API configuration error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to fetch templates',
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

class GeneratePDFView(APIView):
    """Generate PDF with selected template and AI-generated content"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        template_id = request.data.get('template_id')
        lead_magnet_id = request.data.get('lead_magnet_id')
        use_ai_content = request.data.get('use_ai_content', True)
        variables = request.data.get('variables', {})
        
        if not template_id:
            return Response({
                'error': 'template_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template_service = DocRaptorService()
            
            if use_ai_content and lead_magnet_id:
                # Get lead magnet and its generation data
                try:
                    lead_magnet = LeadMagnet.objects.get(
                        id=lead_magnet_id, 
                        owner=request.user
                    )
                    
                    # Get generation data and firm profile
                    generation_data = LeadMagnetGeneration.objects.filter(
                        lead_magnet=lead_magnet
                    ).first()
                    
                    firm_profile = FirmProfile.objects.filter(
                        user=request.user
                    ).first()
                    
                    if generation_data:
                        # Convert generation data to dictionary for AI processing
                        user_answers = {
                            'main_topic': generation_data.main_topic,
                            'lead_magnet_type': generation_data.lead_magnet_type,
                            'target_audience': generation_data.target_audience,
                            'desired_outcome': generation_data.desired_outcome,
                            'key_challenges': generation_data.key_challenges,
                            'unique_value_proposition': generation_data.unique_value_proposition,
                            'content_depth': generation_data.content_depth,
                            'call_to_action': generation_data.call_to_action,
                        }
                        
                        # Convert firm profile to dictionary
                        firm_profile_dict = {}
                        if firm_profile:
                            firm_profile_dict = {
                                'firm_name': firm_profile.firm_name,
                                'work_email': firm_profile.work_email,
                                'phone_number': firm_profile.phone_number,
                                'firm_website': firm_profile.firm_website,
                                'firm_size': firm_profile.firm_size,
                                'industry_specialties': firm_profile.industry_specialties,
                                'location': firm_profile.location,
                            }
                        
                        # Generate PDF with AI content
                        result = template_service.generate_pdf_with_ai_content(
                            template_id, 
                            user_answers, 
                            firm_profile_dict
                        )
                    else:
                        # Fallback to regular PDF generation
                        result = template_service.generate_pdf(template_id, variables)
                        
                except LeadMagnet.DoesNotExist:
                    return Response({
                        'error': 'Lead magnet not found'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                # Generate PDF with provided variables
                result = template_service.generate_pdf(template_id, variables)
            
            if result['success']:
                # Update lead magnet status if provided
                if lead_magnet_id:
                    try:
                        lead_magnet = LeadMagnet.objects.get(
                            id=lead_magnet_id, 
                            owner=request.user
                        )
                        lead_magnet.status = 'completed'
                        
                        # Store AI-generated content if available
                        if 'ai_content' in result:
                            # Create or update template selection with AI content
                            template_selection, created = TemplateSelection.objects.get_or_create(
                                lead_magnet=lead_magnet,
                                defaults={
                                    'user': request.user,
                                    'template_id': template_id,
                                    'template_name': 'Professional Guide Template',
                                    'ai_generated_content': result['ai_content'],
                                    'status': 'pdf-generated'
                                }
                            )
                            if not created:
                                template_selection.ai_generated_content = result['ai_content']
                                template_selection.status = 'pdf-generated'
                                template_selection.save()
                        
                        lead_magnet.save()
                    except LeadMagnet.DoesNotExist:
                        pass
                
                # Return PDF as downloadable response
                response = HttpResponse(
                    result['pdf_content'],
                    content_type='application/pdf'
                )
                response['Content-Disposition'] = f'attachment; filename="{result["filename"]}"'
                return response
            else:
                return Response({
                    'error': 'PDF generation failed',
                    'details': result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': 'PDF generation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PreviewTemplateView(APIView):
    """Preview template with custom variables"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        template_id = request.data.get('template_id')
        variables = request.data.get('variables', {})
        
        if not template_id:
            return Response({
                'error': 'template_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            template_service = DocRaptorService()
            preview_html = template_service.preview_template(template_id, variables)
            
            return Response({
                'success': True,
                'preview_html': preview_html
            })
            
        except Exception as e:
            return Response({
                'error': 'Preview generation failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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