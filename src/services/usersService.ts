import { apiClient } from './apiClient';
import type { Settings, SettingsOptions } from '@/types/goals';

export const usersService = {
  async getProfile() {
    return apiClient.get('/users/me');
  },

  async updateSettings(settings: Partial<Settings>) {
    return apiClient.patch('/users/me/settings', settings);
  },

  async getSettingsOptions() {
    return apiClient.get<SettingsOptions>('/users/me/settings/options');
  },
};
