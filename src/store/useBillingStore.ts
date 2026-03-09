import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BillingState, BillingUsage, UpgradeContext, Plan } from '@/types/billing';
import { billingService } from '@/services/billingService';

// Free plan defaults for offline / unauthenticated state
const FREE_ENTITLEMENTS = {
  monthlyMessageLimit: 100,
  modelsAllowed: ['gpt-standard'],
  scrapePriority: 'normal' as const,
  maxEmailAlerts: 0,
  maxSmsAlerts: 0,
  apiAccess: false,
  openClawAccess: false,
};

const FREE_USAGE: BillingUsage = {
  messagesUsed: 0,
  monthlyMessageLimit: 100,
  emailAlertsUsed: 0,
  smsAlertsUsed: 0,
};

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      entitlements: FREE_ENTITLEMENTS,
      usage: FREE_USAGE,
      subscription: {
        plan: 'free',
        status: 'free',
      },
      isLoading: false,
      upgradeModal: {
        isOpen: false,
        context: null,
      },

      fetchBilling: async () => {
        set({ isLoading: true });
        try {
          const data = await billingService.getEntitlements();
          const plan = (data.plan || 'free') as Plan;
          set({
            entitlements: data.entitlements,
            usage: {
              messagesUsed: data.usage.messagesUsed,
              monthlyMessageLimit: data.entitlements.monthlyMessageLimit,
              emailAlertsUsed: data.usage.emailAlertsUsed,
              smsAlertsUsed: data.usage.smsAlertsUsed,
              currentPeriodEnd: data.usage.currentPeriodEnd,
            },
            subscription: {
              plan,
              status: (data.subscriptionStatus as any) || 'free',
            },
            isLoading: false,
          });
        } catch (error) {
          console.warn('[BillingStore] Failed to fetch billing — using cached/free defaults:', error);
          // Fail open: keep cached entitlements, just stop loading
          set({ isLoading: false });
        }
      },

      createCheckoutSession: async (targetPlan: 'pro' | 'power', context?: string): Promise<string> => {
        const response = await billingService.createCheckoutSession(targetPlan, context);
        return response.url;
      },

      openCustomerPortal: async (): Promise<string> => {
        const response = await billingService.createCustomerPortalSession();
        return response.url;
      },

      openUpgrade: (context: UpgradeContext) => {
        set({ upgradeModal: { isOpen: true, context } });
      },

      closeUpgrade: () => {
        set({ upgradeModal: { isOpen: false, context: null } });
      },
    }),
    {
      name: 'billing-store',
      // Only persist the cached entitlements/subscription (not modal state)
      partialize: (state) => ({
        entitlements: state.entitlements,
        usage: state.usage,
        subscription: state.subscription,
      }),
    }
  )
);
