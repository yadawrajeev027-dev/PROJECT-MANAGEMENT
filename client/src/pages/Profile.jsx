import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Building, 
  Mail, 
  Briefcase, 
  Calendar, 
  FileText, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  Award
} from 'lucide-react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileForm from '../components/profile/ProfileForm';
import ActivitySummary from '../components/profile/ActivitySummary';
import { useProfile } from '../context/ProfileContext';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSaveProfile = (updatedData) => {
    updateProfile(updatedData);
    setIsEditing(false);
    setToastMessage('Profile changes saved successfully and persisted in localStorage.');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleNavigateToProject = (projectId) => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  const handleNavigateToReport = (reportId) => {
    if (reportId) {
      navigate(`/reports/${reportId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-down flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-emerald-500 text-[#171717] shadow-xl backdrop-blur-md">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-[#171717]">{toastMessage}</p>
            <p className="text-[10px] text-[#777777] mt-0.5">Frontend local storage updated</p>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#777777] mb-1">
            <Link 
              to="/dashboard"
              className="hover:text-[#171717] transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#171717] font-medium">User Profile</span>
          </nav>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">Account Profile</h1>
          <p className="text-xs text-[#777777] mt-0.5">
            Manage your developer identity, organizational details, and view your platform activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] transition-colors shadow-sm"
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* 1. Profile Header */}
      <ProfileHeader
        profile={profile}
        isEditing={isEditing}
        onEditClick={() => setIsEditing(!isEditing)}
      />

      {/* 2 & 3. Personal Information / Edit Form */}
      {isEditing ? (
        <ProfileForm
          initialProfile={profile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA] mb-5">
            <div>
              <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
                <User size={18} className="text-[#171717]" />
                <span>Personal &amp; Professional Details</span>
              </h3>
              <p className="text-xs text-[#777777] mt-0.5">
                Current developer credential information
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#171717] bg-[#F7F7F5] hover:bg-[#EAEAEA] border border-[#EAEAEA] transition-all"
            >
              <Edit3 size={13} />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Full Name
              </span>
              <p className="text-sm font-semibold text-[#171717]">{profile.fullName}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Email Address
              </span>
              <p className="text-sm font-semibold text-[#171717]">{profile.email}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Role / Designation
              </span>
              <p className="text-sm font-medium text-[#171717]">{profile.designation}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Institution / Organization
              </span>
              <p className="text-sm font-medium text-[#171717]">{profile.organization}</p>
            </div>

            <div className="md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Professional Bio &amp; Focus
              </span>
              <p className="text-xs text-[#171717] leading-relaxed bg-[#F7F7F5] p-4 rounded-xl border border-[#EAEAEA]">
                {profile.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Activity Summary */}
      <ActivitySummary
        onNavigateToProject={handleNavigateToProject}
        onNavigateToReport={handleNavigateToReport}
      />
    </div>
  );
}
