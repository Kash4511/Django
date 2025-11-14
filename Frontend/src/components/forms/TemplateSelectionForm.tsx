import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { dashboardApi } from '../../lib/dashboardApi';
import type { PDFTemplate } from '../../lib/dashboardApi';
import ImageUpload from './ImageUpload'; // Import the new component
import './TemplateSelectionForm.css';
import '../CreateLeadMagnet.css';

interface TemplateSelectionFormProps {
  onClose: () => void;
  onSubmit: (templateId: string, templateName: string, architecturalImages?: File[]) => void;
  loading?: boolean;
}

const TemplateSelectionForm: React.FC<TemplateSelectionFormProps> = ({
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [fetchingTemplates, setFetchingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false); // New state
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setFetchingTemplates(true);
        setError(null);
        const data = await dashboardApi.getTemplates();
        setTemplates(data);
      } catch (err: unknown) {
        console.error('Failed to fetch templates:', err);
        const apiErr = err as { response?: { data?: { error?: string } } };
        setError(apiErr.response?.data?.error || 'Failed to load templates');
      } finally {
        setFetchingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (loading) {
      setElapsed(0);
      timer = setInterval(() => setElapsed(s => s + 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  const handleTemplateSelect = (template: PDFTemplate) => {
    setSelectedTemplate(template);
  };

  const handleImageUploadClose = () => {
    setShowImageUpload(false);
  };

  const handleImagesSelected = (images: File[]) => {
    setShowImageUpload(false);

    if (selectedTemplate) {
      onSubmit(selectedTemplate.id, selectedTemplate.name, images);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) {
      setError('Please select a template before continuing');
      return;
    }
    setShowImageUpload(true);
  };

  if (fetchingTemplates) {
    return (
      <div className="template-loading">
        <Loader2 className="spinner" size={48} />
        <p>Loading templates...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="template-error">
        <AlertCircle size={48} />
        <h3>Failed to Load Templates</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="template-empty">
        <FileText size={48} />
        <h3>No Templates Available</h3>
        <p>Please contact support to set up PDF templates for your account.</p>
      </div>
    )
  }

  if (showImageUpload) {
    return (
      <ImageUpload 
        onImagesSelected={handleImagesSelected} 
        onClose={handleImageUploadClose} 
      />
    );
  }

  return (
    <>
      <div className="template-selection-container">
        <div className="form-header-new">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="back-button-new">
                <ChevronLeft size={24} />
                <span>Back</span>
            </button>
          </div>
        </div>

        <div className="template-grid-new">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="template-thumbnail-wrapper-new">
                {template.preview_url ? (
                  <div className="template-thumbnail-new">
                    <img src={template.preview_url} alt={template.name} className="image-primary" />
                    {template.hover_preview_url && (
                      <img src={template.hover_preview_url} alt={`${template.name} (hover preview)`} className="image-hover" />
                    )}
                  </div>
                ) : (
                  <div className="template-thumbnail-new placeholder">
                    <FileText size={36} />
                  </div>
                )}
              </div>
              <div className="template-info-new">
                <h3>{template.name.toLowerCase().includes('modern') ? 'Template 1' : template.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="form-actions-new">
          <button 
            type="button" 
            onClick={handleSubmit}
            className="submit-btn-new"
            disabled={!selectedTemplate || loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={18} />
                Processing... ({elapsed}s)
              </>
            ) : (
              'Next' // Changed from Continue
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="template-loading-overlay">
          <div className="overlay-content">
            <Loader2 className="spinner" size={32} />
            <p>Creating lead magnet… this can take up to 30s.</p>
            <p>Elapsed: {elapsed}s</p>
          </div>
        </div>
      )}
    </>
  )
}

export default TemplateSelectionForm
