import React, { useState } from 'react';
import type { FirmProfile } from '../../lib/leadMagnetApi';
import { FIRM_SIZE_CHOICES, INDUSTRY_SPECIALTY_CHOICES, FONT_STYLE_CHOICES } from '../../lib/leadMagnetApi';

interface FirmProfileFormProps {
  data: Partial<FirmProfile>;
  onChange: (data: Partial<FirmProfile>) => void;
  isExisting?: boolean;
  onComplete?: () => void;
}

const FirmProfileForm: React.FC<FirmProfileFormProps> = ({ data, onChange, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleInputChange = (field: keyof FirmProfile, value: any) => {
    onChange({ [field]: value });
  };

  const handleSpecialtiesChange = (value: string, checked: boolean) => {
    const currentList = data.industry_specialty_list || [];
    if (checked) {
      onChange({ industry_specialty_list: [...currentList, value] });
    } else {
      onChange({ industry_specialty_list: currentList.filter(item => item !== value) });
    }
  };

  const handleFileUpload = (field: keyof FirmProfile, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange({ [field]: file });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return data.firm_name && data.work_email && data.firm_size && data.location_country;
      case 1: // Industry
        return data.industry_specialty_list?.length;
      case 2: // Branding
        return data.primary_brand_color;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <div className="form-field">
              <label htmlFor="firm_name">Firm Name *</label>
              <input
                type="text"
                id="firm_name"
                value={data.firm_name || ''}
                onChange={(e) => handleInputChange('firm_name', e.target.value)}
                placeholder="Enter your firm name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="work_email">Work Email *</label>
              <input
                type="email"
                id="work_email"
                value={data.work_email || ''}
                onChange={(e) => handleInputChange('work_email', e.target.value)}
                placeholder="your@firmname.com"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="firm_size">Firm Size *</label>
                <select
                  id="firm_size"
                  value={data.firm_size || ''}
                  onChange={(e) => handleInputChange('firm_size', e.target.value)}
                  required
                >
                  <option value="">Select firm size</option>
                  {FIRM_SIZE_CHOICES.map(choice => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="location_country">Location (Country) *</label>
                <input
                  type="text"
                  id="location_country"
                  value={data.location_country || ''}
                  onChange={(e) => handleInputChange('location_country', e.target.value)}
                  placeholder="United States"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="location_city">Location (City)</label>
              <input
                type="text"
                id="location_city"
                value={data.location_city || ''}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                placeholder="New York"
              />
            </div>

            <div className="form-field">
              <label htmlFor="website_url">Website URL</label>
              <input
                type="url"
                id="website_url"
                value={data.website_url || ''}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://yourfirm.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                value={data.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-field">
              <label htmlFor="firm_description">Firm Description</label>
              <textarea
                id="firm_description"
                value={data.firm_description || ''}
                onChange={(e) => handleInputChange('firm_description', e.target.value)}
                placeholder="Brief description of your architecture firm..."
                rows={3}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <div className="checkbox-grid">
              {INDUSTRY_SPECIALTY_CHOICES.map(choice => (
                <label key={choice.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={data.industry_specialty_list?.includes(choice.value) || false}
                    onChange={(e) => handleSpecialtiesChange(choice.value, e.target.checked)}
                  />
                  <span className="checkbox-text">{choice.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="form-field">
              <label htmlFor="logo">Logo Upload</label>
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={(e) => handleFileUpload('logo', e)}
              />
              <small>Upload your firm's logo (JPG, PNG, SVG)</small>
            </div>

            <div className="form-field">
              <label htmlFor="primary_brand_color">Primary Brand Color *</label>
              <input
                type="color"
                id="primary_brand_color"
                value={data.primary_brand_color || '#000000'}
                onChange={(e) => handleInputChange('primary_brand_color', e.target.value)}
                required
              />
              <small>Choose your firm's primary brand color</small>
            </div>

            <div className="form-field">
              <label htmlFor="secondary_brand_color">Secondary Brand Color</label>
              <input
                type="color"
                id="secondary_brand_color"
                value={data.secondary_brand_color || '#000000'}
                onChange={(e) => handleInputChange('secondary_brand_color', e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="preferred_font_style">Preferred Font Style</label>
              <select
                id="preferred_font_style"
                value={data.preferred_font_style || ''}
                onChange={(e) => handleInputChange('preferred_font_style', e.target.value)}
              >
                <option value="">Select font style</option>
                {FONT_STYLE_CHOICES.map(choice => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="additional_branding_guidelines">Additional Branding Guidelines</label>
              <textarea
                id="additional_branding_guidelines"
                value={data.additional_branding_guidelines || ''}
                onChange={(e) => handleInputChange('additional_branding_guidelines', e.target.value)}
                placeholder="Any specific brand guidelines, style preferences, or requirements..."
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    "Create Firm Profile",
    "Industry Specialties", 
    "Brand Identity"
  ];

  const stepDescriptions = [
    "Tell us about your architecture firm",
    "What areas does your firm focus on?",
    "Set up your visual branding"
  ];

  return (
    <div className="single-step-container">
      <div className="step-header">
        <h2>{stepTitles[currentStep]}</h2>
        <p>{stepDescriptions[currentStep]}</p>
      </div>

      <div className="step-content">
        {renderStepContent()}
      </div>

      <div className="step-actions">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="step-btn secondary"
          >
            Back
          </button>
        )}
        
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className="step-btn primary"
        >
          {currentStep === 2 ? 'Complete Profile' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default FirmProfileForm;