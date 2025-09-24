import React from 'react';
import type { LeadMagnetGeneration } from '../../lib/leadMagnetApi';
import { TARGET_AUDIENCE_CHOICES, PAIN_POINTS_CHOICES } from '../../lib/leadMagnetApi';

interface AudienceFormProps {
  data: Partial<LeadMagnetGeneration>;
  onChange: (data: Partial<LeadMagnetGeneration>) => void;
}

const AudienceForm: React.FC<AudienceFormProps> = ({ data, onChange }) => {
  const handleAudienceChange = (audience: string, checked: boolean) => {
    const currentAudiences = data.target_audience_list || [];
    const updatedAudiences = checked
      ? [...currentAudiences, audience]
      : currentAudiences.filter(a => a !== audience);
    
    onChange({ 
      target_audience_list: updatedAudiences,
      target_audience: updatedAudiences.join(',')
    });
  };

  const handlePainPointChange = (painPoint: string, checked: boolean) => {
    const currentPainPoints = data.audience_pain_points_list || [];
    const updatedPainPoints = checked
      ? [...currentPainPoints, painPoint]
      : currentPainPoints.filter(p => p !== painPoint);
    
    onChange({ 
      audience_pain_points_list: updatedPainPoints,
      audience_pain_points: updatedPainPoints.join(',')
    });
  };

  return (
    <div className="audience-form">
      <h2>Target Audience</h2>
      <p className="form-description">
        Define who you want to reach with this lead magnet and what challenges they face.
      </p>

      <div className="form-grid">
        <div className="form-section">
          <h3>Target Audience</h3>
          <p className="field-description">Who is this lead magnet designed for? (Select all that apply)</p>
          
          <div className="checkbox-grid">
            {TARGET_AUDIENCE_CHOICES.map(choice => (
              <label key={choice.value} className="checkbox-card">
                <input
                  type="checkbox"
                  checked={data.target_audience_list?.includes(choice.value) || false}
                  onChange={(e) => handleAudienceChange(choice.value, e.target.checked)}
                />
                <div className="checkbox-content">
                  <span className="checkbox-title">{choice.label}</span>
                  <span className="checkbox-description">
                    {getAudienceDescription(choice.value)}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Audience Pain Points & Challenges</h3>
          <p className="field-description">What problems does your audience face? (Select all that apply)</p>
          
          <div className="checkbox-grid">
            {PAIN_POINTS_CHOICES.map(choice => (
              <label key={choice.value} className="checkbox-card">
                <input
                  type="checkbox"
                  checked={data.audience_pain_points_list?.includes(choice.value) || false}
                  onChange={(e) => handlePainPointChange(choice.value, e.target.checked)}
                />
                <div className="checkbox-content">
                  <span className="checkbox-title">{choice.label}</span>
                  <span className="checkbox-description">
                    {getPainPointDescription(choice.value)}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

const getAudienceDescription = (audience: string): string => {
  const descriptions: Record<string, string> = {
    'homeowners': 'Residential property owners planning projects',
    'developers': 'Real estate developers and project managers',
    'commercial_clients': 'Business owners needing commercial spaces',
    'government': 'Public sector and municipal projects',
    'architects_peers': 'Fellow architects and design professionals',
    'contractors': 'Construction contractors and builders',
    'real_estate_agents': 'Real estate professionals and brokers',
    'nonprofits': 'Non-profit organizations and foundations',
    'facility_managers': 'Property and facility management professionals',
    'other': 'Other professionals in your network',
  };
  return descriptions[audience] || '';
};

const getPainPointDescription = (painPoint: string): string => {
  const descriptions: Record<string, string> = {
    'high_costs': 'Budget constraints and cost overruns',
    'roi_uncertainty': 'Unclear return on investment',
    'compliance_issues': 'Building codes and regulations',
    'sustainability_demands': 'Environmental requirements and goals',
    'risk_management': 'Project risks and liability concerns',
    'long_timelines': 'Extended project schedules',
    'tech_complexity': 'Complex building systems and technology',
    'poor_communication': 'Coordination and communication challenges',
    'competition': 'Competitive market pressures',
    'approvals': 'Permitting and approval processes',
    'energy_efficiency': 'Energy performance requirements',
    'health_wellness': 'Occupant health and wellness concerns',
    'vendor_reliability': 'Contractor and supplier reliability',
    'other': 'Other specific challenges they face',
  };
  return descriptions[painPoint] || '';
};

export default AudienceForm;