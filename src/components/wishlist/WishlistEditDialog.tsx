import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWishlistStore } from '@/store/useWishlistStore';
import type { WishlistItem, WishlistPriority, WishlistStage } from '@/types/wishlist';

interface WishlistEditDialogProps {
  item: WishlistItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const editableStages: Array<{ value: WishlistStage; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'saving', label: 'Saving' },
  { value: 'ready', label: 'Ready to buy' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'dropped', label: 'Dropped' },
];

export function WishlistEditDialog({ item, open, onOpenChange }: WishlistEditDialogProps) {
  const updateItem = useWishlistStore((state) => state.updateItem);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('interested');
  const [stage, setStage] = useState<WishlistStage>('idea');
  const [earliestDate, setEarliestDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item || !open) return;
    setTitle(item.title);
    setNotes(item.notes || '');
    setBudget(item.targetBudget == null ? '' : String(item.targetBudget));
    setPriority(item.priority);
    setStage(item.stage);
    setEarliestDate(item.earliestPurchaseDate?.slice(0, 10) || '');
  }, [item, open]);

  const save = async () => {
    if (!item || !title.trim()) return;
    setSaving(true);
    try {
      await updateItem(item.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        targetBudget: budget ? Number(budget) : null,
        priority,
        stage,
        earliestPurchaseDate: earliestDate ? new Date(`${earliestDate}T12:00:00`).toISOString() : null,
      });
      toast.success('Wishlist item updated');
      onOpenChange(false);
    } catch {
      toast.error('Could not update that item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/25 bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit wishlist item</DialogTitle>
          <DialogDescription>Keep the idea useful without turning it into a research project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wishlist-edit-title">What do you want?</Label>
            <Input id="wishlist-edit-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wishlist-edit-notes">Notes</Label>
            <Textarea id="wishlist-edit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={5000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wishlist-edit-budget">Target budget</Label>
              <Input id="wishlist-edit-budget" type="number" min="0" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wishlist-edit-date">Earliest purchase date</Label>
              <Input id="wishlist-edit-date" type="date" value={earliestDate} onChange={(event) => setEarliestDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as WishlistPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="someday">Someday</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="soon">Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={stage} onValueChange={(value) => setStage(value as WishlistStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {item?.stage === 'researching' && <SelectItem value="researching">Researching</SelectItem>}
                  {editableStages.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!title.trim() || saving}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
