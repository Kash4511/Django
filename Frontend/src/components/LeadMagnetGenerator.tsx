import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, FileText, Building, Target, Users, Zap } from 'lucide-react';
import { 
  getFirmProfile, 
  createFirmProfile, 
  updateFirmProfile,
  createLeadMagnetGeneration,
  FirmProfile,
  LeadMagnetGeneration
} from '../lib/leadMagnetApi';
import FirmProfileForm from './forms/FirmProfileForm';
import LeadMagnetBasicsForm from './forms/LeadMagnetBasicsForm';
import AudienceForm from './forms/AudienceForm';
import ContentForm from './forms/ContentForm';
import './LeadMagnetGenerator.css';

const STAGES = [
  { id: 'firm-profile', name: 'Firm Profile', icon: Building, description: 'Set up your company information' },
  { id: 'basics', name: 'Lead Magnet Basics', icon: FileText, description: 'Choose type and topic' },
  { id: 'audience', name: 'Target Audience', icon: Users, description: 'Define your audience' },
  { id: 'content', name: 'Content & Goals', icon: Target, description: 'Set goals and call-to-action' },
  { id: 'review', name: 'Review & Generate', icon: Zap, description: 'Review and create your lead magnet' },
];

const LeadMagnetGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);
  const [firmProfile, setFirmProfile] = useState<Partial<FirmProfile>>({});
  const [leadMagnetData, setLeadMagnetData] = useState<Partial<LeadMagnetGeneration>>({});
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has existing firm profile
    const checkFirmProfile = async () => {
      try {
        const profile = await getFirmProfile();
        setFirmProfile(profile);
        setHasExistingProfile(true);
        // Skip to lead magnet basics if profile exists
        setCurrentStage(1);
      } catch (err) {
        // No existing profile, start from beginning
        setHasExistingProfile(false);
        setCurrentStage(0);
      }
    };

    checkFirmProfile();
  }, []);

  const handleNext = async () => {
    setError('');

    // Validate current stage before proceeding
    if (!canProceed()) {
      setError('Please fill in all required fields before continuing.');
      return;
    }

    try {
      setLoading(true);
      
      if (currentStage === 0 && !hasExistingProfile) {
        // Save firm profile
        await createFirmProfile(firmProfile);
        setHasExistingProfile(true);
      }

      if (currentStage < STAGES.length - 1) {
        setCurrentStage(currentStage + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      // Create the lead magnet generation
      const result = await createLeadMagnetGeneration(leadMagnetData);
      
      // Navigate to a success page or back to dashboard
      navigate('/dashboard', { 
        state: { 
          message: `Lead magnet "${result.title}" has been created successfully!`,
          type: 'success'
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate lead magnet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFirmProfileData = (data: Partial<FirmProfile>) => {
    setFirmProfile({ ...firmProfile, ...data });
  };

  const updateLeadMagnetData = (data: Partial<LeadMagnetGeneration>) => {
    setLeadMagnetData({ ...leadMagnetData, ...data });
  };

  const isLastStage = currentStage === STAGES.length - 1;
  const canProceed = () => {
    switch (currentStage) {
      case 0: // Firm profile
        return firmProfile.firm_name && firmProfile.work_email && firmProfile.firm_size && 
               firmProfile.primary_brand_color && firmProfile.location_country;
      case 1: // Basics
        return leadMagnetData.lead_magnet_type && leadMagnetData.main_topic;
      case 2: // Audience
        return leadMagnetData.target_audience_list?.length && leadMagnetData.audience_pain_points_list?.length;
      case 3: // Content
        return leadMagnetData.desired_outcome && leadMagnetData.call_to_action;
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 0:
        return (
          <FirmProfileForm
            data={firmProfile}
            onChange={updateFirmProfileData}
            isExisting={hasExistingProfile}
          />
        );
      case 1:
        return (
          <LeadMagnetBasicsForm
            data={leadMagnetData}
            onChange={updateLeadMagnetData}
          />
        );
      case 2:
        return (
          <AudienceForm
            data={leadMagnetData}
            onChange={updateLeadMagnetData}
          />
        );
      case 3:
        return (
          <ContentForm
            data={leadMagnetData}
            onChange={updateLeadMagnetData}
          />
        );
      case 4:
        return (
          <div className="review-stage">
            <h3>Review Your Lead Magnet</h3>
            <div className="review-grid">
              <div className="review-section">
                <h4>Firm Profile</h4>
                <p><strong>Company:</strong> {firmProfile.firm_name}</p>
                <p><strong>Email:</strong> {firmProfile.work_email}</p>
                <p><strong>Size:</strong> {firmProfile.firm_size}</p>
              </div>
              <div className="review-section">
                <h4>Lead Magnet Details</h4>
                <p><strong>Type:</strong> {leadMagnetData.lead_magnet_type?.replace('_', ' ')}</p>
                <p><strong>Topic:</strong> {leadMagnetData.main_topic?.replace('_', ' ')}</p>
                <p><strong>Audience:</strong> {leadMagnetData.target_audience_list?.join(', ')}</p>
              </div>
              <div className="review-section">
                <h4>Content</h4>
                <p><strong>Goal:</strong> {leadMagnetData.desired_outcome}</p>
                <p><strong>Call to Action:</strong> {leadMagnetData.call_to_action}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="lead-magnet-generator">
      <div className="generator-header">
        <button onClick={() => navigate('/dashboard')} className="back-button">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Create Lead Magnet</h1>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStage;
          const isCompleted = index < currentStage;
          
          return (
            <div 
              key={stage.id} 
              className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {isCompleted ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <div className="step-info">
                <div className="step-name">{stage.name}</div>
                <div className="step-description">{stage.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="stage-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="stage-form"
          >
            {renderStageContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="stage-navigation">
        <button 
          onClick={handleBack}
          disabled={currentStage === 0 || loading}
          className="nav-button secondary"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="nav-button-group">
          {isLastStage ? (
            <button 
              onClick={handleGenerate}
              disabled={!canProceed() || loading}
              className="nav-button primary generate-button"
            >
              {loading ? 'Generating...' : 'Generate Lead Magnet'}
              <Zap size={20} />
            </button>
          ) : (
            <button 
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="nav-button primary"
            >
              {loading ? 'Saving...' : 'Next'}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadMagnetGenerator;