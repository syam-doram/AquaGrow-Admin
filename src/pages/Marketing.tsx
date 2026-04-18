import React, { useState, useEffect } from 'react';
import {
  Megaphone, Send, Users, MapPin, MessageSquare, Bell, Smartphone,
  Globe, Plus, BarChart3, Target, Gift, Ticket, UserPlus, Search,
  Filter, MoreVertical, Clock, CheckCircle2, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign } from '../types';
import { storageService } from '../services/storageService';

const TypeIcon = ({ type }: { type: Campaign['type'] }) => {
  if (type === 'PUSH') return <Bell size={14} className="text-emerald-400" />;
  if (type === 'SMS') return <Smartphone size={14} className="text-blue-400" />;
  if (type === 'BANNER') return <Globe size={14} className="text-radiant-sun" />;
  return <MessageSquare size={14} className="text-emerald-500" />;
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
    totalReach: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
    completed: campaigns.filter(c => c.status === 'COMPLETED').length,
  };

  const filtered = campaigns.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.targetRegion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newCampaign.title || !newCampaign.message) return;
    const campaign: Campaign = {
      ...(newCampaign as Campaign),
      id: `CMP-${Date.now()}`,
      sentCount: newCampaign.status === 'ACTIVE' ? Math.floor(Math.random() * 500 + 50) : 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    storageService.saveCampaign(campaign);
    setIsModalOpen(false);
    setNewCampaign({ title: '', type: 'PUSH', status: 'SCHEDULED', targetRegion: 'All', targetAudience: 'farmers', message: '', sentCount: 0 });
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this campaign?')) { storageService.deleteCampaign(id); loadData(); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Marketing & Promotions</h1>
          <p className="text-zinc-400">Manage campaigns, send bulk notifications, and track growth features.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center gap-2">
          <Plus size={20} /> Create Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Total Reach</p>
          <h3 className="text-3xl font-display font-bold">{stats.totalReach.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-2">Messages sent</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Active Campaigns</p>
          <h3 className="text-3xl font-display font-bold text-emerald-400">{stats.active}</h3>
          <p className="text-[10px] text-zinc-500 mt-2">{stats.scheduled} scheduled</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Completed</p>
          <h3 className="text-3xl font-display font-bold text-blue-400">{stats.completed}</h3>
          <p className="text-[10px] text-zinc-500 mt-2">Past campaigns</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Total Campaigns</p>
          <h3 className="text-3xl font-display font-bold">{campaigns.length}</h3>
          <p className="text-[10px] text-emerald-400 font-bold mt-2">All time</p>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Megaphone size={20} className="text-emerald-400" /> Campaign Management
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search campaigns..." className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Reach</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((camp) => (
                <tr key={camp.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-100">{camp.title}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[180px]">{camp.message}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <TypeIcon type={camp.type} /> {camp.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-200">{camp.targetRegion}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{camp.targetAudience}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-zinc-100">{camp.sentCount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      camp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      camp.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>{camp.status}</span>
                  </td>
                  <td className="px-6 py-4"><p className="text-xs text-zinc-500">{camp.createdAt}</p></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(camp.id)} className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center"><Megaphone size={40} className="text-zinc-600 mx-auto mb-3" /><p className="text-zinc-500">No campaigns found.</p></div>
        )}
      </div>

      {/* Growth Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><Gift size={20} className="text-emerald-400" /> Growth Features</h3>
          <div className="space-y-4">
            {[
              { icon: UserPlus, color: 'emerald', label: 'Referral System', sub: '₹500 reward for each successful invite' },
              { icon: Ticket, color: 'radiant-sun', label: 'Promo Codes', sub: '15 active codes for testing & services' },
              { icon: Target, color: 'blue', label: 'Loyalty Rewards', sub: 'Points system for consistent farmers' },
            ].map(({ icon: Icon, color, label, sub }) => (
              <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 flex items-center justify-center text-${color}-500`}><Icon size={20} /></div>
                  <div><p className="font-bold">{label}</p><p className="text-xs text-zinc-500">{sub}</p></div>
                </div>
                <button className="text-xs text-emerald-400 font-bold hover:underline">Manage</button>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-8">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-400" /> Campaign Performance</h3>
          <div className="space-y-6">
            {[
              { label: 'Push Notifications CTR', value: 12.4, color: 'emerald', display: '12.4%' },
              { label: 'SMS Conversion Rate', value: 4.8, color: 'blue', display: '4.8%' },
              { label: 'In-App Banner Impressions', value: 85, color: 'radiant-sun', display: '85%' },
            ].map(({ label, value, color, display }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className={`text-${color}-400 font-bold`}>{display}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">Create Campaign</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Campaign Title</label>
                  <input type="text" placeholder="e.g. Monsoon Alert for Farmers" value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} className="input-field w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Type</label>
                    <select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as Campaign['type'] })} className="input-field w-full bg-zinc-900">
                      <option value="PUSH">Push Notification</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="BANNER">In-App Banner</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</label>
                    <select value={newCampaign.status} onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value as Campaign['status'] })} className="input-field w-full bg-zinc-900">
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="ACTIVE">Active (Send Now)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Target Audience</label>
                    <select value={newCampaign.targetAudience} onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value as Campaign['targetAudience'] })} className="input-field w-full bg-zinc-900">
                      <option value="farmers">Farmers Only</option>
                      <option value="providers">Providers Only</option>
                      <option value="all">All Users</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Region</label>
                    <input type="text" placeholder="e.g. Zone A or All" value={newCampaign.targetRegion}
                      onChange={(e) => setNewCampaign({ ...newCampaign, targetRegion: e.target.value })} className="input-field w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Message</label>
                  <textarea placeholder="Your campaign message..." value={newCampaign.message}
                    onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                    rows={3} className="input-field w-full resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreate} disabled={!newCampaign.title || !newCampaign.message}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={16} /> Launch Campaign
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
