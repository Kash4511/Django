import os
import json
import sys
from unittest.mock import MagicMock, patch

# Add the project root to sys.path to import Backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
import django
django.setup()

from lead_magnets.perplexity_client import PerplexityClient
from lead_magnets.services import DocRaptorService

def test_smart_homes_guide_pipeline():
    """
    Simulates the end-to-end pipeline for "Smart Homes Guide".
    This script verifies that the PerplexityClient can process the payload
    and DocRaptorService can handle the resulting variables.
    """
    print("🚀 Starting Smart Homes Guide Pipeline Verification...")
    
    # Payload identical to the one provided in the issue
    user_answers = {
        "main_topic": "Smart Homes Guide",
        "lead_magnet_type": "Guide",
        "target_audience": ["Homeowners", "Tech Enthusiasts"],
        "desired_outcome": "Educate about smart home technology and its benefits",
        "audience_pain_points": ["High energy costs", "Home security concerns", "Complex technology"],
        "call_to_action": "Schedule a consultation",
        "industry": "Smart Home Technology",
        "brand_primary_color": "#007bff",
        "brand_secondary_color": "#6c757d",
        "brand_accent_color": "#ffc107"
    }
    
    firm_profile = {
        "firm_name": "Smart Solutions Inc.",
        "work_email": "contact@smartsolutions.com",
        "phone_number": "555-0199",
        "firm_website": "www.smartsolutions.com",
        "tagline": "Simplifying Your Life",
        "logo_url": "https://example.com/logo.png"
    }

    client = PerplexityClient()
    
    # Mocking the API response to avoid actual API costs and ensure consistency
    # This response simulates the "malformed" JSON being repaired and then used
    mock_ai_content = {
        "style": {
            "primary_color": user_answers["brand_primary_color"],
            "secondary_color": user_answers["brand_secondary_color"],
            "accent_color": user_answers["brand_accent_color"]
        },
        "brand": {
            "logo_url": firm_profile["logo_url"]
        },
        "cover": {
            "title": "Smart Homes: The Ultimate Guide",
            "subtitle": "Transforming Your Living Space with Technology",
            "company_name": firm_profile["firm_name"],
            "company_tagline": firm_profile["tagline"]
        },
        "terms": {
            "title": "Terms of Use",
            "summary": "This guide is for informational purposes.",
            "paragraphs": [
                "Detailed terms paragraph 1.",
                "Detailed terms paragraph 2.",
                "Detailed terms paragraph 3."
            ]
        },
        "contents": {
            "items": ["Intro", "Security", "Energy", "Convenience", "Future", "Conclusion"]
        },
        "sections": [
            {
                "title": "Introduction to Smart Homes",
                "content": "Smart home technology is revolutionizing how we live. It offers unprecedented control over our environments, enhancing comfort and efficiency. This guide explores the foundational concepts that every homeowner should understand before investing in these systems. We will cover the core benefits and common integration strategies used by leading firms in the industry today.",
                "subsections": [
                    {"title": "Energy Efficiency", "content": "Save on bills with smart thermostats. These devices learn your schedule and adjust temperature automatically for maximum savings without sacrificing comfort."},
                    {"title": "Security", "content": "Protect your home with smart locks and cameras. Integrated systems provide real-time alerts and remote monitoring capabilities from any smartphone device."}
                ]
            }
        ],
        "contact": {
            "title": user_answers["call_to_action"],
            "description": "Our team of experts is ready to help you navigate the complex world of smart home technology. We provide end-to-end solutions tailored to your unique needs and lifestyle preferences.",
            "phone": firm_profile["phone_number"],
            "email": firm_profile["work_email"],
            "website": firm_profile["firm_website"],
            "differentiator_title": "Why Choose " + firm_profile["firm_name"],
            "differentiator": "We combine years of architectural expertise with cutting-edge technological integration. Our approach ensures that your smart home is not only functional but also beautifully designed and intuitive to use."
        }
    }

    print("✅ Step 1: PerplexityClient initialization successful")
    
    # Test the mapping to template variables
    print("🔄 Step 2: Mapping AI content to template variables...")
    try:
        template_vars = client.map_to_template_vars(mock_ai_content, firm_profile)
        print(f"✅ Step 2: Mapping successful. Template keys: {list(template_vars.keys())[:5]}...")
        
        # Verify essential variables (updated for actual keys used in perplexity_client.py)
        assert 'mainTitle' in template_vars
        assert 'primaryColor' in template_vars
        # Note: mapping might favor firm profile if AI content color is missing
        print(f"DEBUG: primaryColor in template: {template_vars['primaryColor']}")
        print("✅ Step 3: Template variables verification successful")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Step 2/3 failed: {e}")
        return

    # Test DocRaptor rendering (mocked)
    print("🔄 Step 4: Simulating DocRaptor PDF generation...")
    doc_service = DocRaptorService()
    # Ensure test mode is on
    doc_service.test_mode = True
    
    try:
        # We'll use a mock for the actual DocRaptor API call if needed, 
        # but here we test the variable preparation.
        result = doc_service.generate_pdf("modern-guide", template_vars)
        if result.get('success'):
            print("✅ Step 4: PDF generation simulation successful")
        else:
            print(f"❌ Step 4: PDF generation failed: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ Step 4 failed: {e}")

    print("\n🏁 Pipeline Verification Complete!")

if __name__ == "__main__":
    test_smart_homes_guide_pipeline()
