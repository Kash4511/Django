import React from 'react'
import Modal from '../Modal'
import TemplateSelectionForm from '../forms/TemplateSelectionForm'

interface TemplateSelectionPopupProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (templateId: string, templateName: string, images: File[]) => void
}

const TemplateSelectionPopup: React.FC<TemplateSelectionPopupProps> = ({ isOpen, onClose, onComplete }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth={1100} customClass="template-selection-modal">
      <TemplateSelectionForm
        onClose={onClose}
        onSubmit={(templateId, templateName, architecturalImages) => {
          if (architecturalImages && architecturalImages.length === 3) {
            onComplete(templateId, templateName, architecturalImages)
          }
        }}
      />
    </Modal>
  )
}

export default TemplateSelectionPopup