import { apiClient } from './apiClient';

export type CategoryId = 'items' | 'finances' | 'actions';

export interface SpecialistChatResponse {
  content: string;
  commands?: Array<{
    type: string;
    data: any;
  }>;
  executedCommands?: Array<{
    type: string;
    success: boolean;
    goalId?: string;
    taskId?: string;
    goal?: any;
    error?: string;
  }>;
}

export const aiSpecialistChatService = {
  /**
   * Non-streaming chat with a category specialist
   */
  async chat(categoryId: CategoryId, message: string): Promise<SpecialistChatResponse> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat`, { message });
  },

  /**
   * Streaming chat with a category specialist
   * Returns a readable stream of Server-Sent Events
   */
  chatStream(categoryId: CategoryId, message: string): ReadableStream {
    return apiClient.postStream(`/ai/specialist/category/${categoryId}/chat/stream`, { message });
  },

  /**
   * Stop an active stream for this category
   */
  async stopStream(categoryId: CategoryId): Promise<{ stopped: boolean; message: string }> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat/stop`);
  },

  /**
   * Confirm and execute pending commands
   */
  async confirmCommands(categoryId: CategoryId, commands: any[]): Promise<any> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat/confirm-commands`, { commands });
  },

  /**
   * Cancel pending commands
   */
  async cancelCommands(categoryId: CategoryId, reason?: string): Promise<{ cancelled: boolean; message: string }> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat/cancel-commands`, { reason });
  },
};
