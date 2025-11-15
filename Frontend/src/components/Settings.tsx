import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowLeft, Save, Trash2, FileText, Plus, Palette, Settings as SettingsIcon, Bot } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/apiClient'
import Modal from './Modal'
import './Settings.css'

interface ProfileData {
  email: string
  name: string
  phone_number: string
}

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({ email: '', name: '', phone_number: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiClient.get('/api/auth/profile/')
        setProfile({
          email: res.data.email || '',
          name: res.data.name || '',
          phone_number: res.data.phone_number || ''
        })
      } catch (err) {
        console.warn('Failed to load profile', err)
      }
    }
    loadProfile()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await apiClient.patch('/api/auth/profile/', {
        name: profile.name,
        phone_number: profile.phone_number
      })
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)
    try {
      await apiClient.post('/api/auth/delete/', { password: deletePassword })
      setShowDeleteModal(false)
      setDeletePassword('')
      logout()
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to delete account. Check password and try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="settings-page" role="main" aria-label="Settings">
      <nav className="dashboard-nav">
        <div className="nav-brand">Forma</div>
        <div className="nav-actions">
          <span className="user-name" aria-label="Current user" title={profile.email}>
            {profile.name || profile.email || 'User'}
          </span>
          <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
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
              <a href="/forma-ai" className="nav-item">
                <Bot size={18} />
                Forma AI
              </a>
              <a href="/brand-assets" className="nav-item">
                <Palette size={18} />
                Brand Assets
              </a>
              <a href="/settings" className="nav-item active">
                <SettingsIcon size={18} />
                Settings
              </a>
            </nav>
          </div>
        </aside>

        <main className="dashboard-main-content">
          <div className="settings-container">
            <header className="settings-header">
              <button className="back-button" onClick={handleBack} aria-label="Back to Dashboard">
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h1 className="settings-title">Personal profile</h1>
            </header>

            <section className="settings-section" aria-labelledby="email-label">
              <label id="email-label" className="field-label">Email address</label>
              <div className="read-only-field" aria-readonly="true">{profile.email || '—'}</div>
            </section>

            <section className="settings-section" aria-labelledby="profile-label">
              <label id="profile-label" className="section-label">Personal profile</label>
              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label" htmlFor="full-name">Full Name</label>
                  <input
                    id="full-name"
                    type="text"
                    className="form-input"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="field-label" htmlFor="phone-number">Phone Number</label>
                  <input
                    id="phone-number"
                    type="tel"
                    className="form-input"
                    value={profile.phone_number}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  aria-label="Save profile"
                >
                  <Save size={16} /> Save Changes
                </button>
                {success && <div className="status success" role="status">{success}</div>}
                {error && <div className="status error" role="alert">{error}</div>}
              </div>
            </section>

            <section className="settings-section danger" aria-labelledby="delete-label">
              <label id="delete-label" className="section-label">Delete Account</label>
              <p className="warning-text">This action is permanent and will result in irreversible data loss.</p>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteModal(true)}
                aria-label="Delete account"
              >
                <Trash2 size={16} /> Delete Account
              </button>
            </section>

            <Modal
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setDeletePassword('') }}
              title="Confirm Account Deletion"
              maxWidth={560}
            >
              <div role="dialog" aria-modal="true" aria-describedby="delete-warning">
                <p id="delete-warning" className="modal-warning">
                  Deleting your account is permanent. All your data will be lost.
                </p>
                <div className="form-group">
                  <label className="field-label" htmlFor="delete-password">Enter your password to confirm</label>
                  <input
                    id="delete-password"
                    type="password"
                    className="form-input"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Password"
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} aria-label="Cancel deletion">Cancel</button>
                  <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting || !deletePassword} aria-label="Confirm deletion">Delete Account</button>
                </div>
              </div>
            </Modal>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Settings