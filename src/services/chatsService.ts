import { apiClient } from './apiClient';

export const chatsService = {
  async getCreationChat() {
    return apiClient.get('/chats/creation');
  },

  async getGoalChat(goalId: string) {
    return apiClient.get(`/chats/goal/${goalId}`);
  },

  async addMessage(chatId: string, role: string, content: string) {
    return apiClient.post(`/chats/${chatId}/messages`, { role, content });
  },

  async getAllChats() {
    return apiClient.get('/chats');
  },
};
