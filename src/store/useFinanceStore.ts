import { create } from 'zustand';
import type { PlaidAccount } from '@/services/plaidService';
import type { FinanceGoal } from '@/types/goals';
import { plaidService } from '@/services/plaidService';

// Read initial state from useAppStore's localStorage
// This keeps the slice in sync with the main store during the migration
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('goals-af-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        plaidAccounts: parsed?.state?.plaidAccounts ?? [],
        plaidAccountsVersion: parsed?.state?.plaidAccountsVersion ?? 0,
      };
    }
  } catch (e) {
    console.error('Failed to parse stored finance state:', e);
  }
  return {
    plaidAccounts: [],
    plaidAccountsVersion: 0,
  };
};

interface FinanceState {
  plaidAccounts: PlaidAccount[];
  plaidAccountsVersion: number;
  fetchPlaidAccounts: () => Promise<void>;
  addPlaidAccounts: (accounts: PlaidAccount[]) => void;
  syncPlaidAccount: (accountId: string) => Promise<void>;
  removePlaidAccount: (accountId: string) => Promise<void>;
  syncFinanceGoal: (goalId: string, goals: any[]) => void;
}

export const useFinanceStore = create<FinanceState>()((set, get) => ({
  // Initial state from localStorage (synced with useAppStore)
  ...getInitialState(),

  // Actions
  fetchPlaidAccounts: async () => {
    try {
      const fetchedAccounts = await plaidService.getAccounts();
      console.log('[useFinanceStore] Fetched Plaid accounts:', fetchedAccounts.map(a => ({
        id: a.id,
        name: a.accountName,
        type: a.accountType,
        subtype: a.accountSubtype,
      })));
      // Deduplicate by plaidAccountId
      const uniqueAccounts = fetchedAccounts.filter((account, index, self) =>
        index === self.findIndex(a => a.plaidAccountId === account.plaidAccountId)
      );
      set({
        plaidAccounts: uniqueAccounts,
        plaidAccountsVersion: get().plaidAccountsVersion + 1,
      });
    } catch (err) {
      console.error('[useFinanceStore] Failed to fetch Plaid accounts:', err);
      set({ plaidAccounts: [] });
    }
  },

  addPlaidAccounts: (accounts) => set((state) => {
    const existingIds = new Set(state.plaidAccounts.map(a => a.plaidAccountId));
    const newAccounts = accounts.filter(a => !existingIds.has(a.plaidAccountId));
    return {
      plaidAccounts: [...state.plaidAccounts, ...newAccounts],
      plaidAccountsVersion: state.plaidAccountsVersion + 1,
    };
  }),

  syncPlaidAccount: async (accountId) => {
    try {
      await plaidService.syncAccount(accountId);
      // Refresh all accounts after sync
      await get().fetchPlaidAccounts();
    } catch (err) {
      console.error('[useFinanceStore] Failed to sync Plaid account:', err);
    }
  },

  removePlaidAccount: async (accountId) => {
    try {
      try {
        await plaidService.deleteAccount(accountId);
      } catch (err) {
        // If endpoint doesn't exist, still remove from local state
        if (err instanceof Error && !err.message.includes('404')) {
          throw err;
        }
        console.log('[useFinanceStore] Delete endpoint not available, removing from local state only');
      }
      // Remove from local state
      set((state) => ({
        plaidAccounts: state.plaidAccounts.filter(a => a.id !== accountId),
        plaidAccountsVersion: state.plaidAccountsVersion + 1,
      }));
    } catch (err) {
      console.error('[useFinanceStore] Failed to remove Plaid account:', err);
      throw err;
    }
  },

  syncFinanceGoal: (goalId, goals) => {
    // Find the finance goal and update its balance
    const goal = goals.find((g: any) => g.id === goalId && g.type === 'finance') as FinanceGoal | undefined;
    if (!goal) return;

    // Simulate sync with random balance change (same logic as useAppStore)
    const change = (Math.random() - 0.3) * 500;
    const newBalance = Math.max(0, goal.currentBalance + change);

    // Note: This action returns the updated goal data
    // The caller (useAppStore or component) is responsible for updating the goals array
    console.log('[useFinanceStore] syncFinanceGoal called for:', goalId, 'new balance:', Math.round(newBalance * 100) / 100);
  },
}));
