import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../lib/dashboardApi';
import type { PDFTemplate } from '../lib/dashboardApi';
import './TemplateSelectionForm.css';

// Use the API's PDFTemplate type for consistency

interface TemplateSelectionFormProps {
  onSubmit: (templateId: string, templateName: string, templateThumbnail?: string) => void;
  loading: boolean;
}

const TemplateSelectionForm: React.FC<TemplateSelectionFormProps> = ({ onSubmit, loading }) => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('🟢 Loading templates...');
      setLoadingTemplates(true);
      setError('');
      
      const response = await dashboardApi.getTemplates();
      console.log('🟢 Templates API response:', response);
      
      if (response && Array.isArray(response)) {
        setTemplates(response);
        console.log(`🟢 Successfully loaded ${response.length} templates`);
        // Auto-select the first (and likely only) template
        if (response.length > 0) {
          setSelectedTemplate(response[0].id);
        }
      } else {
        // Fallback to hardcoded template if API fails
        const fallbackTemplate: PDFTemplate = {
          id: 'template-html',
          name: 'Professional Guide Template',
          description: 'AI-powered professional guide template with dynamic content generation',
          thumbnail: '/template-preview.jpg',
          preview_url: '/template-preview.jpg'
        };
        setTemplates([fallbackTemplate]);
        setSelectedTemplate(fallbackTemplate.id);
        console.log('🟡 Using fallback template');
      }
    } catch (err: unknown) {
      console.error('🔴 Error loading templates:', err);
      // Use fallback template on error
      const fallbackTemplate: PDFTemplate = {
        id: 'template-html',
        name: 'Professional Guide Template',
        description: 'AI-powered professional guide template with dynamic content generation',
        thumbnail: '/template-preview.jpg',
        preview_url: '/template-preview.jpg'
      };
      setTemplates([fallbackTemplate]);
      setSelectedTemplate(fallbackTemplate.id);
      console.log('🟡 Using fallback template due to error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) {
      setError('Please select a template before continuing');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      console.log('🟢 Submitting template:', template.id);
      onSubmit(template.id, template.name, template.preview_url);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="template-selection-form">
        <div className="form-header">
          <h2>Choose Your Template</h2>
          <p>Select a design template for your lead magnet</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading available templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="template-selection-form">
        <div className="form-header">
          <h2>Choose Your Template</h2>
          <p>Select a design template for your lead magnet</p>
        </div>
        <div className="error-state">
          <p className="error-message">❌ {error}</p>
          <button onClick={loadTemplates} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selection-form">
      <div className="form-header">
        <h2>Choose Your Template</h2>
        <p>Select a design template for your lead magnet</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="templates-grid">
          {templates.length === 0 ? (
            <div className="no-templates">
              <p>No templates available at the moment.</p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setError('');
                }}
              >
                <div className="template-image">
                  <img 
                    src={template.preview_url || template.thumbnail || '/default-template.jpg'} 
                    alt={template.name}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = '/default-template.jpg';
                    }}
                  />
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                    <div className="template-meta">
                      {selectedTemplate === template.id && (
                        <span className="selected-badge">Selected</span>
                      )}
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

        {error && <p className="error-message">❌ {error}</p>}

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={!selectedTemplate || loading}
          >
            {loading ? 'Creating Lead Magnet...' : 'Create Lead Magnet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateSelectionForm;