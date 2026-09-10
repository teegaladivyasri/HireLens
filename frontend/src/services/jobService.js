import apiClient from './api';

export const jobService = {
  async getJobs() {
    const response = await apiClient.get('/jobs/');
    return response.data;
  },

  async getJobById(jobId) {
    const response = await apiClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  async createJob(jobData) {
    const response = await apiClient.post('/jobs/', jobData);
    return response.data;
  },

  async createJobFromDocument(title, file) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    const response = await apiClient.post('/jobs/from-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateJob(jobId, jobData) {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  async deleteJob(jobId) {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },
};
