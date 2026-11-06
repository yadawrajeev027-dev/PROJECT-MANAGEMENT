import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Sliders, 
  ShieldCheck, 
  Lock, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles 
} from 'lucide-react';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AnalysisPreferences from '../components/settings/AnalysisPreferences';
import PrivacySettings from '../components/settings/PrivacySettings';
import SecuritySettings from '../components/settings/SecuritySettings';

import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useProfile } from '../context/ProfileContext';
import { useProjects } from '../context/ProjectContext';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, toggleNotification, updateAnalysisPreference, resetSettings } = useSettings();
  const { resetProfile } = useProfile();
  const { resetProjects } = useProjects();

  const [activeTab, setActiveTab] = useState('appearance');
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSaveSettings = () => {
    try {
      updateSettings(settings);
      showNotification('Settings successfully saved to local browser storage.');
    } catch (e) {
      console.error('Failed to save settings:', e);
      showNotification('Failed to save settings to localStorage.', 'error');
    }
  };

  const handleResetDefaults = () => {
    resetSettings();
    setTheme('dark');
    showNotification('Settings have been reset to factory defaults.');
  };

  const handleDeleteAccountData = () => {
    try {
      // Clear all projectpulse keys from localStorage
      const keysToRemove = [
        'projectpulse_user_settings',
        'projectpulse_user_profile',
        'projectpulse_custom_projects',
        'projectpulse_project_draft_v1',
        'projectpulse_theme'
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      resetSettings();
      resetProfile();
      resetProjects();
      setTheme('dark');
      showNotification('All local data, custom projects, and cached settings purged successfully.');
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analysis', label: 'Analysis Engine', icon: Sliders },
    { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck },
    { id: 'security', label: 'Security & Auth', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-slide-in-down ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-300 text-red-800'
            : 'bg-white border-emerald-500 text-[#171717]'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          )}
          <div className="text-xs">
            <p className="font-semibold">{toast.message}</p>
            <p className="text-[10px] text-[#777777] mt-0.5">Application State Synced</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#777777] mb-1">
            <Link 
              to="/dashboard"
              className="hover:text-[#171717] transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#171717] font-medium">Settings</span>
          </nav>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight flex items-center gap-2.5">
            <SettingsIcon size={24} className="text-[#171717]" />
            <span>Platform Settings</span>
          </h1>
          <p className="text-xs text-[#777777] mt-0.5">
            Manage your interface appearance, code analysis policies, and account security
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-[#F7F7F5] hover:bg-[#EAEAEA] border border-[#EAEAEA] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#EAEAEA]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#080808] text-white shadow-sm'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] border border-transparent'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#F5C400]' : 'text-[#777777]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="space-y-6">
        {activeTab === 'appearance' && (
          <AppearanceSettings
            theme={theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettings
            notifications={settings.notifications || {}}
            onNotificationToggle={toggleNotification}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisPreferences
            preferences={settings.analysisPreferences || {}}
            onChange={updateAnalysisPreference}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettings
            onDeleteAccountData={handleDeleteAccountData}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySettings />
        )}
      </div>

      {/* Bottom Sticky-style Actions Bar for Quick Confirmation */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAEAEA] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#777777] text-center sm:text-left">
          <Sparkles size={16} className="text-[#F5C400] shrink-0" />
          <span>
            Preferences are synced to your browser session. Backend MongoDB account synchronization will be integrated in Task 4.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save size={13} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
