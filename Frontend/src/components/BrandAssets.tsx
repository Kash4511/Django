import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, User, Palette } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../lib/dashboardApi'
import type { FirmProfile } from '../lib/dashboardApi'
import './BrandAssets.css'

const FONT_STYLES = [
  { value: 'modern-sans', label: 'Modern Sans-Serif' },
  { value: 'classic-serif', label: 'Classic Serif' },
  { value: 'creative', label: 'Creative/Display' },
  { value: 'no-preference', label: 'No Preference' }
]

const BrandAssets: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<FirmProfile>>({
    primary_brand_color: '#2a5766',
    secondary_brand_color: '#ffffff',
    preferred_font_style: 'no-preference',
    branding_guidelines: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasExistingAssets, setHasExistingAssets] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  // Load existing brand assets
  useEffect(() => {
    const loadBrandAssets = async () => {
      try {
        setLoading(true)
        const profile = await dashboardApi.getFirmProfile()
        if (profile) {
          setFormData({
            primary_brand_color: profile.primary_brand_color || '#2a5766',
            secondary_brand_color: profile.secondary_brand_color || '#ffffff', 
            preferred_font_style: profile.preferred_font_style || 'no-preference',
            branding_guidelines: profile.branding_guidelines || ''
          })
          if (profile.primary_brand_color || profile.branding_guidelines) {
            setHasExistingAssets(true)
          }
        }
      } catch (err) {
        console.log('No existing brand assets found')
      } finally {
        setLoading(false)
      }
    }

    loadBrandAssets()
  }, [])

  const handleInputChange = (field: keyof FirmProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await dashboardApi.updateFirmProfile(formData)
      setHasExistingAssets(true)
      // Could add success notification here
    } catch (err) {
      console.error('Failed to save brand assets:', err)
      // Could add error notification here
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="brand-assets">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ffffff' }}>
          Loading brand assets...
        </div>
      </div>
    )
  }

  return (
    <div className="brand-assets">
      <nav className="dashboard-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <div className="user-menu">
            <User className="user-icon" size={20} />
            <span className="user-name">{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
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
              <a href="#" className="nav-item">
                <Download size={18} />
                Active Campaigns
              </a>
              <a href="#" className="nav-item active">
                <Palette size={18} />
                Brand Assets
              </a>
              <a href="#" className="nav-item">
                <Settings size={18} />
                Settings
              </a>
              <a href="#" className="nav-item">
                <User size={18} />
                Analytics
              </a>
            </nav>
          </div>

          <div className="sidebar-section">
            <h4>Account</h4>
            <nav className="sidebar-nav">
              <a href="#" className="nav-item">
                <Settings size={18} />
                Settings
              </a>
            </nav>
          </div>
        </aside>

        <main className="brand-content">
          <div className="brand-header">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            
            <div className="brand-title-section">
              <h1 className="brand-main-title">Brand Assets</h1>
              <p className="brand-subtitle">
                Set up your brand colors, fonts, and guidelines. These will be applied to all your lead magnets.
              </p>
            </div>
          </div>

          <div className="brand-form-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="brand-form"
            >
              <div className="form-section">
                <h2 className="section-title">Brand Colors</h2>
                
                <div className="form-group">
                  <label className="form-label">Primary Brand Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-input"
                      value={formData.primary_brand_color || '#2a5766'}
                      onChange={(e) => handleInputChange('primary_brand_color', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input color-text"
                      value={formData.primary_brand_color || ''}
                      onChange={(e) => handleInputChange('primary_brand_color', e.target.value)}
                      placeholder="#2a5766"
                    />
                  </div>
                  <p className="field-description">Used for headings, accents, and call-to-action elements</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Brand Color</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      className="color-input"
                      value={formData.secondary_brand_color || '#ffffff'}
                      onChange={(e) => handleInputChange('secondary_brand_color', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input color-text"
                      value={formData.secondary_brand_color || ''}
                      onChange={(e) => handleInputChange('secondary_brand_color', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                  <p className="field-description">Used for backgrounds and complementary elements</p>
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Typography</h2>
                
                <div className="form-group">
                  <label className="form-label">Preferred Font Style</label>
                  <select
                    className="form-select"
                    value={formData.preferred_font_style || 'no-preference'}
                    onChange={(e) => handleInputChange('preferred_font_style', e.target.value)}
                  >
                    {FONT_STYLES.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-description">The font style that best represents your brand</p>
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Brand Guidelines</h2>
                
                <div className="form-group">
                  <label className="form-label">Additional Branding Guidelines</label>
                  <textarea
                    className="form-textarea"
                    value={formData.branding_guidelines || ''}
                    onChange={(e) => handleInputChange('branding_guidelines', e.target.value)}
                    placeholder="Any specific branding requirements, style guides, tone of voice, or design preferences..."
                    rows={6}
                  />
                  <p className="field-description">Describe your brand personality, tone, and any specific design requirements</p>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (hasExistingAssets ? 'Update Brand Assets' : 'Save Brand Assets')}
                </button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default BrandAssets