import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  FileText, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

export default function ProfileForm({
  initialProfile,
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({ ...initialProfile });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.designation || !formData.designation.trim()) {
      errs.designation = 'Role or designation is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <User size={18} className="text-[#171717]" />
            <span>Personal &amp; Professional Information</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Update your public profile details and organizational affiliation
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="profile-fullname"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-fullname"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="profile-email"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="profile-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                  errors.email ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Role & Organization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label 
              htmlFor="profile-role"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Role or Designation <span className="text-red-500">*</span>
            </label>
            <input
              id="profile-role"
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Senior Software Architect"
              className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                errors.designation ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {errors.designation && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.designation}</span>
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="profile-org"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Institution or Organization
            </label>
            <input
              id="profile-org"
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g. ProjectPulse AI Systems"
              className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2.5 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label 
            htmlFor="profile-bio"
            className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5 flex items-center justify-between"
          >
            <span>Professional Bio &amp; Research Focus</span>
            <span className="text-[10px] text-[#777777] font-mono">
              {formData.bio ? formData.bio.length : 0}/400
            </span>
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            maxLength={400}
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about your engineering stack, project analysis focus, and software development interests..."
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl p-3.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] leading-relaxed"
          />
        </div>

        {/* Frontend Persistence Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#777777] text-[11px] flex items-start gap-2.5">
          <Info size={15} className="text-[#171717] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Frontend Storage Scope:</strong> Changes saved here are persisted in local browser storage (`localStorage`). Full multi-user synchronization will connect to MongoDB when backend user authentication is implemented.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#EAEAEA] bg-[#F7F7F5] border border-[#EAEAEA] transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-5 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Save size={14} />
          <span>Save Profile Changes</span>
        </button>
      </div>
    </form>
  );
}
