import { create } from 'zustand';
import { todoService } from '@/services/todoService';
import type { CreateTodoInput, Todo } from '@/types/todo';
import { useAuthStore } from './useAuthStore';

interface TodoState {
  items: Todo[];
  isLoading: boolean;
  error: string | null;
  resetStore: () => void;
  fetchItems: () => Promise<void>;
  createItem: (input: CreateTodoInput) => Promise<void>;
  updateItem: (id: string, updates: Partial<Pick<Todo, 'title' | 'notes' | 'status'>>) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
}

const now = () => new Date().toISOString();
const demoItems: Todo[] = [
  { id: 'demo-todo-dusting', title: 'Dusting', notes: 'Living room shelves', status: 'active', createdAt: now(), updatedAt: now() },
];

export const useTodoStore = create<TodoState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  resetStore: () => set({ items: [], isLoading: false, error: null }),
  fetchItems: async () => {
    if (useAuthStore.getState().isDemoMode) {
      set({ items: demoItems, isLoading: false, error: null });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      set({ items: await todoService.getAll(), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      set({ error: 'Failed to load todos', isLoading: false });
    }
  },
  createItem: async (input) => {
    const item = useAuthStore.getState().isDemoMode
      ? { id: `demo-todo-${Date.now()}`, title: input.title.trim(), notes: input.notes?.trim() || null, status: 'active' as const, createdAt: now(), updatedAt: now() }
      : await todoService.create(input);
    set({ items: [item, ...get().items] });
  },
  updateItem: async (id, updates) => {
    const previous = get().items;
    set({ items: previous.map((item) => item.id === id ? { ...item, ...updates, updatedAt: now() } : item) });
    if (useAuthStore.getState().isDemoMode) return;
    try {
      const updated = await todoService.update(id, updates);
      set({ items: get().items.map((item) => item.id === id ? updated : item) });
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  archiveItem: async (id) => {
    const previous = get().items;
    set({ items: previous.map((item) => item.id === id ? { ...item, status: 'archived', updatedAt: now() } : item) });
    if (useAuthStore.getState().isDemoMode) return;
    try {
      const archived = await todoService.archive(id);
      set({ items: get().items.map((item) => item.id === id ? archived : item) });
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
}));
