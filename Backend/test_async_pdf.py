import requests
import json
import time
import os

print("🧪 Testing Async PDF generation with polling...")

# Use environment variables if available, otherwise default to local
API_BASE = os.getenv("API_BASE", "http://localhost:8000")
LOGIN_URL = f"{API_BASE}/api/auth/login/"
PDF_URL = f"{API_BASE}/api/generate-pdf/"
STATUS_URL = f"{API_BASE}/api/generate-pdf/status/"

# Try to login with default credentials or existing user
email = "admin@example.com"
password = "admin"

try:
    print(f"🔑 Logging in to {LOGIN_URL}...")
    r = requests.post(LOGIN_URL, json={"email": email, "password": password})
    if r.status_code == 200:
        access = r.json().get("access")
        print("✅ Logged in successfully")
    else:
        print(f"❌ Login failed: {r.text}")
        access = None
except Exception as e:
    print(f"❌ Auth error: {e}")
    access = None

if not access:
    print("❌ Cannot proceed without access token.")
    exit(1)

headers = {
    "Authorization": f"Bearer {access}",
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
    "special_requests": "TEST ASYNC"
}

create_payload = {
    "title": f"Test Async LM {int(time.time())}",
    "description": "Testing Async PDF generation",
    "generation_data": user_answers
}

try:
    print(f"🧩 Creating lead magnet...")
    lm_resp = requests.post(CREATE_URL, json=create_payload, headers=headers)
    if lm_resp.status_code in (200, 201):
        lead_magnet = lm_resp.json()
        lead_magnet_id = lead_magnet.get("id")
        print(f"✅ Lead magnet created with id: {lead_magnet_id}")
    else:
        print(f"❌ Lead magnet creation failed: {lm_resp.text}")
        exit(1)
except Exception as e:
    print(f"❌ Lead magnet creation exception: {e}")
    exit(1)

# 2) Request PDF generation
pdf_request = {
    "template_id": "modern-guide",
    "lead_magnet_id": lead_magnet_id,
    "use_ai_content": True,
    "user_answers": user_answers
}

try:
    print(f"📄 Requesting PDF generation for ID {lead_magnet_id}...")
    response = requests.post(PDF_URL, json=pdf_request, headers=headers)
    print(f"📊 Initial Status code: {response.status_code}")
    
    if response.status_code == 409:
        print("✅ Received 409 Conflict (Expected for Async). Starting polling...")
        
        # 3) Poll for status
        max_attempts = 60
        attempts = 0
        while attempts < max_attempts:
            attempts += 1
            print(f"🔍 Polling attempt {attempts}...")
            status_resp = requests.get(STATUS_URL, params={"lead_magnet_id": lead_magnet_id}, headers=headers)
            
            if status_resp.status_code == 200:
                data = status_resp.json()
                curr_status = data.get("status")
                print(f"   Status: {curr_status}")
                
                if curr_status == "ready":
                    pdf_url = data.get("pdf_url")
                    print(f"✅ PDF is READY! URL: {pdf_url}")
                    
                    # Download PDF
                    pdf_content = requests.get(pdf_url, headers=headers).content
                    with open(f"test_async_output_{lead_magnet_id}.pdf", "wb") as f:
                        f.write(pdf_content)
                    print(f"💾 PDF saved to test_async_output_{lead_magnet_id}.pdf")
                    break
                elif curr_status == "in_progress":
                    pass # Continue polling
                else:
                    print(f"⚠️ Unexpected status: {curr_status}")
            else:
                print(f"❌ Error polling: {status_resp.text}")
            
            time.sleep(3)
        else:
            print("❌ Polling timed out.")
            
    elif response.status_code == 200:
        print("✅ Received 200 OK (Unexpectedly Synchronous). PDF returned directly.")
        with open(f"test_sync_output_{lead_magnet_id}.pdf", "wb") as f:
            f.write(response.content)
        print("💾 PDF saved to test_sync_output.pdf")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

except Exception as e:
    print(f"❌ Exception: {str(e)}")
