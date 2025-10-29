// Authentication-enabled PDF generation test
// Run this in your browser console to test PDF generation with proper authentication

window.authPDFTest = function() {
    console.log("🔐 TESTING WITH AUTHENTICATION...");
    
    // Get access token from localStorage
    const accessToken = localStorage.getItem('access_token');
    console.log("🔑 Access Token:", accessToken ? "Found" : "MISSING");
    
    if (!accessToken) {
        console.error("❌ No access token found in localStorage. Please log in first.");
        return;
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
            call_to_action: "TEST CALL TO ACTION"
        }
    };
    
    return fetch('http://localhost:8000/api/generate-pdf/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(testData)
    })
    .then(response => {
        console.log("📄 Response Status:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("🎯 PDF RESULT:", data);
        if (data.success && data.pdf_data) {
            console.log("✅ PDF GENERATED SUCCESSFULLY!");
            console.log("📏 PDF Data Length:", data.pdf_data.length);
            console.log("🔍 First 100 chars:", data.pdf_data.substring(0, 100));
            
            // Create a download link for the PDF
            const byteCharacters = atob(data.pdf_data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: 'application/pdf'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'generated_lead_magnet.pdf';
            link.innerText = 'Download Generated PDF';
            link.style.padding = '10px';
            link.style.background = '#4CAF50';
            link.style.color = 'white';
            link.style.borderRadius = '5px';
            link.style.textDecoration = 'none';
            link.style.display = 'inline-block';
            link.style.margin = '10px 0';
            
            // Add to page
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.zIndex = '9999';
            container.style.background = 'white';
            container.style.padding = '15px';
            container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
            container.style.borderRadius = '5px';
            
            const header = document.createElement('h3');
            header.innerText = 'PDF Generated!';
            header.style.margin = '0 0 10px 0';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerText = 'Close';
            closeBtn.style.marginLeft = '10px';
            closeBtn.onclick = () => document.body.removeChild(container);
            
            container.appendChild(header);
            container.appendChild(link);
            container.appendChild(closeBtn);
            document.body.appendChild(container);
        }
        return data;
    })
    .catch(error => {
        console.log("💀 ERROR:", error);
    });
};

// Helper function to check API configuration
window.checkAPIConfig = function() {
    console.log("🔍 Checking frontend API patterns...");
    
    // Look for any existing API configuration
    console.log("Axios defaults:", window.axios?.defaults?.headers);
    console.log("Fetch interceptors?", window.fetch);
    
    // Check localStorage for tokens
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log("Access Token:", accessToken ? "Present" : "Missing");
    console.log("Refresh Token:", refreshToken ? "Present" : "Missing");
    
    return {
        accessToken,
        refreshToken,
        hasAxios: !!window.axios,
        hasFetch: !!window.fetch
    };
};

console.log("✅ Auth PDF Test loaded! Run window.authPDFTest() to test PDF generation");
console.log("ℹ️ Run window.checkAPIConfig() to check API configuration");