import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadProjectPage from './pages/UploadProjectPage';
import MyProjects from './pages/MyProjects';
import ProjectDetails from './pages/ProjectDetails';
import ReportsHistory from './pages/ReportsHistory';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Application Workspace */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          {/* Default route redirects to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Core application routes */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="upload" element={<UploadProjectPage />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="reports" element={<ReportsHistory />} />
          <Route path="reports/:id" element={<ReportsHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />

          {/* 404 Catch-all route within workspace */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
