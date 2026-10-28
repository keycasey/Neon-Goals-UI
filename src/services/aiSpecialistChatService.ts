import { apiClient } from './apiClient';
import type { Goal } from '@/types/goals';
import type { ChatCommand } from '@/store/types';

export type CategoryId = 'items' | 'finances' | 'actions';

export interface SpecialistChatResponse {
  content: string;
  awaitingConfirmation?: boolean;
  proposalType?: 'confirm_edit_cancel' | 'accept_decline';
  commands?: Array<{
    type: string;
    data: Record<string, unknown>;
  }>;
  executedCommands?: Array<{
    type: string;
    success: boolean;
    goalId?: string;
    taskId?: string;
    goal?: Goal;
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
  async chatStream(categoryId: CategoryId, message: string): Promise<ReadableStream> {
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
  async confirmCommands(categoryId: CategoryId, commands: ChatCommand[]): Promise<unknown> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat/confirm-commands`, { commands });
  },

  /**
   * Cancel pending commands
   */
  async cancelCommands(categoryId: CategoryId, reason?: string): Promise<{ cancelled: boolean; message: string }> {
    return apiClient.post(`/ai/specialist/category/${categoryId}/chat/cancel-commands`, { reason });
  },
};
