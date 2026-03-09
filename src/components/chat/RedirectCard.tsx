import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedRedirect } from '@/lib/redirectParser';

interface RedirectCardProps {
  redirect: ParsedRedirect;
  onGo: () => void;
  onStay: () => void;
  disabled?: boolean;
}

export const RedirectCard: React.FC<RedirectCardProps> = ({ redirect, onGo, onStay, disabled = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <p className="text-xs text-muted-foreground mt-1">Redirect dismissed</p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4 max-w-[85%]"
    >
      <p className="text-sm text-foreground mb-3">
        {redirect.message}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!disabled) onGo();
          }}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            disabled
              ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
              : "bg-gradient-neon text-primary-foreground neon-glow-cyan hover:scale-[1.02]"
          )}
        >
          <ArrowRight className="w-4 h-4" />
          Go to {redirect.label}
        </button>

        <button
          onClick={() => {
            setDismissed(true);
            onStay();
          }}
          disabled={disabled}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            disabled
              ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
              : "bg-muted text-foreground hover:bg-muted/70"
          )}
        >
          Stay here
        </button>
      </div>
    </motion.div>
  );
};
