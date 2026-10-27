import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDollarSign, Lightbulb, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWishlistStore } from '@/store/useWishlistStore';
import type { WishlistPriority, WishlistStage } from '@/types/wishlist';
import { cn } from '@/lib/utils';

const stages: Array<{ value: WishlistStage; label: string }> = [
  { value: 'idea', label: 'Idea' },
  { value: 'researching', label: 'Researching' },
  { value: 'saving', label: 'Saving' },
  { value: 'ready', label: 'Ready to buy' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'dropped', label: 'Dropped' },
];

const priorityStyles: Record<WishlistPriority, string> = {
  someday: 'border-border text-muted-foreground',
  interested: 'border-primary/40 text-primary bg-primary/5',
  soon: 'border-accent/50 text-accent bg-accent/10',
};

export function WishlistView() {
  const { items, isLoading, createItem, updateItem, removeItem } = useWishlistStore();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [priority, setPriority] = useState<WishlistPriority>('interested');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeItems = items.filter((item) => !['purchased', 'dropped'].includes(item.stage));
  const resolvedItems = items.filter((item) => ['purchased', 'dropped'].includes(item.stage));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createItem({
        title: title.trim(),
        notes: notes.trim() || undefined,
        targetBudget: budget ? Number(budget) : undefined,
        priority,
      });
      setTitle('');
      setNotes('');
      setBudget('');
      setPriority('interested');
      toast.success('Added to your wishlist');
    } catch {
      toast.error('Could not save that wishlist item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-5 lg:p-6">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mb-5 flex items-start gap-3">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Capture it before you commit</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              One line is enough. Product research stays asleep until you decide the idea deserves it.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="relative grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_150px_auto]">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you want? e.g. a bidet"
            maxLength={200}
            className="h-11 bg-background/70"
            aria-label="Wishlist item"
          />
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
            maxLength={5000}
            className="min-h-11 resize-none bg-background/70 lg:h-11"
            aria-label="Wishlist notes"
          />
          <div className="relative">
            <CircleDollarSign className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="Budget"
              className="h-11 bg-background/70 pl-9"
              aria-label="Target budget"
            />
          </div>
          <Select value={priority} onValueChange={(value) => setPriority(value as WishlistPriority)}>
            <SelectTrigger className="h-11 bg-background/70" aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="someday">Someday</SelectItem>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="soon">Soon</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!title.trim() || isSubmitting} className="h-11 gap-2 shadow-[0_0_24px_hsl(var(--primary)/0.2)]">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold">Considering</h3>
          <span className="text-sm text-muted-foreground">{activeItems.length} ideas</span>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-muted-foreground">Loading your wishlist…</div>
        ) : activeItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
            <p className="font-medium text-foreground">Your sticky notes can retire now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Add the first thing you might want someday.</p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {activeItems.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.2) }}
                className="group rounded-xl border border-border bg-card/80 p-4 transition-colors hover:border-primary/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="truncate font-heading font-semibold text-foreground">{item.title}</h4>
                    {item.notes && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.notes}</p>}
                  </div>
                  <button
                    onClick={() => removeItem(item.id).catch(() => toast.error('Could not remove item'))}
                    className="rounded-lg p-2 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Select value={item.stage} onValueChange={(value) => updateItem(item.id, { stage: value as WishlistStage })}>
                    <SelectTrigger className="h-9 w-[150px] bg-background/60 text-xs" aria-label={`${item.title} stage`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={item.priority} onValueChange={(value) => updateItem(item.id, { priority: value as WishlistPriority })}>
                    <SelectTrigger className={cn('h-9 w-[130px] text-xs', priorityStyles[item.priority])} aria-label={`${item.title} priority`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="someday">Someday</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                      <SelectItem value="soon">Soon</SelectItem>
                    </SelectContent>
                  </Select>
                  {item.targetBudget != null && (
                    <span className="ml-auto text-sm font-medium text-foreground">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.targetBudget)}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {resolvedItems.length > 0 && (
        <details className="rounded-xl border border-border bg-card/40 p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Purchased or dropped ({resolvedItems.length})
          </summary>
          <div className="mt-3 space-y-2">
            {resolvedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <span className="text-foreground">{item.title}</span>
                <span className="capitalize text-muted-foreground">{item.stage}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
