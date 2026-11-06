import React from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  Award,
  Building
} from 'lucide-react';

export default function ProfileHeader({
  profile,
  onEditClick,
  isEditing,
}) {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAEAEA] shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
        {/* Left: Avatar and Identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
          {/* Avatar with Status Ring */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#080808] p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#171717] rounded-[14px] flex items-center justify-center text-[#F5C400] font-extrabold text-2xl tracking-tight">
                {profile.fullName
                  ? profile.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'AS'}
              </div>
            </div>

            {/* Online Indicator Badge */}
            <span 
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" 
              title="Session Active"
            />
          </div>

          {/* User Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">
                {profile.fullName}
              </h1>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA] flex items-center gap-1">
                <Sparkles size={11} className="text-[#F5C400]" />
                <span>{profile.accountType || 'Senior Developer Tier'}</span>
              </span>
            </div>

            <p className="text-xs text-[#777777] font-medium">
              {profile.designation || 'Software Architect & Full-Stack Lead'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3.5 pt-1 text-xs text-[#777777]">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-[#777777]" />
                <span className="text-[#171717] font-medium">{profile.email}</span>
              </span>

              <span className="flex items-center gap-1.5">
                <Building size={13} className="text-[#777777]" />
                <span>{profile.organization || 'ProjectPulse Engineering Lab'}</span>
              </span>

              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#777777]" />
                <span>Member since {profile.memberSince || 'March 2025'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Toggle */}
        <div className="self-center sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onEditClick}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isEditing
                ? 'bg-[#F7F7F5] text-[#171717] hover:bg-[#EAEAEA] border border-[#EAEAEA]'
                : 'bg-[#080808] hover:bg-[#1f1f1f] text-white shadow-sm'
            }`}
          >
            {isEditing ? 'Close Editor' : 'Edit Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
