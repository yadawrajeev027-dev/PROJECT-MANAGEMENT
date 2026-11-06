import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

export default function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  const [confirmationInput, setConfirmationInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim().toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmationInput('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 border border-[#EAEAEA] shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#F7F7F5] transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 id="delete-account-title" className="text-lg font-bold text-[#171717] tracking-tight">
              Delete Account Data
            </h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">
              Irreversible action
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-[#171717]">
          <p className="leading-relaxed">
            Deleting your account will purge all local project caches, custom requirement specifications, and saved report configurations.
          </p>

          <div className="p-3 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-[11px] text-[#777777] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-600">
              <Info size={13} />
              <span>Frontend Architecture Notice</span>
            </div>
            <p className="leading-relaxed text-[#777777]">
              In this preview phase, confirming will clear all <code>localStorage</code> items (<code>projectpulse_*</code>) and reset the application state. Server-side account removal will be coordinated with the Express/MongoDB backend upon authentication integration.
            </p>
          </div>

          <div>
            <label 
              htmlFor="delete-confirm-input"
              className="block text-[11px] font-bold uppercase tracking-wider text-[#171717] mb-1.5"
            >
              Type <span className="font-mono text-red-600 font-black">DELETE</span> to confirm:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-[#F7F7F5] border border-[#EAEAEA] focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-[#171717] placeholder-[#777777] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#EAEAEA]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#EAEAEA] bg-[#F7F7F5] border border-[#EAEAEA] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isConfirmed
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : 'bg-[#F7F7F5] text-[#777777] cursor-not-allowed border border-[#EAEAEA]'
            }`}
          >
            <Trash2 size={13} />
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
