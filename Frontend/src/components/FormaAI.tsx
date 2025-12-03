import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, Palette, Paperclip, Send, File as PdfIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import TemplateSelectionForm from './forms/TemplateSelectionForm'
import './FormaAI.css'
import './Dashboard.css'
import { apiClient } from '../lib/apiClient'

const FormaAI: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('')
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [architecturalImages, setArchitecturalImages] = useState<File[]>([])
  const [messages, setMessages] = useState<string[]>([])
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<number>(0)
  const progressTimers = useRef<number[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setAttachedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleTemplateSelect = (templateId: string, templateName: string, images?: File[]) => {
    setSelectedTemplateId(templateId)
    setSelectedTemplateName(templateName)
    setTemplateError(null)
    if (images) {
      setArchitecturalImages(images)
    }
  }

  const handleSend = async () => {
    // Check if template is selected
    if (!selectedTemplateId) {
      setTemplateError('Pick template')
      // Subtle visual cue on the template button
      const templateButton = document.querySelector('.pdf-btn') as HTMLElement
      if (templateButton) {
        templateButton.style.border = '2px solid #ff6b6b'
        setTimeout(() => { templateButton.style.border = '1px solid #555' }, 1500)
      }
      return
    }

    // Check if architectural images are uploaded
    if (architecturalImages.length === 0) {
      setTemplateError('Upload images')
      return
    }

    if (!message.trim() && attachedFiles.length === 0) return

    const userMsg = message.trim() || '(attachments)'
    setMessages(prev => [...prev, userMsg])
    setTemplateError(null)
    setIsGeneratingPDF(true)
    setGenerationProgress(0)
    // Simulated progress milestones
    progressTimers.current.forEach(id => window.clearTimeout(id))
    progressTimers.current = []
    progressTimers.current.push(window.setTimeout(() => setGenerationProgress(25), 600))
    progressTimers.current.push(window.setTimeout(() => setGenerationProgress(75), 1800))

    try {
      // Create FormData to handle file uploads
      const formData = new FormData()
      formData.append('message', userMsg)
      formData.append('generate_pdf', 'true')
      formData.append('template_id', selectedTemplateId)
      
      // Add architectural images
      architecturalImages.forEach((image, index) => {
        formData.append(`architectural_image_${index + 1}`, image)
      })
      
      // Add attached files if any
      attachedFiles.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })

      // Request may return either JSON or a PDF; use arraybuffer then inspect content-type
      const res = await apiClient.post('/api/ai-conversation/', formData, { 
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const contentType = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || ''

      if (contentType.includes('application/pdf')) {
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setShowPreviewModal(true)

        setMessages(prev => [...prev, '✅ PDF generated. Preview opened.'])
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg !== '✅ PDF generated. Preview opened.'))
        }, 3000)
      } else {
        // Decode JSON payload from arraybuffer
        const text = new TextDecoder('utf-8').decode(res.data as ArrayBuffer)
        const data = JSON.parse(text)
        const assistantMsg = data?.response || 'AI responded.'
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch (err: any) {
      const errMsg = err?.response?.data ? 'Request failed.' : (err?.message || 'Request error.')
      // Show error message briefly
      setMessages(prev => [...prev, `❌ Error: ${errMsg}`])
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.includes('❌ Error:')))
      }, 5000)
    } finally {
      setMessage('')
      setAttachedFiles([])
      setGenerationProgress(100)
      setIsGeneratingPDF(false)
      // Clear timers
      progressTimers.current.forEach(id => window.clearTimeout(id))
      progressTimers.current = []
    }
  }

  const handleCancelGeneration = () => {
    // For now, just hide the overlay
    // In a real implementation, you might want to cancel the API request
    setIsGeneratingPDF(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll to newest message when messages change
  useEffect(() => {
    const container = messagesRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="forma-ai">
      {/* Control panel removed as requested */}
      <nav className="dashboard-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">📄</div>
            <div className="brand-info">
              <h3>AI Lead Magnets</h3>
              <p>Your AI Workforce</p>
            </div>
          </div>
          
          <button className="sidebar-create-btn" onClick={() => navigate('/create-lead-magnet')}>
            <Plus size={20} />
            Create Lead Magnet
          </button>

          <div className="sidebar-section">
            <h4>Navigation</h4>
            <nav className="sidebar-nav">
              <a href="/dashboard" className="nav-item">
                <FileText size={18} />
                My Lead Magnets
              </a>
              <a href="/forma-ai" className="nav-item active">
                <Settings size={18} />
                Forma AI
              </a>
              <a href="/brand-assets" className="nav-item">
                <Palette size={18} />
                Brand Assets
              </a>
              <a href="/settings" className="nav-item">
                <Settings size={18} />
                Settings
              </a>
            </nav>
          </div>
        </aside>

        <main className="ai-content">
          <div className="ai-header">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            
            <div className="ai-title-section">
              <h1 className="ai-main-title">Forma AI</h1>
              <p className="ai-subtitle">
                Get help with architecture projects, design ideas, and technical questions from our AI assistant.
              </p>
            </div>
          </div>

      <div className="chat-container">
          {templateError && (
            <div className="template-error-banner" role="alert">{templateError}</div>
          )}
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            ref={messagesRef}
          >
            {messages.map((m, i) => (
              <div key={i} className="chat-message-item">{m}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>

            <div className="chat-input-container">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="chat-input-wrapper"
              >
                {attachedFiles.length > 0 && (
                  <div className="attached-files">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="attached-file">
                        <span className="file-name">{file.name}</span>
                        <button 
                          className="remove-file-btn"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="chat-input-box">
                  <textarea
                    className="chat-input"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      // Auto-resize textarea height based on content
                      e.currentTarget.style.height = 'auto'
                      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the idea you want to build..."
                    rows={1}
                  />
                  
                  <div className="chat-controls">
                    <div className="left-controls">
                      <button className="pdf-btn" onClick={() => setShowTemplateModal(true)}>
                        <PdfIcon size={18} />
                        {architecturalImages.length > 0 && (
                          <span className="image-indicator">{architecturalImages.length}</span>
                        )}
                      </button>
                    </div>

                    <button 
                      className="send-btn"
                      onClick={handleSend}
                      disabled={!message.trim() && attachedFiles.length === 0}
                    >
                      <Send size={18} />
                      Start chat
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      <Modal 
        isOpen={showTemplateModal} 
        onClose={() => setShowTemplateModal(false)} 
        title="Choose Your Template"
      >
        <TemplateSelectionForm 
          onSubmit={(templateId, templateName, images) => {
            handleTemplateSelect(templateId, templateName, images)
            setShowTemplateModal(false)
          }}
          onClose={() => setShowTemplateModal(false)}
        />
      </Modal>

      <Modal 
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
        }}
        title="Preview PDF"
        maxWidth={1000}
      >
        {previewUrl ? (
          <div>
            <iframe title="Forma AI PDF Preview" src={previewUrl} style={{ width: '100%', height: '70vh', border: '1px solid #333' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (previewUrl) {
                    const link = document.createElement('a')
                    link.href = previewUrl
                    link.setAttribute('download', `forma-ai-${selectedTemplateId}.pdf`)
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                  }
                }}
              >
                Download PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPreviewModal(false)
                  if (previewUrl) { window.URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Loading preview...</div>
        )}
      </Modal>

      {isGeneratingPDF && (
        <div className="pdf-overlay">
          <div className="pdf-overlay-content">
            <div className="pdf-spinner"></div>
            <p>Generating your PDF... {generationProgress}%</p>
            <button 
              className="cancel-btn" 
              onClick={handleCancelGeneration}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#ff4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormaAI
