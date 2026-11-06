import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, FileCode2, Trash2, KeyRound, AlertTriangle } from 'lucide-react';
import DeleteAccountModal from './DeleteAccountModal';

export default function PrivacySettings({ onDeleteAccountData }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const securityGuarantees = [
    {
      title: 'Ephemeral ZIP Storage & Automated Cleanup',
      description: 'Uploaded repository ZIP archives are extracted into an isolated ephemeral processing sandbox strictly for AST code parsing and dependency inspection, and are purged post-analysis.',
      icon: Lock,
      iconColor: 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
    },
    {
      title: 'Zero Public LLM Training on Code',
      description: 'Your private project code, architecture files, and requirements are never retained by third-party model providers, logged in public prompts, or utilized to train public machine learning systems.',
      icon: EyeOff,
      iconColor: 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
    },
    {
      title: 'Deterministic Secret & Credential Scrubbing',
      description: 'Before any report is constructed, pattern heuristic scanners strip .env variables, bearer tokens, AWS credentials, and MongoDB connection strings from the generated audit summaries.',
      icon: KeyRound,
      iconColor: 'text-[#171717] bg-[#F7F7F5] border-[#EAEAEA]'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-base font-bold text-[#171717] tracking-tight flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#171717]" />
            <span>Privacy &amp; Code Protection</span>
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Understand how ProjectPulse AI safeguards your intellectual property and repository code
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {securityGuarantees.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl p-4 space-y-2.5">
              <div className={`p-2 rounded-xl border w-fit ${item.iconColor}`}>
                <Icon size={16} />
              </div>
              <h4 className="text-xs font-bold text-[#171717]">
                {item.title}
              </h4>
              <p className="text-xs text-[#777777] leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Danger Zone: Account Data Deletion */}
      <div className="pt-4 border-t border-[#EAEAEA]">
        <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
              <AlertTriangle size={15} />
              <span>Danger Zone: Account &amp; Local Storage Purge</span>
            </div>
            <p className="text-xs text-[#171717] leading-relaxed max-w-xl">
              Permanently clear your local workspace cache, saved project drafts, custom requirements, and UI preferences.
            </p>
            <p className="text-[11px] text-[#777777] mt-1">
              Note: Database record deletion will link with backend APIs in the upcoming development phase.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Trash2 size={13} />
            <span>Delete Account Data</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDeleteAccountData}
      />
    </div>
  );
}
