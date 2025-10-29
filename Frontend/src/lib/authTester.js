// Authentication Test Utility
console.log("🔍 Authentication Test Utility Loaded");

// Configuration
const API_BASE = "http://localhost:8000";
const AUTH_ENDPOINTS = {
  login: `${API_BASE}/api/auth/login/`,
  register: `${API_BASE}/api/auth/register/`,
  profile: `${API_BASE}/api/auth/profile/`,
  tokenRefresh: `${API_BASE}/api/auth/token/refresh/`,
  pdfGeneration: `${API_BASE}/api/generate-pdf/`
};

// Test login functionality
async function testLogin(email = "test@example.com", password = "password123") {
  console.log("🧪 Testing login functionality...");
  
  try {
    const response = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
    
    console.log(`📊 Login Status: ${response.status}`);
    
    if (!response.ok) {
      console.error("❌ Login failed");
      return null;
    }
    
    const data = await response.json();
    console.log("✅ Login successful!");
    console.log("🔑 Tokens received:", {
      access: data.access ? `${data.access.substring(0, 15)}...` : "None",
      refresh: data.refresh ? `${data.refresh.substring(0, 15)}...` : "None"
    });
    
    // Store tokens
    if (data.access) localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    
    return data;
  } catch (error) {
    console.error("❌ Login error:", error);
    return null;
  }
}

// Test token refresh
async function testTokenRefresh() {
  console.log("🧪 Testing token refresh...");
  
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error("❌ No refresh token found in localStorage");
    return null;
  }
  
  try {
    const response = await fetch(AUTH_ENDPOINTS.tokenRefresh, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    console.log(`📊 Refresh Status: ${response.status}`);
    
    if (!response.ok) {
      console.error("❌ Token refresh failed");
      return null;
    }
    
    const data = await response.json();
    console.log("✅ Token refresh successful!");
    
    // Update access token
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      console.log("🔑 New access token:", data.access.substring(0, 15) + "...");
    }
    
    return data;
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return null;
  }
}

// Test PDF generation with authentication
async function testPDFGeneration() {
  console.log("🧪 Testing PDF generation with authentication...");
  
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    console.error("❌ No access token found in localStorage");
    return null;
  }
  
  const testData = {
    template_id: "modern-guide",
    lead_magnet_id: Date.now(),
    use_ai_content: true,
    user_answers: {
      firm_name: "TEST COMPANY",
      work_email: "test@test.com",
      phone_number: "123-456-7890",
      firm_website: "https://test.com",
      main_topic: "smart home",
      lead_magnet_type: "guide",
      target_audience: ["Homeowners"],
      audience_pain_points: ["High costs", "Complexity"],
      desired_outcome: "TEST CONTENT - This should appear in PDF",
      call_to_action: "TEST CALL TO ACTION",
      special_requests: "This is a test for PDF generation"
    }
  };
  
  try {
    console.log("📤 Sending PDF generation request with auth token...");
    const response = await fetch(AUTH_ENDPOINTS.pdfGeneration, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📊 PDF Generation Status: ${response.status}`);
    
    if (!response.ok) {
      console.error("❌ PDF generation failed");
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return null;
    }
    
    const data = await response.blob();
    console.log("✅ PDF generated successfully!");
    
    // Create download link
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'generated-document.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Running all authentication tests...");
  
  // Step 1: Login
  const loginResult = await testLogin();
  if (!loginResult) {
    console.error("❌ Authentication test suite failed at login step");
    return;
  }
  
  // Step 2: Test token refresh
  const refreshResult = await testTokenRefresh();
  if (!refreshResult) {
    console.error("❌ Authentication test suite failed at token refresh step");
    return;
  }
  
  // Step 3: Test PDF generation
  const pdfResult = await testPDFGeneration();
  if (!pdfResult) {
    console.error("❌ Authentication test suite failed at PDF generation step");
    return;
  }
  
  console.log("✅ All authentication tests passed successfully!");
}

// Export functions to window for console access
window.testLogin = testLogin;
window.testTokenRefresh = testTokenRefresh;
window.testPDFGeneration = testPDFGeneration;
window.runAllTests = runAllTests;

console.log("🔧 Authentication test utility ready!");
console.log("📝 Available commands:");
console.log("  - window.testLogin(email, password)");
console.log("  - window.testTokenRefresh()");
console.log("  - window.testPDFGeneration()");
console.log("  - window.runAllTests()");