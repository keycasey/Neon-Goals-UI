import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useProjectionStore } from '@/store/useProjectionStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    label?: string;
    amount?: number;
    type?: 'income' | 'expense';
    cadence?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
    category?: string;
  } | null;
}

const CADENCES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
] as const;
type Cadence = (typeof CADENCES)[number]['value'];

export const ManualCashflowDialog: React.FC<Props> = ({ open, onOpenChange, initialValues = null }) => {
  const addManualCashflow = useProjectionStore((s) => s.addManualCashflow);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [cadence, setCadence] = useState<Cadence>('monthly');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setLabel(initialValues?.label ?? '');
    setAmount(initialValues?.amount ? String(initialValues.amount) : '');
    setType(initialValues?.type ?? 'income');
    setCadence(initialValues?.cadence ?? 'monthly');
    setCategory(initialValues?.category ?? '');
    setError('');
  }, [initialValues]);

  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleSave = async () => {
    if (!label.trim()) { setError('Label is required'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid positive amount'); return; }

    setIsSaving(true);
    setError('');
    try {
      await addManualCashflow({
        label: label.trim(),
        amount: amt,
        type,
        cadence,
        category: category.trim() || undefined,
      });
      reset();
      onOpenChange(false);
    } catch {
      setError('Could not save cashflow. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recurring Cashflow</DialogTitle>
          <DialogDescription>
            Add income or expenses not detected from linked accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                type === 'income'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-muted/30 border-border/30 text-muted-foreground'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                type === 'expense'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-muted/30 border-border/30 text-muted-foreground'
              }`}
            >
              Expense
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={type === 'income' ? 'e.g. Side project revenue' : 'e.g. Car insurance'}
              className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Frequency</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as Cadence)}
                className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground"
              >
                {CADENCES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Housing, Food, Utilities"
              className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => { reset(); onOpenChange(false); }}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Add Cashflow'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
