import { useChatStore } from './useChatStore';
import { useFinanceStore } from './useFinanceStore';
import { useGoalsStore } from './useGoalsStore';
import { useProjectionStore } from './useProjectionStore';
import { useWishlistStore } from './useWishlistStore';
import { useTodoStore } from './useTodoStore';

export function resetUserScopedState() {
  useGoalsStore.getState().resetStore();
  useFinanceStore.getState().resetStore();
  useChatStore.getState().resetStore();
  useProjectionStore.getState().resetStore();
  useWishlistStore.getState().resetStore();
  useTodoStore.getState().resetStore();
}
