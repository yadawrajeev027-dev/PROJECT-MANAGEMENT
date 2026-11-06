/**
 * ProtectedRoute.jsx
 * Route guard component protecting authenticated views from unauthorized access.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 size={36} className="text-purple-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          VERIFYING AUTHENTICATED SESSION...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
