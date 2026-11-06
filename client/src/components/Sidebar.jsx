import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FolderKanban, 
  FileText, 
  User, 
  Settings, 
  LogOut, 
  Activity,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export default function Sidebar({ 
  isCollapsed, 
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  onLogoutClick
}) {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName = user?.name || profile?.fullName || 'Lead Developer';
  const displayEmail = user?.email || profile?.email || 'developer@projectpulse.ai';
  const userRole = user?.role || 'Admin';

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DP';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'upload', label: 'Upload Project', icon: UploadCloud, highlight: true, path: '/upload' },
    { id: 'projects', label: 'My Projects', icon: FolderKanban, path: '/projects' },
    { id: 'reports', label: 'Reports History', icon: FileText, path: '/reports' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isItemActive = (item) => {
    const current = location.pathname;
    if (item.id === 'dashboard') {
      return current === '/' || current === '/dashboard';
    }
    return current.startsWith(item.path);
  };

  const handleLinkClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: Deep Black (#080808) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col justify-between bg-[#080808] border-r border-[#1a1a1a] transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Top Branding Section */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#1a1a1a]">
            <Link 
              to="/dashboard"
              onClick={handleLinkClick}
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-[#F5C400] flex items-center justify-center text-black font-bold shrink-0 shadow-sm">
                <Activity size={20} strokeWidth={2.2} />
              </div>

              {(!isCollapsed || mobileOpen) && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm tracking-tight text-white truncate flex items-center gap-1.5">
                    ProjectPulse <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#F5C400] font-mono font-semibold">AI</span>
                  </span>
                  <span className="text-[10px] text-[#777777] font-medium tracking-wider uppercase">
                    Code Intelligence
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-[#777777] hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Section at Top */}
          <div className={`p-3 border-b border-[#1a1a1a] ${isCollapsed && !mobileOpen ? 'flex justify-center' : ''}`}>
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className="flex items-center gap-3 p-2 rounded-xl bg-[#121212] hover:bg-[#181818] border border-[#1f1f1f] transition-colors group cursor-pointer"
              title={isCollapsed && !mobileOpen ? displayName : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] text-[#F5C400] flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-[#F5C400]/40 transition-colors">
                {userInitials}
              </div>

              {(!isCollapsed || mobileOpen) && (
                <div className="flex flex-col min-w-0 flex-1 text-left">
                  <span className="text-xs font-semibold text-white truncate group-hover:text-[#F5C400] transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#777777] truncate capitalize">
                    {userRole} &bull; {displayEmail}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={handleLinkClick}
                  title={isCollapsed && !mobileOpen ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#1a1a1a] text-white font-semibold shadow-sm border-l-2 border-[#F5C400]'
                      : 'text-[#888888] hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <Icon 
                    size={18} 
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#F5C400]' : item.highlight ? 'text-[#F5C400]' : 'text-[#888888] group-hover:text-white'
                    }`} 
                  />

                  {(!isCollapsed || mobileOpen) && (
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {/* Highlight pill for Upload */}
                  {item.highlight && (!isCollapsed || mobileOpen) && !isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#F5C400]/15 text-[#F5C400] border border-[#F5C400]/30">
                      New
                    </span>
                  )}

                  {/* Active subtle indicator */}
                  {isActive && (!isCollapsed || mobileOpen) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5C400]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Workspace Status, Collapse Toggle & Logout */}
        <div className="p-3 border-t border-[#1a1a1a] space-y-2">
          {/* Workspace Status Card (shown when expanded) */}
          {(!isCollapsed || mobileOpen) && (
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1f1f1f]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 mb-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  Local Workspace
                </span>
                <span className="text-[#F5C400] font-mono text-[10px]">v1.2</span>
              </div>
              <p className="text-[10px] text-[#777777] leading-tight">
                Express API proxy connected on port 5000.
              </p>
            </div>
          )}

          {/* Logout Action */}
          <button
            type="button"
            onClick={onLogoutClick}
            title={isCollapsed && !mobileOpen ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#777777] hover:bg-[#161616] hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <LogOut size={17} className="shrink-0" />
            {(!isCollapsed || mobileOpen) && (
              <span className="truncate flex-1 text-left">Sign Out</span>
            )}
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-[#777777] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : (
              <div className="flex items-center gap-2 text-xs text-[#777777] hover:text-white">
                <ChevronLeft size={16} />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
