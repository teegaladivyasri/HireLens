import apiClient from './api';

export const resumeService = {
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadBatchResumes(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await apiClient.post('/resumes/upload-batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadZipResumes(zipFile) {
    const formData = new FormData();
    formData.append('file', zipFile);
    const response = await apiClient.post('/resumes/upload-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getMyResumes() {
    const response = await apiClient.get('/resumes/my');
    return response.data;
  },

  async getResumeById(resumeId) {
    const response = await apiClient.get(`/resumes/${resumeId}`);
    return response.data;
  },
};
