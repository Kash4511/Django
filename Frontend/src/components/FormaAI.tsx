import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, Palette, Paperclip, Send, File as PdfIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import TemplateSelectionForm from './forms/TemplateSelectionForm'
import './FormaAI.css'
import './Dashboard.css'
import { dashboardApi, LeadMagnetProgress } from '../lib/dashboardApi'

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
  const [generationProgress, setGenerationProgress] = useState<LeadMagnetProgress | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewBlob, setIsPreviewBlob] = useState<boolean>(false)
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
    setGenerationProgress({ percent: 5, stage: 'Initializing', details: 'Connecting to AI...' })

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

      // Use the new sendAIConversation method which handles polling and progress
      const result = await dashboardApi.sendAIConversation(formData, (progress) => {
        setGenerationProgress(progress)
      })

      if (result.pdfUrl) {
        setPreviewUrl(result.pdfUrl)
        setIsPreviewBlob(result.pdfUrl.startsWith('blob:'))
        setShowPreviewModal(true)

        setMessages(prev => [...prev, '✅ PDF generated. Preview opened.'])
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg !== '✅ PDF generated. Preview opened.'))
        }, 3000)
      } else if (result.data) {
        const assistantMsg = result.data?.response || 'AI responded.'
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch (err: any) {
      console.error('Forma AI Error:', err)
      const errMsg = err?.message || 'Request failed.'
      // Show error message briefly
      setMessages(prev => [...prev, `❌ Error: ${errMsg}`])
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.includes('❌ Error:')))
      }, 5000)
    } finally {
      setMessage('')
      setAttachedFiles([])
      setGenerationProgress(null)
      setIsGeneratingPDF(false)
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
      {/* PDF Generation Overlay Popup */}
      {isGeneratingPDF && generationProgress && (
        <div className="pdf-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pdf-overlay-content"
          >
            <div className="pdf-icon-wrapper">
              <FileText size={48} className="rotating-icon" />
            </div>
            <h2>Generating Your PDF</h2>
            <p>Our AI is crafting your lead magnet based on your input.</p>
            
            <div className="progress-container" style={{ margin: '2rem 0' }}>
              <div className="progress-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="progress-stage" style={{ fontWeight: 600, color: '#3498db' }}>{generationProgress.stage}</span>
                <span className="progress-percent" style={{ color: '#ecf0f1' }}>{generationProgress.percent}%</span>
              </div>
              <div className="progress-bar-bg" style={{ width: '100%', height: '10px', backgroundColor: '#3d3d3d', borderRadius: '5px', overflow: 'hidden' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${generationProgress.percent}%`, 
                    height: '100%', 
                    backgroundColor: '#3498db', 
                    transition: 'width 0.5s ease-in-out',
                    boxShadow: '0 0 10px rgba(52, 152, 219, 0.5)'
                  }}
                ></div>
              </div>
              {generationProgress.details && (
                <p className="progress-details" style={{ fontSize: '14px', color: '#95a5a6', marginTop: '12px' }}>
                  {generationProgress.details}
                </p>
              )}
            </div>
            
            <button className="cancel-btn" onClick={handleCancelGeneration}>
              Cancel Generation
            </button>
          </motion.div>
        </div>
      )}

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

      {showPreviewModal && (
        <Modal 
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            if (previewUrl && isPreviewBlob) { window.URL.revokeObjectURL(previewUrl) }
            setPreviewUrl(null)
            setIsPreviewBlob(false)
          }}
          title="Preview PDF"
          maxWidth={1000}
        >
          {previewUrl ? (
            <div className="pdf-preview-container">
              <div className="pdf-preview-iframe-wrapper" style={{ position: 'relative' }}>
                <iframe 
                  title="Forma AI PDF Preview" 
                  src={previewUrl} 
                  style={{ width: '100%', height: '70vh', border: '1px solid #333' }}
                  onError={(e) => console.error('Iframe load error:', e)}
                />
                <div className="pdf-iframe-fallback" style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#1a1a1a',
                  zIndex: -1,
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#ecf0f1', marginBottom: '1rem' }}>
                    If the preview doesn't load, it might be due to security restrictions or a connection issue.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <a 
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  Open in New Tab
                </a>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (previewUrl) {
                      const link = document.createElement('a')
                      link.href = previewUrl
                      link.setAttribute('download', `forma-ai-${selectedTemplateId || 'lead-magnet'}.pdf`)
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
                    if (previewUrl && isPreviewBlob) { window.URL.revokeObjectURL(previewUrl) }
                    setPreviewUrl(null)
                    setIsPreviewBlob(false)
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
      )}
    </div>
  )
}

export default FormaAI
