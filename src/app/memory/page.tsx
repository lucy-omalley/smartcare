'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { MEMORY_CATEGORIES } from '@/lib/constants';
import { MEMORY_CATEGORY_EMOJI, CATEGORY_GRADIENTS } from '@/lib/illustration-style';
import { EmptyState } from '@/components/visual/empty-state';
import { AnimatedSection } from '@/components/visual/animated-section';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  content: string;
  category: keyof typeof MEMORY_CATEGORIES;
  createdAt: string;
}

export default function MemoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<string>('PREFERENCE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadMemories = () => {
    fetch('/api/memories')
      .then((r) => r.json())
      .then((data) => setMemories(data.memories || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') loadMemories();
  }, [status, router]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, category: newCategory }),
    });
    setNewContent('');
    setShowAdd(false);
    loadMemories();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    loadMemories();
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all memories? This cannot be undone.')) return;
    await fetch('/api/memories', { method: 'DELETE' });
    loadMemories();
  };

  const handleSaveEdit = async (id: string) => {
    await fetch(`/api/memories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setEditingId(null);
    loadMemories();
  };

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading memories...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto px-4 pt-5 pb-10 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📷</span>
              <h1 className="text-xl font-bold">Family Memory Timeline</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Small moments, beautifully kept.</p>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </header>

        {showAdd && (
          <div className="visual-card p-5 space-y-3 animate-fade-in-up">
            <Label>What do you want to remember?</Label>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Loves dinosaurs, counted to ten today..."
              className="rounded-2xl border-0 bg-muted/50 min-h-[100px]"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MEMORY_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{MEMORY_CATEGORY_EMOJI[key] ?? '✨'} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} className="w-full rounded-full touch-target">Save memory</Button>
          </div>
        )}

        {memories.length === 0 ? (
          <EmptyState
            emoji="❤️"
            title="No memories yet?"
            description="Let's create your first family memory. Chat with MumBot or add one above."
            gradientKey="memory"
            actionLabel="Chat with MumBot"
            actionHref="/mumbot"
          />
        ) : (
          <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-rose-200 before:via-amber-200 before:to-emerald-200">
            {memories.map((memory, index) => {
              const emoji = MEMORY_CATEGORY_EMOJI[memory.category] ?? '✨';
              const gradient = CATEGORY_GRADIENTS.memory;
              return (
                <AnimatedSection key={memory.id} delay={index * 60}>
                  <div className="relative">
                    <span className="absolute -left-6 top-4 w-6 h-6 rounded-full bg-white border-2 border-rose-200 flex items-center justify-center text-xs shadow-sm z-10">
                      {emoji}
                    </span>
                    <article className="visual-card overflow-hidden ml-2">
                      <div className={cn('h-28 bg-gradient-to-br flex items-center justify-center', gradient)}>
                        <span className="text-4xl opacity-80">{emoji}</span>
                      </div>
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {MEMORY_CATEGORIES[memory.category]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(memory.createdAt), 'd MMM yyyy')}
                          </span>
                        </div>
                        {editingId === memory.id ? (
                          <div className="space-y-2">
                            <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="rounded-xl" />
                            <div className="flex gap-2">
                              <Button size="sm" className="rounded-full" onClick={() => handleSaveEdit(memory.id)}>Save</Button>
                              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <blockquote className="text-base leading-relaxed italic text-foreground/90">
                              &ldquo;{memory.content}&rdquo;
                            </blockquote>
                            {memory.category === 'JOURNAL' && (
                              <p className="text-xs text-muted-foreground">Moments like these remind us how quickly little minds grow.</p>
                            )}
                            <div className="flex gap-1 pt-1">
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => { setEditingId(memory.id); setEditContent(memory.content); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-destructive" onClick={() => handleDelete(memory.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}

        {memories.length > 0 && (
          <Button variant="outline" className="w-full rounded-full text-destructive" onClick={handleDeleteAll}>
            Delete all memories
          </Button>
        )}

        <div className="text-center">
          <Link href="/home">
            <Button variant="link" className="text-muted-foreground text-sm">← Back to today&apos;s plan</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
