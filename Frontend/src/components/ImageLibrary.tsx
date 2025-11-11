import React, { useState, createContext, useContext, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Upload, ImageIcon, CheckCircle2 } from 'lucide-react';

// 1. Types and Interfaces
interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageLibraryContextType {
  images: ImageFile[];
  addImage: (file: File) => void;
  removeImage: (id: string) => void;
  selectedImages: Set<string>;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}

// 2. Context Creation
const ImageLibraryContext = createContext<ImageLibraryContextType | undefined>(undefined);

// 3. Provider Component
export const ImageLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const addImage = useCallback((file: File) => {
    const newImage: ImageFile = {
      id: `${file.name}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file),
    };
    setImages(prev => {
      // Avoid duplicates
      if (prev.some(img => img.id === newImage.id)) {
        URL.revokeObjectURL(newImage.preview);
        return prev;
      }
      return [newImage, ...prev];
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(id);
      return newSelection;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedImages(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  const value = {
    images,
    addImage,
    removeImage,
    selectedImages,
    toggleSelection,
    clearSelection,
  };

  return (
    <ImageLibraryContext.Provider value={value}>
      {children}
    </ImageLibraryContext.Provider>
  );
};

// 4. Custom Hook
export const useImageLibrary = () => {
  const context = useContext(ImageLibraryContext);
  if (!context) {
    throw new Error('useImageLibrary must be used within an ImageLibraryProvider');
  }
  return context;
};

// 5. ImageLibrary Component
interface ImageLibraryProps {
  onSelect: (selected: File[]) => void;
  maxSelection?: number;
}

export const ImageLibrary: React.FC<ImageLibraryProps> = ({ onSelect, maxSelection = 3 }) => {
  const { images, addImage, removeImage, selectedImages, toggleSelection } = useImageLibrary();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(file => addImage(file));
    }
  };

  const handleSelect = () => {
    const selectedFiles = Array.from(selectedImages)
      .map(id => images.find(img => img.id === id))
      .filter((img): img is ImageFile => !!img)
      .map(img => img.file);
    onSelect(selectedFiles);
  };

  return (
    <div className="image-library-container">
      <div className="image-library-header">
        <h3>Image Library</h3>
        <button onClick={() => fileInputRef.current?.click()} className="btn-upload">
          <Upload size={18} /> Upload New
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
        />
      </div>

      <AnimatePresence>
        <div className="image-library-grid">
          {images.length === 0 ? (
            <div className="empty-library">
              <ImageIcon size={48} />
              <p>Your image library is empty.</p>
              <span>Upload images to get started.</span>
            </div>
          ) : (
            images.map(image => (
              <motion.div
                key={image.id}
                className={`library-item ${selectedImages.has(image.id) ? 'selected' : ''}`}
                onClick={() => toggleSelection(image.id)}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <img src={image.preview} alt={image.file.name} />
                <AnimatePresence>
                  {selectedImages.has(image.id) && (
                    <motion.div className="selection-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <CheckCircle2 size={32} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={(e) => { e.stopPropagation(); removeImage(image.id); }} className="btn-remove-image">
                  <X size={16} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>

      <div className="image-library-footer">
        <p>{selectedImages.size} / {maxSelection} selected</p>
        <button onClick={handleSelect} disabled={selectedImages.size === 0 || selectedImages.size > maxSelection} className="btn-primary">
          Use Selected Images
        </button>
      </div>
    </div>
  );
};