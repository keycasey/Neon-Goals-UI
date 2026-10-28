import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CircleDollarSign, Lightbulb, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
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
import type { WishlistItem } from '@/types/wishlist';
import { WishlistEditDialog } from './WishlistEditDialog';

const stages: Array<{ value: WishlistStage; label: string }> = [
  { value: 'idea', label: 'Idea' },
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
  const [showDetails, setShowDetails] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [hiddenItemIds, setHiddenItemIds] = useState<Set<string>>(new Set());
  const deleteTimers = useRef(new Map<string, number>());

  const visibleItems = items.filter((item) => !hiddenItemIds.has(item.id));
  const activeItems = visibleItems.filter((item) => !['purchased', 'dropped'].includes(item.stage));
  const resolvedItems = visibleItems.filter((item) => ['purchased', 'dropped'].includes(item.stage));

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
      setShowDetails(false);
      toast.success('Added to your wishlist');
    } catch {
      toast.error('Could not save that wishlist item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleRemoval = (item: WishlistItem) => {
    setHiddenItemIds((current) => new Set(current).add(item.id));
    const timer = window.setTimeout(() => {
      deleteTimers.current.delete(item.id);
      removeItem(item.id).catch(() => {
        setHiddenItemIds((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
        toast.error('Could not remove that item');
      });
    }, 5000);
    deleteTimers.current.set(item.id, timer);
    toast(`Removed “${item.title}”`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          window.clearTimeout(deleteTimers.current.get(item.id));
          deleteTimers.current.delete(item.id);
          setHiddenItemIds((current) => {
            const next = new Set(current);
            next.delete(item.id);
            return next;
          });
        },
      },
    });
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

        <form onSubmit={submit} className="relative space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto]">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you want? e.g. a bidet"
              maxLength={200}
              className="h-12 bg-background/70 text-base"
              aria-label="Wishlist item"
            />
            <Button type="submit" disabled={!title.trim() || isSubmitting} className="h-12 gap-2 px-6 shadow-[0_0_24px_hsl(var(--primary)/0.2)]">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
            aria-expanded={showDetails}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
            {showDetails ? 'Hide optional details' : 'Add notes, budget, or priority'}
          </button>
          {showDetails && (
            <div className="grid gap-3 rounded-xl border border-border/60 bg-background/30 p-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_minmax(160px,0.45fr)_minmax(160px,0.45fr)]">
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes, dimensions, preferences…"
                maxLength={5000}
                rows={3}
                className="min-h-[84px] resize-y bg-background/70 md:col-span-2 xl:col-span-1 xl:row-span-2"
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
                  placeholder="Target budget"
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
            </div>
          )}
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
          <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-7 text-center">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
            <p className="font-medium text-foreground">Start with the name. Details can wait.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['Bidet', 'Better office chair', 'Camping stove', 'New tires'].map((example) => (
                <button key={example} onClick={() => setTitle(example)} className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary">
                  {example}
                </button>
              ))}
            </div>
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
                  <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="rounded-lg p-2 text-muted-foreground opacity-60 transition hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scheduleRemoval(item)}
                    className="rounded-lg p-2 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Select value={item.stage} onValueChange={(value) => updateItem(item.id, { stage: value as WishlistStage }).catch(() => toast.error('Could not update status'))}>
                    <SelectTrigger className="h-9 w-[150px] bg-background/60 text-xs" aria-label={`${item.title} stage`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {item.stage === 'researching' && <SelectItem value="researching">Researching</SelectItem>}
                      {stages.map((stage) => <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={item.priority} onValueChange={(value) => updateItem(item.id, { priority: value as WishlistPriority }).catch(() => toast.error('Could not update priority'))}>
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
      <WishlistEditDialog item={editingItem} open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)} />
    </div>
  );
}
