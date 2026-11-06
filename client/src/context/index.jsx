import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ProfileProvider, useProfile } from './ProfileContext';
import { SettingsProvider, useSettings } from './SettingsContext';
import { ProjectProvider, useProjects } from './ProjectContext';

export { useAuth, useTheme, useProfile, useSettings, useProjects };

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ProfileProvider>
          <SettingsProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </SettingsProvider>
        </ProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
