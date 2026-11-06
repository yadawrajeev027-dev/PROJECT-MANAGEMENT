import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: {
    analysisCompleted: true,
    progressUpdates: true,
    recommendations: true,
    announcements: false,
  },
  analysisPreferences: {
    defaultCategory: 'Web Application',
    detailLevel: 'comprehensive',
    showEvidence: true,
    showRecommendations: true,
  }
};

const SETTINGS_STORAGE_KEY = 'projectpulse_user_settings';

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(parsed.notifications || {})
          },
          analysisPreferences: {
            ...DEFAULT_SETTINGS.analysisPreferences,
            ...(parsed.analysisPreferences || {})
          }
        };
      }
    } catch (e) {
      console.warn('Failed reading settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (updatedPartial) => {
    setSettingsState((prev) => {
      const next = {
        ...prev,
        ...updatedPartial,
        notifications: {
          ...prev.notifications,
          ...(updatedPartial.notifications || {})
        },
        analysisPreferences: {
          ...prev.analysisPreferences,
          ...(updatedPartial.analysisPreferences || {})
        }
      };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed saving settings to localStorage:', e);
      }
      return next;
    });
  };

  const toggleNotification = (notificationKey) => {
    setSettingsState((prev) => {
      const next = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: !prev.notifications[notificationKey]
        }
      };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed saving notification toggle:', e);
      }
      return next;
    });
  };

  const updateAnalysisPreference = (field, value) => {
    setSettingsState((prev) => {
      const next = {
        ...prev,
        analysisPreferences: {
          ...prev.analysisPreferences,
          [field]: value
        }
      };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed saving analysis preference:', e);
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Failed resetting settings in localStorage:', e);
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      toggleNotification,
      updateAnalysisPreference,
      resetSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
