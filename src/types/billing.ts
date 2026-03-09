// Billing types for subscription system

export type Entitlements = {
  monthlyMessageLimit: number;
  modelsAllowed: string[];
  scrapePriority: 'normal' | 'priority' | 'highest';
  maxEmailAlerts: number;
  maxSmsAlerts: number;
  apiAccess: boolean;
  openClawAccess: boolean;
};

export type Plan = 'free' | 'pro' | 'power';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'free';

export type UpgradeContext =
  | 'chat_limit_reached'
  | 'premium_model_selected'
  | 'priority_scrape_requested'
  | 'email_alert_requested'
  | 'sms_alert_requested'
  | 'api_access_requested'
  | 'billing_page_cta';

export type BillingSubscription = {
  plan: Plan;
  status: SubscriptionStatus;
  renewsAt?: string;
  cancelAtPeriodEnd?: boolean;
};

export type BillingUsage = {
  messagesUsed: number;
  monthlyMessageLimit: number;
  emailAlertsUsed: number;
  smsAlertsUsed: number;
  currentPeriodEnd?: string;
};

export type BillingState = {
  entitlements: Entitlements | null;
  usage: BillingUsage | null;
  subscription: BillingSubscription | null;
  isLoading: boolean;
  upgradeModal: {
    isOpen: boolean;
    context: UpgradeContext | null;
  };
  // Actions
  fetchBilling: () => Promise<void>;
  createCheckoutSession: (targetPlan: 'pro' | 'power', context?: string) => Promise<string>;
  openCustomerPortal: () => Promise<string>;
  openUpgrade: (context: UpgradeContext) => void;
  closeUpgrade: () => void;
};

// Plan definitions for UI
export type PlanDefinition = {
  id: Plan;
  name: string;
  price: number | null; // null = free
  priceLabel: string;
  description: string;
  color: string;
  features: string[];
  entitlements: Partial<Entitlements>;
};

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    priceLabel: '$0 / mo',
    description: 'Get started and explore your goals',
    color: 'text-muted-foreground',
    features: [
      '100 AI messages / month',
      'Standard AI model',
      'Normal scrape queue',
      'Community support',
    ],
    entitlements: {
      monthlyMessageLimit: 100,
      modelsAllowed: ['gpt-standard'],
      scrapePriority: 'normal',
      maxEmailAlerts: 0,
      maxSmsAlerts: 0,
      apiAccess: false,
      openClawAccess: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    priceLabel: '$19 / mo',
    description: 'Serious goal tracking with priority features',
    color: 'text-primary',
    features: [
      '1,000 AI messages / month',
      'Standard + Advanced AI models',
      'Priority scrape queue',
      '20 email alerts',
      '10 SMS alerts',
      'Read + limited write API access',
      'Priority support',
    ],
    entitlements: {
      monthlyMessageLimit: 1000,
      modelsAllowed: ['gpt-standard', 'gpt-advanced'],
      scrapePriority: 'priority',
      maxEmailAlerts: 20,
      maxSmsAlerts: 10,
      apiAccess: true,
      openClawAccess: false,
    },
  },
  {
    id: 'power',
    name: 'Power',
    price: 49,
    priceLabel: '$49 / mo',
    description: 'Maximum performance for power users',
    color: 'text-secondary',
    features: [
      '5,000 AI messages / month',
      'All AI models (including fastest/premium)',
      'Highest priority scrape queue',
      '100 email alerts',
      '50 SMS alerts',
      'Full API quota + OpenClaw access',
      'Priority + fastest response support',
    ],
    entitlements: {
      monthlyMessageLimit: 5000,
      modelsAllowed: ['gpt-standard', 'gpt-advanced', 'gpt-premium'],
      scrapePriority: 'highest',
      maxEmailAlerts: 100,
      maxSmsAlerts: 50,
      apiAccess: true,
      openClawAccess: true,
    },
  },
];

// Feature gate utility - centralized entitlement checks
export function canUseFeature(
  entitlements: Entitlements | null,
  feature: 'premium_model' | 'priority_scrape' | 'sms_alerts' | 'email_alerts' | 'api_access' | 'openclaw_access'
): boolean {
  if (!entitlements) return false;
  switch (feature) {
    case 'premium_model':
      return entitlements.modelsAllowed.length > 1;
    case 'priority_scrape':
      return entitlements.scrapePriority !== 'normal';
    case 'email_alerts':
      return entitlements.maxEmailAlerts > 0;
    case 'sms_alerts':
      return entitlements.maxSmsAlerts > 0;
    case 'api_access':
      return entitlements.apiAccess;
    case 'openclaw_access':
      return entitlements.openClawAccess;
    default:
      return false;
  }
}

export function isMessageLimitReached(usage: BillingUsage | null): boolean {
  if (!usage) return false;
  return usage.messagesUsed >= usage.monthlyMessageLimit;
}

export function getUsagePercent(usage: BillingUsage | null): number {
  if (!usage || usage.monthlyMessageLimit === 0) return 0;
  return Math.min(100, Math.round((usage.messagesUsed / usage.monthlyMessageLimit) * 100));
}
