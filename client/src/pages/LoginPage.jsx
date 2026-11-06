import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Mail, Lock, LogIn, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-4 sm:p-6 text-[#171717] antialiased">
      <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in duration-300">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#080808] flex items-center justify-center text-[#F5C400] shadow-md mx-auto mb-3">
            <Activity size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] flex items-center justify-center gap-2">
            ProjectPulse <span className="text-xs px-2 py-0.5 rounded-full bg-[#080808] text-white font-mono">AI</span>
          </h1>
          <p className="text-xs text-[#777777]">
            Sign in to access your codebase intelligence and progress analytics
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAEAEA] shadow-lg space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#171717] block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="developer@projectpulse.ai"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] text-xs placeholder:text-[#777777] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#171717]">Password</label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] text-xs placeholder:text-[#777777] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#EAEAEA] text-center text-xs text-[#777777]">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#171717] hover:text-[#F28C28] font-bold underline underline-offset-2">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
