#!/usr/bin/env python
"""
Test to see the raw response from Perplexity API to debug JSON parsing issues.
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

def test_raw_perplexity_response():
    print("🔍 Testing Raw Perplexity API Response...")
    print("=" * 50)
    
    api_key = os.getenv('PERPLEXITY_API_KEY')
    if not api_key:
        print("❌ No API key found")
        return False
    
    print(f"✅ Using API key: {api_key[:10]}...{api_key[-4:]}")
    
    # Simple test prompt that should return JSON
    test_prompt = """
    Generate a simple JSON object with the following structure:
    {
        "title": "Test Lead Magnet",
        "description": "A simple test description",
        "sections": [
            {
                "title": "Section 1",
                "content": "Test content for section 1"
            }
        ]
    }
    
    Return ONLY valid JSON, no other text or formatting.
    """
    
    try:
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "sonar-pro",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a JSON generator. Return only valid JSON, no other text."
                    },
                    {
                        "role": "user",
                        "content": test_prompt
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.1
            },
            timeout=30
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            message_content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            print("📄 Raw message content:")
            print("-" * 30)
            print(repr(message_content))  # Show exact content including whitespace
            print("-" * 30)
            
            print("📄 Formatted message content:")
            print("-" * 30)
            print(message_content)
            print("-" * 30)
            
            # Test JSON extraction from markdown
            def extract_json_from_markdown(content):
                content = content.strip()
                if content.startswith('```'):
                    lines = content.split('\n')
                    start_idx = 0
                    end_idx = len(lines)
                    
                    for i, line in enumerate(lines):
                        if line.strip().startswith('```'):
                            start_idx = i + 1
                            break
                    
                    for i in range(len(lines) - 1, -1, -1):
                        if lines[i].strip().startswith('```'):
                            end_idx = i
                            break
                    
                    json_lines = lines[start_idx:end_idx]
                    return '\n'.join(json_lines)
                return content
            
            # Extract JSON from markdown
            extracted_json = extract_json_from_markdown(message_content)
            print("📄 Extracted JSON:")
            print("-" * 30)
            print(repr(extracted_json))
            print("-" * 30)
            
            # Try to parse as JSON
            try:
                parsed_json = json.loads(extracted_json)
                print("✅ Successfully parsed as JSON!")
                print("📋 Parsed content:")
                print(json.dumps(parsed_json, indent=2))
                return True
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed: {e}")
                print(f"Error at position: {e.pos}")
                if e.pos < len(extracted_json):
                    print(f"Character at error: {repr(extracted_json[e.pos])}")
                return False
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_raw_perplexity_response()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Raw response test successful!")
    else:
        print("💥 Raw response test failed!")
    print("=" * 50)