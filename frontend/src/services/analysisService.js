import apiClient from './api';

export const analysisService = {
  async startCandidateAnalysis(analysisData) {
    const response = await apiClient.post('/analyses/candidate', analysisData);
    return response.data;
  },

  async startCandidateAnalysisWithJdFile(resumeId, jobTitle, jdFile) {
    const formData = new FormData();
    formData.append('resume_id', resumeId);
    if (jobTitle) formData.append('job_title', jobTitle);
    formData.append('jd_file', jdFile);

    const response = await apiClient.post('/analyses/candidate/with-jd-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async screenBatchResumes(jobId, resumeIds) {
    const response = await apiClient.post('/analyses/screen-batch', {
      job_id: jobId,
      resume_ids: resumeIds,
    });
    return response.data;
  },

  async getCandidateHistory() {
    const response = await apiClient.get('/analyses/candidate/history');
    return response.data;
  },

  async getJobScreenings(jobId) {
    const response = await apiClient.get(`/analyses/job/${jobId}`);
    return response.data;
  },

  async getAnalysisDetail(analysisId) {
    const response = await apiClient.get(`/analyses/${analysisId}`);
    return response.data;
  },

  async updateCandidateStatus(analysisId, status) {
    const response = await apiClient.patch(`/analyses/${analysisId}/status`, { status });
    return response.data;
  },

  async getJobShortlist(jobId) {
    const response = await apiClient.get(`/analyses/job/${jobId}/shortlist`);
    return response.data;
  },

  async checkHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
