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
   * Streaming chat with a goal-specific agent
   * Returns a readable stream of Server-Sent Events
   */
  async chatStream(goalId: string, request: GoalChatRequest): Promise<ReadableStream> {
    return apiClient.postStream(`/ai/goal-chat/${goalId}/stream`, request);
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
  async confirmCommands(goalId: string, commands: ChatCommand[]): Promise<unknown> {
    return apiClient.post(`/ai/goal-chat/${goalId}/confirm`, { commands });
  },
};
