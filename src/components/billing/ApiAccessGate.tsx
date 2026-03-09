import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Code, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBillingStore } from '@/store/useBillingStore';
import { canUseFeature } from '@/types/billing';

export const ApiAccessGate: React.FC = () => {
  const { entitlements, openUpgrade } = useBillingStore();
  const hasApiAccess = canUseFeature(entitlements, 'api_access');
  const hasOpenClawAccess = canUseFeature(entitlements, 'openclaw_access');

  if (!hasApiAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-2xl font-bold text-foreground mb-2">API Access Locked</h3>
        <p className="text-muted-foreground mb-6">
          Upgrade to Pro or Power to unlock API access and integrate Neon Goals with your own tools and automation.
        </p>
        <button
          onClick={() => openUpgrade('api_access_requested')}
          className="px-6 py-3 rounded-xl bg-gradient-neon text-primary-foreground font-semibold hover:scale-105 transition-all neon-glow-cyan"
        >
          Upgrade to Unlock
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Code className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">API Key</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use your API key to integrate Neon Goals with external tools and automation workflows.
        </p>
        <button className="w-full py-2 rounded-lg bg-muted/50 text-foreground font-medium hover:bg-muted transition-colors">
          Generate API Key
        </button>
      </motion.div>

      {hasOpenClawAccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl neon-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Zap className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">OpenClaw Access</h3>
            <span className="badge-accent ml-auto">Power</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect OpenClaw agents to your Neon Goals for advanced automation and goal management.
          </p>
          <button className="w-full py-2 rounded-lg bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground font-medium hover:scale-105 transition-all">
            Configure OpenClaw
          </button>
        </motion.div>
      )}
    </div>
  );
};
