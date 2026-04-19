import React, { useState, useEffect } from 'react';
import {
  Megaphone, Send, Users, MessageSquare, Bell, Smartphone,
  Globe, Plus, BarChart3, Target, Gift, Ticket, UserPlus, Search,
  Filter, Trash2, X, Clock, CheckCircle2, ArrowUpRight, Zap, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign } from '../types';
import { storageService } from '../services/storageService';

const TYPE_CONFIG: Record<Campaign['type'], { icon: React.FC<any>; color: string; label: string }> = {
  PUSH:     { icon: Bell,         color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Push' },
  SMS:      { icon: Smartphone,   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         label: 'SMS' },
  WHATSAPP: { icon: MessageSquare,color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',          label: 'WhatsApp' },
  BANNER:   { icon: Globe,        color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       label: 'Banner' },
};

const STATUS_CONFIG: Record<Campaign['status'], string> = {
  ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SCHEDULED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const Marketing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    title: '', type: 'PUSH', status: 'SCHEDULED', targetRegion: 'All',
    targetAudience: 'farmers', message: '', sentCount: 0
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setCampaigns(storageService.getCampaigns());

  const stats = {
    active: campaigns.filter(c => c.status === 'ACTIVE').length,
    scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
    totalReach: campaigns.reduce((s, c) => s + c.sentCount, 0),
    completed: campaigns.filter(c => c.status === 'COMPLETED').length,
  };

  const filtered = campaigns.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.targetRegion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newCampaign.title || !newCampaign.message) return;
    storageService.saveCampaign({
      ...(newCampaign as Campaign),
      id: `CMP-${Date.now()}`,
      sentCount: newCampaign.status === 'ACTIVE' ? Math.floor(Math.random() * 500 + 50) : 0,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
    setNewCampaign({ title: '', type: 'PUSH', status: 'SCHEDULED', targetRegion: 'All', targetAudience: 'farmers', message: '', sentCount: 0 });
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this campaign?')) { storageService.deleteCampaign(id); loadData(); }
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Megaphone size={16} className="text-pink-400" />
            </div>
            <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Marketing</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Marketing & Promotions</h1>
          <p className="text-[var(--text-secondary)]">Manage campaigns, send bulk notifications, and track growth metrics.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={18} /> Create Campaign
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reach', value: stats.totalReach.toLocaleString(), sub: 'Messages sent', icon: Radio, color: 'emerald' },
          { label: 'Active Campaigns', value: stats.active, sub: `${stats.scheduled} scheduled`, icon: Zap, color: 'blue' },
          { label: 'Completed', value: stats.completed, sub: 'Past campaigns', icon: CheckCircle2, color: 'teal' },
          { label: 'Total Campaigns', value: campaigns.length, sub: 'All time', icon: Megaphone, color: 'pink' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
              color === 'teal' ? 'bg-teal-500/10 text-teal-400' : 'bg-pink-500/10 text-pink-400'
            }`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Campaign List ── */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Megaphone size={18} className="text-pink-400" /> Campaign Management
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search campaigns..." className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                {['Campaign', 'Channel', 'Target', 'Reach', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map(camp => {
                const cfg = TYPE_CONFIG[camp.type];
                const CIcon = cfg.icon;
                return (
                  <tr key={camp.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm">{camp.title}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{camp.message}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <CIcon size={10} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm">{camp.targetRegion}</p>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{camp.targetAudience}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono font-bold text-sm">{camp.sentCount.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[camp.status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">{camp.createdAt}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDelete(camp.id)}
                        className="p-2 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Megaphone size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)]">No campaigns yet. Create your first one!</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Growth Features + Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <Gift size={16} className="text-emerald-400" /> Growth Features
          </h3>
          <div className="space-y-3">
            {[
              { icon: UserPlus, color: 'emerald', label: 'Referral System', sub: '₹500 reward for each successful invite', count: '124 active' },
              { icon: Ticket,   color: 'amber',   label: 'Promo Codes',    sub: '15 active codes for testing & services', count: '3 expiring' },
              { icon: Target,   color: 'blue',    label: 'Loyalty Rewards',sub: 'Points system for consistent farmers',    count: '88 members' },
            ].map(({ icon: Icon, color, label, sub, count }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                    color === 'amber'   ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  }`}><Icon size={16} /></div>
                  <div>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{sub}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-400">{count}</p>
                  <button className="text-[10px] text-[var(--text-muted)] hover:text-emerald-400 transition-colors mt-0.5">Manage →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-emerald-400" /> Channel Performance
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Push Notification CTR', value: 12.4, pct: 62, color: 'emerald' },
              { label: 'SMS Conversion Rate',   value: 4.8,  pct: 24, color: 'blue' },
              { label: 'In-App Banner CTR',     value: 85,   pct: 85, color: 'amber' },
              { label: 'WhatsApp Open Rate',    value: 68,   pct: 68, color: 'teal' },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className={`font-bold ${color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : color === 'amber' ? 'text-amber-400' : 'text-teal-400'}`}>
                    {value}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-amber-500' : 'bg-teal-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">Create Campaign</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Campaign Title</label>
                  <input type="text" placeholder="e.g. Monsoon Alert for Farmers" value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} className="input-field w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Channel</label>
                    <select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as Campaign['type'] })} className="input-field w-full">
                      <option value="PUSH">Push Notification</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="BANNER">In-App Banner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</label>
                    <select value={newCampaign.status} onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as Campaign['status'] })} className="input-field w-full">
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ACTIVE">Active (Send Now)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Audience</label>
                    <select value={newCampaign.targetAudience} onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value as Campaign['targetAudience'] })} className="input-field w-full">
                      <option value="farmers">Farmers</option>
                      <option value="providers">Providers</option>
                      <option value="all">All Users</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Region</label>
                    <input type="text" placeholder="e.g. Zone A or All" value={newCampaign.targetRegion}
                      onChange={(e) => setNewCampaign({ ...newCampaign, targetRegion: e.target.value })} className="input-field w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Message</label>
                  <textarea placeholder="Your campaign message..." value={newCampaign.message}
                    onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                    rows={3} className="input-field w-full resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreate} disabled={!newCampaign.title || !newCampaign.message}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Send size={15} /> Launch Campaign
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketing;
