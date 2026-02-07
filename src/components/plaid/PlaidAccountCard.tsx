import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaidAccount } from '@/services/plaidService';

interface PlaidAccountCardProps {
  account: PlaidAccount;
  onSync?: (accountId: string) => void;
  onClick?: (accountId: string) => void;
  isSyncing?: boolean;
}

// Default institution icons by name
const defaultIcons: Record<string, string> = {
  'capital one': '🏦',
  'schwab': '📊',
  'robinhood': '🪶',
  'ally': '🏠',
  'mohela': '🎓',
  'best buy': '🛒',
  'chase': '🔵',
  'bank of america': '🔴',
  'wells fargo': '🟡',
  'fidelity': '💚',
  'vanguard': '🚢',
  'td ameritrade': '📈',
  'coinbase': '🪙',
  'paypal': '💳',
  'venmo': '💸',
};

const getDefaultIcon = (institutionName: string): string => {
  const lowerName = institutionName.toLowerCase();
  for (const [key, icon] of Object.entries(defaultIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return '🏦';
};

const isDebtType = (type: string): boolean => {
  return ['credit', 'loan'].includes(type);
};

export const PlaidAccountCard: React.FC<PlaidAccountCardProps> = ({
  account,
  onSync,
  onClick,
  isSyncing = false,
}) => {
  const isDebt = account.isDebt || isDebtType(account.accountType);
  const displayBalance = Math.abs(account.currentBalance);
  const icon = getDefaultIcon(account.institutionName);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => onClick?.(account.id)}
    >
      {/* Institution Icon */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
        {icon}
      </div>

      {/* Account Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {account.accountName}
          {account.mask && <span className="text-muted-foreground"> ••{account.mask}</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {account.institutionName}
        </p>
      </div>

      {/* Sync Button */}
      {onSync && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSync(account.id);
          }}
          disabled={isSyncing}
          className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          aria-label="Sync account"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
        </button>
      )}

      {/* Balance */}
      <div className="text-right">
        <p className={cn(
          "text-sm font-bold",
          isDebt ? "text-destructive" : "neon-text-cyan"
        )}>
          {isDebt ? '-' : ''}${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </motion.div>
  );
};
