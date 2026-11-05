import { apiClient } from './apiClient';
import type { CreateTodoInput, Todo } from '@/types/todo';

export const todoService = {
  getAll: () => apiClient.get('/todos') as Promise<Todo[]>,
  create: (data: CreateTodoInput) => apiClient.post('/todos', data) as Promise<Todo>,
  update: (id: string, data: Partial<Pick<Todo, 'title' | 'notes' | 'status'>>) =>
    apiClient.patch(`/todos/${id}`, data) as Promise<Todo>,
  archive: (id: string) => apiClient.delete(`/todos/${id}`) as Promise<Todo>,
};
