import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlaidLink as usePlaidLinkLib, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { plaidService, type PlaidAccount } from '@/services/plaidService';
import { useAppStore } from '@/store/useAppStore';

// Lightweight account info from Plaid Link metadata (available before token exchange)
export interface PendingPlaidAccount {
  name: string;
  mask: string;
  type: string;
  subtype: string;
  institutionName: string;
}

interface UsePlaidLinkReturn {
  open: () => void;
  ready: boolean;
  isLoading: boolean;
  error: string | null;
  accounts: PlaidAccount[];
  pendingAccounts: PendingPlaidAccount[];
  fetchAccounts: () => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  isSyncing: string | null;
}

// Demo Plaid accounts for demonstration
const DEMO_PLAID_ACCOUNTS: PlaidAccount[] = [
  {
    id: 'demo-checking-1',
    plaidAccountId: 'demo-plaid-checking-1',
    accountName: 'Everyday Checking',
    accountType: 'depository',
    accountSubtype: 'checking',
    currentBalance: 4823.47,
    currency: 'USD',
    mask: '1234',
    institutionName: 'Chase',
  },
  {
    id: 'demo-savings-1',
    plaidAccountId: 'demo-plaid-savings-1',
    accountName: 'High Yield Savings',
    accountType: 'depository',
    accountSubtype: 'savings',
    currentBalance: 18250.00,
    currency: 'USD',
    mask: '5678',
    institutionName: 'Ally',
  },
  {
    id: 'demo-brokerage-1',
    plaidAccountId: 'demo-plaid-brokerage-1',
    accountName: 'Individual Brokerage',
    accountType: 'investment',
    accountSubtype: 'brokerage',
    currentBalance: 32450.82,
    currency: 'USD',
    mask: '9012',
    institutionName: 'Schwab',
  },
  {
    id: 'demo-roth-1',
    plaidAccountId: 'demo-plaid-roth-1',
    accountName: 'Roth IRA',
    accountType: 'investment',
    accountSubtype: 'roth',
    currentBalance: 15780.33,
    currency: 'USD',
    mask: '3456',
    institutionName: 'Fidelity',
  },
  {
    id: 'demo-credit-1',
    plaidAccountId: 'demo-plaid-credit-1',
    accountName: 'Rewards Credit Card',
    accountType: 'credit',
    accountSubtype: 'credit_card',
    currentBalance: 1245.60,
    currency: 'USD',
    mask: '7890',
    institutionName: 'Capital One',
    isDebt: true,
  },
];

// Extra demo accounts added when user clicks "Link Account" in demo mode
const DEMO_EXTRA_ACCOUNTS: PlaidAccount[] = [
  {
    id: 'demo-401k-1',
    plaidAccountId: 'demo-plaid-401k-1',
    accountName: '401(k)',
    accountType: 'investment',
    accountSubtype: '401k',
    currentBalance: 67320.15,
    currency: 'USD',
    mask: '2468',
    institutionName: 'Vanguard',
  },
  {
    id: 'demo-student-1',
    plaidAccountId: 'demo-plaid-student-1',
    accountName: 'Student Loan',
    accountType: 'loan',
    accountSubtype: 'student',
    currentBalance: 12400.00,
    currency: 'USD',
    mask: '1357',
    institutionName: 'Mohela',
    isDebt: true,
  },
];

