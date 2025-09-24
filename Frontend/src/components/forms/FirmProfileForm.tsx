import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { FirmProfile } from '../../lib/dashboardApi'
import './FirmProfileForm.css'

interface FirmProfileFormProps {
  initialData?: Partial<FirmProfile>
  onNext: (data: Partial<FirmProfile>) => void
  isUpdate?: boolean
}

const FIRM_SIZE_OPTIONS = [
  { value: '1-2', label: '1–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-10', label: '6–10' },
  { value: '11+', label: '11+' }
]

const INDUSTRY_SPECIALTIES = [
  'Residential',
  'Commercial', 
  'Mixed Practice',
  'Sustainable/Green',
  'Educational/Civic',
  'Hospitality',
  'Healthcare',
  'Interiors',
  'Urban Design',
  'Other'
]

const FONT_STYLES = [
  { value: 'modern-sans', label: 'Modern Sans-Serif' },
  { value: 'classic-serif', label: 'Classic Serif' },
  { value: 'creative', label: 'Creative/Display' },
  { value: 'no-preference', label: 'No Preference' }
]

const FirmProfileForm: React.FC<FirmProfileFormProps> = ({ 
  initialData = {}, 
  onNext, 
  isUpdate = false 
}) => {
  const [formData, setFormData] = useState<Partial<FirmProfile>>({
    firm_name: '',
    work_email: '',
    phone_number: '',
    firm_website: '',
    firm_size: '1-2',
    industry_specialties: [],
    primary_brand_color: '',
    secondary_brand_color: '',
    preferred_font_style: 'no-preference',
    branding_guidelines: '',
    location: '',
    ...initialData
  })

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Basic Information',
    'Industry & Size',
    'Branding',
    'Additional Details'
  ]

  const handleInputChange = (field: keyof FirmProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    const current = formData.industry_specialties || []
    const updated = current.includes(specialty)
      ? current.filter(s => s !== specialty)
      : [...current, specialty]
    handleInputChange('industry_specialties', updated)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onNext(formData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.firm_name && formData.work_email
      case 1:
        return formData.firm_size && (formData.industry_specialties?.length || 0) > 0
      case 2:
        return true // Optional fields
      case 3:
        return true // Optional fields
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-step">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-group"
            >
              <label className="form-label">Firm Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.firm_name || ''}
                onChange={(e) => handleInputChange('firm_name', e.target.value)}
                placeholder="Enter your firm name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="form-group"
            >
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                className="form-input"
                value={formData.work_email || ''}
                onChange={(e) => handleInputChange('work_email', e.target.value)}
                placeholder="your@company.com"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="form-group"
            >
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="form-group"
            >
              <label className="form-label">Firm Website</label>
              <input
                type="url"
                className="form-input"
                value={formData.firm_website || ''}
                onChange={(e) => handleInputChange('firm_website', e.target.value)}
                placeholder="https://www.yourfirm.com"
              />
            </motion.div>
          </div>
        )

      case 1:
        return (
          <div className="form-step">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-group"
            >
              <label className="form-label">Firm Size *</label>
              <div className="radio-group">
                {FIRM_SIZE_OPTIONS.map((option) => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="firm_size"
                      value={option.value}
                      checked={formData.firm_size === option.value}
                      onChange={(e) => handleInputChange('firm_size', e.target.value)}
                    />
                    <span className="radio-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="form-group"
            >
              <label className="form-label">Industry Specialty (select all that apply) *</label>
              <div className="checkbox-grid">
                {INDUSTRY_SPECIALTIES.map((specialty) => (
                  <label key={specialty} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={(formData.industry_specialties || []).includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                    />
                    <span className="checkbox-label">{specialty}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          </div>
        )

      case 2:
        return (
          <div className="form-step">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-group"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="form-group"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="form-group"
            >
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
            </motion.div>
          </div>
        )

      case 3:
        return (
          <div className="form-step">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="form-group"
            >
              <label className="form-label">Additional Branding Guidelines</label>
              <textarea
                className="form-textarea"
                value={formData.branding_guidelines || ''}
                onChange={(e) => handleInputChange('branding_guidelines', e.target.value)}
                placeholder="Any specific branding requirements, style guides, or preferences..."
                rows={4}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="form-group"
            >
              <label className="form-label">Location / Country</label>
              <input
                type="text"
                className="form-input"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State/Province, Country"
              />
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="firm-profile-form">
      <div className="form-header">
        <h1 className="form-title">
          {isUpdate ? 'Update Firm Profile' : 'Create Firm Profile'}
        </h1>
        <div className="form-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
          </span>
        </div>
      </div>

      <div className="form-content">
        {renderStepContent()}
      </div>

      <div className="form-actions">
        {currentStep > 0 && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handlePrevious}
          >
            Previous
          </button>
        )}
        
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!isStepValid()}
        >
          {currentStep === steps.length - 1 ? 'Next' : 'Next'}
        </button>
      </div>
    </div>
  )
}

export default FirmProfileForm