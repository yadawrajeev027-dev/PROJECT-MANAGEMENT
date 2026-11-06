import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext();

export const DEFAULT_PROFILE = {
  fullName: 'Astha Sharma',
  email: 'astha.sharma@projectpulse.ai',
  accountType: 'Lead Architect Tier',
  memberSince: 'March 2025',
  designation: 'Senior Full-Stack Developer & AI Systems Researcher',
  organization: 'ProjectPulse Engineering Lab',
  bio: 'Specializing in MERN microservices, automated static code analysis, AST parser heuristics, and LLM-assisted verification for mission-critical software workflows.'
};

const PROFILE_STORAGE_KEY = 'projectpulse_user_profile';

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed reading profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  const updateProfile = (updatedProfile) => {
    const merged = { ...profile, ...updatedProfile };
    setProfileState(merged);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error('Failed saving profile to localStorage:', e);
    }
    return merged;
  };

  const resetProfile = () => {
    setProfileState(DEFAULT_PROFILE);
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed resetting profile in localStorage:', e);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
