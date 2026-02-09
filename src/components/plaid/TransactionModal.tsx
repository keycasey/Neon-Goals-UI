import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CreditCard, Clock, Tag, Building2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlaidAccount, PlaidTransaction } from '@/services/plaidService';
import { plaidService } from '@/services/plaidService';

interface TransactionModalProps {
  account: PlaidAccount;
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [balance, setBalance] = useState<{ balance: number; available?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account.id) {
      fetchData();
    }
  }, [isOpen, account.id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txns, bal] = await Promise.all([
        plaidService.getTransactions(account.id).catch(() => []),
        plaidService.getBalance(account.id).catch(() => null),
      ]);
      setTransactions(txns);
      setBalance(bal);
    } catch (err) {
      setError('Could not load account data');
    } finally {
      setIsLoading(false);
    }
  };

  const isDebt = account.isDebt || ['credit', 'loan'].includes(account.accountType);

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
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto scrollbar-neon p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-medium text-foreground text-sm">
                  Recent Transactions
                </h3>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                </button>
              </div>

              {isLoading && transactions.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shimmer h-16 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions load from your connected bank
                  </p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions will appear after syncing
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((txn, idx) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-colors"
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
                            {txn.category && txn.category.length > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {txn.category[0]}
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
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn(
                            "text-sm font-bold",
                            txn.amount > 0 ? "text-destructive" : "neon-text-cyan"
                          )}>
                            {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {txn.pending && (
                            <span className="badge-warning text-[10px] mt-1 inline-flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
