import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Laptop, 
  Info,
  Smartphone
} from 'lucide-react';

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  const validatePasswordForm = () => {
    const errs = {};
    if (!currentPassword) {
      errs.current = 'Current password is required';
    }
    if (!newPassword) {
      errs.new = 'New password is required';
    } else if (newPassword.length < 8) {
      errs.new = 'Password must be at least 8 characters long';
    }
    if (newPassword !== confirmPassword) {
      errs.confirm = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (validatePasswordForm()) {
      setStatusMessage({
        type: 'success',
        text: 'Password validation passed! (Notice: Backend authentication service with bcrypt hashing is required to permanently update database credentials).'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <Lock size={18} className="text-[#171717]" />
            <span>Security &amp; Active Sessions</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Manage your login credentials, password policies, and inspect verified login sessions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
        {/* Left: Change Password Form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} className="text-[#171717]" />
              <span>Change Password</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-[#777777] hover:text-[#171717] flex items-center gap-1"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showPassword ? 'Hide' : 'Show'} text</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{statusMessage.text}</p>
            </div>
          )}

          <div>
            <label 
              htmlFor="current-password"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1"
            >
              Current Password
            </label>
            <input
              id="current-password"
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                errors.current ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {errors.current && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.current}</span>
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="new-password"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1"
            >
              New Password
            </label>
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                errors.new ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {errors.new && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.new}</span>
              </p>
            )}
          </div>

          <div>
            <label 
              htmlFor="confirm-password"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full bg-[#F7F7F5] border rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none transition-all ${
                errors.confirm ? 'border-red-500' : 'border-[#EAEAEA] focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]'
              }`}
            />
            {errors.confirm && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>{errors.confirm}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all active:scale-95"
          >
            Update Password
          </button>
        </form>

        {/* Right: Active Sessions & Two-Factor Notice */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Active Login Sessions</span>
          </h4>

          {/* Current Device Session */}
          <div className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-[#EAEAEA] text-[#171717] shrink-0 shadow-sm">
                  <Laptop size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#171717]">Windows 11 PC</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Now
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777777] mt-0.5">
                    Google Chrome 131.0 • Dev Sandbox
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#777777]">
              <span>Location: New Delhi, India</span>
              <span className="font-mono text-[#777777]">127.0.0.1</span>
            </div>
          </div>

          {/* Secondary Mobile Session (illustrative) */}
          <div className="bg-[#F7F7F5]/60 border border-[#EAEAEA] rounded-xl p-4 space-y-2 opacity-80">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-[#EAEAEA] text-[#777777] shrink-0">
                  <Smartphone size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#171717]">Apple iPhone 15 Pro</span>
                  <p className="text-[11px] text-[#777777] mt-0.5">
                    Mobile Safari • Last active 3 days ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[11px] text-[#777777] flex items-start gap-2">
            <Info size={14} className="text-[#171717] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Token refresh rotation, OAuth provider linking (GitHub/Google), and remote session revocation will be enabled in Phase 4 when Express session controllers are wired up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
