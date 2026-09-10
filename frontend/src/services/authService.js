import apiClient from './api';

export const authService = {
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    const data = response.data;
    if (data.access_token) {
      localStorage.setItem('hirelens_token', data.access_token);
      localStorage.setItem('hirelens_user', JSON.stringify({
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
      }));
    }
    return data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('hirelens_token');
    localStorage.removeItem('hirelens_user');
  },

  getStoredUser() {
    const stored = localStorage.getItem('hirelens_user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken() {
    return localStorage.getItem('hirelens_token');
  },
};
