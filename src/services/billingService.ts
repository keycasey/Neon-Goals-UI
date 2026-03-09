import { apiClient } from './apiClient';
import type { Entitlements, BillingUsage, BillingSubscription } from '@/types/billing';

export type BillingEntitlementsResponse = {
  plan: string;
  subscriptionStatus: string;
  entitlements: Entitlements;
  usage: {
    messagesUsed: number;
    emailAlertsUsed: number;
    smsAlertsUsed: number;
    currentPeriodEnd?: string;
  };
};

export const billingService = {
  async getEntitlements(): Promise<BillingEntitlementsResponse> {
    return apiClient.get<BillingEntitlementsResponse>('/billing/entitlements');
  },

  async getSubscription(): Promise<BillingSubscription> {
    return apiClient.get<BillingSubscription>('/billing/subscription');
  },

  async getUsage(): Promise<BillingUsage> {
    return apiClient.get<BillingUsage>('/billing/usage');
  },

  async createCheckoutSession(plan: 'pro' | 'power', context?: string): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>('/billing/checkout-session', {
      plan,
      context,
      successUrl: `${window.location.origin}?checkout=success`,
      cancelUrl: window.location.href,
    });
  },

  async createCustomerPortalSession(): Promise<{ url: string }> {
    return apiClient.post<{ url: string }>('/billing/customer-portal-session', {
      returnUrl: window.location.href,
    });
  },
};
