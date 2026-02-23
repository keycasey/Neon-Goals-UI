import { apiClient } from './apiClient';

export interface OverviewChatRequest {
  message: string;
}

export type ChatCommandType =
  | 'CREATE_GOAL'
  | 'CREATE_SUBGOAL'
  | 'UPDATE_PROGRESS'
  | 'UPDATE_TITLE'
  | 'UPDATE_FILTERS'
  | 'ADD_TASK'
  | 'REMOVE_TASK'
  | 'TOGGLE_TASK'
  | 'ARCHIVE_GOAL';

export interface ChatCommand {
  type: ChatCommandType;
  data: any;
}

export interface OverviewChatResponse {
  content: string;
  commands?: ChatCommand[];
  hasPendingCommands?: boolean;
  pendingCommands?: ChatCommand[];
}

export interface OverviewStreamChunk {
  content: string;
  done: boolean;
  goalPreview?: string;
  awaitingConfirmation?: boolean;
  commands?: ChatCommand[];
  extraction?: {
    groupId: string;
    urls: string[];
    streamUrl: string;
  };
}

export const aiOverviewChatService = {
  /**
   * Send message to overview chat agent
   */
  async chat(request: OverviewChatRequest): Promise<OverviewChatResponse> {
    return apiClient.post<OverviewChatResponse>('/ai/overview/chat', request);
  },

  /**
   * Stream overview chat for real-time responses
   */
  async *chatStream(request: OverviewChatRequest): AsyncGenerator<OverviewStreamChunk, void, unknown> {
    const stream = await apiClient.postStream('/ai/overview/chat/stream', request);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();

          try {
            const chunk = JSON.parse(jsonStr) as OverviewStreamChunk;
            yield chunk;
            if (chunk.done) return;
          } catch (e) {
            console.error('Failed to parse stream chunk:', jsonStr);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  /**
   * Stop active overview chat stream
   */
  async stopStream(): Promise<{ stopped: boolean; message: string }> {
    return apiClient.post('/ai/overview/chat/stop');
  },

  /**
   * Confirm and execute pending commands
   */
  async confirmCommands(commands: ChatCommand[]): Promise<any> {
    return apiClient.post('/ai/overview/chat/confirm-commands', { commands });
  },

  /**
   * Cancel pending commands
   */
  async cancelCommands(reason?: string): Promise<any> {
    return apiClient.post('/ai/overview/chat/cancel-commands', { reason });
  },
};

