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
from .perplexity_client import PerplexityClient

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

    def post(self, request):
        try:
            data = request.data
            user = request.user

            # Create the lead magnet
            lead_magnet = LeadMagnet.objects.create(
                title=data.get('title'),
                description=data.get('description', ''),
                owner=user,
                status='draft'
            )

            # Generate AI content if generation_data is provided
            generation_data = data.get('generation_data', {})
            if generation_data:
                # Get user's firm profile
                firm_profile = {}
                try:
                    firm_profile_obj = user.firm_profile
                    firm_profile = {
                        'firm_name': firm_profile_obj.firm_name,
                        'work_email': firm_profile_obj.work_email,
                        'phone_number': firm_profile_obj.phone_number,
                        'firm_website': firm_profile_obj.firm_website,
                        'industry': 'Architecture'
                    }
                except Exception:
                    # Use default firm profile if none exists
                    firm_profile = {
                        'firm_name': user.email.split('@')[0],
                        'work_email': user.email,
                        'industry': 'Architecture'
                    }

                # Generate AI content (with timeout handling)
                ai_client = PerplexityClient()
                ai_content = None
                try:
                    ai_content = ai_client.generate_lead_magnet_json(
                        user_answers=generation_data,
                        firm_profile=firm_profile
                    )
                    ai_client.debug_ai_content(ai_content)
                except Exception as e:
                    print(f"⚠️ AI content generation failed: {e}")
                    ai_content = {}
                # If AI content generation failed, store empty content
                if not ai_content:
                    print("ℹ️ AI content generation failed - storing empty content")
                    ai_content = {}
                
                # Create generation data record (always store user's selections)
                LeadMagnetGeneration.objects.create(
                    lead_magnet=lead_magnet,
                    lead_magnet_type=generation_data.get('lead_magnet_type'),
                    main_topic=generation_data.get('main_topic'),
                    target_audience=generation_data.get('target_audience', []),
                    audience_pain_points=generation_data.get('audience_pain_points', []),
                    desired_outcome=generation_data.get('desired_outcome'),
                    call_to_action=generation_data.get('call_to_action'),
                    special_requests=generation_data.get('special_requests', '')
                )

                # Store template selection; include AI content if available
                TemplateSelection.objects.create(
                    user=user,
                    lead_magnet=lead_magnet,
                    template_id="professional-guide",
                    template_name="Professional Guide Template",
                    captured_answers=generation_data,
                    ai_generated_content=ai_content if ai_content is not None else {},
                    source='create-lead-magnet',
                    status='content-generated' if ai_content else 'content-pending'
                )

            serializer = LeadMagnetSerializer(lead_magnet)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
            
            # Update lead magnet status to in-progress as soon as a template is selected
            lead_magnet.status = 'in-progress'
            lead_magnet.save(update_fields=['status'])
            
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
    """Generate PDF with selected template using AI or manual content"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        print("🚀 PDF Generation Started...")
        print(f"📦 Request data: {request.data}")
        
        template_id = request.data.get('template_id')
        lead_magnet_id = request.data.get('lead_magnet_id')
        use_ai_content = request.data.get('use_ai_content', True)
        manual_variables = request.data.get('variables', {})
        user_answers = request.data.get('user_answers', {})
        
        print(f"🔍 Lead Magnet ID: {lead_magnet_id}")
        print(f"🔍 Use AI Content: {use_ai_content}")
        print(f"🔍 User Answers: {user_answers}")
        
        if not template_id:
            return Response({'error': 'template_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not lead_magnet_id:
            return Response({'error': 'lead_magnet_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get lead magnet and template selection
            lead_magnet = LeadMagnet.objects.get(id=lead_magnet_id, owner=request.user)
            template_selection = TemplateSelection.objects.filter(lead_magnet=lead_magnet).first()
            
            # If no template selection exists, create one with the specified template_id
            if not template_selection:
                template_selection = TemplateSelection.objects.create(
                    user=request.user,
                    lead_magnet=lead_magnet,
                    template_id=template_id,
                    template_name="Modern Guide Template",
                    source='create-lead-magnet'
                )
            
            template_service = DocRaptorService()
            ai_client = PerplexityClient()
            
            # Build firm profile dict
            firm_profile = {}
            try:
                fp = FirmProfile.objects.get(user=request.user)
                firm_profile = {
                    'firm_name': fp.firm_name,
                    'work_email': fp.work_email,
                    'phone_number': fp.phone_number,
                    'firm_website': fp.firm_website,
                    'primary_brand_color': fp.primary_brand_color,
                    'secondary_brand_color': fp.secondary_brand_color,
                    'logo_url': fp.logo.url if fp.logo else '',
                    'industry': 'Architecture'
                }
            except FirmProfile.DoesNotExist:
                firm_profile = {
                    'firm_name': request.user.email.split('@')[0],
                    'work_email': request.user.email,
                    'primary_brand_color': '',
                    'secondary_brand_color': '',
                    'logo_url': '',
                    'industry': 'Architecture'
                }
            # Merge firm details from user-provided answers so cover and contacts are never empty
            answers_source = {}
            if isinstance(user_answers, dict) and user_answers:
                answers_source = user_answers
            elif template_selection and isinstance(template_selection.captured_answers, dict):
                answers_source = template_selection.captured_answers or {}
            answers_fp = answers_source.get('firm_profile') or answers_source
            for src_key, dst_key in [
                ('firm_name', 'firm_name'),
                ('work_email', 'work_email'),
                ('phone_number', 'phone_number'),
                ('firm_website', 'firm_website'),
                ('tagline', 'tagline'),
                ('primary_brand_color', 'primary_brand_color'),
                ('secondary_brand_color', 'secondary_brand_color'),
                ('logo_url', 'logo_url'),
            ]:
                val = answers_fp.get(src_key)
                if isinstance(val, str):
                    val = val.strip()
                if val:
                    firm_profile[dst_key] = val
            print(f"🔧 Firm Profile (merged): {firm_profile}")
            
            # Decide which content to use
            if use_ai_content:
                # Prefer fresh answers; else reuse captured answers; else reuse stored AI content
                answers_for_ai = user_answers if (isinstance(user_answers, dict) and user_answers) else (template_selection.captured_answers if template_selection else {})
                try:
                    if answers_for_ai:
                        ai_content = ai_client.generate_lead_magnet_json(
                            user_answers=answers_for_ai,
                            firm_profile=firm_profile
                        )
                        ai_client.debug_ai_content(ai_content)
                        print("✅ AI Content Generated")
                        # Persist generated content
                        if template_selection:
                            template_selection.ai_generated_content = ai_content
                            template_selection.captured_answers = answers_for_ai
                            template_selection.save(update_fields=['ai_generated_content', 'captured_answers'])
                    elif template_selection and template_selection.ai_generated_content:
                        ai_content = template_selection.ai_generated_content
                        ai_client.debug_ai_content(ai_content)
                        print("ℹ️ Using existing AI content from template selection")
                    else:
                        ai_content = {}
                        print("⚠️ No AI content available; proceeding with empty content")
                except Exception as e:
                    import traceback
                    print(f"❌ AI content generation failed: {str(e)}")
                    print(traceback.format_exc())
                    ai_content = {}
                
                # Map AI content to template variables and force firm info fallbacks
                template_vars = ai_client.map_to_template_vars(ai_content, firm_profile)
                # Ensure cover/contact never empty
                template_vars['companyName'] = template_vars.get('companyName') or firm_profile.get('firm_name', 'Your Company')
                template_vars['companySubtitle'] = template_vars.get('companySubtitle') or firm_profile.get('tagline', '')
                template_vars['emailAddress'] = template_vars.get('emailAddress') or firm_profile.get('work_email', '')
                template_vars['phoneNumber'] = template_vars.get('phoneNumber') or firm_profile.get('phone_number', '')
                template_vars['website'] = template_vars.get('website') or firm_profile.get('firm_website', '')
                template_vars['documentSubtitle'] = template_vars.get('documentSubtitle') or firm_profile.get('tagline', '')
                non_empty = {k: v for k, v in template_vars.items() if str(v).strip()}
                missing_keys = [k for k, v in template_vars.items() if not str(v).strip()]
                print(f"✅ Template Variables Mapped: {len(non_empty)} non-empty, {len(missing_keys)} missing")
                result = template_service.generate_pdf_with_ai_content(template_id, template_vars)
                print(f"🛠️ Service result: keys={list(result.keys())}")
            else:
                # Fallback to manual variables with sensible defaults
                default_vars = {
                    'primaryColor': '#8B4513',
                    'secondaryColor': '#D2691E',
                    'accentColor': '#F4A460',
                    'companyName': firm_profile.get('firm_name', 'Your Company'),
                    'mainTitle': 'PROFESSIONAL GUIDE',
                    'customContent1': ''
                }
                template_vars = {**default_vars, **(manual_variables or {})}
                result = template_service.generate_pdf(template_id, template_vars)
                print(f"🛠️ Service result: keys={list(result.keys())}")
                # Do not set status here; only on success below
            
            if result.get('success'):
                # Mark lead magnet completed
                lead_magnet.status = 'completed'
                lead_magnet.save(update_fields=['status'])

                # Update template selection status to pdf-generated only on success
                if template_selection:
                    template_selection.status = 'pdf-generated'
                    template_selection.save(update_fields=['status'])
                
                pdf_data = result.get('pdf_data', b'')
                print(f"✅ PDF generation successful, size: {len(pdf_data)} bytes")
                response = HttpResponse(pdf_data, content_type='application/pdf')
                filename = result.get('filename', f'lead-magnet-{template_id}.pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                print("✅ PDF Response Ready")
                return response
            else:
                print(f"❌ PDF generation failed: {result.get('error')}")
                return Response({'error': 'PDF generation failed', 'details': result.get('error')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except LeadMagnet.DoesNotExist:
            return Response({'error': 'Lead magnet not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"❌ PDF Generation Error: {str(e)}")
            print(f"🔍 Stack Trace: {traceback.format_exc()}")
            return Response({'error': 'PDF generation failed', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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