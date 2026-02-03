import { apiClient } from './apiClient';
import { API_BASE_URL as API_BASE } from '@/lib/apiConfig';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  mode: 'creation' | 'goal';
  goalType?: 'item' | 'finance' | 'action';
  goalContext?: string;
}

export interface ChatResponse {
  content: string;
  shouldEnterGoalCreation?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  shouldEnterGoalCreation?: boolean;
  goalPreview?: string;
  awaitingConfirmation?: boolean;
  commands?: Array<{ type: string; data: any }>;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Read token dynamically on each request
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

export const aiService = {
  /**
   * Send chat message to AI
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post('/ai/chat', request);
  },

  /**
   * Stream chat message to AI for real-time responses
   */
  async *chatStream(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const response = await fetchWithAuth('/ai/chat/stream', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
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

          // Strip the 'data:' prefix from SSE format
          const jsonStr = trimmed.slice(5).trim();

          try {
            const chunk = JSON.parse(jsonStr) as StreamChunk;
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
   * Parse goal from natural language (future enhancement)
   */
  async parseGoal(message: string, goalType: 'item' | 'finance' | 'action') {
    return apiClient.post('/ai/parse-goal', { message, goalType });
  },
};
