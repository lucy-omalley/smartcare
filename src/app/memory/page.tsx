'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, Trash2, Pencil } from 'lucide-react';
import { MEMORY_CATEGORIES } from '@/lib/constants';

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
        <div className="container max-w-lg mx-auto p-6 text-center text-muted-foreground">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">My Family Memory</h1>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Everything MumBot remembers about your family. You always control your data.
        </p>

        {showAdd && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label>Memory</Label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. Loves dinosaurs"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEMORY_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} className="w-full rounded-xl">Save Memory</Button>
            </CardContent>
          </Card>
        )}

        {memories.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No memories yet. Chat with MumBot and save what matters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {memories.map((memory) => (
              <Card key={memory.id} className="rounded-2xl">
                <CardContent className="p-4">
                  {editingId === memory.id ? (
                    <div className="space-y-2">
                      <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(memory.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-primary">✓</span>
                          <Badge variant="secondary" className="text-xs rounded-full">
                            {MEMORY_CATEGORIES[memory.category]}
                          </Badge>
                        </div>
                        <p className="text-sm">{memory.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditingId(memory.id); setEditContent(memory.content); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(memory.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {memories.length > 0 && (
          <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={handleDeleteAll}>
            Delete all memories
          </Button>
        )}
      </div>
    </AppShell>
  );
}
