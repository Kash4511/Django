import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string | number;
  customClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, maxWidth, customClass }) => {
  const titleId = title ? 'modal-title' : undefined
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className={`modal-content ${customClass || ''}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={maxWidth ? { maxWidth } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              {title && <h2 id={titleId}>{title}</h2>}
              <button className="modal-close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;