'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/pricing';
import { getStoreSettingsAction, getActiveCouponsAction } from '@/lib/actions';

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  activeCoupons: any[];
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ 
  children, 
  initialSettings 
}: { 
  children: React.ReactNode, 
  initialSettings?: StoreSettings 
}) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getStoreSettingsAction();
      if (res.success && res.data) {
        setSettings(res.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('admin_settings', JSON.stringify(res.data));
          } catch (e) {
            console.error('Failed to save settings to localStorage:', e);
          }
        }
      }

      // Fetch active coupons
      const coupRes = await getActiveCouponsAction();
      if (coupRes.success && coupRes.data) {
        setActiveCoupons(coupRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings/coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Always fetch fresh settings from API on mount — ignore initialSettings / localStorage
  // to ensure margin changes from admin panel are picked up immediately.
  useEffect(() => {
    fetchSettings();
  }, []);

  // Re-fetch settings on page focus to pick up any backend changes
  useEffect(() => {
    if (!mounted) return;
    const handleFocus = () => {
      fetchSettings();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [mounted]);



  return (
    <SettingsContext.Provider value={{ settings, loading, activeCoupons, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
