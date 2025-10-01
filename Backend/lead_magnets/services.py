import os
import requests
from typing import Dict, List, Optional

class APITemplateService:
    """Service to interact with APITemplate.io API"""
    
    BASE_URL = "https://api.apitemplate.io/v1"
    
    def __init__(self):
        self.api_key = os.environ.get('APITEMPLATE_API_KEY')
        if not self.api_key:
            raise ValueError("APITEMPLATE_API_KEY environment variable is not set")
    
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
