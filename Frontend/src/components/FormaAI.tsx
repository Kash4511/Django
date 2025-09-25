import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, Palette, Paperclip, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './FormaAI.css'

const FormaAI: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

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

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0) {
      // TODO: Implement AI chat functionality
      console.log('Sending message:', message)
      console.log('Attached files:', attachedFiles)
      
      // Clear form after sending
      setMessage('')
      setAttachedFiles([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="forma-ai">
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
              <a href="#" className="nav-item">
                <Download size={18} />
                Active Campaigns
              </a>
              <a href="/brand-assets" className="nav-item">
                <Palette size={18} />
                Brand Assets
              </a>
              <a href="#" className="nav-item">
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
            <div className="chat-welcome">
              <h2 className="welcome-title">Welcome to Forma AI</h2>
            </div>

            <div className="chat-messages">
              {/* Chat messages will go here in the future */}
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
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the idea you want to build..."
                    rows={1}
                  />
                  
                  <div className="chat-controls">
                    <div className="left-controls">
                      <label className="file-upload-btn">
                        <Paperclip size={18} />
                        <input
                          type="file"
                          multiple
                          onChange={handleFileAttach}
                          style={{ display: 'none' }}
                          accept="image/*,application/pdf,.doc,.docx,.txt"
                        />
                      </label>
                      
                      <select className="theme-selector">
                        <option value="auto">Auto theme</option>
                        <option value="light">Light theme</option>
                        <option value="dark">Dark theme</option>
                      </select>
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
    </div>
  )
}

export default FormaAI