import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowLeft, LayoutDashboard, FolderKanban } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 sm:p-10 border border-[#EAEAEA] text-center space-y-6 shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-2xl bg-[#080808] text-[#F5C400] flex items-center justify-center mx-auto shadow-sm">
          <span className="text-3xl font-black font-mono">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-[#777777] leading-relaxed max-w-sm mx-auto">
            The route <code className="px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#EAEAEA] text-[#171717] font-mono text-[11px]">{location.pathname}</code> does not exist or has been relocated in the workspace.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={14} />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            to="/projects"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-[#171717] hover:bg-[#EAEAEA] bg-[#F7F7F5] border border-[#EAEAEA] transition-colors flex items-center justify-center gap-2"
          >
            <FolderKanban size={14} />
            <span>View My Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
