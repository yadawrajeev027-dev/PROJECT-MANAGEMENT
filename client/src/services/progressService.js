/**
 * progressService.js
 * Centralized service for Deterministic Progress, History & Development Velocity (Step 10).
 */

import api from './api';

export const progressService = {
  /**
   * Trigger deterministic weighted progress calculation
   */
  async calculateProgress(projectId) {
    const res = await api.post(`/projects/${projectId}/calculate-progress`);
    return res?.data ?? res;
  },

  /**
   * Get current progress and verification coverage metrics
   */
  async getProgress(projectId) {
    const res = await api.get(`/projects/${projectId}/progress`);
    return res?.data ?? res;
  },

  /**
   * Get historical progress timeline across completed inspection runs
   */
  async getProgressHistory(projectId) {
    const res = await api.get(`/projects/${projectId}/progress-history`);
    return res?.data?.history || res?.history || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
  },

  /**
   * Get development velocity and milestone completion forecast
   */
  async getVelocity(projectId) {
    const res = await api.get(`/projects/${projectId}/velocity`);
    return res?.data ?? res;
  },
};

export default progressService;
