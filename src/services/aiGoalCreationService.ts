import { apiClient } from './apiClient';

export interface GoalCreationResponse {
  content: string;
  goalCreated: boolean;
  goal?: any;
  goalPreview?: string;
  awaitingConfirmation?: boolean;
}

export const aiGoalCreationService = {
  /**
   * Start goal creation session with OpenAI thread
   */
  async startSession() {
    return apiClient.post('/ai/goal-creation/start');
  },

  /**
   * Send message in goal creation flow
   */
  async chat(message: string): Promise<GoalCreationResponse> {
    return apiClient.post('/ai/goal-creation/chat', { message });
  },

  /**
   * Confirm and create the goal (user clicked "Looks good!")
   */
  async confirmGoal(): Promise<GoalCreationResponse> {
    return apiClient.put('/ai/goal-creation/confirm');
  },

  /**
   * Cancel goal creation and delete the thread
   */
  async cancelSession() {
    return apiClient.delete('/ai/goal-creation/cancel');
  },

  /**
   * Clear the goal creation session (keeps thread)
   */
  async clearSession() {
    return apiClient.delete('/ai/goal-creation/session');
  },
};

/**
 * Service for continuing conversations about existing goals
 */
export const aiGoalChatService = {
  /**
   * Send message to continue conversation about a goal
   */
  async chat(goalId: string, message: string) {
    return apiClient.post(`/ai/goal-chat/${goalId}`, { message });
  },
};
