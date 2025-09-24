import React from 'react';
import { LeadMagnetGeneration, LEAD_MAGNET_TYPE_CHOICES, MAIN_TOPIC_CHOICES } from '../../lib/leadMagnetApi';

interface LeadMagnetBasicsFormProps {
  data: Partial<LeadMagnetGeneration>;
  onChange: (data: Partial<LeadMagnetGeneration>) => void;
}

const LeadMagnetBasicsForm: React.FC<LeadMagnetBasicsFormProps> = ({ data, onChange }) => {
  const handleInputChange = (field: keyof LeadMagnetGeneration, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="lead-magnet-basics-form">
      <h2>Lead Magnet Basics</h2>
      <p className="form-description">
        Choose the type and topic for your lead magnet to attract your ideal clients.
      </p>

      <div className="form-grid">
        <div className="form-section">
          <h3>Lead Magnet Type</h3>
          <p className="field-description">What format works best for your content?</p>
          
          <div className="radio-grid">
            {LEAD_MAGNET_TYPE_CHOICES.map(choice => (
              <label key={choice.value} className="radio-card">
                <input
                  type="radio"
                  name="lead_magnet_type"
                  value={choice.value}
                  checked={data.lead_magnet_type === choice.value}
                  onChange={(e) => handleInputChange('lead_magnet_type', e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-title">{choice.label}</span>
                  <span className="radio-description">
                    {getTypeDescription(choice.value)}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Main Topic</h3>
          <p className="field-description">What's the primary focus of this lead magnet?</p>
          
          <div className="radio-grid">
            {MAIN_TOPIC_CHOICES.map(choice => (
              <label key={choice.value} className="radio-card">
                <input
                  type="radio"
                  name="main_topic"
                  value={choice.value}
                  checked={data.main_topic === choice.value}
                  onChange={(e) => handleInputChange('main_topic', e.target.value)}
                />
                <div className="radio-content">
                  <span className="radio-title">{choice.label}</span>
                  <span className="radio-description">
                    {getTopicDescription(choice.value)}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {data.main_topic === 'custom' && (
            <div className="form-field">
              <label htmlFor="custom_topic">Custom Topic</label>
              <input
                type="text"
                id="custom_topic"
                value={data.custom_topic || ''}
                onChange={(e) => handleInputChange('custom_topic', e.target.value)}
                placeholder="Describe your custom topic..."
                required
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'guide': 'Comprehensive how-to resource',
    'case_study': 'Real project showcase with results',
    'checklist': 'Step-by-step actionable list',
    'roi_calculator': 'Interactive value demonstration tool',
    'trends_report': 'Industry insights and predictions',
    'client_onboarding_flow': 'Process overview for new clients',
    'design_portfolio': 'Curated project showcase',
    'custom': 'Something unique to your practice',
  };
  return descriptions[type] || '';
};

const getTopicDescription = (topic: string): string => {
  const descriptions: Record<string, string> = {
    'sustainable_architecture': 'Green building and eco-friendly design',
    'smart_homes': 'Technology-integrated residential design',
    'adaptive_reuse': 'Repurposing existing structures',
    'wellness_biophilic': 'Health-focused and nature-integrated design',
    'modular_prefab': 'Efficient, factory-built construction',
    'urban_placemaking': 'Community-focused public spaces',
    'passive_house_net_zero': 'Ultra-efficient energy design',
    'climate_resilient': 'Future-proof, weather-resistant design',
    'project_roi': 'Investment returns and value creation',
    'branding_differentiation': 'Standing out in the market',
    'custom': 'Your unique area of expertise',
  };
  return descriptions[topic] || '';
};

export default LeadMagnetBasicsForm;