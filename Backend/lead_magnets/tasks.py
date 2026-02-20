import logging
import uuid
from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from django.core.files.base import ContentFile
from .models import LeadMagnet, FirmProfile, LeadMagnetGeneration, TemplateSelection, PDFJob
from .perplexity_client import PerplexityClient
from .services import DocRaptorService


logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_pdf_job_task(self, job_id, user_id, template_id, lead_magnet_id, use_ai_content=True, user_answers=None, architectural_images=None):
    try:
        job = PDFJob.objects.get(id=job_id)
    except PDFJob.DoesNotExist:
        return

    if job.status in (PDFJob.STATUS_COMPLETED, PDFJob.STATUS_PROCESSING):
        return

    job.status = PDFJob.STATUS_PROCESSING
    job.error = ""
    job.file_url = ""
    job.save(update_fields=["status", "error", "file_url", "updated_at"])

    UserModel = get_user_model()

    try:
        user = UserModel.objects.get(id=user_id)
    except UserModel.DoesNotExist:
        job.status = PDFJob.STATUS_FAILED
        job.error = "User not found"
        job.save(update_fields=["status", "error", "updated_at"])
        return

    try:
        with transaction.atomic():
            try:
                lead_magnet = LeadMagnet.objects.select_for_update().get(id=lead_magnet_id, owner=user)
            except LeadMagnet.DoesNotExist:
                job.status = PDFJob.STATUS_FAILED
                job.error = "Lead magnet not found"
                job.save(update_fields=["status", "error", "updated_at"])
                return

            template_selection = TemplateSelection.objects.filter(lead_magnet=lead_magnet).first()

            try:
                fp = FirmProfile.objects.get(user=user)
                firm_profile = {
                    "firm_name": fp.firm_name or user.email.split("@")[0],
                    "work_email": fp.work_email or user.email,
                    "phone_number": fp.phone_number,
                    "firm_website": fp.firm_website,
                    "primary_brand_color": fp.primary_brand_color,
                    "secondary_brand_color": fp.secondary_brand_color,
                    "logo_url": fp.logo.url if fp.logo else "",
                    "industry": "Architecture",
                }
            except FirmProfile.DoesNotExist:
                firm_profile = {
                    "firm_name": user.email.split("@")[0],
                    "work_email": user.email,
                    "phone_number": "",
                    "firm_website": "",
                    "primary_brand_color": "",
                    "secondary_brand_color": "",
                    "logo_url": "",
                    "industry": "Architecture",
                }

            required_firm_fields = ["firm_name"]
            missing_firm = [k for k in required_firm_fields if not str(firm_profile.get(k, "")).strip()]
            if missing_firm:
                if "firm_name" in missing_firm:
                    firm_profile["firm_name"] = user.email.split("@")[0]
                    missing_firm.remove("firm_name")
                if missing_firm:
                    job.status = PDFJob.STATUS_FAILED
                    job.error = "Missing firm profile fields"
                    job.save(update_fields=["status", "error", "updated_at"])
                    return

            ai_client = PerplexityClient()
            ai_content = None
            template_vars = {}

            if use_ai_content:
                answers_for_ai = user_answers or (template_selection.captured_answers if template_selection else {})

                if not answers_for_ai:
                    try:
                        gen_data = lead_magnet.generation_data
                        answers_for_ai = {
                            "lead_magnet_type": gen_data.lead_magnet_type,
                            "main_topic": gen_data.main_topic,
                            "target_audience": gen_data.target_audience,
                            "audience_pain_points": gen_data.audience_pain_points,
                            "desired_outcome": gen_data.desired_outcome,
                            "call_to_action": gen_data.call_to_action,
                            "special_requests": gen_data.special_requests,
                        }
                    except Exception:
                        pass

                if not answers_for_ai:
                    job.status = PDFJob.STATUS_FAILED
                    job.error = "AI content not available"
                    job.save(update_fields=["status", "error", "updated_at"])
                    return

                logger.info("PDFJob: before AI generate", extra={"job_id": str(job.id), "lead_magnet_id": str(lead_magnet_id)})
                ai_content = ai_client.generate_lead_magnet_json(user_answers=answers_for_ai, firm_profile=firm_profile)
                ai_client.debug_ai_content(ai_content)
                template_vars = ai_client.map_to_template_vars(ai_content, firm_profile)
                if not str(template_vars.get("companyName", "")).strip():
                    template_vars["companyName"] = firm_profile.get("firm_name") or ""
                logger.info("PDFJob: after AI generate", extra={"job_id": str(job.id), "template_keys": list(template_vars.keys())})
                if template_selection:
                    template_selection.ai_generated_content = ai_content
                    template_selection.captured_answers = answers_for_ai
                    template_selection.save(update_fields=["ai_generated_content", "captured_answers"])
            else:
                template_vars = {
                    "primaryColor": firm_profile.get("primary_brand_color") or "",
                    "secondaryColor": firm_profile.get("secondary_brand_color") or "",
                    "accentColor": "",
                    "companyName": firm_profile.get("firm_name") or "",
                    "mainTitle": (user_answers or {}).get("main_topic") or "",
                    "documentSubtitle": (user_answers or {}).get("desired_outcome") or "",
                    "emailAddress": firm_profile.get("work_email") or "",
                    "phoneNumber": firm_profile.get("phone_number") or "",
                    "website": firm_profile.get("firm_website") or "",
                }

            if isinstance(architectural_images, list) and architectural_images:
                try:
                    img_list = []
                    for i, img in enumerate(architectural_images[:3]):
                        if isinstance(img, str) and ";base64," in img:
                            img_list.append({"src": img, "alt": f"Architectural Image {i+1}"})
                    if img_list:
                        template_vars["architecturalImages"] = img_list
                except Exception:
                    pass

            required_keys = ["mainTitle", "companyName"]
            missing = [k for k in required_keys if not str(template_vars.get(k, "")).strip()]
            if missing:
                job.status = PDFJob.STATUS_FAILED
                job.error = "Missing critical content for PDF generation"
                job.save(update_fields=["status", "error", "updated_at"])
                return

            template_service = DocRaptorService()

            logger.info("PDFJob: before PDF generation", extra={"job_id": str(job.id), "lead_magnet_id": str(lead_magnet_id)})
            result = template_service.generate_pdf_with_ai_content(template_id, template_vars)
            logger.info("PDFJob: after PDF generation", extra={"job_id": str(job.id), "lead_magnet_id": str(lead_magnet_id), "success": bool(result.get("success"))})

            if not result.get("success"):
                error_message = result.get("error", "Unknown error during PDF generation")
                details = result.get("details", "")
                full_error = f"{error_message}: {details}" if details else error_message
                job.status = PDFJob.STATUS_FAILED
                job.error = full_error
                job.save(update_fields=["status", "error", "updated_at"])
                return

            pdf_data = result.get("pdf_data")
            if not pdf_data:
                job.status = PDFJob.STATUS_FAILED
                job.error = "PDF data missing from generation result"
                job.save(update_fields=["status", "error", "updated_at"])
                return

            filename = result.get("filename") or f"lead-magnet-{template_id}.pdf"

            content = ContentFile(pdf_data, name=filename)
            lead_magnet.pdf_file.save(filename, content, save=True)
            lead_magnet.status = "completed"
            lead_magnet.save(update_fields=["status"])

            job.status = PDFJob.STATUS_COMPLETED
            try:
                job.file_url = lead_magnet.pdf_file.url
            except Exception:
                job.file_url = ""
            job.save(update_fields=["status", "file_url", "updated_at"])
    except Exception as e:
        logger.exception("PDFJob: unexpected exception", extra={"job_id": str(job_id)})
        job.status = PDFJob.STATUS_FAILED
        job.error = str(e)
        job.save(update_fields=["status", "error", "updated_at"])
