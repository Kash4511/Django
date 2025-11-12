import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, AlertCircle, Loader2, Eye, Check, ChevronLeft } from 'lucide-react';
import './ImageUploadModal.css';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void; // New prop for back navigation
  onImagesSelected: (images: File[]) => void;
  onPreview: (images: File[]) => void;
  templateName: string;
  maxImages?: number;
  minImages?: number;
}

interface ProcessedImage {
  file: File;
  preview: string;
  compressed?: boolean;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  onBack, // Destructure new prop
  onImagesSelected,
  onPreview,
  templateName,
  maxImages = 3,
  minImages = 1
}) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            resolve(file);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[], slotIndex?: number) => {
    setError('');
    const fileArray = Array.from(files);
    
    // Validate file types
    const validFiles = fileArray.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== fileArray.length) {
      setError('Some files were skipped. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Validate file sizes (10MB max)
    const sizeLimit = 10 * 1024 * 1024;
    const sizedFiles = validFiles.filter(file => file.size <= sizeLimit);
    if (sizedFiles.length !== validFiles.length) {
      setError('Some files were skipped. Maximum size is 10MB per image.');
    }

    // Check total image count
    // If uploading to a specific slot, only allow one file to be added/replaced
    if (typeof slotIndex === 'number') {
      if (sizedFiles.length < 1) {
        setError('Please select a valid image file.');
        return;
      }
    } else {
      if (images.length + sizedFiles.length > maxImages) {
        setError(`You can only upload up to ${maxImages} images total.`);
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      const processedImages: ProcessedImage[] = [];
      
      for (const file of (typeof slotIndex === 'number' ? sizedFiles.slice(0,1) : sizedFiles)) {
        const shouldCompress = file.size > 2 * 1024 * 1024;
        const processedFile = shouldCompress ? await compressImage(file) : file;
        const preview = URL.createObjectURL(processedFile);
        processedImages.push({ file: processedFile, preview, compressed: shouldCompress });
      }

      if (typeof slotIndex === 'number') {
        setImages(prev => {
          const next = [...prev];
          // Revoke previous preview for the slot if replacing
          if (next[slotIndex]) URL.revokeObjectURL(next[slotIndex].preview);
          next[slotIndex] = processedImages[0];
          // Ensure array length covers all slots
          return next.slice(0, maxImages);
        });
      } else {
        setImages(prev => [...prev, ...processedImages].slice(0, maxImages));
      }
    } catch (err) {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ensure re-selecting the same file triggers onChange by resetting value
    const input = e.target;
    if (input.files) {
      processFiles(input.files, activeSlotIndex ?? undefined);
      setActiveSlotIndex(null);
    }
    // Clear the value so clicking the same file again will re-open correctly
    input.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    
    setImages(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setError('');
  };

  const handlePreview = async () => {
    if (images.length !== maxImages) {
      setError(`Please upload exactly ${maxImages} images before previewing.`);
      return;
    }

    setIsGeneratingPreview(true);
    try {
      await onPreview(images.map(img => img.file));
    } catch (err) {
      setError('Failed to generate preview. Please try again.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleContinue = () => {
    if (images.length !== maxImages) {
      setError(`Please upload exactly ${maxImages} images to continue.`);
      return;
    }
    onImagesSelected(images.map(img => img.file));
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="image-upload-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          className="image-upload-modal"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-images-title"
          tabIndex={-1}
        >
          {/* New Header */}
          <div className="modal-header-new">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="back-button-new">
                    <ChevronLeft size={24} />
                    <span>Back</span>
                </button>
                <div className="title-section-new">
                    <h2 id="upload-images-title">Upload Your Images</h2>
                    <p className="subtitle-new">Select up to {maxImages} images for your document</p>
                </div>
            </div>
            <button className="close-button-new" onClick={onClose}>
                <X size={20} />
            </button>
          </div>

          {/* New Content */}
          <div className="modal-content-new">
            {/* Hidden single-file input used per slot */}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              style={{ display: 'none' }}
            />
            <div className="upload-requirements-new">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum file size: 10MB per image</p>
            </div>

            {error && (
              <div className="error-message-new" role="alert" aria-live="polite">
                <span className="error-icon" aria-hidden="true"><AlertCircle size={16} /></span>
                <span className="error-text">{error}</span>
              </div>
            )}

            <div className="browse-files-new" style={{ display: 'none' }}>
                <button
                    type="button"
                    className="browse-button-new"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Browse files"
                    disabled={isProcessing}
                >
                    Browse Files
                </button>
            </div>

            {/* Image Display Grid */}
            <div className="image-grid-new">
              {Array.from({ length: maxImages }).map((_, index) => (
                <div 
                  key={index} 
                  className={`image-box-new ${activeSlotIndex === index ? 'active' : ''}`}
                  onClick={() => { 
                    setActiveSlotIndex(index); 
                    if (fileInputRef.current) {
                      // Clear value to guarantee dialog reopens even for same file
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }}
                  role="button"
                  aria-label={`Select image for slot ${index+1}`}
                  title={images[index] ? 'Click to replace image' : 'Click to select an image'}
                  tabIndex={0}
                >
                  {images[index] ? (
                    <div className="image-preview-wrapper">
                      <img
                        src={images[index].preview}
                        alt={`Upload ${index + 1}`}
                        className="image-preview-new"
                      />
                      <div className="selected-indicator" aria-hidden="true">
                        <Check size={16} />
                      </div>
                      <button 
                        type="button" 
                        className="remove-image-btn" 
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        aria-label={`Remove image ${index+1}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="empty-image-box-new">
                      <ImageIcon size={48} />
                      <span className="empty-image-label">Browse Files</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
          </div>

          {/* New Footer */}
          <div className="modal-footer-new">
            <button
              type="button"
              className="preview-button-new"
              onClick={handlePreview}
              disabled={images.filter(Boolean).length !== maxImages || isGeneratingPreview}
            >
              {isGeneratingPreview ? (
                <><Loader2 className="spinner" /> Generating...</>
              ) : (
                'Preview'
              )}
            </button>
            <button
              type="button"
              className="continue-button-new"
              onClick={handleContinue}
              disabled={images.filter(Boolean).length !== maxImages || isProcessing}
          >
            Continue
          </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageUploadModal;