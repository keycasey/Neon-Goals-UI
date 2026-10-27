import { useChatStore } from './useChatStore';
import { useFinanceStore } from './useFinanceStore';
import { useGoalsStore } from './useGoalsStore';
import { useProjectionStore } from './useProjectionStore';
import { useWishlistStore } from './useWishlistStore';

export function resetUserScopedState() {
  useGoalsStore.getState().resetStore();
  useFinanceStore.getState().resetStore();
  useChatStore.getState().resetStore();
  useProjectionStore.getState().resetStore();
  useWishlistStore.getState().resetStore();
}
