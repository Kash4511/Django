import os
import re
import requests
from typing import Dict, Any, List
from django.conf import settings


class DocRaptorService:
    """Service for handling PDF template operations using DocRaptor API"""
    
    def __init__(self):
        self.api_key = os.getenv('DOCRAPTOR_API_KEY')
        self.base_url = "https://api.docraptor.com/docs"
        self.templates_dir = os.path.join(settings.BASE_DIR, 'lead_magnets', 'templates')
        # Use env-driven test mode; default to True for safety
        self.test_mode = str(os.getenv('DOCRAPTOR_TEST_MODE', 'true')).lower() in ('1', 'true', 'yes')

    def list_templates(self) -> List[Dict[str, Any]]:
        template_path = os.path.join(self.templates_dir, 'Template.html')
        return [
            {
                'id': 'modern-guide',
                'name': 'Modern Guide Template',
                'description': 'Single template rendered from lead_magnets/templates/Template.html',
                'category': 'guide',
                'path': template_path,
            }
        ]

    def render_template_with_vars(self, template_id: str, variables: Dict[str, Any]) -> str:
        template_path = os.path.join(self.templates_dir, 'Template.html')
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        def replace_var(match):
            key = match.group(1).strip()
            return str(variables.get(key, ''))

        rendered_html = re.sub(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", replace_var, html_content)

        # Diagnostics: missing or leftover placeholders
        placeholders = re.findall(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", html_content)
        missing_keys = [k for k in set(placeholders) if k not in variables or not str(variables.get(k, '')).strip()]
        leftover_placeholders = re.findall(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", rendered_html)
        snippet = rendered_html[:400].replace('\n', ' ')
        print(f"🧪 DEBUG: Template path: {template_path}")
        print(f"🧪 DEBUG: Provided keys: {sorted(list(variables.keys()))[:20]}")
        print(f"🧪 DEBUG: Missing or empty keys: {sorted(missing_keys)[:20]}")
        print(f"🧪 DEBUG: Leftover placeholders after render: {sorted(set(leftover_placeholders))[:20]}")
        print(f"🧪 DEBUG: Rendered HTML sample: {snippet}")
        print(f"🧪 DEBUG: Rendered HTML length: {len(rendered_html)}")

        return rendered_html

    def _save_preview_html(self, template_id: str, rendered_html: str) -> str:
        preview_dir = os.path.join(settings.MEDIA_ROOT, 'template_previews')
        os.makedirs(preview_dir, exist_ok=True)
        preview_path = os.path.join(preview_dir, f'{template_id}-rendered.html')
        try:
            with open(preview_path, 'w', encoding='utf-8') as f:
                f.write(rendered_html)
            print(f"🧪 DEBUG: Saved rendered HTML preview to {preview_path}")
        except Exception as e:
            print(f"⚠️ DEBUG: Failed to save preview HTML: {e}")
        return preview_path

    def _build_mock_pdf_bytes(self, template_id: str) -> bytes:
        pdf = (
            b"%PDF-1.4\n"
            b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
            b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
            b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
            b"4 0 obj<</Length 55>>stream\nBT /F1 24 Tf 72 720 Td (Lead Magnet: " + template_id.encode('utf-8') + b") Tj ET\nendstream\nendobj\n"
            b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
            b"xref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000121 00000 n \n0000000285 00000 n \n0000000414 00000 n \n"
            b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n505\n%%EOF\n"
        )
        return pdf

    def generate_pdf(self, template_id: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        print("🛠️ DEBUG: generate_pdf called")
        print(f"🛠️ DEBUG: DocRaptor API Key present: {bool(self.api_key)}")
        print(f"🛠️ DEBUG: DocRaptor test mode: {self.test_mode}")
        rendered_html = self.render_template_with_vars(template_id, variables)
        self._save_preview_html(template_id, rendered_html)

        if not self.api_key:
            print("⚠️ DEBUG: No DocRaptor API key. Returning mock PDF bytes.")
            return {
                'success': True,
                'pdf_data': self._build_mock_pdf_bytes(template_id),
                'content_type': 'application/pdf',
                'filename': f'lead-magnet-{template_id}.pdf',
                'template_id': template_id
            }

        try:
            print("🛠️ DEBUG: Posting to DocRaptor API...")
            doc_data = {
                'user_credentials': self.api_key,
                'doc': {
                    'document_type': 'pdf',
                    'document_content': rendered_html,
                    'name': f'lead-magnet-{template_id}',
                    'test': self.test_mode
                }
            }
            response = requests.post(
                self.base_url,
                json=doc_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            if response.status_code == 200:
                print("✅ DEBUG: DocRaptor API success")
                return {
                    'success': True,
                    'pdf_data': response.content,
                    'content_type': 'application/pdf',
                    'filename': f'lead-magnet-{template_id}.pdf',
                    'template_id': template_id
                }
            else:
                print(f"❌ DEBUG: DocRaptor error {response.status_code}: {response.text}")
                return {
                    'success': False,
                    'error': f'DocRaptor API error: {response.status_code}',
                    'details': response.text
                }
        except Exception as e:
            print(f"❌ DEBUG: DocRaptor request failed: {e}")
            return {
                'success': False,
                'error': 'DocRaptor request failed',
                'details': str(e)
            }

    def generate_pdf_with_ai_content(self, template_id: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self.generate_pdf(template_id, variables)

    def preview_template(self, template_id: str, variables: Dict[str, Any]) -> str:
        html = self.render_template_with_vars(template_id, variables)
        self._save_preview_html(template_id, html)
        return html