export const usePlaid = (): UsePlaidLinkReturn => {
  const { isDemoMode, plaidAccounts, fetchPlaidAccounts, addPlaidAccounts, removePlaidAccount, syncPlaidAccount } = useAppStore();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<PendingPlaidAccount[]>([]);
  const openRef = useRef<(() => void) | null>(null);

  // Fetch existing linked accounts on mount
  const fetchAccounts = useCallback(async () => {
    // In demo mode, seed with first 2 accounts if none exist
    if (isDemoMode) {
      if (plaidAccounts.length === 0) {
        addPlaidAccounts(DEMO_PLAID_ACCOUNTS.slice(0, 2));
      }
      return;
    }

    await fetchPlaidAccounts();
  }, [isDemoMode, fetchPlaidAccounts, addPlaidAccounts, plaidAccounts.length]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Create link token when needed
  const createLinkToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[usePlaid] Creating link token...');
      const response = await plaidService.createLinkToken();
      console.log('[usePlaid] Link token created:', response.link_token?.substring(0, 10) + '...');
      return response.link_token;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Plaid Link';
      setError(message);
      console.error('[usePlaid] Failed to create link token:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSuccess: PlaidLinkOnSuccess = useCallback(async (publicToken, metadata) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[usePlaid] Linking account with public token:', publicToken.substring(0, 20) + '...');
      console.log('[usePlaid] Link metadata:', metadata);

      // Set pending accounts from metadata immediately (before the slow token exchange)
      const institutionName = metadata.institution?.name || 'Bank';
      setPendingAccounts(
        (metadata.accounts || []).map((a: any) => ({
          name: a.name,
          mask: a.mask || '',
          type: a.type || 'depository',
          subtype: a.subtype || '',
          institutionName,
        }))
      );

      const response = await plaidService.linkAccount(publicToken);
      console.log('[usePlaid] Link response accounts:', response.accounts?.map(a => ({
        id: a.id,
        name: a.accountName,
        type: a.accountType,
        subtype: a.accountSubtype,
        plaidId: a.plaidAccountId
      })));
      if (response.accounts) {
        addPlaidAccounts(response.accounts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link account';
      setError(message);
      console.error('Failed to link account:', err);
    } finally {
      setIsLoading(false);
      setPendingAccounts([]);
      setLinkToken(null);
    }
  }, [addPlaidAccounts]);

  const onExit: PlaidLinkOnExit = useCallback((err) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      setError(err.display_message || 'Plaid Link was closed');
    }
    setLinkToken(null);
  }, []);

  // Only initialize Plaid Link when we have a token
  const config: PlaidLinkOptions = {
    token: linkToken || '',
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLinkLib(config);

  // Store the open function in a ref so we can call it after token creation
  useEffect(() => {
    if (ready) {
      openRef.current = open as () => void;
    }
  }, [ready, open]);

  // Combined open: create token then open
  const handleOpen = useCallback(async () => {
    console.log('[usePlaid] Opening Plaid Link...');

    // In demo mode, simulate Plaid linking with a delay
    if (isDemoMode) {
      // Read current accounts directly from store to avoid stale closure
      const currentAccounts = useAppStore.getState().plaidAccounts;
      const existingIds = new Set(currentAccounts.map(a => a.id));
      const allDemo = [...DEMO_PLAID_ACCOUNTS, ...DEMO_EXTRA_ACCOUNTS];
      const remaining = allDemo.filter(a => !existingIds.has(a.id));
      if (remaining.length === 0) return; // All demo accounts already linked

      // Add at most 2 accounts per "link"
      const newAccounts = remaining.slice(0, 2);

      // Show pending skeletons immediately (simulates Plaid metadata)
      setIsLoading(true);
      setPendingAccounts(
        newAccounts.map(a => ({
          name: a.accountName,
          mask: a.mask,
          type: a.accountType,
          subtype: a.accountSubtype || '',
          institutionName: a.institutionName,
        }))
      );

      // Simulate token exchange delay, then add real accounts
      setTimeout(() => {
        addPlaidAccounts(newAccounts);
        setPendingAccounts([]);
        setIsLoading(false);
      }, 3000);
      return;
    }

    // Create a fresh token
    const token = await createLinkToken();
    if (!token) {
      console.error('[usePlaid] Failed to create link token');
      return;
    }

    // Set the token - this will trigger the Plaid Link initialization
    setLinkToken(token);

    // Wait for Plaid Link to become ready, then open
    const checkReady = setInterval(() => {
      if (openRef.current) {
        clearInterval(checkReady);
        console.log('[usePlaid] Plaid Link is ready, opening...');
        openRef.current();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkReady);
      if (!openRef.current) {
        console.error('[usePlaid] Timeout waiting for Plaid Link to be ready');
      }
    }, 5000);
  }, [createLinkToken, isDemoMode]);

  const syncAccount = useCallback(async (accountId: string) => {
    try {
      setIsSyncing(accountId);
      await syncPlaidAccount(accountId);
    } catch (err) {
      console.error('Failed to sync account:', err);
    } finally {
      setIsSyncing(null);
    }
  }, [syncPlaidAccount]);

  const removeAccount = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      await removePlaidAccount(accountId);
    } catch (err) {
      console.error('Failed to remove account:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [removePlaidAccount]);

  return {
    open: handleOpen,
    ready: !!linkToken && ready,
    isLoading,
    error,
    accounts: plaidAccounts,
    pendingAccounts,
    fetchAccounts,
    syncAccount,
    removeAccount,
    isSyncing,
  };
};
