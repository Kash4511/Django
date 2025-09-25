import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, User, Palette } from 'lucide-react'
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
    // Filter to only include basic business info, never branding fields
    const basicInfoOnly = {
      firm_name: data.firm_name,
      work_email: data.work_email,
      phone_number: data.phone_number,
      firm_website: data.firm_website,
      firm_size: data.firm_size,
      industry_specialties: data.industry_specialties,
      location: data.location
    }
    setFirmProfile(basicInfoOnly)
    setCurrentStep('lead-magnet-generation')
  }

  const humanizeTitle = (topic: string, type: string) => {
    const topicMap: Record<string, string> = {
      'sustainable-architecture': 'Sustainable Architecture',
      'smart-homes': 'Smart Homes',
      'adaptive-reuse': 'Adaptive Reuse',
      'wellness-biophilic': 'Wellness & Biophilic Design',
      'modular-prefab': 'Modular & Prefab',
      'urban-placemaking': 'Urban Placemaking',
      'passive-house': 'Passive House & Net-Zero',
      'climate-resilient': 'Climate-Resilient Design',
      'project-roi': 'Project ROI',
      'branding-differentiation': 'Branding & Differentiation'
    }
    
    const typeMap: Record<string, string> = {
      'guide': 'Guide',
      'case-study': 'Case Study',
      'checklist': 'Checklist',
      'roi-calculator': 'ROI Calculator',
      'trends-report': 'Trends Report',
      'onboarding-flow': 'Client Onboarding Flow',
      'design-portfolio': 'Design Portfolio'
    }
    
    return `${topicMap[topic] || topic} ${typeMap[type] || type}`
  }

  const handleGenerationSubmit = async (data: LeadMagnetGeneration) => {
    setLoading(true)
    try {
      const createRequest: CreateLeadMagnetRequest = {
        title: humanizeTitle(data.main_topic, data.lead_magnet_type),
        description: data.desired_outcome,
        firm_profile: hasExistingProfile ? undefined : firmProfile,
        generation_data: data
      }

      await dashboardApi.createLeadMagnetWithData(createRequest)
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to create lead magnet:', err)
      // Could add user-facing error handling here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-lead-magnet">
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
              <a href="/forma-ai" className="nav-item">
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