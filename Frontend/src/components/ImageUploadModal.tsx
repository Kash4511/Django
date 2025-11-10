import React, { useState, useCallback, useRef } from 'react';
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

  const processFiles = async (files: FileList | File[]) => {
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
    if (images.length + sizedFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images total.`);
      return;
    }

    setIsProcessing(true);
    
    try {
      const processedImages: ProcessedImage[] = [];
      
      for (const file of sizedFiles) {
        // Compress large images (>2MB)
        const shouldCompress = file.size > 2 * 1024 * 1024;
        const processedFile = shouldCompress ? await compressImage(file) : file;
        
        const preview = URL.createObjectURL(processedFile);
        processedImages.push({
          file: processedFile,
          preview,
          compressed: shouldCompress
        });
      }

      setImages(prev => [...prev, ...processedImages]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
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
    
    setImages(prev => prev.filter((_, i) => i !== index));
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
                    <h2 id="upload-images-title">Upload Images</h2>
                    <p className="subtitle-new">Upload images for your {templateName} template</p>
                </div>
            </div>
            <button className="close-button-new" onClick={onClose}>
                <X size={20} />
            </button>
          </div>

          {/* New Content */}
          <div className="modal-content-new">
            <div className="upload-requirements-new">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum file size: 10MB per image</p>
                <p>Upload {maxImages} images</p>
                <p>Images will be automatically compressed if needed</p>
            </div>

            <div className="browse-files-new">
                <button
                    type="button"
                    className="browse-button-new"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Browse files"
                    disabled={isProcessing || images.length >= maxImages}
                >
                    Browse Files
                </button>
            </div>

            {/* Image Display Grid */}
            <div className="image-grid-new">
              {Array.from({ length: maxImages }).map((_, index) => (
                <div key={index} className="image-box-new">
                  {images[index] ? (
                    <img
                      src={images[index].preview}
                      alt={`Upload ${index + 1}`}
                      className="image-preview-new"
                    />
                  ) : (
                    <div className="empty-image-box-new">
                      <ImageIcon size={48} />
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
              disabled={images.length !== maxImages || isGeneratingPreview}
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
              disabled={images.length !== maxImages || isProcessing}
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