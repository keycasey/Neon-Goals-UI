import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlaidLink as usePlaidLinkLib, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { plaidService, type PlaidAccount } from '@/services/plaidService';
import { ApiClientError } from '@/services/apiClient';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useProjectionStore } from '@/store/useProjectionStore';

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
  reconnectAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  isSyncing: string | null;
  reconnectRequiredAccounts: Record<string, string>;
}

export const usePlaid = (): UsePlaidLinkReturn => {
  const { plaidAccounts, fetchPlaidAccounts, addPlaidAccounts, removePlaidAccount, syncPlaidAccount } = useFinanceStore();
  const fetchOverview = useProjectionStore((state) => state.fetchOverview);
  const fetchCashflow = useProjectionStore((state) => state.fetchCashflow);
  const fetchGoalForecasts = useProjectionStore((state) => state.fetchGoalForecasts);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [pendingAccounts, setPendingAccounts] = useState<PendingPlaidAccount[]>([]);
  const [reconnectRequiredAccounts, setReconnectRequiredAccounts] = useState<Record<string, string>>({});
  const openRef = useRef<(() => void) | null>(null);
  const reconnectingAccountIdRef = useRef<string | null>(null);

  // Fetch existing linked accounts on mount
  const fetchAccounts = useCallback(async () => {
    await fetchPlaidAccounts();
  }, [fetchPlaidAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const clearReconnectRequirement = useCallback((accountIds: string[]) => {
    if (accountIds.length === 0) return;
    setReconnectRequiredAccounts((current) => {
      const next = { ...current };
      for (const id of accountIds) {
        delete next[id];
      }
      return next;
    });
  }, []);

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
        (metadata.accounts || []).map((a) => ({
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
        clearReconnectRequirement([
          ...response.accounts.map((account) => account.id),
          ...(reconnectingAccountIdRef.current ? [reconnectingAccountIdRef.current] : []),
        ]);
        reconnectingAccountIdRef.current = null;
        await Promise.all([
          fetchOverview(),
          fetchCashflow(),
          fetchGoalForecasts(),
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link account';
      setError(message);
      console.error('Failed to link account:', err);
    } finally {
      setIsLoading(false);
      setPendingAccounts([]);
      setLinkToken(null);
      openRef.current = null;
    }
  }, [addPlaidAccounts, clearReconnectRequirement, fetchOverview, fetchCashflow, fetchGoalForecasts]);

  const onExit: PlaidLinkOnExit = useCallback((err) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      setError(err.display_message || 'Plaid Link was closed');
    }
    setLinkToken(null);
    openRef.current = null;
  }, []);

  const openWithToken = useCallback((token: string) => {
    openRef.current = null;
    setLinkToken(token);

    const checkReady = setInterval(() => {
      if (openRef.current) {
        clearInterval(checkReady);
        console.log('[usePlaid] Plaid Link is ready, opening...');
        openRef.current();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkReady);
      if (!openRef.current) {
        console.error('[usePlaid] Timeout waiting for Plaid Link to be ready');
      }
    }, 5000);
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

    // Create a fresh token
    const token = await createLinkToken();
    if (!token) {
      console.error('[usePlaid] Failed to create link token');
      return;
    }

    // Set the token - this will trigger the Plaid Link initialization
    openWithToken(token);
  }, [createLinkToken, openWithToken]);

  const reconnectAccount = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      reconnectingAccountIdRef.current = accountId;
      const response = await plaidService.createReconnectLinkToken(accountId, 'investments');
      openWithToken(response.link_token);
    } catch (err) {
      reconnectingAccountIdRef.current = null;
      const message = err instanceof Error ? err.message : 'Failed to reconnect account';
      setError(message);
      console.error('[usePlaid] Failed to create reconnect link token:', err);
    } finally {
      setIsLoading(false);
    }
  }, [openWithToken]);

  const syncAccount = useCallback(async (accountId: string) => {
    try {
      setIsSyncing(accountId);
      await syncPlaidAccount(accountId);
      clearReconnectRequirement([accountId]);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'PLAID_INVESTMENTS_CONSENT_REQUIRED') {
        setReconnectRequiredAccounts((current) => ({
          ...current,
          [accountId]: err.message,
        }));
      }
      console.error('Failed to sync account:', err);
      throw err;
    } finally {
      setIsSyncing(null);
    }
  }, [clearReconnectRequirement, syncPlaidAccount]);

  const removeAccount = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      await removePlaidAccount(accountId);
      clearReconnectRequirement([accountId]);
    } catch (err) {
      console.error('Failed to remove account:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearReconnectRequirement, removePlaidAccount]);

  return {
    open: handleOpen,
    ready: !!linkToken && ready,
    isLoading,
    error,
    accounts: plaidAccounts,
    pendingAccounts,
    fetchAccounts,
    syncAccount,
    reconnectAccount,
    removeAccount,
    isSyncing,
    reconnectRequiredAccounts,
  };
};
