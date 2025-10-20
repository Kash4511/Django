import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Plus, Settings, LogOut, Palette } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi } from '../lib/dashboardApi'
import type { FirmProfile, TemplateSelectionRequest } from '../lib/dashboardApi'
import FirmProfileForm from './forms/FirmProfileForm'
import LeadMagnetGenerationForm from './forms/LeadMagnetGenerationForm'
import TemplateSelectionForm from './forms/TemplateSelectionForm'
import './CreateLeadMagnet.css'
import type { LeadMagnetGeneration } from '../lib/dashboardApi';


interface CreateLeadMagnetProps {}

type FormStep = 'firm-profile' | 'lead-magnet-generation' | 'template-selection'

const CreateLeadMagnet: React.FC<CreateLeadMagnetProps> = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<FormStep>('firm-profile')
  const [firmProfile, setFirmProfile] = useState<Partial<FirmProfile>>({})
  const [capturedAnswers, setCapturedAnswers] = useState<LeadMagnetGeneration & { title?: string }>({} as LeadMagnetGeneration)
  const [loading, setLoading] = useState(false)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBack = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    if (currentStep === 'template-selection') {
      setCurrentStep('lead-magnet-generation')
    } else if (currentStep === 'lead-magnet-generation') {
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
    // Just capture the data and move to template selection
    // Don't create the lead magnet yet
    setCapturedAnswers({
      ...firmProfile,
      ...data,
      title: humanizeTitle(data.main_topic, data.lead_magnet_type)
    })
    setCurrentStep('template-selection')
  }

  const getFilenameFromHeaders = (headers: Record<string, any>) => {
    const cd = headers['content-disposition'] || headers['Content-Disposition']
    if (!cd) return 'lead-magnet.pdf'

    // Try RFC 5987
    const starMatch = cd.match(/filename\*=([^;]+)/i)
    if (starMatch) {
      let value = starMatch[1].trim()
      if (value.startsWith("UTF-8''")) {
        value = value.replace("UTF-8''", '')
      }
      try {
        return decodeURIComponent(value.replace(/\"/g, ''))
      } catch {
        return value.replace(/\"/g, '')
      }
    }

    // Fallback to simple filename="..."
    const simpleMatch = cd.match(/filename="?([^";]+)"?/i)
    if (simpleMatch) return simpleMatch[1]

    return 'lead-magnet.pdf'
  }

  const handleTemplateSubmit = async (templateId: string, templateName: string, templateThumbnail?: string) => {
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      // Create the lead magnet with all captured data + template selection
      const generationData: LeadMagnetGeneration = {
        main_topic: capturedAnswers.main_topic,
        lead_magnet_type: capturedAnswers.lead_magnet_type,
        target_audience: capturedAnswers.target_audience,
        audience_pain_points: capturedAnswers.audience_pain_points,
        desired_outcome: capturedAnswers.desired_outcome,
        call_to_action: capturedAnswers.call_to_action,
        special_requests: capturedAnswers.special_requests,
      }

      const leadMagnet = await dashboardApi.createLeadMagnetWithData({
        title: capturedAnswers.title || 'Untitled Lead Magnet',
        firm_profile: hasExistingProfile ? undefined : firmProfile,
        generation_data: generationData,
      })

      setSuccessMessage('Lead magnet created. Saving template selection...')
      
      // Now save template selection and generate PDF with AI content
      const selectionRequest: TemplateSelectionRequest = {
        lead_magnet_id: leadMagnet.id,
        template_id: templateId,
        template_name: templateName,
        template_thumbnail: templateThumbnail,
        captured_answers: capturedAnswers,
        source: 'create-lead-magnet'
      }

      await dashboardApi.selectTemplate(selectionRequest)
      setSuccessMessage('Template selected. Generating PDF with AI...')
      
      // Generate PDF with AI content using the new endpoint
      try {
        const pdfResponse = await dashboardApi.generatePDFWithAI({
          template_id: templateId,
          lead_magnet_id: leadMagnet.id,
          use_ai_content: true
        })
        
        // Attempt to trigger download
        const filename = getFilenameFromHeaders(pdfResponse.headers)
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename || 'lead-magnet.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        
        setSuccessMessage('PDF generated. Download should start automatically.')
        navigate('/dashboard')
      } catch (pdfError) {
        console.error('🔴 PDF generation failed:', pdfError)
        setErrorMessage('PDF generation failed. You can retry from dashboard.')
        // Still navigate to dashboard even if PDF generation fails
        navigate('/dashboard')
      }
      
    } catch (err) {
      console.error('Failed to create lead magnet with template:', err)
      setErrorMessage('Failed to create lead magnet. Please review inputs and try again.')
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
              <div className={`step ${currentStep === 'lead-magnet-generation' ? 'active' : currentStep === 'template-selection' ? 'completed' : ''}`}>
                2. Lead Magnet Details
              </div>
              <div className={`step ${currentStep === 'template-selection' ? 'active' : ''}`}>
                3. Choose Template
              </div>
            </div>

            {errorMessage && (
              <div className="status-message error" style={{ marginTop: '8px', color: '#b00020' }}>{errorMessage}</div>
            )}
            {successMessage && (
              <div className="status-message success" style={{ marginTop: '8px', color: '#0b7a0b' }}>{successMessage}</div>
            )}
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

            {currentStep === 'template-selection' && (
  <TemplateSelectionForm
    onSubmit={handleTemplateSubmit}
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