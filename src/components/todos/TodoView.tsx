import { FormEvent, useMemo, useState } from 'react';
import { Archive, Check, ChevronDown, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/store/useTodoStore';
import type { Todo } from '@/types/todo';

export function TodoView() {
  const { items, isLoading, error, createItem, updateItem, archiveItem } = useTodoStore();
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const active = useMemo(() => items.filter((item) => item.status === 'active'), [items]);
  const completed = useMemo(() => items.filter((item) => item.status === 'completed'), [items]);
  const archived = useMemo(() => items.filter((item) => item.status === 'archived'), [items]);

  const addTodo = async (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    try {
      await createItem({ title: nextTitle });
      setTitle('');
    } catch {
      toast.error('Could not add that todo');
    }
  };

  const beginEdit = (item: Todo) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditNotes(item.notes || '');
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateItem(id, { title: editTitle.trim(), notes: editNotes.trim() || null });
      setEditingId(null);
    } catch {
      toast.error('Could not update that todo');
    }
  };

  const archive = async (item: Todo) => {
    try {
      await archiveItem(item.id);
      toast('Todo archived', {
        action: { label: 'Undo', onClick: () => void updateItem(item.id, { status: item.status }) },
      });
    } catch {
      toast.error('Could not archive that todo');
    }
  };

  const row = (item: Todo) => (
    <div key={item.id} className="group rounded-xl border border-border bg-card/70 p-3 transition-colors hover:border-primary/40">
      {editingId === item.id ? (
        <div className="space-y-3">
          <Input aria-label="Edit todo title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={200} autoFocus />
          <Textarea aria-label="Todo notes" value={editNotes} onChange={(event) => setEditNotes(event.target.value)} placeholder="Notes (optional)" maxLength={5000} rows={2} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
            <Button size="sm" onClick={() => void saveEdit(item.id)}><Check className="mr-1 h-4 w-4" />Save</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Checkbox
            aria-label={`Mark ${item.title} ${item.status === 'completed' ? 'active' : 'complete'}`}
            checked={item.status === 'completed'}
            disabled={item.status === 'archived'}
            onCheckedChange={(checked) => void updateItem(item.id, { status: checked ? 'completed' : 'active' }).catch(() => toast.error('Could not update that todo'))}
            className="mt-1"
          />
          <div className="min-w-0 flex-1">
            <p className={cn('font-medium text-foreground', item.status === 'completed' && 'text-muted-foreground line-through')}>{item.title}</p>
            {item.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p>}
          </div>
          {item.status === 'archived' ? (
            <Button size="icon" variant="ghost" aria-label={`Restore ${item.title}`} onClick={() => void updateItem(item.id, { status: 'active' })}><RotateCcw className="h-4 w-4" /></Button>
          ) : (
            <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <Button size="icon" variant="ghost" aria-label={`Edit ${item.title}`} onClick={() => beginEdit(item)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Archive ${item.title}`} onClick={() => void archive(item)}><Archive className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <form onSubmit={addTodo} className="flex gap-2 rounded-2xl border border-primary/20 bg-card/80 p-3 shadow-sm">
        <Input aria-label="New todo" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs doing?" maxLength={200} />
        <Button type="submit" disabled={!title.trim()}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </form>

      {isLoading && <div className="rounded-xl border border-border bg-card/60 p-8 text-center text-muted-foreground">Loading your todos…</div>}
      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">{error}</div>}
      {!isLoading && !error && active.length === 0 && completed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Check className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="font-medium text-foreground">Nothing nagging at you.</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a quick action without turning it into a whole damn goal.</p>
        </div>
      )}

      {active.length > 0 && <section className="space-y-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">To do · {active.length}</h2>{active.map(row)}</section>}
      {completed.length > 0 && <section className="space-y-2"><h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Completed · {completed.length}</h2>{completed.map(row)}</section>}
      {archived.length > 0 && (
        <section>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowArchived((value) => !value)}>
            <ChevronDown className={cn('h-4 w-4 transition-transform', !showArchived && '-rotate-90')} />Archived · {archived.length}
          </button>
          {showArchived && <div className="mt-2 space-y-2 opacity-75">{archived.map(row)}</div>}
        </section>
      )}
    </div>
  );
}
