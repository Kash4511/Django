// Test script for PDF generation endpoint
const API_BASE_URL = 'http://localhost:8000/api';

// Function to test PDF generation with correct URL
async function testPDFGeneration() {
  console.log("🚀 Starting PDF generation test with correct URL...");
  
  const testData = {
    template_id: "modern-guide",
    lead_magnet_id: Date.now(), // Use timestamp as unique ID
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
  
  console.log("📦 Test payload:", testData);
  
  try {
    // Get the access token from localStorage
    const accessToken = localStorage.getItem('access_token');
    console.log("🔑 Using access token:", accessToken ? "Token available" : "No token found");
    
    const response = await fetch(`${API_BASE_URL}/generate-pdf/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || ''}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📄 Response status: ${response.status}`);
    console.log(`📄 Response headers:`, response.headers);
    
    if (response.status === 200) {
      console.log("✅ PDF generated successfully!");
      
      // Create a download link for the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-lead-magnet-${testData.lead_magnet_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        message: "PDF generated and download initiated"
      };
    } else {
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      console.log("❌ Error response:", errorData);
      return {
        success: false,
        status: response.status,
        error: errorData
      };
    }
  } catch (error) {
    console.error("💀 Test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the test function to global scope for console access
window.testPDFGeneration = testPDFGeneration;

console.log("🔧 PDF test script loaded. Run window.testPDFGeneration() in console to test.");