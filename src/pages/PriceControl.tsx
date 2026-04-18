import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Search,
  Filter, Plus, Brain, Sparkles, Globe, MapPin, MoreVertical,
  Save, RefreshCw, Activity, Trash2, X, Edit3, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceSetting } from '../types';
import { storageService } from '../services/storageService';

const QualityBadge = ({ q }: { q: PriceSetting['quality'] }) => {
  const styles = { PREMIUM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', STANDARD: 'bg-blue-500/10 text-blue-400 border-blue-500/20', ECONOMY: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[q]}`}>{q}</span>;
};

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

  const openCreate = () => {
    setEditingPrice(null);
    setForm({ cropType: 'Shrimp', count: 30, quality: 'PREMIUM', location: '', pricePerKg: 450, trend: 'stable' });
    setIsModalOpen(true);
  };

  const openEdit = (price: PriceSetting) => {
    setEditingPrice(price);
    setForm({ ...price });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.location || !form.pricePerKg) return;
    const price: PriceSetting = {
      ...(form as PriceSetting),
      id: editingPrice ? editingPrice.id : `PRC-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    storageService.savePrice(price);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this price setting?')) { storageService.deletePrice(id); loadData(); }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Price Decision System</h1>
          <p className="text-zinc-400">Set daily market prices, monitor trends, and apply AI-driven suggestions.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center justify-center gap-2"><RefreshCw size={18} />Sync Market</button>
          <button onClick={openCreate} className="btn-primary flex items-center justify-center gap-2"><Plus size={18} />Set New Price</button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><TrendingUp size={24} /></div>
            <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold"><ArrowUpRight size={14} />+4.2%</span>
          </div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Market Trend</p>
          <h3 className="text-3xl font-display font-bold">Bullish</h3>
          <p className="text-[10px] text-zinc-500 mt-2">{risingCount} price points trending up</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-radiant-sun/10 text-radiant-sun"><Brain size={24} /></div>
            <span className="text-emerald-400 text-xs font-bold">AI Optimized</span>
          </div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Avg. Set Price</p>
          <h3 className="text-3xl font-display font-bold">₹{avgPrice}<span className="text-lg text-zinc-500">/kg</span></h3>
          <p className="text-[10px] text-zinc-500 mt-2">Across {prices.length} price entries</p>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Globe size={24} /></div>
            <span className="text-zinc-400 text-xs font-bold">Live</span>
          </div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Global Index</p>
          <h3 className="text-3xl font-display font-bold">$6.42<span className="text-lg text-zinc-500">/lb</span></h3>
          <p className="text-[10px] text-zinc-500 mt-2">Ecuador & Vietnam markets</p>
        </div>
      </div>

      {/* Price Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2"><DollarSign size={20} className="text-emerald-400" />Daily Price Settings</h3>
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search by location or crop..." className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Crop / Location</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Quality</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Price (₹/kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((price) => (
                <tr key={price.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-100">{price.cropType}</p>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500"><MapPin size={10} />{price.location}</div>
                  </td>
                  <td className="px-6 py-4"><span className="font-mono text-sm font-bold text-zinc-300">{price.count} Count</span></td>
                  <td className="px-6 py-4"><QualityBadge q={price.quality} /></td>
                  <td className="px-6 py-4"><p className="font-mono font-bold text-lg text-zinc-100">₹{price.pricePerKg}</p></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {price.trend === 'up' && <ArrowUpRight size={16} className="text-emerald-400" />}
                      {price.trend === 'down' && <ArrowDownRight size={16} className="text-red-400" />}
                      {price.trend === 'stable' && <Activity size={16} className="text-zinc-500" />}
                      <span className={`text-xs font-medium ${price.trend === 'up' ? 'text-emerald-400' : price.trend === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
                        {price.trend.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><p className="text-xs text-zinc-500">{price.lastUpdated}</p></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(price)} className="p-2 hover:bg-blue-500/10 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(price.id)} className="p-2 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Price Intelligence */}
      <div className="glass-panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Sparkles size={20} /></div>
          <div><h3 className="text-xl font-display font-bold">AI Price Intelligence</h3><p className="text-sm text-zinc-400">Predictive pricing based on market trends and supply chain data.</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Next Week Forecast</p>
              <div className="flex items-center justify-between"><span className="text-lg font-bold">Expected Price Rise</span><span className="text-emerald-400 font-bold">+₹15/kg</span></div>
              <p className="text-[10px] text-zinc-600 mt-2">Confidence: 92% • Based on low harvest reports in Zone A</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Demand Analysis</p>
              <div className="flex items-center justify-between"><span className="text-lg font-bold">High Demand (Count 30)</span><span className="text-radiant-sun font-bold">Shortage Risk</span></div>
              <p className="text-[10px] text-zinc-600 mt-2">Nellore buyers are offering premium rates for large sizes</p>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-emerald-600/5 border border-emerald-500/10 flex flex-col justify-center">
            <h4 className="font-bold text-emerald-400 mb-3">Admin Recommendation</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">Based on current market intelligence, increase the price for Count 30 by ₹10/kg in the Nellore region to align with buyer demand.</p>
            <button className="mt-6 btn-primary py-2 text-sm">Apply Recommendations</button>
          </div>
        </div>
      </div>

      {/* Create / Edit Price Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">{editingPrice ? 'Edit Price' : 'Set New Price'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Crop Type</label>
                    <input type="text" value={form.cropType} onChange={(e) => setForm({ ...form, cropType: e.target.value })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Location</label>
                    <input type="text" placeholder="e.g. Zone A" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Count</label>
                    <input type="number" value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Price ₹/kg</label>
                    <input type="number" value={form.pricePerKg} onChange={(e) => setForm({ ...form, pricePerKg: Number(e.target.value) })} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quality</label>
                    <select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value as PriceSetting['quality'] })} className="input-field w-full bg-zinc-900">
                      <option value="PREMIUM">Premium</option>
                      <option value="STANDARD">Standard</option>
                      <option value="ECONOMY">Economy</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Market Trend</label>
                  <select value={form.trend} onChange={(e) => setForm({ ...form, trend: e.target.value as PriceSetting['trend'] })} className="input-field w-full bg-zinc-900">
                    <option value="up">Rising ↑</option>
                    <option value="stable">Stable →</option>
                    <option value="down">Falling ↓</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={!form.location} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Save size={16} /> {editingPrice ? 'Update Price' : 'Save Price'}
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
