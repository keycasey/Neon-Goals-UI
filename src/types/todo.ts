export type TodoStatus = 'active' | 'completed' | 'archived';

export interface Todo {
  id: string;
  title: string;
  notes: string | null;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  notes?: string;
}
