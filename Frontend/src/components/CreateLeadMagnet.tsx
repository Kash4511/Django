import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../lib/dashboardApi'
import type { FirmProfile, LeadMagnetGeneration, CreateLeadMagnetRequest } from '../lib/dashboardApi'
import FirmProfileForm from './forms/FirmProfileForm'
import LeadMagnetGenerationForm from './forms/LeadMagnetGenerationForm'
import './CreateLeadMagnet.css'

interface CreateLeadMagnetProps {}

type FormStep = 'firm-profile' | 'lead-magnet-generation' | 'summary'

const CreateLeadMagnet: React.FC<CreateLeadMagnetProps> = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<FormStep>('firm-profile')
  const [firmProfile, setFirmProfile] = useState<Partial<FirmProfile>>({})
  const [generationData, setGenerationData] = useState<Partial<LeadMagnetGeneration>>({})
  const [loading, setLoading] = useState(false)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBack = () => {
    if (currentStep === 'lead-magnet-generation') {
      setCurrentStep('firm-profile')
    } else {
      navigate('/dashboard')
    }
  }

  // Check if user has existing firm profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const profile = await dashboardApi.getFirmProfile()
        if (profile && profile.firm_name) {
          setFirmProfile(profile)
          setHasExistingProfile(true)
          setCurrentStep('lead-magnet-generation')
        }
      } catch (err) {
        // No existing profile, start with firm profile form
        console.log('No existing profile found')
      }
    }

    checkExistingProfile()
  }, [])

  const handleFirmProfileNext = (data: Partial<FirmProfile>) => {
    setFirmProfile(data)
    setCurrentStep('lead-magnet-generation')
  }

  const handleGenerationSubmit = async (data: LeadMagnetGeneration) => {
    setLoading(true)
    try {
      const createRequest: CreateLeadMagnetRequest = {
        title: `${data.main_topic} ${data.lead_magnet_type}`,
        description: data.desired_outcome,
        firm_profile: hasExistingProfile ? undefined : firmProfile,
        generation_data: data
      }

      await dashboardApi.createLeadMagnetWithData(createRequest)
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to create lead magnet:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lead-magnet">
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
          
          <button className="sidebar-create-btn active">
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
              <a href="#" className="nav-item">
                <Settings size={18} />
                Integrations
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

        <main className="create-content">
          <div className="create-header">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
              Back
            </button>
            
            <div className="step-indicator">
              <div className={`step ${currentStep === 'firm-profile' ? 'active' : 'completed'}`}>
                1. {hasExistingProfile ? 'Profile' : 'Firm Profile'}
              </div>
              <div className={`step ${currentStep === 'lead-magnet-generation' ? 'active' : ''}`}>
                2. Lead Magnet Details
              </div>
            </div>
          </div>

          <div className="form-container">
            {currentStep === 'firm-profile' && (
              <FirmProfileForm
                initialData={firmProfile}
                onNext={handleFirmProfileNext}
                isUpdate={hasExistingProfile}
              />
            )}

            {currentStep === 'lead-magnet-generation' && (
              <LeadMagnetGenerationForm
                onSubmit={handleGenerationSubmit}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreateLeadMagnet