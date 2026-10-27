import { create } from 'zustand';
import { wishlistService } from '@/services/wishlistService';
import { useAuthStore } from './useAuthStore';
import type {
  CreateWishlistItemInput,
  WishlistItem,
  WishlistPriority,
  WishlistStage,
} from '@/types/wishlist';

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  resetStore: () => void;
  fetchItems: () => Promise<void>;
  createItem: (input: CreateWishlistItemInput) => Promise<void>;
  updateItem: (
    id: string,
    updates: Partial<Pick<WishlistItem, 'title' | 'notes' | 'targetBudget' | 'earliestPurchaseDate'>> & {
      priority?: WishlistPriority;
      stage?: WishlistStage;
    },
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

const makeDemoItem = (input: CreateWishlistItemInput): WishlistItem => ({
  id: `demo-wish-${Date.now()}`,
  title: input.title,
  notes: input.notes || null,
  targetBudget: input.targetBudget ?? null,
  currency: 'USD',
  priority: input.priority || 'interested',
  stage: 'idea',
  earliestPurchaseDate: input.earliestPurchaseDate || null,
  linkedGoalId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  resetStore: () => set({ items: [], isLoading: false, error: null }),
  fetchItems: async () => {
    if (useAuthStore.getState().isDemoMode) return;
    set({ isLoading: true, error: null });
    try {
      set({ items: await wishlistService.getAll(), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      set({ error: 'Failed to load wishlist', isLoading: false });
    }
  },
  createItem: async (input) => {
    const item = useAuthStore.getState().isDemoMode
      ? makeDemoItem(input)
      : await wishlistService.create(input);
    set({ items: [item, ...get().items] });
  },
  updateItem: async (id, updates) => {
    const previous = get().items;
    set({
      items: previous.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
      ),
    });
    if (useAuthStore.getState().isDemoMode) return;
    try {
      const updated = await wishlistService.update(id, updates);
      set({ items: get().items.map((item) => (item.id === id ? updated : item)) });
    } catch (error) {
      set({ items: previous });
      throw error;
    }
  },
  removeItem: async (id) => {
    if (!useAuthStore.getState().isDemoMode) await wishlistService.remove(id);
    set({ items: get().items.filter((item) => item.id !== id) });
  },
}));
