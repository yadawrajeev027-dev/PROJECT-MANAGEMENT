import React from 'react';
import { Moon, Sun, Monitor, CheckCircle2, Palette } from 'lucide-react';

export default function AppearanceSettings({ theme, onThemeChange }) {
  const options = [
    {
      id: 'dark',
      name: 'Dark Navy (Default)',
      description: 'Deep navy background with purple and blue glowing accents. Optimized for low-light development.',
      icon: Moon,
      preview: 'bg-navy-950 border-navy-750 text-white',
      badge: 'High Contrast'
    },
    {
      id: 'light',
      name: 'Clean Light',
      description: 'Bright slate workspace with crisp typography and subtle purple gradients.',
      icon: Sun,
      preview: 'bg-slate-100 border-slate-300 text-slate-800',
      badge: 'Daylight'
    },
    {
      id: 'system',
      name: 'System Preference',
      description: 'Automatically synchronizes with your operating system dark/light configuration.',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-navy-900 to-slate-200 border-navy-700 text-slate-200',
      badge: 'Adaptive'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <Palette size={18} className="text-[#171717]" />
            <span>Appearance &amp; Theme</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Customize the interface appearance. Theme changes take effect across all application views immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onThemeChange(opt.id)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-[#F7F7F5] border-[#080808] ring-1 ring-[#080808] shadow-sm'
                  : 'bg-white hover:bg-[#F7F7F5] border-[#EAEAEA] hover:border-[#777777]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg border ${
                    isSelected
                      ? 'bg-[#080808] border-[#080808] text-white'
                      : 'bg-[#F7F7F5] border-[#EAEAEA] text-[#777777] group-hover:text-[#171717]'
                  }`}>
                    <Icon size={18} />
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#171717] bg-[#F5C400] px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-[#171717] mb-1">
                  {opt.name}
                </div>

                <p className="text-xs text-[#777777] leading-relaxed mb-4">
                  {opt.description}
                </p>
              </div>

              {/* Mini visual mockup preview indicator */}
              <div className={`w-full h-8 rounded-lg border flex items-center justify-between px-2.5 text-[10px] font-mono ${opt.preview}`}>
                <span>Aa</span>
                <span className="opacity-60">{opt.badge}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
