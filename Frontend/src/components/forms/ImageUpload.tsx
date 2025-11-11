import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud } from 'lucide-react';
import './ImageUpload.css';

interface ImageUploadProps {
  onImagesSelected: (images: File[]) => void;
  onClose: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesSelected, onClose }) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, 3);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, [images]);

  const { getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    noClick: true,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
    newPreviews.forEach(preview => URL.revokeObjectURL(preview)); // Clean up object URLs
  };

  const handleContinue = () => {
    if (images.length === 0) {
      setError('Upload images');
      return;
    }
    setError(null);
    onImagesSelected(images);
  };

  return (
    <div className="image-upload-container">
        {/* Hidden input to support programmatic open() for all slots */}
        <input {...getInputProps()} style={{ display: 'none' }} />
        <div className="image-upload-header">
            <h2 className="text-2xl font-semibold text-white">Upload Images</h2>
            <p className="mt-2 text-sm text-gray-400">Upload images for your Modern Guide Template</p>
            {error && (
              <div className="template-error-banner" role="alert" style={{ marginTop: '10px' }}>
                {error}
              </div>
            )}
        </div>

      <div className="image-grid">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="image-box">
            {previews[index] ? (
              <div className="image-preview-container">
                <img src={previews[index]} alt={`preview-${index}`} className="image-preview" />
                <button onClick={() => removeImage(index)} className="remove-image-btn">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className={`dropzone ${isDragActive ? 'active' : ''}`}
                onClick={() => open()}
                role="button"
                aria-label={`Select image for slot ${index + 1}`}
                title="Browse Files"
                tabIndex={0}
              >
                <UploadCloud size={32} />
                <p>Browse Files</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="image-upload-footer">
        <button onClick={onClose} className="back-button-new">Back</button>
        <button onClick={handleContinue} className="submit-btn-new">
          Continue
        </button>
      </div>
    </div>
  );
};

export default ImageUpload;