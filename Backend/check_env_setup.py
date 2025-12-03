#!/usr/bin/env python
"""
Quick script to verify .env file setup and environment variable loading.
Run this to check if your PERPLEXITY_API_KEY is properly configured.
"""
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("❌ python-dotenv is not installed!")
    print("   Install it with: pip install python-dotenv")
    sys.exit(1)

# Get the Backend directory path
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / '.env'

print("=" * 60)
print("🔍 Checking .env File Setup")
print("=" * 60)
print(f"📁 Backend directory: {backend_dir}")
print(f"📄 .env file path: {env_path}")
print(f"✅ .env file exists: {env_path.exists()}")

if not env_path.exists():
    print("\n❌ .env file not found!")
    print(f"\n📝 To fix this:")
    print(f"   1. Create a file named '.env' in: {backend_dir}")
    print(f"   2. Add the following line:")
    print(f"      PERPLEXITY_API_KEY=pplx-your-api-key-here")
    print(f"\n   Get your API key from: https://www.perplexity.ai/settings/api")
    sys.exit(1)

# Load the .env file
load_dotenv(env_path)
print(f"✅ .env file loaded successfully")

# Check for PERPLEXITY_API_KEY
api_key = os.getenv('PERPLEXITY_API_KEY')
print(f"\n🔑 PERPLEXITY_API_KEY:")
if api_key:
    # Show first 10 and last 4 characters for security
    masked_key = f"{api_key[:10]}...{api_key[-4:]}" if len(api_key) > 14 else "***"
    print(f"   ✅ Found: {masked_key}")
    
    # Validate format
    if api_key.startswith('pplx-'):
        print(f"   ✅ Format is valid (starts with 'pplx-')")
    else:
        print(f"   ⚠️  Warning: Key doesn't start with 'pplx-' - may be invalid")
else:
    print(f"   ❌ NOT FOUND!")
    print(f"\n📝 To fix this:")
    print(f"   1. Open: {env_path}")
    print(f"   2. Add this line:")
    print(f"      PERPLEXITY_API_KEY=pplx-your-api-key-here")
    print(f"   3. Replace 'pplx-your-api-key-here' with your actual API key")
    print(f"   4. Get your API key from: https://www.perplexity.ai/settings/api")

# Check other important variables
print(f"\n📋 Other Environment Variables:")
secret_key = os.getenv('SECRET_KEY')
print(f"   SECRET_KEY: {'✅ Set' if secret_key else '⚠️  Not set (using default)'}")

debug = os.getenv('DEBUG')
print(f"   DEBUG: {debug if debug else '⚠️  Not set (defaults to false)'}")

docraptor_key = os.getenv('DOCRAPTOR_API_KEY')
print(f"   DOCRAPTOR_API_KEY: {'✅ Set' if docraptor_key else '⚠️  Not set (will use mock PDF)'}")

print("\n" + "=" * 60)
if api_key:
    print("✅ Setup looks good! Your PERPLEXITY_API_KEY is configured.")
    print("\n💡 Next steps:")
    print("   - Run: python manage.py runserver")
    print("   - Test PDF generation in your frontend")
else:
    print("❌ Setup incomplete! Please configure PERPLEXITY_API_KEY in .env file")
print("=" * 60)

