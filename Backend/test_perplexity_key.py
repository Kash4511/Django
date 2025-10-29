import os
import sys
import requests
from dotenv import load_dotenv

# Add the Backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables from .env file in the Backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)
print(f"🔧 Loading .env from: {env_path}")

def test_perplexity_key():
    # Get API key from environment
    api_key = os.getenv('PERPLEXITY_API_KEY')
    
    if not api_key:
        print("❌ PERPLEXITY_API_KEY not found in environment variables")
        print("Available env vars:", [k for k in os.environ.keys() if 'PERPLEXITY' in k])
        return False
    
    print(f"✅ Found API key: {api_key[:10]}...{api_key[-4:]}")
    
    # Test 1: Check key format
    if not api_key.startswith('pplx-'):
        print("❌ Invalid API key format - should start with 'pplx-'")
        return False
    
    print("✅ API key format is valid")
    
    # Test 2: Skip models endpoint (Perplexity may not have public models endpoint)
    print("ℹ️  Skipping models endpoint test (not publicly available)")
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    # Test 3: Test minimal chat completion
    try:
        print("🔍 Testing chat completion...")
        chat_data = {
            "model": "sonar-pro",
            "messages": [
                {"role": "user", "content": "Say 'API test successful' if you can read this."}
            ],
            "max_tokens": 20
        }
        
        chat_response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers=headers,
            json=chat_data,
            timeout=30
        )
        
        if chat_response.status_code == 200:
            result = chat_response.json()
            message = result['choices'][0]['message']['content']
            print(f"✅ Chat completion successful!")
            print(f"💬 Response: {message}")
            return True
        else:
            print(f"❌ Chat completion failed: {chat_response.status_code}")
            print(f"Response: {chat_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error in chat completion: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Testing New Perplexity API Key...")
    print("=" * 50)
    
    success = test_perplexity_key()
    
    print("=" * 50)
    if success:
        print("🎉 All tests passed! New API key is working correctly.")
    else:
        print("💥 Tests failed! Please check your API key.")
    
    print("=" * 50)