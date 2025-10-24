#!/usr/bin/env python
"""
Test script to verify template rendering with populated variables
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from lead_magnets.services import DocRaptorService
from lead_magnets.perplexity_client import PerplexityClient

def test_template_rendering():
    print("🧪 Testing Template Rendering...")
    
    # Create test data
    firm_profile = {
        'firm_name': 'Test Architecture Firm',
        'work_email': 'test@example.com',
        'phone_number': '+1-555-123-4567',
        'firm_website': 'https://testfirm.com',
        'primary_brand_color': '#2a5766',
        'secondary_brand_color': '#ffffff',
        'logo_url': 'https://example.com/logo.png',
        'industry': 'Architecture'
    }
    
    # Create mock AI content
    ai_content = {
        "style": {
            "primary_color": "#2a5766",
            "secondary_color": "#ffffff",
            "accent_color": "#f4a460"
        },
        "brand": {
            "logo_url": "https://example.com/logo.png"
        },
        "cover": {
            "title": "Sustainable Architecture Guide",
            "subtitle": "Transform Your Building Projects with Eco-Friendly Design",
            "company_name": "Test Architecture Firm",
            "company_tagline": "Building Tomorrow's World Today"
        },
        "terms": {
            "title": "Terms of Use",
            "summary": "This guide is provided for educational purposes. Please review these terms before using the content.",
            "paragraphs": [
                "This guide contains proprietary information and best practices developed by our firm.",
                "The content is intended for professional use by qualified architects and designers.",
                "All recommendations should be verified with local building codes and regulations.",
                "The firm assumes no liability for the implementation of these guidelines.",
                "This document is protected by copyright and may not be redistributed without permission."
            ]
        },
        "contents": {
            "items": [
                "Introduction to Sustainable Design",
                "Energy Efficiency Strategies",
                "Material Selection Guidelines",
                "Water Conservation Methods",
                "Indoor Air Quality Considerations",
                "Implementation Best Practices"
            ]
        },
        "sections": [
            {
                "title": "Introduction to Sustainable Design",
                "content": "Sustainable architecture represents a fundamental shift in how we approach building design.",
                "subsections": [
                    {
                        "title": "Core Principles",
                        "content": "The foundation of sustainable design rests on three pillars: environmental responsibility, economic viability, and social equity."
                    }
                ]
            },
            {
                "title": "Energy Efficiency Strategies",
                "content": "Implementing energy-efficient systems is crucial for reducing operational costs and environmental impact.",
                "subsections": [
                    {
                        "title": "Passive Design",
                        "content": "Utilizing natural light, ventilation, and thermal mass to reduce energy consumption."
                    }
                ]
            }
        ],
        "contact": {
            "phone": "+1-555-123-4567",
            "email": "test@example.com",
            "website": "https://testfirm.com"
        }
    }
    
    # Test the mapping
    client = PerplexityClient()
    template_vars = client.map_to_template_vars(ai_content, firm_profile)
    
    print(f"✅ Generated {len(template_vars)} template variables")
    
    # Show some key variables
    key_vars = ['documentTitle', 'companyName', 'primaryColor', 'secondaryColor', 'accentColor', 'logoUrl', 'headerText1', 'sectionTitle1', 'pageNumberHeader2']
    print("\n🔍 Key Template Variables:")
    for var in key_vars:
        value = template_vars.get(var, 'NOT FOUND')
        print(f"  {var}: {value}")
    
    # Count non-empty variables
    non_empty = {k: v for k, v in template_vars.items() if str(v).strip()}
    empty = {k: v for k, v in template_vars.items() if not str(v).strip()}
    
    print(f"\n📊 Variable Statistics:")
    print(f"  Total variables: {len(template_vars)}")
    print(f"  Non-empty: {len(non_empty)}")
    print(f"  Empty: {len(empty)}")
    
    if empty:
        print(f"\n⚠️  Empty variables: {list(empty.keys())[:10]}...")  # Show first 10
    
    # Test template rendering
    try:
        service = DocRaptorService()
        preview_html = service.preview_template("template_1", template_vars)
        
        # Save preview to file for inspection
        with open('template_preview.html', 'w', encoding='utf-8') as f:
            f.write(preview_html)
        
        print(f"\n✅ Template rendered successfully!")
        print(f"📄 Preview saved to: template_preview.html")
        print(f"📏 HTML length: {len(preview_html)} characters")
        
        # Check if template has content
        if "{{" in preview_html:
            unresolved_count = preview_html.count("{{")
            print(f"⚠️  Found {unresolved_count} unresolved template variables")
        else:
            print("✅ All template variables resolved!")
            
    except Exception as e:
        print(f"❌ Template rendering failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_template_rendering()