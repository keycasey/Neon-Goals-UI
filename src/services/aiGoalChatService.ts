import { apiClient } from './apiClient';
import type { ChatCommand } from '@/store/types';

export interface GoalChatRequest {
  message: string;
}

export interface GoalChatResponse {
  content: string;
  commands?: ChatCommand[];
  goalPreview?: string;
  awaitingConfirmation?: boolean;
  proposalType?: 'confirm_edit_cancel' | 'accept_decline';
}

export const aiGoalChatService = {
  /**
   * Send message to goal-specific chat agent
   * Returns response content and optional commands to execute
   */
  async chat(goalId: string, request: GoalChatRequest): Promise<GoalChatResponse> {
    return apiClient.post<GoalChatResponse>(`/ai/goal-chat/${goalId}`, request);
  },

  /**
   * Stop active goal chat stream
   */
  async stopStream(goalId: string): Promise<{ stopped: boolean; message: string }> {
    return apiClient.post(`/ai/goal-chat/${goalId}/stop`);
  },

  /**
   * Confirm and execute pending commands for a goal chat
   */
  async confirmCommands(goalId: string, commands: ChatCommand[]): Promise<any> {
    return apiClient.post(`/ai/goal-chat/${goalId}/confirm`, { commands });
  },
};
