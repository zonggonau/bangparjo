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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Also sync to localStorage for legacy code compatibility
        localStorage.setItem('admin_settings', JSON.stringify(data));
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
    } else {
      // Still sync to localStorage if we have initial settings
      localStorage.setItem('admin_settings', JSON.stringify(initialSettings));
    }
  }, [initialSettings]);

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
