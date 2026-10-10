'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@mjn/ui';
import {
  Plus, PencilSimple, Trash, Eye, ArrowLeft,
  ArrowRight, X, CheckCircle, Article,
} from '@mjn/ui';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const CATEGORIES = [
  'UAE Licensing', 'UK Placement', 'US & NCLEX', 'Ireland',
  'Exam Prep', 'Career', 'Student Life', 'Canada', 'Australia',
];

type Block = { type: 'p' | 'h2' | 'h3' | 'ul' | 'callout'; text?: string; items?: string[] };

type Post = {
  id: string; title: string; slug: string; excerpt: string;
  category: string; readTime: string; author: string; authorRole: string;
  status: string; featured: boolean; primaryFeatured: boolean;
  publishedAt: string | null; createdAt: string; updatedAt: string;
  content?: Block[];
};

const EMPTY_POST = {
  title: '', slug: '', excerpt: '', category: CATEGORIES[0],
  readTime: '5 min', author: 'MJN Advisory Team', authorRole: 'MJN Team',
  status: 'DRAFT', featured: false, primaryFeatured: false, content: [] as Block[],
};

function token() {
  return typeof window !== 'undefined' ? localStorage.getItem('mjn_admin_token') ?? '' : '';
}

// ── Block Editor ──────────────────────────────────────────────────────────────

function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (b: Block[]) => void }) {
  function addBlock(type: Block['type']) {
    const newBlock: Block = type === 'ul'
      ? { type, items: [''] }
      : { type, text: '' };
    onChange([...blocks, newBlock]);
  }

  function updateBlock(i: number, patch: Partial<Block>) {
    const next = blocks.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    onChange(next);
  }

  function removeBlock(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const next = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const labelMap: Record<Block['type'], string> = {
    p: 'Paragraph', h2: 'Heading 2', h3: 'Heading 3', ul: 'List', callout: 'Callout',
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {labelMap[block.type]}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveBlock(i, -1)} disabled={i === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs">▲</button>
              <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30 text-xs">▼</button>
              <button onClick={() => removeBlock(i)}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {block.type === 'ul' ? (
            <div className="space-y-1.5">
              {(block.items ?? []).map((item, j) => (
                <div key={j} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => {
                      const items = [...(block.items ?? [])];
                      items[j] = e.target.value;
                      updateBlock(i, { items });
                    }}
                    className="flex-1 rounded border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder={`List item ${j + 1}`}
                  />
                  <button onClick={() => {
                    const items = (block.items ?? []).filter((_, k) => k !== j);
                    updateBlock(i, { items });
                  }} className="text-slate-400 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateBlock(i, { items: [...(block.items ?? []), ''] })}
                className="text-xs font-medium text-primary hover:text-primary/80"
              >+ Add item</button>
            </div>
          ) : (
            <textarea
              value={block.text ?? ''}
              onChange={(e) => updateBlock(i, { text: e.target.value })}
              rows={block.type === 'p' ? 3 : 2}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
              placeholder={
                block.type === 'h2' ? 'Section heading...' :
                block.type === 'h3' ? 'Sub-heading...' :
                block.type === 'callout' ? 'Callout / highlight text...' :
                'Paragraph text...'
              }
            />
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(['p', 'h2', 'h3', 'ul', 'callout'] as Block['type'][]).map((type) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-primary hover:text-primary transition-colors"
          >
            + {labelMap[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Post Editor Panel ─────────────────────────────────────────────────────────

function PostEditor({
  post, onSave, onClose,
}: {
  post: Partial<Post> | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !post?.id;
  const [form, setForm] = useState({ ...EMPTY_POST, ...(post ?? {}) });
  const [saving, setSaving] = useState(false);

  function set(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  async function save(publish = false) {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.excerpt.trim()) { toast.error('Excerpt is required'); return; }
    setSaving(true);
    try {
      const body = { ...form, status: publish ? 'PUBLISHED' : form.status };
      const url = isNew ? `${API}/blog` : `${API}/blog/${post!.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(publish ? 'Published!' : 'Saved as draft');
      onSave();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Posts
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-foreground">{isNew ? 'New Post' : 'Edit Post'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={form.status === 'PUBLISHED' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-300 text-slate-500'}>
            {form.status}
          </Badge>
          <button onClick={() => save(false)} disabled={saving} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <CheckCircle className="h-4 w-4" />
            {form.status === 'PUBLISHED' ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Title *</label>
          <input
            value={form.title}
            onChange={(e) => { set('title', e.target.value); if (isNew) set('slug', autoSlug(e.target.value)); }}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-lg font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Article title..."
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Slug (URL)</label>
          <input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="url-slug-here"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Excerpt *</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
            placeholder="Short summary shown on the blog listing page..."
          />
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Read time</label>
            <input
              value={form.readTime}
              onChange={(e) => set('readTime', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="5 min"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author</label>
            <input
              value={form.author}
              onChange={(e) => set('author', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author Role</label>
            <input
              value={form.authorRole}
              onChange={(e) => set('authorRole', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Featured toggles */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)}
              className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm font-medium text-slate-700">Featured</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.primaryFeatured} onChange={(e) => set('primaryFeatured', e.target.checked)}
              className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm font-medium text-slate-700">Primary Featured (hero card)</span>
          </label>
        </div>

        {/* Content blocks */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Content</label>
          <BlockEditor blocks={form.content as Block[]} onChange={(b) => set('content', b)} />
        </div>
      </div>
    </div>
  );
}

// ── Post List ─────────────────────────────────────────────────────────────────

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null | 'new'>(null);
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/blog/admin/all`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setPosts(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deletePost(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await fetch(`${API}/blog/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    toast.success('Post deleted');
    load();
  }

  async function openEditor(id: string) {
    const res = await fetch(`${API}/blog/admin/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setEditing(await res.json());
  }

  const filtered = posts.filter((p) => filter === 'ALL' || p.status === filter);
  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter((p) => p.status === 'DRAFT').length;

  if (editing !== null) {
    return (
      
        <div className="h-screen flex flex-col">
          <PostEditor
            post={editing === 'new' ? null : editing as Post}
            onSave={() => { load(); setEditing(null); }}
            onClose={() => setEditing(null)}
          />
        </div>
      
    );
  }

  return (
    
      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 data-tour="page-title" className="text-xl font-bold text-foreground">Blog & Articles</h1>
            <p className="text-sm text-slate-500 mt-0.5">Write and publish articles for the marketing site</p>
          </div>
          <button onClick={() => setEditing('new')} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shrink-0 shadow-sm">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>

        {/* Stats */}
        <div data-tour="blog-stats" className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: posts.length, active: filter === 'ALL', key: 'ALL' as const },
            { label: 'Published', value: publishedCount, active: filter === 'PUBLISHED', key: 'PUBLISHED' as const },
            { label: 'Drafts', value: draftCount, active: filter === 'DRAFT', key: 'DRAFT' as const },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-xl border p-4 text-left transition-all ${s.active ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <p className={`text-2xl font-bold ${s.active ? 'text-primary' : 'text-foreground'}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Table */}
        <div data-tour="blog-table" className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading posts...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Article className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No posts yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "New Post" to write your first article</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.featured && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">Featured</span>
                        )}
                        <span className="font-medium text-foreground line-clamp-1">{post.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">/blog/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{post.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        post.status === 'PUBLISHED' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.status === 'PUBLISHED' && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://mjnhealthcare.com'}/blog/${post.slug}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openEditor(post.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <PencilSimple className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    
  );
}
