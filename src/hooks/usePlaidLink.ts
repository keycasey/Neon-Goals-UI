import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink as usePlaidLinkLib, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { plaidService, type PlaidAccount } from '@/services/plaidService';

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

export const usePlaid = (): UsePlaidLinkReturn => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Fetch existing linked accounts on mount
  const fetchAccounts = useCallback(async () => {
    try {
      const fetchedAccounts = await plaidService.getAccounts();
      setAccounts(fetchedAccounts);
    } catch (err) {
      console.error('Failed to fetch Plaid accounts:', err);
      // Don't set error for fetch failure - just means no accounts yet
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Create link token when needed
  const createLinkToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await plaidService.createLinkToken();
      setLinkToken(response.linkToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Plaid Link';
      setError(message);
      console.error('Failed to create link token:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSuccess: PlaidLinkOnSuccess = useCallback(async (publicToken, metadata) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await plaidService.linkAccount(publicToken, metadata);
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

  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLinkLib(config);

  // Combined open: create token then open
  const handleOpen = useCallback(async () => {
    if (!linkToken) {
      await createLinkToken();
    }
  }, [linkToken, createLinkToken]);

  // Auto-open when link token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

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
