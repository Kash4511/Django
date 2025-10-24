import requests
import json

# Test script to trigger PDF generation
print("🧪 Testing PDF generation...")

import requests
import json
import time

print("🧪 Testing PDF generation with auth...")

API_BASE = "http://localhost:8000"
LOGIN_URL = f"{API_BASE}/api/auth/login/"
REGISTER_URL = f"{API_BASE}/api/auth/register/"
PROFILE_URL = f"{API_BASE}/api/auth/profile/"
PDF_URL = f"{API_BASE}/api/generate-pdf/"

# Create or login a user to get JWT token
email = f"tester_{int(time.time())}@example.com"
password = "Test1234!"
name = "Tester"

# Try register first
try:
    r = requests.post(REGISTER_URL, json={
        "email": email,
        "password": password,
        "password_confirm": password,
        "name": name,
        "phone_number": ""
    })
    if r.status_code in (200, 201):
        tokens = r.json()
        access = tokens.get("access")
        print("✅ Registered new user")
    else:
        print(f"ℹ️ Register failed ({r.status_code}), trying login... {r.text}")
        r = requests.post(LOGIN_URL, json={"email": email, "password": password})
        tokens = r.json()
        access = tokens.get("access")
except Exception as e:
    print(f"❌ Auth error: {e}")
    access = None

if not access:
    # Fallback: try a default local account if exists
    print("⚠️ No access token. Trying default credentials...")
    r = requests.post(LOGIN_URL, json={"email": "admin@example.com", "password": "admin"})
    if r.status_code == 200:
        access = r.json().get("access")
        print("✅ Logged in with default credentials")

headers = {
    "Authorization": f"Bearer {access}" if access else "",
    "Content-Type": "application/json",
}

# 1) Create a lead magnet
CREATE_URL = f"{API_BASE}/api/create-lead-magnet/"
user_answers = {
    "lead_magnet_type": "guide",
    "main_topic": "smart-homes",
    "target_audience": ["homeowners", "developers"],
    "audience_pain_points": ["budget", "timeline"],
    "desired_outcome": "Educate and capture leads",
    "call_to_action": "Schedule Consultation",
    "special_requests": ""
}

create_payload = {
    "title": "Test Lead Magnet",
    "description": "Testing PDF generation",
    "generation_data": user_answers
}

try:
    lm_resp = requests.post(CREATE_URL, json=create_payload, headers=headers)
    print(f"🧩 LeadMagnet create status: {lm_resp.status_code}")
    if lm_resp.status_code in (200, 201):
        lead_magnet = lm_resp.json()
        lead_magnet_id = lead_magnet.get("id")
        print(f"✅ Lead magnet created with id: {lead_magnet_id}")
    else:
        print(f"❌ Lead magnet creation failed: {lm_resp.text}")
        lead_magnet_id = None
except Exception as e:
    print(f"❌ Lead magnet creation exception: {e}")
    lead_magnet_id = None

# 2) Request PDF generation using AI content
pdf_request = {
    "template_id": "modern-guide",
    "lead_magnet_id": lead_magnet_id,
    "use_ai_content": True,
    "user_answers": user_answers
}

try:
    response = requests.post(PDF_URL, json=pdf_request, headers=headers)
    print(f"📊 Status code: {response.status_code}")
    print(f"📄 Response headers: {response.headers}")
    if response.status_code == 200:
        print("✅ PDF generated successfully!")
        with open("test_output.pdf", "wb") as f:
            f.write(response.content)
        print("💾 PDF saved to test_output.pdf")
    else:
        print(f"❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Exception: {str(e)}")