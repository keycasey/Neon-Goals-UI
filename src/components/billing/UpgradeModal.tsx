import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBillingStore } from '@/store/useBillingStore';
import { PLANS } from '@/types/billing';
import type { UpgradeContext } from '@/types/billing';

const CONTEXT_COPY: Record<UpgradeContext, { title: string; description: string }> = {
  chat_limit_reached: {
    title: 'Message Limit Reached',
    description: 'Upgrade to Pro or Power to continue chatting with AI assistants this month.',
  },
  premium_model_selected: {
    title: 'Premium Model Access',
    description: 'Advanced AI models are available on Pro and Power plans.',
  },
  priority_scrape_requested: {
    title: 'Priority Scanning',
    description: 'Get faster product search results with priority queue access.',
  },
  email_alert_requested: {
    title: 'Email Alerts',
    description: 'Get instant email notifications when prices drop or listings change.',
  },
  sms_alert_requested: {
    title: 'SMS Alerts',
    description: 'Get text message alerts for urgent price changes.',
  },
  api_access_requested: {
    title: 'API Access',
    description: 'Build integrations and automate your goal tracking workflow.',
  },
  billing_page_cta: {
    title: 'Upgrade Your Plan',
    description: 'Unlock powerful features to supercharge your goals.',
  },
};

export const UpgradeModal: React.FC = () => {
  const { upgradeModal, closeUpgrade, createCheckoutSession } = useBillingStore();
  const [loading, setLoading] = useState<'pro' | 'power' | null>(null);

  const handleUpgrade = async (plan: 'pro' | 'power') => {
    setLoading(plan);
    try {
      const url = await createCheckoutSession(plan, upgradeModal.context || undefined);
      window.location.href = url;
    } catch (error) {
      console.error('[UpgradeModal] Checkout failed:', error);
      setLoading(null);
    }
  };

  const copy = upgradeModal.context ? CONTEXT_COPY[upgradeModal.context] : CONTEXT_COPY.billing_page_cta;
  const paidPlans = PLANS.filter((p) => p.id !== 'free');

  return (
    <AnimatePresence>
      {upgradeModal.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            onClick={closeUpgrade}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] z-[101] overflow-y-auto scrollbar-neon"
          >
            <div className="glass-card border border-border/50 p-6 md:p-8 relative">
              {/* Close Button */}
              <button
                onClick={closeUpgrade}
                className="absolute top-4 right-4 p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-8 pr-12">
                <h2 className="font-heading text-3xl font-bold gradient-text mb-2">{copy.title}</h2>
                <p className="text-muted-foreground">{copy.description}</p>
              </div>

              {/* Plan Cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {paidPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={cn(
                      'glass-card p-6 rounded-2xl neon-border',
                      plan.id === 'power' && 'border-secondary/50'
                    )}
                  >
                    <div className="mb-4">
                      <h3 className={cn('font-heading text-2xl font-bold mb-1', plan.color)}>{plan.name}</h3>
                      <p className="text-4xl font-heading font-bold neon-text-cyan mb-1">{plan.priceLabel}</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.id as 'pro' | 'power')}
                      disabled={loading !== null}
                      className={cn(
                        'w-full py-3 rounded-xl font-semibold transition-all',
                        plan.id === 'pro' &&
                          'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:scale-105 neon-glow-cyan',
                        plan.id === 'power' &&
                          'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground hover:scale-105 neon-glow-magenta',
                        loading !== null && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Continue on Free */}
              <div className="text-center pt-4 border-t border-border/30">
                <button
                  onClick={closeUpgrade}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Continue on Free
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
