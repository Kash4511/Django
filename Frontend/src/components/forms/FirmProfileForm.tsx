import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { FirmProfile } from '../../lib/leadMagnetApi';
import { FIRM_SIZE_CHOICES, INDUSTRY_SPECIALTY_CHOICES, FONT_STYLE_CHOICES } from '../../lib/leadMagnetApi';
import QuestionCard from './QuestionCard';
import './QuestionCard.css';

interface FirmProfileFormProps {
  data: Partial<FirmProfile>;
  onChange: (data: Partial<FirmProfile>) => void;
  isExisting?: boolean;
  onComplete?: () => void;
}

const FirmProfileForm: React.FC<FirmProfileFormProps> = ({ data, onChange, isExisting, onComplete }) => {
  const [currentCard, setCurrentCard] = useState(0);

  const handleInputChange = (field: keyof FirmProfile, value: any) => {
    onChange({ [field]: value });
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const currentIndustries = data.industry_specialty_list || [];
    const updatedIndustries = checked
      ? [...currentIndustries, industry]
      : currentIndustries.filter(i => i !== industry);
    
    onChange({ 
      industry_specialty_list: updatedIndustries,
      industry_specialty: updatedIndustries.join(',')
    });
  };

  const handleFileUpload = (field: keyof FirmProfile, file: File | null) => {
    if (file) {
      onChange({ [field]: file });
    }
  };

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const canProceed = (cardIndex: number) => {
    switch (cardIndex) {
      case 0: // Basic Info
        return data.firm_name && data.work_email && data.firm_size && data.location_country;
      case 1: // Industry
        return data.industry_specialty_list?.length;
      case 2: // Branding
        return data.primary_brand_color;
      default:
        return true;
    }
  };

  const cards = [
    {
      title: "Basic Information",
      description: "Tell us about your architecture firm",
      content: (
        <div>
          <div className="form-field">
            <label htmlFor="firm_name">Firm Name *</label>
            <input
              type="text"
              id="firm_name"
              value={data.firm_name || ''}
              onChange={(e) => handleInputChange('firm_name', e.target.value)}
              placeholder="Your Architecture Firm"
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
              placeholder="contact@yourfirm.com"
              required
            />
          </div>

          <div className="form-row">
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
              <label htmlFor="firm_website">Firm Website</label>
              <input
                type="url"
                id="firm_website"
                value={data.firm_website || ''}
                onChange={(e) => handleInputChange('firm_website', e.target.value)}
                placeholder="https://yourfirm.com"
              />
            </div>
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
              <label htmlFor="location_country">Location/Country *</label>
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
        </div>
      )
    },
    {
      title: "Industry Specialties",
      description: "What areas does your firm focus on?",
      content: (
        <div className="checkbox-grid">
          {INDUSTRY_SPECIALTY_CHOICES.map(choice => (
            <label key={choice.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={data.industry_specialty_list?.includes(choice.value) || false}
                onChange={(e) => handleIndustryChange(choice.value, e.target.checked)}
              />
              <span className="checkbox-text">{choice.label}</span>
            </label>
          ))}
        </div>
      )
    },
    {
      title: "Brand Identity",
      description: "Set up your visual branding for lead magnets",
      content: (
        <div>
          <div className="form-field">
            <label htmlFor="logo">Logo Upload</label>
            <input
              type="file"
              id="logo"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
            />
            <small>PNG, JPEG, or SVG format</small>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="primary_brand_color">Primary Brand Color *</label>
              <input
                type="color"
                id="primary_brand_color"
                value={data.primary_brand_color || '#14b8a6'}
                onChange={(e) => handleInputChange('primary_brand_color', e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="secondary_brand_color">Secondary Brand Color</label>
              <input
                type="color"
                id="secondary_brand_color"
                value={data.secondary_brand_color || '#0f172a'}
                onChange={(e) => handleInputChange('secondary_brand_color', e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="preferred_font_style">Preferred Font Style</label>
            <select
              id="preferred_font_style"
              value={data.preferred_font_style || 'no_preference'}
              onChange={(e) => handleInputChange('preferred_font_style', e.target.value)}
            >
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
      )
    }
  ];

  return (
    <div className="firm-profile-form">
      <AnimatePresence mode="wait">
        <QuestionCard
          key={currentCard}
          title={cards[currentCard].title}
          description={cards[currentCard].description}
          onNext={handleNext}
          onBack={currentCard > 0 ? handleBack : undefined}
          nextDisabled={!canProceed(currentCard)}
          isLastCard={currentCard === cards.length - 1}
          showBack={currentCard > 0}
          nextLabel={currentCard === cards.length - 1 ? "Complete Profile" : undefined}
        >
          {cards[currentCard].content}
        </QuestionCard>
      </AnimatePresence>
    </div>
  );
};

export default FirmProfileForm;