import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FinancialAccount {
  id: string;
  institutionName: string;
  institutionIcon?: string;
  institutionImage?: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'retirement';
  currentBalance: number;
  currency?: string;
  lastSync?: Date;
  trend?: number; // percentage change
  isDebt?: boolean; // For credit cards and loans
}

interface FinancialAccountCardProps {
  account: FinancialAccount;
  onSync?: (accountId: string) => void;
  onClick?: (accountId: string) => void;
  compact?: boolean;
}

const accountTypeConfig: Record<string, { label: string; color: string }> = {
  checking: { label: 'Checking', color: 'text-primary' },
  savings: { label: 'Savings', color: 'text-success' },
  credit: { label: 'Credit', color: 'text-warning' },
  investment: { label: 'Investment', color: 'text-accent' },
  loan: { label: 'Loan', color: 'text-destructive' },
  retirement: { label: 'Retirement', color: 'text-info' },
};

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
};

const getDefaultIcon = (institutionName: string): string => {
  const lowerName = institutionName.toLowerCase();
  for (const [key, icon] of Object.entries(defaultIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return '🏦';
};

export const FinancialAccountCard: React.FC<FinancialAccountCardProps> = ({
  account,
  onSync,
  onClick,
  compact = false,
}) => {
  const config = accountTypeConfig[account.accountType] || accountTypeConfig.checking;
  const isNegative = account.isDebt || account.currentBalance < 0;
  const displayBalance = Math.abs(account.currentBalance);
  const currency = account.currency || 'USD';
  const icon = account.institutionIcon || getDefaultIcon(account.institutionName);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => onClick?.(account.id)}
      >
        {/* Institution Icon */}
        {account.institutionImage ? (
          <img 
            src={account.institutionImage} 
            alt={account.institutionName}
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
            {icon}
          </div>
        )}

        {/* Account Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {account.accountName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {account.institutionName}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className={cn(
            "text-sm font-bold",
            isNegative ? "text-destructive" : "neon-text-cyan"
          )}>
            {isNegative ? '-' : ''}${displayBalance.toLocaleString()}
          </p>
          {account.trend !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs justify-end",
              account.trend >= 0 ? "text-success" : "text-destructive"
            )}>
              {account.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {account.trend >= 0 ? '+' : ''}{account.trend.toFixed(1)}%
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4 cursor-pointer group"
      onClick={() => onClick?.(account.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {account.institutionImage ? (
            <img 
              src={account.institutionImage} 
              alt={account.institutionName}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-sunset flex items-center justify-center text-xl">
              {icon}
            </div>
          )}
          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm">
              {account.accountName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {account.institutionName}
            </p>
          </div>
        </div>

        {/* Account Type Badge */}
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50",
          config.color
        )}>
          {config.label}
        </span>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <p className={cn(
          "text-2xl font-heading font-bold",
          isNegative ? "text-destructive" : "neon-text-cyan"
        )}>
          {isNegative ? '-' : ''}${displayBalance.toLocaleString()}
        </p>
        {account.trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium mt-1",
            account.trend >= 0 ? "text-success" : "text-destructive"
          )}>
            {account.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {account.trend >= 0 ? '+' : ''}{account.trend.toFixed(1)}% this month
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/30">
        {account.lastSync && (
          <p className="text-xs text-muted-foreground">
            Synced {new Date(account.lastSync).toLocaleDateString()}
          </p>
        )}
        
        {/* Quick Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSync && (
            <button
              onClick={(e) => { e.stopPropagation(); onSync(account.id); }}
              className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              aria-label="Sync"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="View"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Sample accounts for demo
export const sampleAccounts: FinancialAccount[] = [
  {
    id: 'cap1-checking',
    institutionName: 'Capital One',
    accountName: 'Checking',
    accountType: 'checking',
    currentBalance: 2450.67,
    trend: 5.2,
    lastSync: new Date(),
  },
  {
    id: 'cap1-credit',
    institutionName: 'Capital One',
    accountName: 'Quicksilver Card',
    accountType: 'credit',
    currentBalance: 1234.56,
    isDebt: true,
    trend: -12.3,
    lastSync: new Date(),
  },
  {
    id: 'schwab-checking',
    institutionName: 'Schwab',
    accountName: 'High Yield Checking',
    accountType: 'checking',
    currentBalance: 8920.00,
    trend: 2.1,
    lastSync: new Date(),
  },
  {
    id: 'schwab-roth',
    institutionName: 'Schwab',
    accountName: 'Roth IRA',
    accountType: 'retirement',
    currentBalance: 45670.89,
    trend: 8.7,
    lastSync: new Date(),
  },
  {
    id: 'schwab-traditional',
    institutionName: 'Schwab',
    accountName: 'Traditional IRA',
    accountType: 'retirement',
    currentBalance: 32100.00,
    trend: 7.2,
    lastSync: new Date(),
  },
  {
    id: 'robinhood',
    institutionName: 'Robinhood',
    accountName: 'Individual Brokerage',
    accountType: 'investment',
    currentBalance: 12890.45,
    trend: 15.4,
    lastSync: new Date(),
  },
  {
    id: 'ally-savings',
    institutionName: 'Ally',
    accountName: 'High Yield Savings',
    accountType: 'savings',
    currentBalance: 25000.00,
    trend: 0.4,
    lastSync: new Date(),
  },
  {
    id: 'mohela',
    institutionName: 'MOHELA',
    accountName: 'Student Loans',
    accountType: 'loan',
    currentBalance: 28450.00,
    isDebt: true,
    trend: -2.1,
    lastSync: new Date(),
  },
  {
    id: 'bestbuy-credit',
    institutionName: 'Best Buy',
    accountName: 'Credit Card',
    accountType: 'credit',
    currentBalance: 450.00,
    isDebt: true,
    trend: -45.0,
    lastSync: new Date(),
  },
];
