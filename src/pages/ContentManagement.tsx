import React, { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, Filter, Eye, Trash2, X, Send,
  Tag, Megaphone, FileText, Video, Bell, Zap, Clock, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContentItem } from '../types';
import { storageService } from '../services/storageService';

const TYPE_CONFIG: Record<ContentItem['type'], { color: string; icon: React.FC<any> }> = {
  GUIDE:        { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       icon: BookOpen },
  ALERT:        { color: 'bg-red-500/10 text-red-400 border-red-500/20',          icon: Bell },
  VIDEO:        { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Video },
  TRAINING:     { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Zap },
  ANNOUNCEMENT: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    icon: Megaphone },
};

const TypeBadge = ({ type }: { type: ContentItem['type'] }) => {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
      <Icon size={9} /> {type}
    </span>
  );
};

const ContentManagement = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ContentItem>>({
    title: '', type: 'GUIDE', category: '', summary: '', content: '',
    targetAudience: 'farmers', status: 'DRAFT', tags: [], views: 0
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setContent(storageService.getContent());

  const stats = {
    published: content.filter(c => c.status === 'PUBLISHED').length,
    draft: content.filter(c => c.status === 'DRAFT').length,
    totalViews: content.reduce((s, c) => s + (c.views || 0), 0),
    alerts: content.filter(c => c.type === 'ALERT' && c.status === 'PUBLISHED').length,
  };

  const filtered = content.filter(c => {
    const ms = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterType === 'all' || c.type === filterType;
    return ms && mf;
  });

  const handleCreate = () => {
    if (!newItem.title || !newItem.content) return;
    storageService.saveContent({
      ...(newItem as ContentItem),
      id: `CNT-${Date.now()}`,
      publishedAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
    setNewItem({ title: '', type: 'GUIDE', category: '', summary: '', content: '', targetAudience: 'farmers', status: 'DRAFT', tags: [], views: 0 });
    loadData();
  };

  const handlePublish = (item: ContentItem) => { storageService.saveContent({ ...item, status: 'PUBLISHED' }); loadData(); };
  const handleDelete = (id: string) => { if (window.confirm('Delete this content?')) { storageService.deleteContent(id); loadData(); } };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Content Hub</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Content Management</h1>
          <p className="text-[var(--text-secondary)]">Publish farming guides, post seasonal alerts, and share training materials.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={18} /> New Content
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Published', value: stats.published, icon: Globe, color: 'emerald', sub: 'Live content' },
          { label: 'Drafts', value: stats.draft, icon: FileText, color: 'zinc', sub: 'Awaiting review' },
          { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'blue', sub: 'All time' },
          { label: 'Active Alerts', value: stats.alerts, icon: Bell, color: 'red', sub: 'Published alerts' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              color === 'blue'   ? 'bg-blue-500/10 text-blue-400' :
              color === 'red'    ? 'bg-red-500/10 text-red-400' : 'bg-[var(--bg-surface-2)] text-[var(--text-muted)]'
            }`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Search content..." className="input-field w-full pl-11"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-surface-2)] border border-[var(--border-default)] rounded-xl px-4 py-2.5">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent outline-none text-sm">
            <option value="all">All Types</option>
            {Object.keys(TYPE_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(item => (
            <motion.div key={item.id} whileHover={{ y: -3 }} className="glass-panel p-6 group flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <TypeBadge type={item.type} />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}>{item.status}</span>
              </div>
              <h3 className="font-display font-bold text-base mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2 flex-1">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2">{item.summary}</p>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-4">
                <span className="flex items-center gap-1"><Tag size={9} />{item.category}</span>
                <span className="flex items-center gap-1"><Eye size={9} />{(item.views || 0).toLocaleString()}</span>
                <span className="capitalize">{item.targetAudience}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={9} /> {item.publishedAt}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewItem(item)} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <Eye size={14} />
                  </button>
                  {item.status === 'DRAFT' && (
                    <button onClick={() => handlePublish(item)} className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 transition-colors">
                      <Send size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-panel py-20 text-center">
          <BookOpen size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)] font-semibold">No content found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Try a different search or create your first piece of content.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-5 text-sm">Create Content</button>
        </div>
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">New Content</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Title</label>
                  <input type="text" placeholder="Content title..." value={newItem.title}
                    onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="input-field w-full" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Type</label>
                    <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as ContentItem['type'] })} className="input-field w-full">
                      {Object.keys(TYPE_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Audience</label>
                    <select value={newItem.targetAudience} onChange={e => setNewItem({ ...newItem, targetAudience: e.target.value as ContentItem['targetAudience'] })} className="input-field w-full">
                      <option value="all">All</option><option value="farmers">Farmers</option><option value="providers">Providers</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Category</label>
                    <input type="text" placeholder="e.g. Disease" value={newItem.category}
                      onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</label>
                    <select value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value as ContentItem['status'] })} className="input-field w-full">
                      <option value="DRAFT">Draft</option><option value="PUBLISHED">Publish Now</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Summary</label>
                  <textarea placeholder="Brief summary shown in listing..." value={newItem.summary}
                    onChange={e => setNewItem({ ...newItem, summary: e.target.value })} rows={2} className="input-field w-full resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Full Content</label>
                  <textarea placeholder="Full content / article body..." value={newItem.content}
                    onChange={e => setNewItem({ ...newItem, content: e.target.value })} rows={5} className="input-field w-full resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreate} disabled={!newItem.title || !newItem.content} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Send size={15} /> Save Content
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── View Modal ── */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewItem(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <TypeBadge type={viewItem.type} />
                <button onClick={() => setViewItem(null)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><X size={18} /></button>
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">{viewItem.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-5">{viewItem.summary}</p>
              <div className="p-5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {viewItem.content}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>Published: {viewItem.publishedAt}</span>
                <span className="capitalize">{viewItem.targetAudience}</span>
                <span>{(viewItem.views || 0)} views</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentManagement;
