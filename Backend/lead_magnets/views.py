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
from .services import render_template

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
                        print("❌ No AI content available; cannot proceed")
                        return Response({'error': 'AI content not available'}, status=status.HTTP_400_BAD_REQUEST)
                except Exception as e:
                    import traceback
                    print(f"❌ AI content generation failed: {str(e)}")
                    print(traceback.format_exc())
                    return Response({'error': 'AI content generation failed', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                # Validate AI JSON schema before mapping
                if not isinstance(ai_content, dict) or 'cover' not in ai_content or not ai_content.get('sections'):
                    keys = list(ai_content.keys()) if isinstance(ai_content, dict) else []
                    print(f"❌ AI JSON missing expected keys: {keys}")
                    return Response({'error': "AI content invalid — missing 'cover' or 'sections'"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Map AI content to template variables and force firm info fallbacks
                template_vars = ai_client.map_to_template_vars(ai_content, firm_profile)
                
                # Ensure sections from ai_content are added to template_vars if present
                if 'sections' in ai_content and isinstance(ai_content['sections'], list) and len(ai_content['sections']) > 0:
                    print(f"✅ Adding {len(ai_content['sections'])} sections from ai_content to template_vars")
                    template_vars['sections'] = ai_content['sections']
                
                # Check for flattened template variables that are actually used in the template
                flattened_keys_present = False
                flattened_sections_count = 0
                for i in range(1, 10):  # Check for flattened variables (increased range to 10)
                    if f'customTitle{i}' in template_vars and template_vars[f'customTitle{i}'] and f'customContent{i}' in template_vars and template_vars[f'customContent{i}']:
                        flattened_keys_present = True
                        flattened_sections_count += 1
                        print(f"✅ Found populated flattened variables for section {i}: {template_vars[f'customTitle{i}']}")
                
                if flattened_keys_present:
                    print(f"✅ Found {flattened_sections_count} populated flattened sections in template_vars")
                
                # Ensure cover/contact never empty
                template_vars['companyName'] = template_vars.get('companyName') or firm_profile.get('firm_name', 'Your Company')
                template_vars['companySubtitle'] = template_vars.get('companySubtitle') or firm_profile.get('tagline', '')
                template_vars['emailAddress'] = template_vars.get('emailAddress') or firm_profile.get('work_email', '')
                template_vars['phoneNumber'] = template_vars.get('phoneNumber') or firm_profile.get('phone_number', '')
                template_vars['website'] = template_vars.get('website') or firm_profile.get('firm_website', '')
                template_vars['documentSubtitle'] = template_vars.get('documentSubtitle') or firm_profile.get('tagline', '')
                
                # If mainTitle is missing but we have a flattened title, use it
                if 'mainTitle' not in template_vars or not template_vars['mainTitle']:
                    for i in range(1, 10):
                        if f'customTitle{i}' in template_vars and template_vars[f'customTitle{i}']:
                            template_vars['mainTitle'] = template_vars[f'customTitle{i}'].upper()
                            print(f"✅ Set mainTitle from customTitle{i}: {template_vars['mainTitle']}")
                            break
                
                non_empty = {k: v for k, v in template_vars.items() if str(v).strip()}
                missing_keys = [k for k, v in template_vars.items() if not str(v).strip()]
                print(f"✅ Template Variables Mapped: {len(non_empty)} non-empty, {len(missing_keys)} missing")
                print(f"🔍 Template vars keys: {list(template_vars.keys())}")
                
                # Debug key template variables
                debug_keys = ['mainTitle', 'companyName', 'sections', 'accentColor', 'primaryColor']
                for key in debug_keys:
                    if key in template_vars:
                        value = template_vars[key]
                        if isinstance(value, dict) or isinstance(value, list):
                            print(f"🔍 {key}: {type(value)} with {len(value)} items")
                        else:
                            print(f"🔍 {key}: {value}")
                    else:
                        print(f"❌ Missing key template variable: {key}")
                
                # Validate only keys actually required by the template
                required_keys = ['mainTitle', 'companyName']
                missing_required = [key for key in required_keys if key not in template_vars or not template_vars[key]]
                
                # Enhanced logging for content validation
                print(f"🔍 Content validation - Required keys: {required_keys}")
                print(f"🔍 Content validation - Missing keys: {missing_required}")
                
                # Flag to track if we've successfully recovered content
                content_recovered = False
                
                if missing_required:
                    print(f"⚠️ Missing required content for PDF generation: {missing_required}")
                    print(f"🔄 Attempting content recovery from AI response...")
                    print("="*50)
                    print("📋 CONTENT RECOVERY PROCESS STARTED")
                    print("="*50)
                    
                    # Attempt to recover missing content from AI content if possible
                    if 'mainTitle' in missing_required and ai_content:
                        # Try multiple paths to find a title in the AI content
                        print(f"🔍 Searching for mainTitle in AI content structure...")
                        if 'cover' in ai_content and 'title' in ai_content['cover']:
                            template_vars['mainTitle'] = ai_content['cover']['title']
                            content_recovered = True
                            print(f"✅ Recovered mainTitle from AI content cover: {template_vars['mainTitle']}")
                        elif 'title' in ai_content:
                            template_vars['mainTitle'] = ai_content['title']
                            content_recovered = True
                            print(f"✅ Recovered mainTitle from AI content root: {template_vars['mainTitle']}")
                        # If still missing after checks, leave as missing to fail fast
                    
                    if 'companyName' in missing_required:
                        # Try to get company name from firm profile
                        if firm_profile and 'firm_name' in firm_profile and firm_profile['firm_name']:
                            template_vars['companyName'] = firm_profile['firm_name']
                            content_recovered = True
                            print(f"✅ Recovered companyName from firm profile: {template_vars['companyName']}")
                        # Do not create fallback company name; fail fast if absent
                    
                    # Re-check missing required keys after recovery attempts
                    missing_required = [key for key in required_keys if key not in template_vars or not template_vars[key]]
                    
                    if content_recovered:
                        print("✅ Successfully recovered missing content")
                    else:
                        print("⚠️ Failed to recover missing content")
                    
                    print("="*50)
                    print("📋 CONTENT RECOVERY PROCESS COMPLETED")
                    print("="*50)
                    
                    # Additional recovery paths for mainTitle
                    if 'mainTitle' in missing_required and ai_content:
                        if 'style' in ai_content and 'title' in ai_content['style']:
                            template_vars['mainTitle'] = ai_content['style']['title']
                            content_recovered = True
                            print(f"✅ Recovered mainTitle from AI style: {template_vars['mainTitle']}")
                        else:
                            print(f"❌ Could not find mainTitle in AI content structure")
                    
                    # Sections are optional for this template because we map into
                    # flattened placeholders (customTitle1, customContent1, etc.)
                    # We'll still validate if present below.
                
                # Verify sections content is properly structured and fix if needed
                if 'sections' in template_vars and isinstance(template_vars['sections'], list):
                    print(f"🔍 Validating structure of {len(template_vars['sections'])} sections")
                    sections_fixed = False
                    section_issues = 0
                    
                    for i, section in enumerate(template_vars['sections']):
                        if not isinstance(section, dict) or 'title' not in section or 'content' not in section:
                            print(f"⚠️ Section {i} is malformed, fixing structure")
                            sections_fixed = True
                            section_issues += 1
                            
                            # Convert non-dict sections to dict if needed
                            if not isinstance(section, dict):
                                template_vars['sections'][i] = {
                                    'title': f"Section {i+1}",
                                    'content': str(section)
                                }
                                continue
                                
                            # Ensure required fields exist
                            if 'title' not in section:
                                section['title'] = f"Section {i+1}"
                            if 'content' not in section:
                                section['content'] = "Content unavailable"
                    
                    if sections_fixed:
                        content_recovered = True
                        print(f"✅ Fixed {section_issues} malformed sections structure")
                    else:
                        print(f"✅ All sections have valid structure")
                
                # Final validation before PDF generation
                critical_missing = [key for key in required_keys if key not in template_vars or not template_vars[key]]
                if critical_missing:
                    print(f"❌ Critical content missing for PDF generation: {critical_missing}")
                    result = {
                        'success': False,
                        'error': 'Missing critical content for PDF generation',
                        'details': f'Required content missing: {critical_missing}',
                        'missing_keys': critical_missing
                    }
                else:
                    print(f"🚀 Proceeding with PDF generation - Content validation passed")
                    # Add timing information
                    import time
                    start_time = time.time()
                    print(f"⏱️ Starting PDF generation at {time.strftime('%H:%M:%S')}")
                    
                    try:
                        print(f"📊 PDF Generation Stats - Template ID: {template_id}")
                        print(f"📊 PDF Generation Stats - Template Variables Keys: {list(template_vars.keys())}")
                        print(f"📊 PDF Generation Stats - Sections Count: {len(template_vars.get('sections', []))}")
                        
                        result = template_service.generate_pdf_with_ai_content(template_id, template_vars)
                        
                        elapsed_time = time.time() - start_time
                        print(f"⏱️ PDF generation completed in {elapsed_time:.2f} seconds")
                    except Exception as e:
                        elapsed_time = time.time() - start_time
                        print(f"❌ PDF generation failed after {elapsed_time:.2f} seconds")
                        print(f"❌ Exception: {str(e)}")
                        result = {
                            'success': False,
                            'error': f'Exception during PDF generation: {str(e)}',
                            'details': 'An unexpected error occurred during PDF generation'
                        }
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
                print("\n" + "="*50)
                print("📋 PDF GENERATION COMPLETED SUCCESSFULLY")
                print("="*50)
                print(f"✅ PDF generated successfully for lead magnet ID: {lead_magnet.id}")
                
                lead_magnet.status = 'completed'
                lead_magnet.save(update_fields=['status'])

                # Update template selection status to pdf-generated only on success
                if template_selection:
                    print(f"✅ Updating template selection ID: {template_selection.id} to 'pdf-generated'")
                    template_selection.status = 'pdf-generated'
                    template_selection.save(update_fields=['status'])
                
                pdf_data = result.get('pdf_data', b'')
                print(f"✅ PDF generation successful, size: {len(pdf_data)} bytes")
                response = HttpResponse(pdf_data, content_type='application/pdf')
                filename = result.get('filename', f'lead-magnet-{template_id}.pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                print("✅ PDF Response Ready")
                print("="*50)
                return response
            else:
                # Handle PDF generation failure
                error_message = result.get('error', 'Unknown error during PDF generation')
                details = result.get('details', '')
                missing_keys = result.get('missing_keys', [])
                
                print("\n" + "="*50)
                print("❌ PDF GENERATION FAILED")
                print("="*50)
                print(f"❌ PDF generation failed: {error_message}")
                print(f"❌ Details: {details}")
                
                # Keep status in a valid state; do not set to an invalid choice
                print(f"⚠️ Keeping lead magnet status as 'in-progress' due to failure")
                lead_magnet.status = 'in-progress'
                lead_magnet.save(update_fields=['status'])
                
                # Update template selection if it exists
                if template_selection:
                    print(f"⚠️ Reverting template selection ID: {template_selection.id} to 'template-selected' status")
                    template_selection.status = 'template-selected'
                    template_selection.save(update_fields=['status'])
                
                # If missing keys were identified, try to recover and regenerate
                if missing_keys and ai_content:
                    print(f"🔄 Attempting to recover missing content and regenerate PDF")
                    
                    # Try to recover missing content directly from AI content
                    recovered = False
                    for key in missing_keys:
                        if key == 'mainTitle' and 'cover' in ai_content and 'title' in ai_content['cover']:
                            template_vars['mainTitle'] = ai_content['cover']['title']
                            recovered = True
                            print(f"🔄 Recovered mainTitle: {template_vars['mainTitle']}")
                        elif key == 'sections' and 'sections' in ai_content:
                            template_vars['sections'] = ai_content['sections']
                            recovered = True
                            print(f"🔄 Recovered sections: {len(template_vars['sections'])} sections")
                        # Do not create default fallbacks; only use AI content or firm data
                    
                    # Do not synthesize sections; require AI-provided sections or flattened content
                    
                    if recovered:
                        # Try generating PDF again with recovered content
                        print("🔄 Regenerating PDF with recovered content")
                        result = template_service.generate_pdf_with_ai_content(template_id, template_vars)
                        
                        if result.get('success'):
                            pdf_data = result.get('pdf_data')
                            content_type = result.get('content_type', 'application/pdf')
                            filename = result.get('filename', 'lead-magnet.pdf')
                            
                            print(f"✅ PDF regenerated successfully after content recovery")
                            
                            response = HttpResponse(pdf_data, content_type=content_type)
                            response['Content-Disposition'] = f'attachment; filename="{filename}"'
                            return response
                
                print("="*50)
                # If recovery failed or wasn't attempted, return error response
                return Response({'error': 'PDF generation failed', 'details': error_message, 'lead_magnet_id': lead_magnet.id}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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

class GenerateDocumentPreviewView(APIView):
    """Generate dynamic HTML preview using AI JSON and Jinja2 without fallbacks"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            user_answers = request.data.get('user_answers')
            firm_profile = request.data.get('firm_profile')
            template_id = request.data.get('template_id', 'modern-guide')

            if not isinstance(user_answers, dict) or not isinstance(firm_profile, dict):
                return Response({'error': 'user_answers and firm_profile must be provided as objects'}, status=status.HTTP_400_BAD_REQUEST)

            ai_client = PerplexityClient()
            ai_data = ai_client.generate_lead_magnet_json(user_answers=user_answers, firm_profile=firm_profile)
            template_vars = ai_client.map_to_template_vars(ai_data, firm_profile)

            # Load template HTML
            templates_dir = os.path.join(settings.BASE_DIR, 'lead_magnets', 'templates')
            template_path = os.path.join(templates_dir, 'Template.html')
            with open(template_path, 'r', encoding='utf-8') as f:
                template_html = f.read()

            final_html = render_template(template_html, template_vars)

            # Optionally save preview HTML alongside existing preview method
            service = DocRaptorService()
            preview_path = service._save_preview_html(template_id, final_html)

            return Response({
                'success': True,
                'preview_html': final_html,
                'preview_path': preview_path
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"❌ GenerateDocumentPreviewView error: {e}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)