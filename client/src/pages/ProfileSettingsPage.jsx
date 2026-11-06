import React, { useState } from 'react';
import { 
  User, 
  Key, 
  ShieldCheck, 
  Bell, 
  Save, 
  Sparkles, 
  Check, 
  Terminal,
  Cpu
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('sk-proj-demo-masked-key-****************');
  const [provider, setProvider] = useState('openai');

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-[#171717] tracking-tight">
          Profile &amp; Architecture Configuration
        </h2>
        <p className="text-xs text-[#777777] mt-0.5">
          Manage developer workspace credentials, LLM model parameters, and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-[#171717]" />
            <span>Developer Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                defaultValue="Astha Sharma"
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                defaultValue="astha.sharma@projectpulse.ai"
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Engineering Role
              </label>
              <input
                type="text"
                defaultValue="Senior Full-Stack MERN Architect"
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Active Organization
              </label>
              <input
                type="text"
                defaultValue="ProjectPulse AI Systems"
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
              />
            </div>
          </div>
        </div>

        {/* AI & Model Settings Card (Ready for Phase 5) */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#171717] uppercase tracking-wider flex items-center gap-2">
            <Cpu size={16} className="text-[#171717]" />
            <span>AI Reasoning Provider (Phase 5 Engine)</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">
                Target Model Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3.5 py-2 text-xs text-[#171717] focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
              >
                <option value="openai">OpenAI (GPT-4o / GPT-4 Turbo Code Engine)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet Artifacts)</option>
                <option value="gemini">Google DeepMind (Gemini 2.5 Flash / Pro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5 flex items-center justify-between">
                <span>API Secret Key</span>
                <span className="text-[10px] text-[#777777]">Never exposed to client bundle in production</span>
              </label>
              <div className="relative">
                <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl pl-9 pr-4 py-2 text-xs text-[#171717] font-mono focus:outline-none focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save feedback */}
        {saved && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span>Preferences saved successfully to local state.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-2"
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
