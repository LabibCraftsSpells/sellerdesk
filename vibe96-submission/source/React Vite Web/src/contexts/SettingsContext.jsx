import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getSettingsApi } from '../api/settings';

export const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  businessName: 'SellerDesk',
  businessPhone: '',
  businessAddress: '',
  invoiceFooter: 'Thank you for your purchase!',
  defaultDeliveryCharge: 60,
  lowStockThreshold: 5,
  language: 'en',
  logoUrl: null,
  couriers: ['Pathao', 'Steadfast', 'RedX', 'Paperfly', 'Sundarban', 'Other'],
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await getSettingsApi();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch {
      // use defaults
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sellerdesk_token');
    if (token) loadSettings();
    else setLoadingSettings(false);
  }, [loadSettings]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, loadSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
