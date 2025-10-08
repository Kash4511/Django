import axios from 'axios';

// Define the base URL for API requests
const API_BASE_URL = 'http://localhost:8000/api';

// Define types
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
  main_topic: string;
  lead_magnet_type: string;
  desired_outcome: string;
  target_audience: string;
  tone_of_voice: string;
  additional_instructions?: string;
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
  main_topic: string;
  lead_magnet_type: string;
  desired_outcome: string;
  target_audience: string;
  tone_of_voice: string;
  additional_instructions?: string;
}


export interface TemplateSelectionRequest {
  lead_magnet_id: number;
  template_id: string;
  template_name: string;
  template_thumbnail?: string;
}

// API functions
export const dashboardApi = {
  // Dashboard stats
  getStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats if API endpoint doesn't exist yet
      return {
        total_lead_magnets: 0,
        active_lead_magnets: 0,
        total_downloads: 0,
        leads_generated: 0
      };
    }
  },
  
  // Templates
  getTemplates: async (): Promise<PDFTemplate[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lead-magnets/templates/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data.templates || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },
  
  selectTemplate: async (request: TemplateSelectionRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/lead-magnets/select-template/`, request, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error selecting template:', error);
      throw error;
    }
  },
  
  createLeadMagnet: async (data: CreateLeadMagnetRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/lead-magnets/create-lead-magnet/`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating lead magnet:', error);
      throw error;
    }
  },

  // Firm profile
  getFirmProfile: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts/firm-profile/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching firm profile:', error);
      throw error;
    }
  },

  updateFirmProfile: async (profileData: Partial<FirmProfile>) => {
    try {
      const formData = new FormData();
      
      // Add all profile data to formData
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'logo' && value instanceof File) {
            formData.append('logo', value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await axios.patch(`${API_BASE_URL}/accounts/firm-profile/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating firm profile:', error);
      throw error;
    }
  },

  // Lead magnets
  getLeadMagnets: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lead-magnets/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching lead magnets:', error);
      throw error;
    }
  },

  getLeadMagnet: async (id: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lead-magnets/${id}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead magnet with id ${id}:`, error);
      throw error;
    }
  }
};