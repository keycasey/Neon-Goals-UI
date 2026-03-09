import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBillingStore } from '@/store/useBillingStore';
import { PLANS } from '@/types/billing';

export const BillingPlanCards: React.FC = () => {
  const { subscription, createCheckoutSession } = useBillingStore();
  const [loading, setLoading] = useState<'pro' | 'power' | null>(null);

  const handleUpgrade = async (plan: 'pro' | 'power') => {
    setLoading(plan);
    try {
      const url = await createCheckoutSession(plan, 'billing_page_cta');
      window.location.href = url;
    } catch (error) {
      console.error('[BillingPlanCards] Checkout failed:', error);
      setLoading(null);
    }
  };

  const currentPlan = subscription?.plan || 'free';

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {PLANS.map((plan) => {
        const isCurrent = plan.id === currentPlan;
        const canUpgrade = plan.price !== null && plan.id !== currentPlan;

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={canUpgrade ? { scale: 1.02, y: -4 } : {}}
            className={cn(
              'glass-card p-6 rounded-2xl relative',
              isCurrent && 'neon-border ring-2 ring-primary/30',
              plan.id === 'power' && !isCurrent && 'border-secondary/30'
            )}
          >
            {isCurrent && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-neon text-primary-foreground text-xs font-bold">
                Current Plan
              </div>
            )}

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

            {canUpgrade && (
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
            )}

            {isCurrent && plan.id === 'free' && (
              <div className="w-full py-3 text-center rounded-xl bg-muted/30 text-muted-foreground font-medium">
                Current Plan
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
