import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CreditCard, Clock, Tag, Building2, AlertCircle, RefreshCw, Trash2, TimerReset } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PlaidAccount,
  PlaidInvestmentSnapshot,
  PlaidInvestmentTransaction,
  PlaidTransaction,
} from '@/services/plaidService';
import type { RecurringItem } from '@/types/projections';
import { plaidService } from '@/services/plaidService';

interface TransactionModalProps {
  account: PlaidAccount;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (accountId: string) => Promise<void>;
  highlightTransactionIds?: string[];
  highlightedItemLabel?: string;
  highlightedItemDirection?: 'income' | 'expense';
  mergedSources?: NonNullable<RecurringItem['mergedSources']>;
  onUnmergeRecurringSource?: (sourceItemId: string) => void;
  onAddManualCashflow?: (prefill: {
    label: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
  }) => void;
}

const channelLabels: Record<string, string> = {
  online: 'Online',
  in_store: 'In Store',
  'in store': 'In Store',
  other: 'Other',
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  account,
  isOpen,
  onClose,
  onDelete,
  highlightTransactionIds,
  highlightedItemLabel,
  highlightedItemDirection,
  mergedSources,
  onUnmergeRecurringSource,
  onAddManualCashflow,
}) => {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [investmentData, setInvestmentData] = useState<PlaidInvestmentSnapshot | null>(null);
  const [balance, setBalance] = useState<{ balance: number; available?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const highlightedIds = new Set(highlightTransactionIds ?? []);
  const isDrilldownView = Boolean(highlightedItemDirection && highlightedIds.size > 0);
  const isInvestmentAccount =
    account.accountType.toLowerCase() === 'investment' ||
    account.accountType.toLowerCase() === 'brokerage';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailResult, balanceResult] = await Promise.allSettled([
        isInvestmentAccount
          ? plaidService.getStoredInvestments(account.id)
          : plaidService.getStoredTransactions(account.id),
        plaidService.getBalance(account.id),
      ]);

      if (detailResult.status === 'fulfilled') {
        if (isInvestmentAccount) {
          setInvestmentData(detailResult.value as PlaidInvestmentSnapshot);
          setTransactions([]);
        } else {
          setTransactions(detailResult.value as PlaidTransaction[]);
          setInvestmentData(null);
        }
      } else {
        setTransactions([]);
        setInvestmentData(null);
        setError(isInvestmentAccount ? 'Could not load brokerage data' : 'Could not load transaction history');
      }

      if (balanceResult.status === 'fulfilled') {
        setBalance(balanceResult.value);
      } else {
        setBalance(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [account.id, isInvestmentAccount]);

  useEffect(() => {
    if (isOpen && account.id) {
      void fetchData();
    }
    // Reset delete confirmation when modal closes
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  }, [isOpen, account.id, fetchData]);

  const isDebt = account.isDebt || ['credit', 'loan'].includes(account.accountType.toLowerCase()) ||
    ['credit_card', 'auto', 'mortgage', 'student', 'loan'].includes(account.accountSubtype?.toLowerCase() || '');
  const visibleTransactions = isDrilldownView
    ? transactions.filter((transaction) => highlightedIds.has(transaction.id))
    : transactions;
  const transactionsHeading = isDrilldownView
    ? highlightedItemDirection === 'income'
      ? 'Recent Income'
      : 'Recent Expenses'
    : 'Recent Transactions';
  const visibleInvestmentTransactions = investmentData?.transactions ?? [];
  const holdings = investmentData?.holdings ?? [];

  const renderInvestmentTransaction = (txn: PlaidInvestmentTransaction, idx: number) => {
    const currentPrice = txn.currentPrice ?? null;
    const txnPrice = txn.price ?? null;
    const priceChange =
      currentPrice !== null && txnPrice !== null ? currentPrice - txnPrice : null;

    return (
      <motion.div
        key={txn.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="p-3 rounded-xl border bg-muted/20 border-border/20 hover:bg-muted/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {txn.tickerSymbol ? `${txn.tickerSymbol} • ${txn.name}` : txn.name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(txn.date).toLocaleDateString()}
              </span>
              {txn.type && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {txn.type}
                </span>
              )}
              {txn.quantity != null && (
                <span className="text-xs text-muted-foreground">
                  {txn.quantity.toLocaleString()} shares
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {txn.price != null && <span>Trade price ${txn.price.toFixed(2)}</span>}
              {currentPrice != null && <span>Current ${currentPrice.toFixed(2)}</span>}
              {priceChange != null && (
                <span className={priceChange >= 0 ? 'text-success' : 'text-destructive'}>
                  Since trade {priceChange >= 0 ? '+' : '-'}${Math.abs(priceChange).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-foreground">
              ${Math.abs(txn.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {txn.fees != null && (
              <span className="text-[10px] text-muted-foreground">
                Fees ${txn.fees.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg max-h-[80vh] glass-card neon-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-semibold text-foreground">
                      {account.accountName}
                      {account.mask && (
                        <span className="text-muted-foreground font-normal"> ••{account.mask}</span>
                      )}
                    </h2>
                    <p className="text-xs text-muted-foreground">{account.institutionName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onDelete && !showDeleteConfirm && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete account"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
                  >
                    <p className="text-sm text-foreground mb-3">
                      Remove this account from your overview?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 py-2 px-3 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await onDelete(account.id);
                            onClose();
                          } catch (err) {
                            console.error('Failed to delete account:', err);
                          } finally {
                            setIsDeleting(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 py-2 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          'Remove Account'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Balance Summary */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
                  <p className={cn(
                    "text-lg font-heading font-bold",
                    isDebt ? "text-destructive" : "neon-text-cyan"
                  )}>
                    {isDebt ? '-' : ''}${Math.abs(balance?.balance ?? account.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {balance?.available !== undefined && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">Available</p>
                    <p className="text-lg font-heading font-bold text-foreground">
                      ${balance.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Transactions / Holdings */}
            <div className="flex-1 overflow-y-auto scrollbar-neon p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading font-medium text-foreground text-sm">
                    {isInvestmentAccount ? 'Brokerage Data' : transactionsHeading}
                  </h3>
                  {!isInvestmentAccount && highlightedItemLabel && highlightedIds.size > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Highlighting {highlightedItemDirection === 'income' ? 'income' : 'expense'} rows used for {highlightedItemLabel}
                    </p>
                  )}
                  {!isInvestmentAccount && mergedSources && mergedSources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {mergedSources.map((source) => (
                        <span
                          key={source.id}
                          className="inline-flex items-center gap-1 rounded-full border border-border/30 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground"
                        >
                          {source.label}
                          <button
                            type="button"
                            aria-label={`Remove merged source ${source.label}`}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => onUnmergeRecurringSource?.(source.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                </button>
              </div>

              {isLoading && transactions.length === 0 && !investmentData ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shimmer h-16 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  {!isInvestmentAccount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      The projection was computed earlier, but this follow-up fetch for the account failed
                    </p>
                  )}
                </div>
              ) : isInvestmentAccount ? (
                holdings.length === 0 && visibleInvestmentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No brokerage holdings or trade history are available yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reconnect this brokerage account to grant investments access, then refresh the account card
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                        Holdings
                      </h4>
                      <div className="space-y-2">
                        {holdings.map((holding) => (
                          <div
                            key={holding.id}
                            className="p-3 rounded-xl border bg-muted/20 border-border/20"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {holding.tickerSymbol
                                    ? `${holding.tickerSymbol} • ${holding.name}`
                                    : holding.name}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span>{holding.quantity.toLocaleString()} shares</span>
                                  {holding.institutionPrice != null && (
                                    <span>${holding.institutionPrice.toFixed(2)} current price</span>
                                  )}
                                  {holding.costBasis != null && (
                                    <span>${holding.costBasis.toFixed(2)} cost basis</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold neon-text-cyan">
                                  ${Math.abs(holding.institutionValue ?? 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                                {holding.currentPriceAsOf && (
                                  <p className="text-[10px] text-muted-foreground">
                                    As of {new Date(holding.currentPriceAsOf).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                        Recent Activity
                      </h4>
                      <div className="space-y-2">
                        {visibleInvestmentTransactions.map(renderInvestmentTransaction)}
                      </div>
                    </div>
                  </div>
                )
              ) : visibleTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isDrilldownView ? 'No matching transactions found for this projection item' : 'No stored transactions'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isDrilldownView
                      ? 'Refresh the account card to resync this account if the projection rows look stale'
                      : 'Refresh the account card to sync transactions into projections'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleTransactions.map((txn, idx) => {
                    const isHighlighted = highlightedIds.has(txn.id);
                    const categoryLabel = Array.isArray(txn.category)
                      ? txn.category[0]
                      : txn.category || txn.categories?.[0];

                    return (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        "p-3 rounded-xl border transition-colors",
                        isHighlighted
                          ? "bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(244,114,182,0.12))] border-primary/40 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_30px_rgba(34,211,238,0.12)]"
                          : "bg-muted/20 border-border/20 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {txn.merchantName || txn.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(txn.date).toLocaleDateString()}
                            </span>
                            {categoryLabel && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {categoryLabel}
                              </span>
                            )}
                            {txn.paymentChannel && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {channelLabels[txn.paymentChannel] || txn.paymentChannel}
                              </span>
                            )}
                          </div>
                          {txn.location && (txn.location.address || txn.location.city) && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {[txn.location.address, txn.location.city, txn.location.region].filter(Boolean).join(', ')}
                            </p>
                          )}
                          <button
                            type="button"
                            aria-label={`Add recurring from ${txn.merchantName || txn.name}`}
                            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border/30 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                            onClick={() => onAddManualCashflow?.({
                              label: txn.merchantName || txn.name,
                              amount: Math.abs(txn.amount),
                              type: txn.amount < 0 ? 'income' : 'expense',
                              category: categoryLabel,
                            })}
                          >
                            <TimerReset className="w-3 h-3" />
                            Make recurring
                          </button>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn(
                            "text-sm font-bold",
                            txn.amount < 0 || (isHighlighted && highlightedItemDirection === 'income')
                              ? "text-success"
                              : txn.amount > 0 || (isHighlighted && highlightedItemDirection === 'expense')
                                ? "text-destructive"
                                : "text-foreground"
                          )}>
                            {txn.amount < 0 ? '+' : txn.amount > 0 ? '-' : ''}
                            ${Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {isHighlighted && (
                            <span className="mt-1 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Used in projection
                            </span>
                          )}
                          {txn.pending && (
                            <span className="badge-warning text-[10px] mt-1 inline-flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
