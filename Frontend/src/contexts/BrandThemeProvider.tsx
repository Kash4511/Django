import React, { useEffect, type ReactNode } from 'react';
import { useBrand } from './BrandContext';

interface BrandThemeProviderProps {
  children: ReactNode;
}

export const BrandThemeProvider: React.FC<BrandThemeProviderProps> = ({ children }) => {
  const { brandColors } = useBrand();

  useEffect(() => {
    // Apply CSS variables to the document root
    document.documentElement.style.setProperty('--primary-color', brandColors.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', brandColors.secondaryColor);
    
    // Apply font style
    let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    
    switch (brandColors.fontStyle) {
      case 'modern-sans':
        fontFamily = '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        break;
      case 'classic-serif':
        fontFamily = '"Georgia", "Times New Roman", serif';
        break;
      case 'creative':
        fontFamily = '"Poppins", "Montserrat", sans-serif';
        break;
      default:
        // Default font remains
        break;
    }
    
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [brandColors]);

  return <>{children}</>;
};