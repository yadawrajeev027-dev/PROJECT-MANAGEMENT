import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';

export default function NotificationSettings({ notifications, onNotificationToggle }) {
  const notificationItems = [
    {
      id: 'analysisCompleted',
      title: 'Project Analysis Completed',
      description: 'Receive an immediate in-app and email alert whenever a ZIP code analysis finishes processing.',
      icon: CheckCircle,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'progressUpdates',
      title: 'Progress Milestone Updates',
      description: 'Get notified when milestone threshold markers (50%, 75%, 100%) are unlocked or changed.',
      icon: Bell,
      iconColor: 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
    },
    {
      id: 'recommendations',
      title: 'High-Impact Recommendations',
      description: 'Alerts when the heuristic analyzer discovers missing security configurations or critical missing features.',
      icon: AlertTriangle,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      id: 'announcements',
      title: 'Product & Engine Announcements',
      description: 'News about upcoming AST language parsers, benchmark models, and platform enhancements.',
      icon: Sparkles,
      iconColor: 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <Bell size={18} className="text-[#171717]" />
            <span>Notification Preferences</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Choose what alerts and analysis completion events you wish to receive
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#EAEAEA]">
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const isChecked = !!notifications[item.id];

          return (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-2 rounded-xl border shrink-0 ${item.iconColor}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#171717] mb-0.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#777777] leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Accessible Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isChecked}
                onClick={() => onNotificationToggle(item.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#F5C400] ${
                  isChecked ? 'bg-[#080808]' : 'bg-[#EAEAEA]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isChecked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
