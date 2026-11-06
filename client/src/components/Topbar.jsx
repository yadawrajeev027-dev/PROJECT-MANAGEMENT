import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Menu, 
  User, 
  Settings, 
  Key, 
  LogOut, 
  ChevronDown, 
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ 
  searchQuery, 
  setSearchQuery, 
  setMobileOpen, 
  onLogoutClick,
}) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    {
      id: 1,
      title: 'Analysis complete for Food Quality',
      time: '2 hours ago',
      read: false,
      type: 'success',
    },
    {
      id: 2,
      title: 'Gap detected in Authentication routes',
      time: '5 hours ago',
      read: false,
      type: 'warning',
    },
    {
      id: 3,
      title: 'Heuristic model v2.1 activated',
      time: '1 day ago',
      read: true,
      type: 'info',
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery && searchQuery.trim()) {
      navigate(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = user?.name || profile.fullName || 'Lead Developer';
  const displayEmail = user?.email || profile.email || 'developer@projectpulse.ai';

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DP';

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#EAEAEA] flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Menu Trigger & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] lg:hidden focus:outline-none transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search 
            size={16} 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, routes, AST tokens..."
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl pl-9 pr-8 py-2 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:bg-white focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono text-[#777777] bg-white border border-[#EAEAEA]">
            /
          </kbd>
        </form>
      </div>

      {/* Right: Quick Action, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Upload Action Button */}
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-black bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all active:scale-95"
        >
          <UploadCloud size={15} />
          <span>Upload ZIP</span>
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] relative transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5C400] ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#EAEAEA] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA] mb-2">
                <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#F5C400]" />
                  Notifications
                </span>
                <span className="text-[10px] text-[#777777] hover:text-[#171717] hover:underline cursor-pointer">
                  Mark all as read
                </span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-2.5 rounded-xl hover:bg-[#F7F7F5] transition-colors flex items-start gap-2.5 cursor-pointer border border-transparent hover:border-[#EAEAEA]"
                  >
                    <div className="mt-0.5">
                      {notif.type === 'success' && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                      {notif.type === 'warning' && (
                        <Clock size={14} className="text-amber-500" />
                      )}
                      {notif.type === 'info' && (
                        <Sparkles size={14} className="text-[#F5C400]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#171717] font-medium leading-tight">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-[#777777]">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F7F7F5] transition-colors"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-[#080808] border border-[#EAEAEA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-[#171717] leading-tight">{displayName}</div>
              <div className="text-[10px] text-[#777777] font-medium">{profile.designation || 'Software Architect'}</div>
            </div>

            <ChevronDown size={14} className="text-[#777777] hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#EAEAEA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-[#EAEAEA] mb-1">
                <div className="font-bold text-xs text-[#171717]">{displayName}</div>
                <div className="text-[10px] text-[#777777] truncate">{displayEmail}</div>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#F5C400]/15 text-[#171717] border border-[#F5C400]/30">
                  {profile.accountType || 'Lead Architect Tier'}
                </span>
              </div>

              <div className="space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#171717] hover:bg-[#F7F7F5] transition-colors text-left font-medium"
                >
                  <User size={14} className="text-[#777777]" />
                  <span>Profile Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/settings');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#171717] hover:bg-[#F7F7F5] transition-colors text-left font-medium"
                >
                  <Settings size={14} className="text-[#777777]" />
                  <span>Settings &amp; Keys</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open('https://github.com', '_blank');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#171717] hover:bg-[#F7F7F5] transition-colors text-left font-medium"
                >
                  <ExternalLink size={14} className="text-[#777777]" />
                  <span>Architecture Docs</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogoutClick();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold text-left"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
