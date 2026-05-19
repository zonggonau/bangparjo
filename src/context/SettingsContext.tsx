'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings, DEFAULT_SETTINGS } from '@/lib/pricing';

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
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
  const [settings, setSettings] = useState<StoreSettings>(initialSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!initialSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Sync to localStorage only after mount (safe from hydration)
        if (mounted && typeof window !== 'undefined') {
          localStorage.setItem('admin_settings', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    } else if (mounted && typeof window !== 'undefined') {
      // Sync to localStorage only after mount (safe from hydration)
      localStorage.setItem('admin_settings', JSON.stringify(initialSettings));
    }
  }, [initialSettings, mounted]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
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
