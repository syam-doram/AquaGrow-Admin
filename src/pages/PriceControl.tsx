import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Search,
  Plus, Brain, Sparkles, Globe, MapPin, MoreVertical,
  Save, RefreshCw, Activity, Trash2, X, Edit3, CheckCircle2,
  Target, Zap, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceSetting } from '../types';
import { storageService } from '../services/storageService';

const QUALITY_STYLES: Record<PriceSetting['quality'], string> = {
  PREMIUM:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  STANDARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ECONOMY:  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const QualityBadge = ({ q }: { q: PriceSetting['quality'] }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${QUALITY_STYLES[q]}`}>{q}</span>
);

const PriceControl = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prices, setPrices] = useState<PriceSetting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceSetting | null>(null);
  const [form, setForm] = useState<Partial<PriceSetting>>({
    cropType: 'Shrimp', count: 30, quality: 'PREMIUM', location: '', pricePerKg: 450, trend: 'stable'
  });

  useEffect(() => { loadData(); }, []);
  const loadData = () => setPrices(storageService.getPrices());

  const filtered = prices.filter(p =>
    p.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgPrice = prices.length ? Math.round(prices.reduce((s, p) => s + p.pricePerKg, 0) / prices.length) : 0;
  const risingCount = prices.filter(p => p.trend === 'up').length;
  const premiumCount = prices.filter(p => p.quality === 'PREMIUM').length;

  const openCreate = () => { setEditingPrice(null); setForm({ cropType: 'Shrimp', count: 30, quality: 'PREMIUM', location: '', pricePerKg: 450, trend: 'stable' }); setIsModalOpen(true); };
  const openEdit = (price: PriceSetting) => { setEditingPrice(price); setForm({ ...price }); setIsModalOpen(true); };

  const handleSave = () => {
    if (!form.location || !form.pricePerKg) return;
    storageService.savePrice({
      ...(form as PriceSetting),
      id: editingPrice ? editingPrice.id : `PRC-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this price setting?')) { storageService.deletePrice(id); loadData(); }
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <DollarSign size={16} className="text-lime-400" />
            </div>
            <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">Pricing</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Price Decision System</h1>
          <p className="text-[var(--text-secondary)]">Set daily market prices, monitor trends, and apply AI-driven suggestions.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Sync Market</button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Set Price</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Market Trend', value: 'Bullish', sub: `${risingCount} rising`, icon: TrendingUp, color: 'emerald' },
          { label: 'Avg Set Price', value: `₹${avgPrice}`, sub: `${prices.length} entries`, icon: DollarSign, color: 'amber' },
          { label: 'Global Index', value: '$6.42', sub: 'Ecuador & Vietnam', icon: Globe, color: 'blue' },
          { label: 'Premium Entries', value: premiumCount, sub: 'Top grade', icon: Target, color: 'violet' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              color === 'amber'  ? 'bg-amber-500/10 text-amber-400' :
              color === 'blue'   ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
            }`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Price Table ── */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <DollarSign size={18} className="text-lime-400" /> Daily Price Settings
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Search by location or crop..." className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                {['Crop / Location', 'Count', 'Quality', 'Price (₹/kg)', 'Trend', 'Updated', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map(price => (
                <tr key={price.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-sm">{price.cropType}</p>
                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><MapPin size={9} />{price.location}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-bold">{price.count} ct</span>
                  </td>
                  <td className="px-5 py-4"><QualityBadge q={price.quality} /></td>
                  <td className="px-5 py-4">
                    <p className="font-mono font-bold text-lg">₹{price.pricePerKg}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {price.trend === 'up'     && <ArrowUpRight size={15} className="text-emerald-400" />}
                      {price.trend === 'down'   && <ArrowDownRight size={15} className="text-red-400" />}
                      {price.trend === 'stable' && <Activity size={15} className="text-[var(--text-muted)]" />}
                      <span className={`text-xs font-bold ${price.trend === 'up' ? 'text-emerald-400' : price.trend === 'down' ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                        {price.trend.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-muted)]">{price.lastUpdated}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(price)} className="p-2 hover:bg-blue-500/10 text-[var(--text-muted)] hover:text-blue-400 rounded-lg transition-colors"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(price.id)} className="p-2 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <DollarSign size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)]">No price entries yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── AI Intelligence ── */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold">AI Price Intelligence</h3>
            <p className="text-sm text-[var(--text-secondary)]">Predictive pricing based on market trends and supply data</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: 'Next Week Forecast', value: 'Expected Rise', accent: '+₹15/kg', sub: 'Confidence: 92% • Low harvest in Zone A', color: 'emerald' },
              { label: 'Demand Analysis', value: 'High Demand (Ct 30)', accent: 'Shortage Risk', sub: 'Nellore buyers offering premium rates', color: 'amber' },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-2">{item.label}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{item.value}</span>
                  <span className={`font-bold text-sm ${item.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'}`}>{item.accent}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="p-6 rounded-2xl bg-emerald-600/5 border border-emerald-500/15 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-emerald-400" />
              <h4 className="font-bold text-emerald-400">Admin Recommendation</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Based on current market intelligence, increase Count 30 price by <span className="text-emerald-400 font-bold">₹10/kg</span> in the Nellore region to align with buyer demand.
            </p>
            <button className="mt-5 btn-primary py-2 text-sm">Apply Recommendations</button>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">{editingPrice ? 'Edit Price' : 'Set New Price'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Crop Type</label>
                    <input type="text" value={form.cropType} onChange={(e) => setForm({ ...form, cropType: e.target.value })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Location</label>
                    <input type="text" placeholder="e.g. Zone A" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Count</label>
                    <input type="number" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">₹/kg</label>
                    <input type="number" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Quality</label>
                    <select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value as PriceSetting['quality'] })} className="input-field w-full">
                      <option value="PREMIUM">Premium</option>
                      <option value="STANDARD">Standard</option>
                      <option value="ECONOMY">Economy</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Market Trend</label>
                  <select value={form.trend} onChange={(e) => setForm({ ...form, trend: e.target.value as PriceSetting['trend'] })} className="input-field w-full">
                    <option value="up">Rising ↑</option>
                    <option value="stable">Stable →</option>
                    <option value="down">Falling ↓</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={!form.location} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Save size={15} /> {editingPrice ? 'Update' : 'Save Price'}
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

export default PriceControl;
