import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Filter, Eye, Trash2, X, Send, Tag, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ContentItem } from '../types';
import { storageService } from '../services/storageService';

const TypeBadge = ({ type }: { type: ContentItem['type'] }) => {
  const styles: Record<string, string> = { GUIDE: 'bg-blue-500/10 text-blue-400 border-blue-500/20', ALERT: 'bg-red-500/10 text-red-400 border-red-500/20', VIDEO: 'bg-purple-500/10 text-purple-400 border-purple-500/20', TRAINING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ANNOUNCEMENT: 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[type]}`}>{type}</span>;
};

const ContentManagement = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<ContentItem>>({
    title: '', type: 'GUIDE', category: '', summary: '', content: '', targetAudience: 'farmers', status: 'DRAFT', tags: [], views: 0
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setContent(storageService.getContent());

  const stats = { published: content.filter(c => c.status === 'PUBLISHED').length, draft: content.filter(c => c.status === 'DRAFT').length, totalViews: content.reduce((s, c) => s + (c.views || 0), 0), alerts: content.filter(c => c.type === 'ALERT' && c.status === 'PUBLISHED').length };

  const filtered = content.filter(c => {
    const ms = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterType === 'all' || c.type === filterType;
    return ms && mf;
  });

  const handleCreate = () => {
    if (!newItem.title || !newItem.content) return;
    const item: ContentItem = {
      ...(newItem as ContentItem),
      id: `CNT-${Date.now()}`,
      publishedAt: new Date().toISOString().split('T')[0],
    };
    storageService.saveContent(item);
    setIsModalOpen(false);
    setNewItem({ title: '', type: 'GUIDE', category: '', summary: '', content: '', targetAudience: 'farmers', status: 'DRAFT', tags: [], views: 0 });
    loadData();
  };

  const handlePublish = (item: ContentItem) => { storageService.saveContent({ ...item, status: 'PUBLISHED' }); loadData(); };
  const handleDelete = (id: string) => { if (window.confirm('Delete this content?')) { storageService.deleteContent(id); loadData(); } };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Content Management</h1>
          <p className="text-zinc-400">Publish farming guides, post seasonal alerts, and share training materials.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center gap-2"><Plus size={20} />New Content</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit"><Send size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Published</p><h3 className="text-3xl font-display font-bold text-emerald-400">{stats.published}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-zinc-500/10 text-zinc-400 w-fit"><BookOpen size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Drafts</p><h3 className="text-3xl font-display font-bold">{stats.draft}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-blue-500/10 text-blue-400 w-fit"><Eye size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Views</p><h3 className="text-3xl font-display font-bold text-blue-400">{stats.totalViews.toLocaleString()}</h3></div>
        <div className="glass-panel p-5"><div className="mb-3 p-2.5 rounded-xl bg-red-500/10 text-red-400 w-fit"><Megaphone size={18} /></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Active Alerts</p><h3 className="text-3xl font-display font-bold text-red-400">{stats.alerts}</h3></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search content..." className="input-field w-full pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"><Filter size={16} className="text-zinc-500" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent outline-none text-sm">
            <option value="all">All Types</option>
            <option value="GUIDE">Guide</option>
            <option value="ALERT">Alert</option>
            <option value="VIDEO">Video</option>
            <option value="TRAINING">Training</option>
            <option value="ANNOUNCEMENT">Announcement</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(item => (
          <motion.div key={item.id} whileHover={{ y: -3 }} className="glass-panel p-6 group">
            <div className="flex items-start justify-between mb-3">
              <TypeBadge type={item.type} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'DRAFT' ? 'bg-zinc-500/10 text-zinc-400' : 'bg-zinc-700/20 text-zinc-600'}`}>{item.status}</span>
            </div>
            <h3 className="font-display font-bold text-base mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">{item.title}</h3>
            <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{item.summary}</p>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-4">
              <span className="flex items-center gap-1"><Tag size={10} />{item.category}</span>
              <span className="flex items-center gap-1"><Eye size={10} />{(item.views || 0).toLocaleString()} views</span>
              <span>{item.targetAudience}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{item.publishedAt}</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setViewItem(item)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"><Eye size={15} /></button>
                {item.status === 'DRAFT' && <button onClick={() => handlePublish(item)} className="p-2 hover:bg-emerald-500/10 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors"><Send size={15} /></button>}
                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-display font-bold">New Content</h2><button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button></div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Title</label><input type="text" placeholder="Content title..." value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="input-field w-full" /></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2 col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</label><select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as ContentItem['type'] })} className="input-field w-full bg-zinc-900"><option value="GUIDE">Guide</option><option value="ALERT">Alert</option><option value="VIDEO">Video</option><option value="TRAINING">Training</option><option value="ANNOUNCEMENT">Announcement</option></select></div>
                  <div className="space-y-2 col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Audience</label><select value={newItem.targetAudience} onChange={e => setNewItem({ ...newItem, targetAudience: e.target.value as ContentItem['targetAudience'] })} className="input-field w-full bg-zinc-900"><option value="all">All</option><option value="farmers">Farmers</option><option value="providers">Providers</option></select></div>
                  <div className="space-y-2 col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label><input type="text" placeholder="e.g. Disease" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="input-field w-full" /></div>
                  <div className="space-y-2 col-span-1"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</label><select value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value as ContentItem['status'] })} className="input-field w-full bg-zinc-900"><option value="DRAFT">Draft</option><option value="PUBLISHED">Publish Now</option></select></div>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Summary</label><textarea placeholder="Brief summary shown in listing..." value={newItem.summary} onChange={e => setNewItem({ ...newItem, summary: e.target.value })} rows={2} className="input-field w-full resize-none" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Content</label><textarea placeholder="Full content / article body..." value={newItem.content} onChange={e => setNewItem({ ...newItem, content: e.target.value })} rows={5} className="input-field w-full resize-none" /></div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreate} disabled={!newItem.title || !newItem.content} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Send size={16} />Save Content</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewItem(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4"><TypeBadge type={viewItem.type} /><button onClick={() => setViewItem(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button></div>
              <h2 className="text-2xl font-display font-bold mb-2">{viewItem.title}</h2>
              <p className="text-sm text-zinc-400 mb-4">{viewItem.summary}</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{viewItem.content}</div>
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500"><span>Published: {viewItem.publishedAt}</span><span>{viewItem.targetAudience}</span><span>{(viewItem.views || 0)} views</span></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentManagement;
