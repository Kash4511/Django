// Token refresh utility
const refreshToken = async () => {
  console.log("🔄 Attempting to refresh token...");
  
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error("❌ No refresh token found in localStorage");
    return null;
  }
  
  try {
    // Use the correct endpoint path
    const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refresh: refreshToken})
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      console.log("✅ Token refreshed successfully!");
      console.log("New token:", data.access.substring(0, 20) + "...");
      return data.access;
    } else {
      console.error("❌ Refresh response didn't contain access token:", data);
      return null;
    }
  } catch (error) {
    console.error("❌ Token refresh failed:", error);
    return null;
  }
};

// Test function to verify token refresh
const testTokenRefresh = async () => {
  console.log("🧪 Testing token refresh functionality...");
  const result = await refreshToken();
  
  if (result) {
    console.log("✅ Token refresh test PASSED");
    return true;
  } else {
    console.log("❌ Token refresh test FAILED");
    return false;
  }
};

// Export functions
window.refreshToken = refreshToken;
window.testTokenRefresh = testTokenRefresh;

// Auto-execute test if this script is loaded directly
console.log("📝 Token refresh utility loaded");
console.log("Run window.testTokenRefresh() to test token refresh");