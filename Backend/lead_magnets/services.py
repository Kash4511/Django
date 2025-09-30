import os
import requests
from typing import Dict, List, Optional
from django.core.cache import cache

class APITemplateService:
    """Service to interact with APITemplate.io API"""
    
    BASE_URL = "https://api.apitemplate.io/v1"
    CACHE_TIMEOUT = 60 * 60 * 24 * 7  # 7 days
    
    def __init__(self):
        self.api_key = os.environ.get('APITEMPLATE_API_KEY')
        if not self.api_key:
            raise ValueError("APITEMPLATE_API_KEY environment variable is not set")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def list_templates(self, include_previews: bool = True) -> List[Dict]:
        """
        Fetch all available templates from APITemplate.io with preview images
        
        Args:
            include_previews: If True, generate preview images for templates
        
        Returns:
            List of template objects with id, name, format, and preview URL
            
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
            templates = data
        elif isinstance(data, dict) and 'templates' in data:
            templates = data['templates']
        else:
            templates = []
        
        # Add preview URLs to each template
        if include_previews:
            for template in templates:
                template_id = template.get('id')
                if template_id:
                    preview_url = self._get_or_generate_preview(template_id, template.get('format'))
                    template['preview_url'] = preview_url
        
        return templates
    
    def _get_or_generate_preview(self, template_id: str, template_format: str = 'PDF') -> Optional[str]:
        """
        Get cached preview URL or generate a new one
        
        Args:
            template_id: The template ID
            template_format: The template format (PDF or Image)
            
        Returns:
            Preview image URL or None if generation fails
        """
        cache_key = f'template_preview_{template_id}'
        cached_url = cache.get(cache_key)
        
        if cached_url:
            return cached_url
        
        # Generate preview with sample data
        preview_url = self._generate_preview(template_id, template_format)
        
        if preview_url:
            cache.set(cache_key, preview_url, self.CACHE_TIMEOUT)
        
        return preview_url
    
    def _generate_preview(self, template_id: str, template_format: str = 'PDF') -> Optional[str]:
        """
        Generate a preview image for a template using empty/minimal data
        
        Args:
            template_id: The template ID
            template_format: The template format (PDF or Image)
            
        Returns:
            Preview image URL or None if generation fails
        """
        try:
            # Generate with minimal/empty data - template will use its defaults
            # Request JPEG output for image preview (works for both PDF and Image templates)
            url = f"{self.BASE_URL}/create?template_id={template_id}&expiration=0&output_image_type=jpegOnly"
            
            # Empty data object - let template use its default values
            payload = {}
            
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # Return the download URL (which is the preview)
            if result.get('status') == 'success':
                # Try JPEG first (requested format), then PNG, then fallback to main download_url
                return (result.get('download_url_jpeg') or 
                       result.get('download_url_png') or 
                       result.get('download_url'))
            
            return None
            
        except Exception as e:
            print(f"Error generating preview for template {template_id}: {str(e)}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            return None
    
    def get_template_by_id(self, template_id: str) -> Optional[Dict]:
        """
        Get a specific template by ID
        
        Args:
            template_id: The template ID from APITemplate.io
            
        Returns:
            Template object or None if not found
        """
        templates = self.list_templates(include_previews=False)
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
