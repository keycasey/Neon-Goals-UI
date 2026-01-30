import { apiClient } from './apiClient';

export interface GoalChatRequest {
  message: string;
}

export interface ChatCommand {
  type: 'CREATE_SUBGOAL' | 'UPDATE_PROGRESS';
  data: any;
}

export interface GoalChatResponse {
  content: string;
  commands?: ChatCommand[];
}

export const aiGoalChatService = {
  /**
   * Send message to goal-specific chat agent
   * Returns response content and optional commands to execute
   */
  async chat(goalId: string, request: GoalChatRequest): Promise<GoalChatResponse> {
    return apiClient.post<GoalChatResponse>(`/ai/goal-chat/${goalId}`, request);
  },
};
