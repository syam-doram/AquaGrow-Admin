import React, { useState, useEffect } from 'react';
import { Waves, MapPin, Activity, AlertTriangle, CheckCircle2, Search, Plus, Eye, Droplets, Thermometer, Wind, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pond } from '../types';
import { storageService } from '../services/storageService';

const StatusBadge = ({ status }: { status: Pond['status'] }) => {
  const s = { ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ALERT: 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20', DISEASE_DETECTED: 'bg-red-500/10 text-red-400 border-red-500/20', HARVESTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20', EMPTY: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s[status]}`}>{status.replace(/_/g, ' ')}</span>;
};

const PondMonitoring = () => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = () => setPonds(storageService.getPonds());

  const stats = { total: ponds.length, active: ponds.filter(p => p.status === 'ACTIVE').length, alert: ponds.filter(p => p.status === 'ALERT').length, disease: ponds.filter(p => p.status === 'DISEASE_DETECTED').length };

  const filtered = ponds.filter(p => {
    const ms = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterStatus === 'all' || p.status === filterStatus;
    return ms && mf;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Pond & Crop Monitoring</h1>
          <p className="text-zinc-400">Monitor pond health, crop lifecycle, and water quality across all farms.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Ponds', value: stats.total, color: 'blue', icon: Waves },
          { label: 'Active', value: stats.active, color: 'emerald', icon: CheckCircle2 },
          { label: 'On Alert', value: stats.alert, color: 'radiant-sun', icon: AlertTriangle },
          { label: 'Disease Detected', value: stats.disease, color: 'red', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400`}><Icon size={18} /></div>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <h3 className={`text-3xl font-display font-bold ${color !== 'blue' ? `text-${color}-400` : ''}`}>{value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search by pond name or farmer..." className="input-field w-full pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field bg-zinc-900 w-full md:w-auto">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ALERT">Alert</option>
          <option value="DISEASE_DETECTED">Disease Detected</option>
          <option value="HARVESTED">Harvested</option>
        </select>
      </div>

      {/* Pond Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(pond => (
          <motion.div key={pond.id} whileHover={{ y: -3 }} className="glass-panel p-6 cursor-pointer group" onClick={() => setSelectedPond(pond)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-lg group-hover:text-emerald-400 transition-colors">{pond.name}</h3>
                  <StatusBadge status={pond.status} />
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1"><Users size={10} />{pond.farmerName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">DOC</p>
                <p className="text-2xl font-bold font-display text-emerald-400">{pond.currentDoc || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-white/5 text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Species</p>
                <p className="text-xs font-bold text-zinc-200">{pond.species}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Size</p>
                <p className="text-xs font-bold text-zinc-200">{pond.sizeInAcres} ac</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">Survival</p>
                <p className="text-xs font-bold text-emerald-400">{pond.survivalRate}%</p>
              </div>
            </div>

            {pond.waterQuality && (
              <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                <span className="flex items-center gap-1 text-zinc-400"><Droplets size={12} className="text-blue-400" />DO: {pond.waterQuality.dissolvedOxygen} mg/L</span>
                <span className="flex items-center gap-1 text-zinc-400"><Thermometer size={12} className="text-radiant-sun" />{pond.waterQuality.temperature}°C</span>
                <span className="flex items-center gap-1 text-zinc-400"><Wind size={12} className="text-emerald-400" />pH {pond.waterQuality.ph}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pond Detail Modal */}
      <AnimatePresence>
        {selectedPond && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPond(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold">{selectedPond.name}</h2>
                  <p className="text-sm text-zinc-400">{selectedPond.farmerName} • {selectedPond.region}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedPond.status} />
                  <button onClick={() => setSelectedPond(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'DOC', value: `${selectedPond.currentDoc || '—'} days` },
                  { label: 'Density', value: `${selectedPond.stockingDensity}/m²` },
                  { label: 'Est. Weight', value: `${selectedPond.estimatedWeight || '—'} g` },
                  { label: 'Mortality', value: `${selectedPond.mortalityRate}%` },
                  { label: 'Feed Used', value: `${selectedPond.feedUsage} kg` },
                  { label: 'Size', value: `${selectedPond.sizeInAcres} acres` },
                  { label: 'Stocked', value: selectedPond.stockingDate },
                  { label: 'Est. Harvest', value: selectedPond.expectedHarvestDate },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
                    <p className="font-bold text-zinc-100 text-sm">{value}</p>
                  </div>
                ))}
              </div>
              {selectedPond.waterQuality && (
                <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Water Quality — {selectedPond.waterQuality.recordedAt}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-[10px] text-zinc-500 mb-1">pH</p><p className="text-lg font-bold">{selectedPond.waterQuality.ph}</p></div>
                    <div><p className="text-[10px] text-zinc-500 mb-1">Dissolved O₂</p><p className="text-lg font-bold">{selectedPond.waterQuality.dissolvedOxygen} mg/L</p></div>
                    <div><p className="text-[10px] text-zinc-500 mb-1">Temperature</p><p className="text-lg font-bold">{selectedPond.waterQuality.temperature}°C</p></div>
                    <div><p className="text-[10px] text-zinc-500 mb-1">Salinity</p><p className="text-lg font-bold">{selectedPond.waterQuality.salinity} ppt</p></div>
                    <div><p className="text-[10px] text-zinc-500 mb-1">Ammonia</p><p className="text-lg font-bold">{selectedPond.waterQuality.ammonia} mg/L</p></div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PondMonitoring;
