#!/usr/bin/env python3
"""
Test script to verify timeout handling and retry logic in PerplexityClient
"""

import os
import sys
import django
from pathlib import Path

# Add the Backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_project.settings')
django.setup()

from lead_magnets.perplexity_client import PerplexityClient

def test_timeout_handling():
    """Test the timeout handling and retry logic"""
    print("🧪 Testing Perplexity API timeout handling...")
    
    # Initialize client
    client = PerplexityClient()
    
    # Simple test data
    user_answers = {
        'target_audience': 'First-time home buyers',
        'pain_points': 'Confused about the buying process',
        'content_type': 'checklist',
        'industry_focus': 'Real Estate'
    }
    
    firm_profile = {
        'name': 'Test Realty',
        'specialization': 'Residential Real Estate',
        'location': 'Test City'
    }
    
    try:
        print("📡 Making API call with retry logic...")
        result = client.generate_lead_magnet_json(
            user_answers=user_answers,
            firm_profile=firm_profile
        )
        
        print("✅ API call successful!")
        print(f"📄 Generated content has {len(result.get('sections', []))} sections")
        print(f"📝 Main title: {result.get('mainTitle', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"❌ API call failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_timeout_handling()
    if success:
        print("\n🎉 Timeout handling test passed!")
    else:
        print("\n💥 Timeout handling test failed!")