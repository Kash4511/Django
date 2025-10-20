import axios from 'axios';

// Define the base URL for API requests
const API_BASE_URL = 'http://localhost:8000/api';

// Define types with valid choices
export interface FirmProfile {
  id?: number;
  primary_brand_color: string;
  secondary_brand_color: string;
  preferred_font_style: string;
  branding_guidelines: string;
  logo?: File | null;
}

// Define type for Lead Magnet generation form
export interface LeadMagnetGeneration {
  lead_magnet_type: string;
  main_topic: string;
  target_audience: string[];
  audience_pain_points: string[];
  desired_outcome: string;
  call_to_action: string;
  special_requests?: string;
}

// Define types for templates
export interface PDFTemplate {
  id: string;
  name: string;
  description?: string;
  preview_url?: string;
  thumbnail?: string;
}

export interface CreateLeadMagnetRequest {
  title: string;
  description?: string;
  firm_profile?: number | Partial<FirmProfile>;
  generation_data: LeadMagnetGeneration;
  template_type?: string;
  status?: string;
}

export interface TemplateSelectionRequest {
  lead_magnet_id: number;
  template_id: string;
  template_name: string;
  template_thumbnail?: string;
  captured_answers?: any;
  source?: string;
}

// Enhanced error handler
const handleApiError = (error: any, context: string) => {
  if (error.response) {
    console.error(`${context} - Server Error:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers,
      url: error.response.config?.url
    });
    
    throw new Error(
      `${context} failed: ${error.response.status} ${error.response.statusText}\n` +
      `Details: ${JSON.stringify(error.response.data, null, 2)}`
    );
  } else if (error.request) {
    console.error(`${context} - No Response:`, error.request);
    throw new Error(`${context} failed: No response from server`);
  } else {
    console.error(`${context} - Request Error:`, error.message);
    throw new Error(`${context} failed: ${error.message}`);
  }
};

// API functions
export const dashboardApi = {
  // Dashboard stats
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/stats/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        total_lead_magnets: 0,
        active_lead_magnets: 0,
        total_downloads: 0,
        leads_generated: 0
      };
    }
  },
  
  // Get valid choices from server
  getValidChoices: async (): Promise<{lead_magnet_types: string[], main_topics: string[]}> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/valid-choices/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.log('Valid choices endpoint not available, using discovered choices');
      return {
        lead_magnet_types: ['CHECKLIST', 'CHEATSHEET', 'GUIDE', 'TEMPLATE'],
        main_topics: ['FINANCE', 'MARKETING', 'TECHNOLOGY', 'HEALTH', 'EDUCATION']
      };
    }
  },
  
  // Templates - FIXED VERSION
  getTemplates: async (): Promise<PDFTemplate[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/templates/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      // Handle different response structures
      if (response.data.templates) {
        return response.data.templates;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      // Return empty array instead of throwing if you want to handle gracefully
      return [];
    }
  },
  
  selectTemplate: async (request: TemplateSelectionRequest): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/select-template/`, request, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Selecting template');
    }
  },
  
  // Create lead magnet with comprehensive error handling
  createLeadMagnet: async (data: CreateLeadMagnetRequest): Promise<any> => {
    try {
      console.log('🚀 Sending lead magnet data:', JSON.stringify(data, null, 2));
      
      // Validate required fields
      if (!data.title || !data.generation_data) {
        throw new Error('Title and generation_data are required');
      }

      const response = await axios.post(`${API_BASE_URL}/create-lead-magnet/`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Lead magnet created successfully:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating lead magnet');
    }
  },

  // Create lead magnet with validated choices
  createLeadMagnetWithValidData: async (data: { 
    title: string; 
    description?: string; 
    firm_profile?: number | Partial<FirmProfile>; 
    generation_data: LeadMagnetGeneration;
  }): Promise<any> => {
    try {
      console.log('🚀 Creating lead magnet with validated data...');
      
      // Convert to uppercase as Django choices are often uppercase
      const validatedData = {
        title: data.title,
        description: data.description || '',
        firm_profile: data.firm_profile || null,
        generation_data: {
          ...data.generation_data,
          lead_magnet_type: data.generation_data.lead_magnet_type.toUpperCase(),
          main_topic: data.generation_data.main_topic.toUpperCase()
        },
        template_type: 'GUIDE',
        status: 'DRAFT'
      };

      console.log('📤 Sending validated data:', JSON.stringify(validatedData, null, 2));

      const response = await axios.post(`${API_BASE_URL}/create-lead-magnet/`, validatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ Lead magnet created successfully:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Creating lead magnet with validated data');
    }
  },

  // Firm profile
  getFirmProfile: async (): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/firm-profile/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Fetching firm profile');
    }
  },

  updateFirmProfile: async (profileData: Partial<FirmProfile>): Promise<any> => {
    try {
      const formData = new FormData();
      
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'logo' && value instanceof File) {
            formData.append('logo', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await axios.patch(`${API_BASE_URL}/firm-profile/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Updating firm profile');
    }
  },

  // Lead magnets - THIS GENERATES THE PDF
  generatePDFWithAI: async (request: { template_id: string; lead_magnet_id: number; use_ai_content: boolean }): Promise<any> => {
    try {
      console.log('🔄 Generating PDF...', request);
      
      const response = await axios.post(`${API_BASE_URL}/generate-pdf/`, request, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob',
        timeout: 60000
      });
      
      console.log('✅ PDF generated successfully');
      
      // Create download link for the PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lead-magnet-${request.lead_magnet_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response;
    } catch (error) {
      handleApiError(error, 'Generating PDF with AI');
    }
  },

  getLeadMagnets: async (): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lead-magnets/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Fetching lead magnets');
    }
  },

  getLeadMagnet: async (id: number): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lead-magnets/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, `Fetching lead magnet ${id}`);
    }
  },

  // Test function with valid choices
  testCreateLeadMagnet: async (): Promise<any> => {
    const testData = {
      title: "Test Lead Magnet - " + Date.now(),
      description: "This is a test lead magnet",
      generation_data: {
        lead_magnet_type: "GUIDE",
        main_topic: "MARKETING",
        target_audience: ["small business owners", "entrepreneurs"],
        audience_pain_points: ["lack of online presence", "difficulty generating leads"],
        desired_outcome: "increase online visibility and generate more leads",
        call_to_action: "Download our free guide to boost your online presence",
        special_requests: "Please make it professional and easy to understand"
      }
    };

    try {
      console.log('🧪 Testing lead magnet creation with valid choices:', testData);
      const response = await axios.post(`${API_BASE_URL}/create-lead-magnet/`, testData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Test successful:', response.data);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Testing lead magnet creation');
    }
  },

  // Complete workflow: Create lead magnet -> Select template -> Generate PDF
  createAndGeneratePDF: async (leadMagnetData: any, templateId: string): Promise<any> => {
    try {
      // Step 1: Create lead magnet
      console.log('📝 Step 1: Creating lead magnet...');
      const leadMagnet = await dashboardApi.createLeadMagnetWithValidData(leadMagnetData);
      
      // Step 2: Select template
      console.log('🎨 Step 2: Selecting template...');
      await dashboardApi.selectTemplate({
        lead_magnet_id: leadMagnet.id,
        template_id: templateId,
        template_name: 'Selected Template'
      });
      
      // Step 3: Generate PDF
      console.log('📄 Step 3: Generating PDF...');
      const pdfResponse = await dashboardApi.generatePDFWithAI({
        template_id: templateId,
        lead_magnet_id: leadMagnet.id,
        use_ai_content: true
      });
      
      console.log('✅ Complete workflow finished successfully!');
      return {
        leadMagnet,
        pdfResponse
      };
    } catch (error) {
      console.error('❌ Workflow failed:', error);
      throw error;
    }
  }
};