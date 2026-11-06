import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import ProjectDetailsModal from '../ProjectDetailsModal';
import ReanalyseModal from '../ReanalyseModal';
import { useTheme } from '../../context/ThemeContext';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { projects } = useProjects();
  const { logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Modal States
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [selectedProjectForReanalyse, setSelectedProjectForReanalyse] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleOpenDetails = (project) => {
    setSelectedProjectForDetails(project);
  };

  const handleOpenReanalyse = (project) => {
    setSelectedProjectForReanalyse(project || projects[0]);
  };

  const handleLogoutAction = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#171717] flex flex-col lg:flex-row antialiased selection:bg-[#F5C400] selection:text-black transition-colors duration-200">
      {/* 1. Collapsible & Responsive Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onLogoutClick={handleLogoutAction}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Bar */}
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setMobileOpen={setMobileSidebarOpen}
          onLogoutClick={handleLogoutAction}
        />

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ 
            searchQuery, 
            setSearchQuery,
            handleOpenDetails, 
            handleOpenReanalyse 
          }} />
        </main>

        {/* Professional Footer */}
        <footer className="border-t border-[#EAEAEA] py-4 px-6 text-center text-xs text-[#777777] bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>ProjectPulse AI &bull; Senior Engineering Demonstration Architecture</span>
            <span className="text-[11px] font-mono text-[#777777]">
              Theme: {theme.toUpperCase()} &bull; Stack: React 18 + Vite + Tailwind + React Router
            </span>
          </div>
        </footer>
      </div>

      {/* 3. Global Interactive Modals */}
      <ProjectDetailsModal
        project={selectedProjectForDetails}
        isOpen={Boolean(selectedProjectForDetails)}
        onClose={() => setSelectedProjectForDetails(null)}
      />

      <ReanalyseModal
        project={selectedProjectForReanalyse}
        isOpen={Boolean(selectedProjectForReanalyse)}
        onClose={() => setSelectedProjectForReanalyse(null)}
      />

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-[#171717]">Sign Out from Session?</h3>
            <p className="text-xs text-[#777777]">
              You will return to the dashboard portal once authentication tokens are activated in Task 4.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#F7F7F5] bg-white border border-[#EAEAEA] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate('/login');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer transition-colors"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
