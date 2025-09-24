import React, { useState, useEffect } from 'react';
import { Building, FileText, Target, Users, Zap } from 'lucide-react';
import { 
  getFirmProfile, 
  createFirmProfile,
  createLeadMagnetGeneration
} from '../lib/leadMagnetApi';
import type { FirmProfile, LeadMagnetGeneration } from '../lib/leadMagnetApi';
import FirmProfileForm from './forms/FirmProfileForm';
import LeadMagnetBasicsForm from './forms/LeadMagnetBasicsForm';
import AudienceForm from './forms/AudienceForm';
import ContentForm from './forms/ContentForm';
import './LeadMagnetFormContent.css';

const STAGES = [
  { id: 'firm-profile', name: 'Firm Profile', icon: Building },
  { id: 'basics', name: 'Lead Magnet Basics', icon: FileText },
  { id: 'audience', name: 'Target Audience', icon: Users },
  { id: 'content', name: 'Content & Goals', icon: Target },
  { id: 'review', name: 'Review & Generate', icon: Zap },
];

interface LeadMagnetFormContentProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const LeadMagnetFormContent: React.FC<LeadMagnetFormContentProps> = ({ onClose, onSuccess }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [firmProfile, setFirmProfile] = useState<Partial<FirmProfile>>({});
  const [leadMagnetData, setLeadMagnetData] = useState<Partial<LeadMagnetGeneration>>({});
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkFirmProfile = async () => {
      try {
        const profile = await getFirmProfile();
        setFirmProfile(profile);
        setHasExistingProfile(true);
        setCurrentStage(1);
      } catch (err) {
        setHasExistingProfile(false);
        setCurrentStage(0);
      }
    };
    checkFirmProfile();
  }, []);

  const handleStageComplete = async () => {
    if (currentStage === 0 && !hasExistingProfile) {
      try {
        setLoading(true);
        await createFirmProfile(firmProfile);
        setHasExistingProfile(true);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to save firm profile.');
        return;
      } finally {
        setLoading(false);
      }
    }
    
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(currentStage + 1);
    } else {
      await handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await createLeadMagnetGeneration(leadMagnetData);
      onSuccess(`Lead magnet "${result.title}" has been created successfully!`);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate lead magnet.');
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

  const renderStageContent = () => {
    switch (currentStage) {
      case 0:
        return (
          <FirmProfileForm
            data={firmProfile}
            onChange={updateFirmProfileData}
            isExisting={hasExistingProfile}
            onComplete={handleStageComplete}
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
      default:
        return null;
    }
  };

  return (
    <div className="lead-magnet-form-content">
      {/* Simple Progress Icons */}
      <div className="simple-progress">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index === currentStage;
          const isCompleted = index < currentStage;
          
          return (
            <div key={stage.id} className={`progress-icon ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <Icon size={24} />
            </div>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="stage-content">
        {renderStageContent()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Creating...</div>
        </div>
      )}
    </div>
  );
};

export default LeadMagnetFormContent;