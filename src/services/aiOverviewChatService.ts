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
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
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
    const response = await fetchWithAuth('/ai/overview/chat/stream', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Overview chat error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
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

