import os
import docraptor
import json
from django.conf import settings
from django.template.loader import get_template
from django.template import Context, Template
from dotenv import load_dotenv
from .perplexity import PerplexityClient

load_dotenv()

class DocRaptorService:
    """Service for handling PDF generation with DocRaptor"""
    
    def __init__(self):
        self.api_key = os.getenv("DOCRAPTOR_API_KEY")
        # Initialize client only if API key exists; allow non-PDF operations without key
        self.client = None
        if self.api_key:
            self.client = docraptor.DocApi()
            self.client.api_client.configuration.username = self.api_key
        self.perplexity_client = PerplexityClient()
    
    def list_templates(self):
        """Return available PDF templates - now using the single Template.html"""
        return [
            {
                "id": "professional-guide",
                "name": "Professional Guide Template",
                "description": "AI-powered professional guide template with dynamic content generation",
                "category": "Professional",
                "thumbnail": "/media/template_previews/professional-guide.jpg",
                "preview_url": "/media/template_previews/professional-guide.jpg",
                "variables": {
                    "primaryColor": {"type": "color", "default": "#8B4513", "label": "Primary Color"},
                    "secondaryColor": {"type": "color", "default": "#D2691E", "label": "Secondary Color"},
                    "accentColor": {"type": "color", "default": "#F4A460", "label": "Accent Color"},
                    "companyName": {"type": "text", "default": "Your Company", "label": "Company Name"},
                    "mainTitle": {"type": "text", "default": "PROFESSIONAL GUIDE", "label": "Main Title"}
                }
            }
        ]
    
    def generate_pdf_with_ai_content(self, template_id, user_answers, firm_profile=None, output_filename=None):
        """Generate PDF using AI-generated content based on user answers"""
        if not output_filename:
            company_name = (firm_profile or {}).get('firm_name', 'Document')
            output_filename = f"{template_id}_{company_name.replace(' ', '_')}.pdf"
        
        try:
            # Require DocRaptor client for PDF generation
            if not self.client:
                raise ValueError("DocRaptor API key missing. Set DOCRAPTOR_API_KEY in environment to generate PDFs.")

            # Generate AI content using Perplexity
            ai_content = self.perplexity_client.generate_lead_magnet_json(user_answers, firm_profile or {})
            
            # Map AI content to template variables (aligned with Template.html)
            template_variables = self.perplexity_client.map_to_template_vars(ai_content, firm_profile or {})
            
            # Get template HTML
            template_html = self._get_template_html()
            
            # Replace variables in template
            for key, value in template_variables.items():
                placeholder = "{{" + key + "}}"
                template_html = template_html.replace(placeholder, str(value))
            
            # Generate PDF with DocRaptor
            response = self.client.create_doc({
                "test": True,  # Set to False for production
                "document_content": template_html,
                "name": output_filename,
                "document_type": "pdf",
            })
            
            return {
                "success": True,
                "pdf_content": response,
                "filename": output_filename,
                "ai_content": ai_content,
                "template_variables": template_variables
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def generate_pdf(self, template_id, variables, output_filename=None):
        """Generate PDF using provided variables (legacy method)"""
        if not output_filename:
            output_filename = f"{template_id}_{variables.get('companyName', 'document').replace(' ', '_')}.pdf"
        
        # Get template HTML
        template_html = self._get_template_html()
        
        # Replace variables in template
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            template_html = template_html.replace(placeholder, str(value))
        
        try:
            if not self.client:
                raise ValueError("DocRaptor API key missing. Set DOCRAPTOR_API_KEY in environment to generate PDFs.")
            # Generate PDF with DocRaptor
            response = self.client.create_doc({
                "test": True,  # Set to False for production
                "document_content": template_html,
                "name": output_filename,
                "document_type": "pdf",
            })
            
            return {
                "success": True,
                "pdf_content": response,
                "filename": output_filename
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_template_html(self):
        """Get the actual Template.html content"""
        try:
            # Load the Template.html file
            template_path = os.path.join(settings.BASE_DIR, 'lead_magnets', 'templates', 'Template.html')
            with open(template_path, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            # Fallback to a basic template if Template.html is not found
            return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    :root {
                        --primary-color: {{primaryColor}};
                        --secondary-color: {{secondaryColor}};
                        --accent-color: {{accentColor}};
                    }
                    body { font-family: Arial, sans-serif; }
                    .header { color: var(--primary-color); }
                </style>
            </head>
            <body>
                <h1 class="header">{{mainTitle}}</h1>
                <h2>by {{companyName}}</h2>
                <div class="content">
                    {{customContent1}}
                </div>
            </body>
            </html>
            """
    
    def preview_template(self, template_id, variables=None):
        """Generate a preview of the template with given variables"""
        if not variables:
            variables = {}
        
        template_html = self._get_template_html()
        
        # Replace variables for preview
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            template_html = template_html.replace(placeholder, str(value))
        
        return template_html