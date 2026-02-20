from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from .models import FormaAIConversation
from .perplexity_client import PerplexityClient
from .services import DocRaptorService
from .revision_prompts import build_revision_request
from .models import FirmProfile


class FormaAIRevisionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        conversation_id = request.data.get("conversation_id")
        if not conversation_id:
            return Response({"error": "conversation_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conversation = FormaAIConversation.objects.get(id=conversation_id, user=request.user)
        except FormaAIConversation.DoesNotExist:
            return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)

        if not conversation.ai_generated_content:
            return Response({"error": "No generated content available for revision"}, status=status.HTTP_400_BAD_REQUEST)

        revision_payload = {
            "revision_type": request.data.get("revision_type"),
            "target_section": request.data.get("target_section"),
            "section_index": request.data.get("section_index"),
            "tone": request.data.get("tone"),
            "instructions": request.data.get("instructions"),
            "focus_audience": request.data.get("focus_audience"),
            "strengthen_conversion": bool(request.data.get("strengthen_conversion", False)),
            "title_alternatives": bool(request.data.get("title_alternatives", False)),
        }

        try:
            try:
                fp = FirmProfile.objects.get(user=request.user)
                firm_profile = {
                    "firm_name": fp.firm_name,
                    "work_email": fp.work_email,
                    "phone_number": fp.phone_number,
                    "firm_website": fp.firm_website,
                    "primary_brand_color": fp.primary_brand_color,
                    "secondary_brand_color": fp.secondary_brand_color,
                    "logo_url": fp.logo.url if fp.logo else "",
                    "industry": "Architecture",
                }
            except FirmProfile.DoesNotExist:
                firm_profile = {
                    "firm_name": request.user.email.split("@")[0],
                    "work_email": request.user.email,
                    "phone_number": "",
                    "firm_website": "",
                    "primary_brand_color": "",
                    "secondary_brand_color": "",
                    "logo_url": "",
                    "industry": "Architecture",
                }

            ai_client = PerplexityClient()
            revision_request = build_revision_request(conversation.ai_generated_content, revision_payload, firm_profile)
            updated_ai = ai_client.revise_lead_magnet_json(conversation.ai_generated_content, revision_request, firm_profile)

            template_vars = ai_client.map_to_template_vars(updated_ai, firm_profile)
            template_service = DocRaptorService()

            conversation.ai_generated_content = updated_ai
            conversation.template_vars = template_vars
            conversation.save(update_fields=["ai_generated_content", "template_vars", "updated_at"])

            result = template_service.generate_pdf_with_ai_content("modern-guide", template_vars)
            if not result.get("success"):
                return Response(
                    {
                        "error": result.get("error", "PDF generation failed"),
                        "details": result.get("details", ""),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            pdf_data = result.get("pdf_data", b"")
            if not pdf_data:
                return Response(
                    {
                        "error": "PDF data missing from generation result",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            from django.http import HttpResponse

            response = HttpResponse(pdf_data, content_type=result.get("content_type", "application/pdf"))
            filename = result.get("filename", "forma-ai-revision.pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            import traceback

            trace = traceback.format_exc() if settings.DEBUG else None
            payload = {"error": "Revision failed", "details": str(e)}
            if trace:
                payload["trace"] = trace
            return Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

