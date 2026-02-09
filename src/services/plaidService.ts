import { apiClient } from './apiClient';

export interface PlaidAccount {
  id: string;
  plaidAccountId: string;
  institutionName: string;
  institutionId?: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'retirement' | 'depository' | 'brokerage' | 'other';
  accountSubtype?: string;
  currentBalance: number;
  availableBalance?: number;
  currency: string;
  lastSync?: string;
  isDebt?: boolean;
  mask?: string; // last 4 digits
}

export interface PlaidTransaction {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  date: string;
  category?: string[];
  pending: boolean;
  merchantName?: string;
  paymentChannel?: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    lat?: number;
    lon?: number;
  };
  checkNumber?: string;
}

export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface LinkAccountResponse {
  success: boolean;
  accounts: PlaidAccount[];
}

export const plaidService = {
  /** Create a link token for Plaid Link */
  async createLinkToken(): Promise<LinkTokenResponse> {
    return apiClient.post<LinkTokenResponse>('/plaid/create-link-token');
  },

  /** Exchange public token and save accounts */
  async linkAccount(publicToken: string): Promise<LinkAccountResponse> {
    return apiClient.post<LinkAccountResponse>('/plaid/link-account', {
      publicToken,
    });
  },

  /** Get all linked accounts */
  async getAccounts(): Promise<PlaidAccount[]> {
    const response = await apiClient.get<{ accounts: PlaidAccount[] } | PlaidAccount[]>('/plaid/accounts');
    return Array.isArray(response) ? response : response.accounts || [];
  },

  /** Sync balance for an account */
  async syncAccount(accountId: string): Promise<PlaidAccount> {
    return apiClient.post<PlaidAccount>(`/plaid/sync/${accountId}`);
  },

  /** Link an account to a finance goal */
  async linkToGoal(accountId: string, goalId: string): Promise<void> {
    return apiClient.post('/plaid/link-to-goal', { accountId, goalId });
  },

  /** Get fresh balance from Plaid */
  async getBalance(accountId: string): Promise<{ balance: number; available?: number }> {
    return apiClient.get(`/plaid/accounts/${accountId}/balance`);
  },

  /** Get transactions for an account */
  async getTransactions(accountId: string): Promise<PlaidTransaction[]> {
    const response = await apiClient.get<{ transactions: PlaidTransaction[] } | PlaidTransaction[]>(
      `/plaid/accounts/${accountId}/transactions`
    );
    return Array.isArray(response) ? response : response.transactions || [];
  },
};
