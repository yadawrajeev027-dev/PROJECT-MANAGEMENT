/**
 * analysisService.js
 * Centralized service for AST Analysis, Requirement Verification, AI Advisory & Reports.
 */

import api from './api';

export const analysisService = {
  /**
   * Trigger static source code analysis (Step 7)
   */
  async analyzeSource(projectId) {
    const res = await api.post(`/projects/${projectId}/analyze-source`);
    return res.data;
  },

  /**
   * Get source analysis status
   */
  async getSourceAnalysisStatus(projectId) {
    const res = await api.get(`/projects/${projectId}/source-analysis-status`);
    return res.data;
  },

  /**
   * Trigger requirement verification engine (Step 8)
   */
  async verifyRequirements(projectId) {
    const res = await api.post(`/projects/${projectId}/verify-requirements`);
    return res.data;
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(projectId) {
    const res = await api.get(`/projects/${projectId}/verification-status`);
    return res.data;
  },

  /**
   * Generate AI architectural recommendations (Step 9)
   */
  async generateRecommendations(projectId, providerOverride = {}) {
    const res = await api.post(`/projects/${projectId}/generate-recommendations`, { providerOverride });
    return res.data;
  },

  /**
   * Get latest AI recommendations
   */
  async getRecommendations(projectId) {
    try {
      const res = await api.get(`/projects/${projectId}/recommendations`);
      return res?.data?.aiAnalysis || res?.aiAnalysis || res?.data || null;
    } catch (err) {
      // 404 simply means AI recommendations have not yet been generated
      if (err?.status === 404 || err?.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Get all reports for the user across projects
   */
  async getReports() {
    const res = await api.get('/reports');
    return res.data || [];
  },

  /**
   * Get single report details
   */
  async getReport(id) {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },

  /**
   * Get reports for a specific project
   */
  async getProjectReports(projectId) {
    const res = await api.get(`/projects/${projectId}/reports`);
    return res.data || [];
  },
};

export default analysisService;
