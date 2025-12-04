import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, AlertCircle, ChevronLeft, CheckCircle } from 'lucide-react';
import { dashboardApi } from '../../lib/dashboardApi';
import { apiClient } from '../../lib/apiClient';
import type { PDFTemplate } from '../../lib/dashboardApi';
import ImageUpload from './ImageUpload'; // Import the new component
import './TemplateSelectionForm.css';
import '../CreateLeadMagnet.css';
import Modal from '../Modal';

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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [fallbackSrc, setFallbackSrc] = useState<Record<string, string | null>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PDFTemplate | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setFetchingTemplates(true);
        setError(null);
        const data = await dashboardApi.getTemplates();
        type AnyTemplate = PDFTemplate & Partial<{ preview: string; thumbnail: string; image: string; image2: string; secondary_preview_url: string } & { preview_url: string; hover_preview_url: string }>;
        const baseUrl = String(apiClient.defaults.baseURL || '').replace(/\/$/, '')
        const photoUrl = `${baseUrl}/media/photo.png`
        const hoverTempUrl = `${baseUrl}/media/tempphoto1.png`
        const mapped: PDFTemplate[] = (data || []).map((t) => {
          const tt = t as AnyTemplate;
          const name = (t.name || '').toLowerCase()
          const isTemplate1 = name.includes('modern') || name.includes('template 1')
          return {
            ...t,
            preview_url: isTemplate1 ? photoUrl : (tt.preview_url || tt.preview || tt.thumbnail || tt.image || null),
            hover_preview_url: isTemplate1 ? hoverTempUrl : (tt.hover_preview_url || null),
            secondary_preview_url: tt.secondary_preview_url || tt.image2 || tt.hover_preview_url || null,
          } as PDFTemplate;
        });
        setTemplates(mapped);
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
    setPreviewTemplate(null);
    setShowPreviewModal(false);
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
              className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''} ${template.name.toLowerCase().includes('modern') || template.name.toLowerCase().includes('template 1') ? 'template-1' : ''}`}
              onClick={() => handleTemplateSelect(template)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {selectedTemplate?.id === template.id && (
                <div className="selected-check">
                  <CheckCircle size={18} />
                </div>
              )}
              <div className="template-thumbnail-wrapper-new">
                {template.preview_url && !imageErrors[template.id] ? (
                  (() => {
                    const isTemplate1 = template.name.toLowerCase().includes('modern') || template.name.toLowerCase().includes('template 1')
                    if (isTemplate1 && template.secondary_preview_url) {
                      return (
                        <div className="template-thumbnail-new template-dual-preview">
                          <img
                            src={template.preview_url}
                            alt={template.name}
                            className="dual-image-left"
                            loading="lazy"
                            decoding="async"
                            srcSet={`${template.preview_url} 1x, ${template.preview_url} 2x`}
                            onError={() => setImageErrors((prev) => ({ ...prev, [template.id]: true }))}
                          />
                          <img
                            src={template.secondary_preview_url}
                            alt={`${template.name} secondary`}
                            className="dual-image-right"
                            loading="lazy"
                            decoding="async"
                            srcSet={`${template.secondary_preview_url} 1x, ${template.secondary_preview_url} 2x`}
                            onError={() => setImageErrors((prev) => ({ ...prev, [template.id]: true }))}
                          />
                        </div>
                      )
                    }
                    return (
                      <div className="template-thumbnail-new">
                        {(() => {
                          const baseUrl = String(apiClient.defaults.baseURL || '').replace(/\/$/, '')
                          const preferred = `${baseUrl}/media/templates/photo.png`
                          const secondary = `${baseUrl}/media/photo.png`
                          const src = fallbackSrc[template.id] || template.preview_url
                          return (
                            <img
                              src={src}
                              alt={template.name}
                              className="image-primary"
                              loading="lazy"
                              decoding="async"
                              srcSet={`${src} 1x, ${src} 2x`}
                              onErrorCapture={() => {
                                if (!fallbackSrc[template.id]) {
                                  setFallbackSrc((p) => ({ ...p, [template.id]: preferred }))
                                } else if (fallbackSrc[template.id] === preferred) {
                                  setFallbackSrc((p) => ({ ...p, [template.id]: secondary }))
                                } else {
                                  setImageErrors((prev) => ({ ...prev, [template.id]: true }))
                                }
                              }}
                            />
                          )
                        })()}
                        {template.hover_preview_url && (
                          <img
                            src={template.hover_preview_url}
                            alt={`${template.name} (hover preview)`}
                            className="image-hover"
                            loading="lazy"
                            decoding="async"
                            srcSet={`${template.hover_preview_url} 1x, ${template.hover_preview_url} 2x`}
                            onError={() => setImageErrors((prev) => ({ ...prev, [template.id]: true }))}
                          />
                        )}
                      </div>
                    )
                  })()
                ) : (
                  (() => {
                    const isTemplate1 = template.name.toLowerCase().includes('modern') || template.name.toLowerCase().includes('template 1')
                    if (isTemplate1) {
                      const baseUrl = String(apiClient.defaults.baseURL || '').replace(/\/$/, '')
                      const photoUrl = `${baseUrl}/media/photo.png`
                      const imagrUrl = `${baseUrl}/media/templates/IMAGR.png`
                      const src = fallbackSrc[template.id] || imagrUrl
                      if (!imageErrors[template.id]) {
                        return (
                          <div className="template-thumbnail-new">
                            <img
                              src={src}
                              alt={`${template.name} preview`}
                              className="image-primary"
                              loading="lazy"
                              decoding="async"
                              srcSet={`${src} 1x, ${src} 2x`}
                              onErrorCapture={() => {
                                if (src !== photoUrl) {
                                  setFallbackSrc((p) => ({ ...p, [template.id]: photoUrl }))
                                } else {
                                  setImageErrors((prev) => ({ ...prev, [template.id]: true }))
                                }
                              }}
                            />
                          </div>
                        )
                      }
                      return (
                        <div className="template-thumbnail-new placeholder">
                          <FileText size={36} />
                        </div>
                      )
                    }
                    return (
                      <div className="template-thumbnail-new placeholder">
                        <FileText size={36} />
                      </div>
                    )
                  })()
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

      <Modal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
        title="Template Preview" 
        maxWidth={900}
      >
        {previewTemplate?.preview_url && !imageErrors[previewTemplate.id] ? (
          <div className="template-preview-wrapper">
            <img
              src={previewTemplate.preview_url}
              alt={previewTemplate.name}
              className="template-preview-img"
              loading="eager"
              decoding="async"
            />
            <div className="modal-actions">
              <button
                className="submit-btn-new"
                onClick={() => {
                  if (previewTemplate) {
                    setSelectedTemplate(previewTemplate)
                    setShowPreviewModal(false)
                  }
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        ) : (
          <div className="template-preview-wrapper">
            <div className="template-preview-placeholder">
              <FileText size={48} />
            </div>
            <div className="modal-actions">
              <button className="submit-btn-new" onClick={() => setShowPreviewModal(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

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
