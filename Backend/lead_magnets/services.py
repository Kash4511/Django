import os
import requests
import hashlib
import io
from typing import Dict, List, Optional
from PIL import Image
from pdf2image import convert_from_bytes
from django.conf import settings

class APITemplateService:
    """Service to interact with APITemplate.io API"""
    
    BASE_URL = "https://api.apitemplate.io/v1"
    
    def __init__(self):
        # Use the provided API key directly
        self.api_key = "9ea6MzkyMTY6MzY0MTM6UDdQblZlaUZkWmlaM2ZVUA="
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        if not self.api_key:
            raise ValueError("API key is not set")
        return {
            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def list_templates(self) -> List[Dict]:
        """
        Fetch all available templates from APITemplate.io
        
        Returns:
            List of template objects with id, name, and other metadata
            
        Raises:
            requests.exceptions.RequestException: If API request fails
        """
        url = f"{self.BASE_URL}/list-templates"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        
        data = response.json()
        
        # APITemplate.io returns templates in different formats
        # Handle both array and object responses
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'templates' in data:
            return data['templates']
        else:
            return []
    
    def get_template_by_id(self, template_id: str) -> Optional[Dict]:
        """
        Get a specific template by ID
        
        Args:
            template_id: The template ID from APITemplate.io
            
        Returns:
            Template object or None if not found
        """
        templates = self.list_templates()
        for template in templates:
            if template.get('id') == template_id:
                return template
        return None
    
    def create_pdf(self, template_id: str, data: Dict) -> Optional[Dict]:
        """
        Create a PDF using a template and data
        
        Args:
            template_id: The template ID to use
            data: Dictionary of data to populate the template
            
        Returns:
            Response with PDF URL and metadata
        """
        try:
            url = f"{self.BASE_URL}/create"
            payload = {
                'template_id': template_id,
                'data': data
            }
            
            response = requests.post(url, json=payload, headers=self._get_headers())
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error creating PDF: {str(e)}")
            return None
    
    def generate_template_preview(self, template_id: str, template_name: str) -> Optional[str]:
        """
        Generate a preview image for a template by creating a sample PDF
        
        Args:
            template_id: The template ID
            template_name: The template name for placeholder data
            
        Returns:
            URL to the preview image or None if generation fails
        """
        try:
            # Create preview directory if it doesn't exist
            preview_dir = os.path.join(settings.MEDIA_ROOT, 'template_previews')
            os.makedirs(preview_dir, exist_ok=True)
            
            # Check if preview already exists
            preview_filename = f"{template_id}.jpg"
            preview_path = os.path.join(preview_dir, preview_filename)
            
            if os.path.exists(preview_path):
                return f"/media/template_previews/{preview_filename}"
            
            # Generate sample PDF with placeholder data
            sample_data = {
                "title": template_name,
                "subtitle": "Lead Magnet Preview",
                "content": "This is a sample preview of your template",
                "author": "Forma AI"
            }
            
            # Create PDF
            url = f"{self.BASE_URL}/create"
            params = {
                'template_id': template_id,
                'export_type': 'file'  # Get binary data instead of URL
            }
            
            response = requests.post(
                url,
                json=sample_data,
                headers=self._get_headers(),
                params=params
            )
            response.raise_for_status()
            
            # Convert PDF to image
            pdf_bytes = response.content
            images = convert_from_bytes(pdf_bytes, first_page=1, last_page=1, dpi=150)
            
            if images:
                # Save first page as preview
                image = images[0]
                # Resize to thumbnail size
                image.thumbnail((400, 600), Image.Resampling.LANCZOS)
                image.save(preview_path, 'JPEG', quality=85)
                
                return f"/media/template_previews/{preview_filename}"
            
            return None
            
        except Exception as e:
            print(f"Error generating preview for template {template_id}: {str(e)}")
            return None
