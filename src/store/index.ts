/**
 * Store barrel exports
 * Domain-based Zustand stores for state management
 *
 * During migration: These stores read from localStorage to stay in sync with useAppStore
 * After migration: Each store will manage its own domain state
 */

// Main store (monolithic - will be deprecated after migration)
export { useAppStore } from './useAppStore';

// Domain stores (new)
export { useAuthStore } from './useAuthStore';
export { useViewStore } from './useViewStore';
export { useFinanceStore } from './useFinanceStore';
export { useGoalsStore } from './useGoalsStore';
export { useChatStore } from './useChatStore';
export { useBillingStore } from './useBillingStore';

// Shared types
export type { ChatCommand, PendingCommandsState } from './types';
