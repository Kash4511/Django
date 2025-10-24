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

  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    let timer: any
    if (loading) {
      setElapsed(0)
      timer = setInterval(() => setElapsed((s) => s + 1), 1000)
    }
    return () => timer && clearInterval(timer)
  }, [loading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTemplate) {
      onSubmit(selectedTemplate.id, selectedTemplate.name, selectedTemplate.thumbnail)
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
            {template.preview_url ? (
              <div className="template-thumbnail">
                <img src={template.preview_url} alt={template.name} />
              </div>
            ) : (
              <div className="template-thumbnail placeholder">
                <FileText size={48} />
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
              Processing... ({elapsed}s)
            </>
          ) : (
            'Continue'
          )}
        </button>
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
    </form>
  )
}

export default TemplateSelectionForm
