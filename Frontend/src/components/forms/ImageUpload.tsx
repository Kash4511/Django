import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud } from 'lucide-react';
import './ImageUpload.css';

interface ImageUploadProps {
  onImagesSelected: (images: File[]) => void;
  onClose: () => void;
  templateId?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesSelected, onClose, templateId }) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles].slice(0, 3);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, [images]);

  const { getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      // Build a helpful error message
      const messages = rejections.map(r => {
        const fileName = r.file?.name || 'file';
        const sizeErr = r.errors.find(e => e.code === 'file-too-large');
        const typeErr = r.errors.find(e => e.code === 'file-invalid-type');
        if (sizeErr) return `${fileName} is larger than 10MB`;
        if (typeErr) return `${fileName} is not a supported image format`;
        return `${fileName} could not be added`;
      });
      setError(messages.join('\n'));
    },
    // Accept common formats JPG, PNG, GIF, SVG
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg']
    },
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

  // Convert File to data URL for preview-template
  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const handlePreview = async () => {
    try {
      if (!templateId) {
        setError('Select a template before previewing');
        return;
      }
      if (images.length !== 3) {
        setError('Please upload exactly 3 images to preview');
        return;
      }
      setError(null);
      setIsPreviewing(true);
      // Convert images to data URLs for server-side HTML rendering
      const dataUrls = await Promise.all(images.map(img => fileToDataUrl(img)));
      const architecturalImages = dataUrls.map((src, i) => ({ src, alt: `Architectural Image ${i + 1}` }));
      // Call preview-template API
      const { dashboardApi } = await import('../../lib/dashboardApi');
      const result = await dashboardApi.previewTemplate({
        template_id: templateId,
        variables: {
          architecturalImages,
          architecturalImageCaption1: 'Uploaded Image 1',
          architecturalImageCaption2: 'Uploaded Image 2',
          architecturalImageCaption3: 'Uploaded Image 3'
        }
      });
      setPreviewHtml(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate preview');
    } finally {
      setIsPreviewing(false);
    }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePreview} className="submit-btn-new" disabled={isPreviewing}>
            {isPreviewing ? 'Generating Preview…' : 'Preview'}
          </button>
          <button onClick={handleContinue} className="submit-btn-new">
            Continue
          </button>
        </div>
      </div>

      {previewHtml && (
        <div style={{ marginTop: '16px', border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
          <iframe title="Template HTML Preview" srcDoc={previewHtml} style={{ width: '100%', height: '60vh' }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;