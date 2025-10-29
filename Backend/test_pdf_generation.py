#!/usr/bin/env python
"""
Test script to reproduce the PDF generation error
"""
import os
import sys
import django

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from lead_magnets.services import DocRaptorService

def test_pdf_generation():
    """Test PDF generation with sample data"""
    print("Testing PDF generation...")
    
    # Sample variables that would come from AI
    test_variables = {
        'mainTitle': 'Test Lead Magnet',
        'companyName': 'Test Company',
        'section1Title': 'Introduction',
        'section1Content': 'This is test content for section 1.',
        'section2Title': 'Main Content',
        'section2Content': 'This is test content for section 2.',
    }
    
    try:
        service = DocRaptorService()
        print(f"Templates directory: {service.templates_dir}")
        print(f"Test mode: {service.test_mode}")
        print(f"API key exists: {bool(service.api_key)}")
        
        # Test template rendering first
        print("\nTesting template rendering...")
        rendered_html = service.render_template_with_vars('Template', test_variables)
        print(f"Template rendered successfully. Length: {len(rendered_html)} characters")
        
        # Test PDF generation (but don't print the binary content)
        print("\nTesting PDF generation...")
        result = service.generate_pdf('Template', test_variables)
        
        # Print result without the binary content
        if 'content' in result:
            content_length = len(result['content'])
            result_summary = {k: v for k, v in result.items() if k != 'content'}
            result_summary['content_length'] = content_length
            print(f"PDF generation successful: {result_summary}")
        else:
            print(f"PDF generation result: {result}")
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_pdf_generation()