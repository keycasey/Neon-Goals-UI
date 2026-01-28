import { apiClient } from './apiClient';

export const usersService = {
  async getProfile() {
    return apiClient.get('/users/me');
  },

  async updateSettings(settings: any) {
    return apiClient.patch('/users/me/settings', settings);
  },
};
