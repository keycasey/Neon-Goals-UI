import { apiClient } from './apiClient';

export const chatsService = {
  async getCreationChat() {
    return apiClient.get('/chats/creation');
  },

  async getGoalChat(goalId: string) {
    return apiClient.get(`/chats/goal/${goalId}`);
  },

  async getOverviewChat() {
    return apiClient.get('/chats/overview');
  },

  async getCategoryChat(categoryId: 'items' | 'finances' | 'actions') {
    return apiClient.get(`/chats/category/${categoryId}`);
  },

  async addMessage(chatId: string, role: string, content: string) {
    return apiClient.post(`/chats/${chatId}/messages`, { role, content });
  },

  async editMessage(chatId: string, messageId: string, content: string) {
    return apiClient.put(`/chats/${chatId}/messages/${messageId}`, { content });
  },

  async getAllChats() {
    return apiClient.get('/chats');
  },
};
