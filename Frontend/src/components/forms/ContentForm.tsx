import React from 'react';
import { LeadMagnetGeneration } from '../../lib/leadMagnetApi';

interface ContentFormProps {
  data: Partial<LeadMagnetGeneration>;
  onChange: (data: Partial<LeadMagnetGeneration>) => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ data, onChange }) => {
  const handleInputChange = (field: keyof LeadMagnetGeneration, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="content-form">
      <h2>Content & Goals</h2>
      <p className="form-description">
        Define what your lead magnet will achieve and how you want people to engage with your firm.
      </p>

      <div className="form-grid">
        <div className="form-section">
          <h3>Desired Outcome</h3>
          <p className="field-description">What should readers achieve or learn from this lead magnet?</p>
          
          <div className="form-field">
            <label htmlFor="desired_outcome">Outcome Description *</label>
            <textarea
              id="desired_outcome"
              value={data.desired_outcome || ''}
              onChange={(e) => handleInputChange('desired_outcome', e.target.value)}
              placeholder="After reading this lead magnet, my audience will be able to..."
              rows={4}
              required
            />
            <div className="field-help">
              <strong>Examples:</strong>
              <ul>
                <li>"Understand the true cost savings of sustainable building materials"</li>
                <li>"Create a comprehensive brief for their residential renovation project"</li>
                <li>"Evaluate architects based on their sustainability expertise"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Call-to-Action</h3>
          <p className="field-description">What do you want readers to do after consuming your lead magnet?</p>
          
          <div className="form-field">
            <label htmlFor="call_to_action">Call-to-Action *</label>
            <input
              type="text"
              id="call_to_action"
              value={data.call_to_action || ''}
              onChange={(e) => handleInputChange('call_to_action', e.target.value)}
              placeholder="Schedule a Free Consultation"
              required
            />
            <div className="field-help">
              <strong>Popular options:</strong>
              <div className="cta-suggestions">
                <button 
                  type="button" 
                  className="suggestion-btn"
                  onClick={() => handleInputChange('call_to_action', 'Schedule a Free Consultation')}
                >
                  Schedule a Free Consultation
                </button>
                <button 
                  type="button" 
                  className="suggestion-btn"
                  onClick={() => handleInputChange('call_to_action', 'Download Our Portfolio')}
                >
                  Download Our Portfolio
                </button>
                <button 
                  type="button" 
                  className="suggestion-btn"
                  onClick={() => handleInputChange('call_to_action', 'Get a Project Quote')}
                >
                  Get a Project Quote
                </button>
                <button 
                  type="button" 
                  className="suggestion-btn"
                  onClick={() => handleInputChange('call_to_action', 'Join Our Newsletter')}
                >
                  Join Our Newsletter
                </button>
                <button 
                  type="button" 
                  className="suggestion-btn"
                  onClick={() => handleInputChange('call_to_action', 'Book a Site Visit')}
                >
                  Book a Site Visit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Requirements</h3>
          
          <div className="form-field">
            <label htmlFor="special_requests">Special Requests or Additional Sections</label>
            <textarea
              id="special_requests"
              value={data.special_requests || ''}
              onChange={(e) => handleInputChange('special_requests', e.target.value)}
              placeholder="Any specific content, sections, or requirements for this lead magnet..."
              rows={4}
            />
            <div className="field-help">
              <strong>Examples:</strong>
              <ul>
                <li>"Include a section on local building codes"</li>
                <li>"Add client testimonials from similar projects"</li>
                <li>"Include a cost comparison chart"</li>
                <li>"Add photos from our recent sustainable projects"</li>
              </ul>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="preferred_layout_template">Preferred Layout/Template (Optional)</label>
            <select
              id="preferred_layout_template"
              value={data.preferred_layout_template || ''}
              onChange={(e) => handleInputChange('preferred_layout_template', e.target.value)}
            >
              <option value="">Let AI choose the best layout</option>
              <option value="professional">Professional & Clean</option>
              <option value="modern">Modern & Visual</option>
              <option value="minimal">Minimal & Text-Focused</option>
              <option value="creative">Creative & Artistic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="content-preview">
        <h4>Content Preview</h4>
        <div className="preview-card">
          <div className="preview-section">
            <strong>Goal:</strong> {data.desired_outcome || 'Not specified yet'}
          </div>
          <div className="preview-section">
            <strong>Call-to-Action:</strong> {data.call_to_action || 'Not specified yet'}
          </div>
          {data.special_requests && (
            <div className="preview-section">
              <strong>Special Requirements:</strong> {data.special_requests}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentForm;