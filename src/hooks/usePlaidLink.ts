import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlaidLink as usePlaidLinkLib, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { plaidService, type PlaidAccount } from '@/services/plaidService';
import { useAppStore } from '@/store/useAppStore';

interface UsePlaidLinkReturn {
  open: () => void;
  ready: boolean;
  isLoading: boolean;
  error: string | null;
  accounts: PlaidAccount[];
  fetchAccounts: () => Promise<void>;
  syncAccount: (accountId: string) => Promise<void>;
  isSyncing: string | null;
}

// Demo Plaid accounts for demonstration
const DEMO_PLAID_ACCOUNTS: PlaidAccount[] = [
  {
    id: 'demo-checking-1',
    plaidAccountId: 'demo-plaid-checking-1',
    accountName: 'Demo Checking Account',
    accountType: 'checking',
    accountSubtype: 'checking',
    currentBalance: 5000,
    currency: 'USD',
    mask: '1234',
    institutionName: 'Demo Bank',
  },
  {
    id: 'demo-savings-1',
    plaidAccountId: 'demo-plaid-savings-1',
    accountName: 'Demo Savings Account',
    accountType: 'savings',
    accountSubtype: 'savings',
    currentBalance: 25000,
    currency: 'USD',
    mask: '5678',
    institutionName: 'Demo Bank',
  },
];

export const usePlaid = (): UsePlaidLinkReturn => {
  const { isDemoMode } = useAppStore();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const openRef = useRef<(() => void) | null>(null);

  // Fetch existing linked accounts on mount
  const fetchAccounts = useCallback(async () => {
    // Skip API call in demo mode, use demo data
    if (isDemoMode) {
      setAccounts(DEMO_PLAID_ACCOUNTS);
      return;
    }

    try {
      const fetchedAccounts = await plaidService.getAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      // Silently ignore errors - just means no accounts linked
      setAccounts([]);
    }
  }, [isDemoMode]);

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
      const response = await plaidService.linkAccount(publicToken);
      if (response.accounts) {
        setAccounts(prev => [...prev, ...response.accounts]);
      }
      // Refresh all accounts after linking
      await fetchAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link account';
      setError(message);
      console.error('Failed to link account:', err);
    } finally {
      setIsLoading(false);
      setLinkToken(null);
    }
  }, [fetchAccounts]);

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

    // In demo mode, just show an alert
    if (isDemoMode) {
      alert('Demo mode: Plaid Link is not available. Demo accounts are already shown.');
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
      await plaidService.syncAccount(accountId);
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to sync account:', err);
    } finally {
      setIsSyncing(null);
    }
  }, [fetchAccounts]);

  return {
    open: handleOpen,
    ready: !!linkToken && ready,
    isLoading,
    error,
    accounts,
    fetchAccounts,
    syncAccount,
    isSyncing,
  };
};
