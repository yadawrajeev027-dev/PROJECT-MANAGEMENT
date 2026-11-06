/**
 * projectService.js
 * Centralized Project, Upload, Extraction & Requirements API service.
 */

import api from './api';

export const projectService = {
  /**
   * List projects with pagination & filters
   */
  async getProjects(params = {}) {
    const res = await api.get('/projects', { params });
    return res;
  },

  /**
   * Get single project details by ID
   */
  async getProject(id) {
    const res = await api.get(`/projects/${id}`);
    return res?.data?.project || res?.project || res?.data || res;
  },

  /**
   * Create a new project
   */
  async createProject(projectData) {
    const res = await api.post('/projects', projectData);
    return res?.data?.project || res?.project || res?.data || res;
  },

  /**
   * Update an existing project
   */
  async updateProject(id, projectData) {
    const res = await api.put(`/projects/${id}`, projectData);
    return res?.data?.project || res?.project || res?.data || res;
  },

  /**
   * Delete a project
   */
  async deleteProject(id) {
    const res = await api.delete(`/projects/${id}`);
    return res;
  },

  /**
   * Upload project ZIP archive (multipart/form-data)
   */
  async uploadProjectZip(id, file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post(`/projects/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      },
    });
    return res.data;
  },

  /**
   * Trigger extraction of uploaded ZIP archive
   */
  async extractProjectZip(id) {
    const res = await api.post(`/projects/${id}/extract`);
    return res.data;
  },

  /**
   * Get project extraction status
   */
  async getExtractionStatus(id) {
    const res = await api.get(`/projects/${id}/extraction-status`);
    return res.data;
  },

  /**
   * Fetch project requirements
   */
  async getRequirements(id) {
    const res = await api.get(`/projects/${id}/requirements`);
    return res?.data?.requirements || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
  },

  /**
   * Add a requirement to a project
   */
  async addRequirement(id, requirementData) {
    const res = await api.post(`/projects/${id}/requirements`, requirementData);
    return res?.data?.requirement || res?.data || res;
  },

  /**
   * Update a requirement
   */
  async updateRequirement(id, reqId, requirementData) {
    const res = await api.put(`/projects/${id}/requirements/${reqId}`, requirementData);
    return res.data;
  },

  /**
   * Delete a requirement
   */
  async deleteRequirement(id, reqId) {
    const res = await api.delete(`/projects/${id}/requirements/${reqId}`);
    return res;
  },

  /**
   * Fetch aggregated dashboard statistics
   */
  async getDashboardStats() {
    const res = await api.get('/projects/dashboard/stats');
    return res.data;
  },
};

export default projectService;
