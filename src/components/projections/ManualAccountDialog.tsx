import React, { useState } from 'react';
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
}

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash / Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'property', label: 'Property' },
  { value: 'other', label: 'Other' },
] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number]['value'];

export const ManualAccountDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const addManualAccount = useProjectionStore((s) => s.addManualAccount);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balance, setBalance] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setType('cash');
    setBalance('');
    setIsDebt(false);
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    const bal = parseFloat(balance);
    if (isNaN(bal)) { setError('Enter a valid balance'); return; }

    setIsSaving(true);
    setError('');
    try {
      await addManualAccount({
        name: name.trim(),
        type,
        balance: bal,
        isDebt,
        currency: 'USD',
      });
      reset();
      onOpenChange(false);
    } catch {
      setError('Could not save account. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Account</DialogTitle>
          <DialogDescription>
            Add accounts not supported by linked banking to improve projection accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Account Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Schwab Brokerage"
              className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Current Balance</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full p-2 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDebt}
              onChange={(e) => setIsDebt(e.target.checked)}
              className="rounded border-border/30"
            />
            <span className="text-xs text-muted-foreground">This is a debt / liability</span>
          </label>

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
            {isSaving ? 'Saving...' : 'Add Account'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
