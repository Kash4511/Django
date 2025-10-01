import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { dashboardApi } from '../../lib/dashboardApi'
import type { PDFTemplate } from '../../lib/dashboardApi'
import '../CreateLeadMagnet.css'

interface TemplateSelectionFormProps {
  onSubmit: (templateId: string, templateName: string, templateThumbnail?: string) => void
  loading?: boolean
}

const TemplateSelectionForm: React.FC<TemplateSelectionFormProps> = ({
  onSubmit,
  loading = false
}) => {
  const [templates, setTemplates] = useState<PDFTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null)
  const [fetchingTemplates, setFetchingTemplates] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [failedPreviews, setFailedPreviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setFetchingTemplates(true)
        setError(null)
        const data = await dashboardApi.getTemplates()
        setTemplates(data)
      } catch (err: any) {
        console.error('Failed to fetch templates:', err)
        setError(err.response?.data?.error || 'Failed to load templates')
      } finally {
        setFetchingTemplates(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleTemplateSelect = (template: PDFTemplate) => {
    setSelectedTemplate(template)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTemplate) {
      onSubmit(
        selectedTemplate.id, 
        selectedTemplate.name, 
        selectedTemplate.preview_url || selectedTemplate.thumbnail
      )
    }
  }

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

  return (
    <form onSubmit={handleSubmit} className="template-selection-form">
      <div className="form-header">
        <h2>Choose Your Template</h2>
        <p>Select a design template for your lead magnet PDF</p>
      </div>

      <div className="template-grid">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
            onClick={() => handleTemplateSelect(template)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {(template.preview_url || template.thumbnail) ? (
              <div className="template-thumbnail">
                {failedPreviews.has(template.id) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                    <FileText size={48} />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>PDF Preview</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.7 }}>{template.name}</p>
                  </div>
                ) : (template.preview_url && template.preview_url.toLowerCase().endsWith('.pdf')) ? (
                  <img 
                    src={`https://image.thum.io/get/width/400/crop/600/noanimate/${encodeURIComponent(template.preview_url)}`}
                    alt={template.name}
                    onError={() => {
                      setFailedPreviews(prev => new Set(prev).add(template.id))
                    }}
                  />
                ) : failedPreviews.has(template.id) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                    <FileText size={48} />
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Preview Unavailable</p>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.7 }}>{template.name}</p>
                  </div>
                ) : (
                  <img 
                    src={template.preview_url || template.thumbnail} 
                    alt={template.name}
                    onError={() => {
                      setFailedPreviews(prev => new Set(prev).add(template.id))
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="template-thumbnail placeholder">
                <FileText size={48} />
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
                  Generating preview...
                </p>
              </div>
            )}
            <div className="template-info">
              <h3>{template.name}</h3>
              {template.description && <p>{template.description}</p>}
            </div>
            {selectedTemplate?.id === template.id && (
              <div className="selected-indicator">✓</div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="submit-btn"
          disabled={!selectedTemplate || loading}
        >
          {loading ? (
            <>
              <Loader2 className="spinner" size={18} />
              Processing...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </form>
  )
}

export default TemplateSelectionForm
