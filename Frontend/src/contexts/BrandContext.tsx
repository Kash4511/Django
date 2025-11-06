import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { dashboardApi } from '../lib/dashboardApi'
import { useAuth } from './AuthContext'

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
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Load brand colors from API on mount
  useEffect(() => {
    const loadBrandColors = async () => {
      try {
        // Wait for auth state to resolve; skip if logged out
        if (authLoading) {
          return;
        }
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

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
        // Quiet 401s (unauthorized) to avoid noisy logs when tokens expire
        const status = (error as any)?.response?.status;
        if (status === 401) {
          // Keep defaults, no error log needed
          return;
        }
        console.error('Failed to load brand colors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBrandColors();
  }, [isAuthenticated, authLoading]);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};