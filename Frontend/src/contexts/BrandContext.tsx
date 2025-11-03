import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { dashboardApi } from '../lib/dashboardApi'

interface BrandColors {
  primaryColor: string;
  secondaryColor: string;
  fontStyle: string;
}

interface BrandContextType {
  brandColors: BrandColors;
  loading: boolean;
  updateBrandColors: (colors: BrandColors) => void;
}

const defaultBrandColors: BrandColors = {
  primaryColor: '#2a5766',
  secondaryColor: '#ffffff',
  fontStyle: 'no-preference'
}

const BrandContext = createContext<BrandContextType | undefined>(undefined)

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const [brandColors, setBrandColors] = useState<BrandColors>(defaultBrandColors);
  const [loading, setLoading] = useState(true);

  // Load brand colors from API on mount
  useEffect(() => {
    const loadBrandColors = async () => {
      try {
        setLoading(true);
        const profile = await dashboardApi.getFirmProfile();
        if (profile) {
          setBrandColors({
            primaryColor: profile.primary_brand_color || defaultBrandColors.primaryColor,
            secondaryColor: profile.secondary_brand_color || defaultBrandColors.secondaryColor,
            fontStyle: profile.preferred_font_style || defaultBrandColors.fontStyle
          });
        }
      } catch (error) {
        console.error('Failed to load brand colors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrandColors();
  }, []);

  const updateBrandColors = (colors: BrandColors) => {
    setBrandColors(colors);
  };

  const value: BrandContextType = {
    brandColors,
    loading,
    updateBrandColors
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};