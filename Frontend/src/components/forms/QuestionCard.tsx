import React from 'react';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  isLastCard?: boolean;
  showBack?: boolean;
  nextLabel?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  title,
  description,
  children,
  onNext,
  onBack,
  nextDisabled = false,
  isLastCard = false,
  showBack = true,
  nextLabel
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="question-card"
    >
      <div className="question-header">
        <h3 className="question-title">{title}</h3>
        {description && (
          <p className="question-description">{description}</p>
        )}
      </div>

      <div className="question-content">
        {children}
      </div>

      <div className="question-actions">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="question-btn secondary"
          >
            Back
          </button>
        )}
        
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="question-btn primary"
          >
            {nextLabel || (isLastCard ? 'Complete' : 'Next')}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionCard;