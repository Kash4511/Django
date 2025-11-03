// PDF Generation Helper with Authentication
// This module provides functions to generate PDFs with proper authentication

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Generate a PDF with AI content and proper authentication
 * @param {Object} params - Parameters for PDF generation
 * @param {string} params.template_id - ID of the template to use
 * @param {number} params.lead_magnet_id - ID of the lead magnet
 * @param {boolean} params.use_ai_content - Whether to use AI-generated content
 * @param {Object} params.user_answers - User answers for AI content generation
 * @returns {Promise} - Promise resolving to the PDF response
 */
export const generatePDFWithAuth = async (params) => {
  const { template_id, lead_magnet_id, use_ai_content = true, user_answers = {} } = params;
  
  console.log('🔄 Generating PDF with authentication...');
  console.log('📝 Request parameters:', { template_id, lead_magnet_id, use_ai_content });
  console.log('👤 User answers provided:', Object.keys(user_answers).length > 0 ? 'Yes' : 'No');
  
  // Get access token from localStorage
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    console.error('❌ Authentication error: No access token found');
    throw new Error('Authentication required. Please log in.');
  }
  
  try {
    console.log('🔐 Using authentication token for request');
    
    const response = await axios.post(
      `${API_BASE_URL}/generate-pdf/`, 
      { template_id, lead_magnet_id, use_ai_content, user_answers },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob',
        
      }
    );
    
    console.log('✅ PDF generated successfully');
    return response;
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with an error status
      const status = error.response.status;
      
      if (status === 401) {
        console.error('🔒 Authentication error: Unauthorized');
        throw new Error('Authentication failed. Please log in again.');
      } else if (status === 404) {
        console.error('🔍 API endpoint not found');
        throw new Error('PDF generation service not found. Please check API configuration.');
      } else {
        console.error(`🛑 Server error: ${status}`);
        throw new Error(`Server error (${status}). Please try again later.`);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('📡 No response from server');
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Error in setting up the request
      console.error('⚠️ Request setup error:', error.message);
      throw error;
    }
  }
};

/**
 * Download the generated PDF
 * @param {Blob} pdfBlob - PDF data as a Blob
 * @param {string} filename - Name for the downloaded file
 */
export const downloadPDF = (pdfBlob, filename = 'generated-document.pdf') => {
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Generate and download a PDF in one step
 * @param {Object} params - Parameters for PDF generation
 * @returns {Promise} - Promise resolving when PDF is downloaded
 */
export const generateAndDownloadPDF = async (params) => {
  try {
    const response = await generatePDFWithAuth(params);
    downloadPDF(response.data, `lead-magnet-${params.lead_magnet_id}.pdf`);
    return { success: true };
  } catch (error) {
    console.error('Failed to generate and download PDF:', error);
    throw error;
  }
};

// Export a test function that can be called from the console
window.testPDFGeneration = async (leadMagnetId = Date.now()) => {
  console.log('🧪 Testing PDF generation with authentication...');
  
  const testParams = {
    template_id: 'modern-guide',
    lead_magnet_id: leadMagnetId,
    use_ai_content: true,
    user_answers: {
      firm_name: 'TEST COMPANY',
      work_email: 'test@test.com',
      phone_number: '123-456-7890',
      firm_website: 'https://test.com',
      main_topic: 'smart home',
      lead_magnet_type: 'guide',
      target_audience: ['Homeowners'],
      audience_pain_points: ['High costs', 'Complexity'],
      desired_outcome: 'TEST CONTENT - This should appear in PDF',
      call_to_action: 'TEST CALL TO ACTION'
    }
  };
  
  try {
    await generateAndDownloadPDF(testParams);
    console.log('✅ Test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
};

export default {
  generatePDFWithAuth,
  downloadPDF,
  generateAndDownloadPDF,
  testPDFGeneration: window.testPDFGeneration
};