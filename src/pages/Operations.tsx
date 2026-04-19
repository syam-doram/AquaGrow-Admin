import React, { useState } from 'react';
import {
  Waves, Search, Filter, AlertTriangle, CheckCircle2, Clock,
  Thermometer, Droplets, Activity, ChevronRight, MoreVertical,
  Cpu, Calendar, TrendingUp, Eye, Zap, ArrowUpRight, MapPin,
  RefreshCw, PlayCircle, StopCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Pond } from '../types';

/* ── mock data ──────────────────────────────────────────────────────────────── */
const mockPonds: Pond[] = [
  {
    id: 'POND-001', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Alpha',
    sizeInAcres: 2.5, species: 'L. Vannamei', stockingDensity: 80,
    stockingDate: '2026-02-15', expectedHarvestDate: '2026-05-15',
    feedUsage: 1200, mortalityRate: 2.5, survivalRate: 97.5, status: 'ACTIVE',
    lastAiAnalysis: { timestamp: '2026-04-10 10:00', result: 'Optimal Growth', confidence: 98 }
  },
  {
    id: 'POND-002', farmerId: 'F-102', farmerName: 'Jane Smith', name: 'Smith Pond 1',
    sizeInAcres: 1.5, species: 'L. Vannamei', stockingDensity: 70,
    stockingDate: '2026-01-10', expectedHarvestDate: '2026-04-20',
    feedUsage: 2500, mortalityRate: 8.2, survivalRate: 91.8, status: 'ALERT',
    lastAiAnalysis: { timestamp: '2026-04-10 09:30', result: 'Low Oxygen Risk', confidence: 85 }
  },
  {
    id: 'POND-003', farmerId: 'F-101', farmerName: 'John Doe', name: 'Pond Beta',
    sizeInAcres: 3.0, species: 'Tiger Shrimp', stockingDensity: 60,
    stockingDate: '2026-03-01', expectedHarvestDate: '2026-06-01',
    feedUsage: 450, mortalityRate: 15.0, survivalRate: 85.0, status: 'DISEASE_DETECTED',
    lastAiAnalysis: { timestamp: '2026-04-10 11:00', result: 'White Spot Syndrome', confidence: 92 }
  },
];

const STATUS_CONFIG: Record<Pond['status'], { label: string; cls: string; dot: string }> = {
  ACTIVE:           { label: 'Active',           cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  ALERT:            { label: 'Alert',             cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400' },
  DISEASE_DETECTED: { label: 'Disease Detected', cls: 'bg-red-500/10 text-red-400 border-red-500/20',            dot: 'bg-red-400' },
  HARVESTED:        { label: 'Harvested',         cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: 'bg-blue-400' },
  EMPTY:            { label: 'Empty',             cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         dot: 'bg-zinc-400' },
};

const StatusBadge = ({ status }: { status: Pond['status'] }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

/* ── component ──────────────────────────────────────────────────────────────── */
const Operations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockPonds.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    active: mockPonds.filter(p => p.status === 'ACTIVE').length,
    alert: mockPonds.filter(p => p.status === 'ALERT' || p.status === 'DISEASE_DETECTED').length,
    harvested: mockPonds.filter(p => p.status === 'HARVESTED').length,
  };

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Waves size={16} className="text-teal-400" />
            </div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Operations</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Operations Management</h1>
          <p className="text-[var(--text-secondary)]">Pond stocking, harvest planning, and real-time health monitoring.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="btn-secondary flex items-center gap-2"><RefreshCw size={16} />Refresh</button>
          <button className="btn-primary flex items-center gap-2"><PlayCircle size={16} />New Harvest</button>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Ponds', value: '128', icon: Waves, color: 'emerald', sub: '12 zones' },
          { label: 'Harvests This Month', value: '14', icon: Calendar, color: 'teal', sub: '6 upcoming' },
          { label: 'Disease Alerts', value: `${stats.alert}`, icon: AlertTriangle, color: 'red', sub: 'Needs attention' },
          { label: 'Avg Survival Rate', value: '91.4%', icon: TrendingUp, color: 'blue', sub: '+2.1% vs prev' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              color === 'teal'   ? 'bg-teal-500/10 text-teal-400' :
              color === 'red'    ? 'bg-red-500/10 text-red-400' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Pond Status Summary Bar ── */}
      <div className="glass-panel p-5 flex flex-wrap items-center gap-4">
        <p className="text-sm font-bold text-[var(--text-secondary)] mr-2">Live Pond Status:</p>
        {[
          { label: 'Healthy', count: stats.active, color: 'emerald' },
          { label: 'Alert / Disease', count: stats.alert, color: 'red' },
          { label: 'Harvested', count: stats.harvested, color: 'blue' },
          { label: 'Empty', count: 3, color: 'zinc' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              s.color === 'emerald' ? 'bg-emerald-400' :
              s.color === 'red'     ? 'bg-red-400' :
              s.color === 'blue'    ? 'bg-blue-400' : 'bg-zinc-400'
            }`} />
            <span className="text-sm text-[var(--text-secondary)]">{s.label}</span>
            <span className="font-bold text-sm">{s.count}</span>
          </div>
        ))}
      </div>

      {/* ── Pond Table ── */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity size={18} className="text-teal-400" /> Active Ponds & Health
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search ponds or farmers..."
              className="input-field w-full pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                {['Pond / Farmer', 'Species & Size', 'Stocking → Harvest', 'Feed / Mortality', 'AI Analysis', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((pond) => (
                <tr key={pond.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-[var(--text-muted)]">{pond.id}</p>
                    <p className="font-bold text-sm">{pond.farmerName}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{pond.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">{pond.species}</p>
                    <p className="text-xs text-[var(--text-muted)]">{pond.sizeInAcres} acres • {pond.stockingDensity}/m²</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-[var(--text-muted)]">Stock: {pond.stockingDate}</p>
                    <p className="text-xs text-emerald-400 font-semibold">Harvest: {pond.expectedHarvestDate}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{pond.feedUsage.toLocaleString()} kg</p>
                    <p className={`text-xs font-semibold ${pond.mortalityRate > 10 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                      {pond.mortalityRate}% mortality
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {pond.lastAiAnalysis && (
                      <div className="flex items-start gap-2">
                        <Cpu size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">{pond.lastAiAnalysis.result}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{pond.lastAiAnalysis.confidence}% confidence</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={pond.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Waves size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)]">No ponds match your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upstream AI Alerts ── */}
      <div className="glass-panel p-6">
        <h3 className="font-display font-bold flex items-center gap-2 mb-5">
          <Zap size={16} className="text-amber-400" /> Upcoming Harvest Schedule
        </h3>
        <div className="space-y-3">
          {[
            { pond: 'POND-001', farmer: 'John Doe', date: '2026-05-15', biomass: '2.4 T', status: 'On Track' },
            { pond: 'POND-004', farmer: 'Priya Menon', date: '2026-05-22', biomass: '1.8 T', status: 'Pending Confirmation' },
            { pond: 'POND-007', farmer: 'Ramesh K.', date: '2026-06-01', biomass: '3.1 T', status: 'On Track' },
          ].map(r => (
            <div key={r.pond} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Calendar size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">{r.farmer} — {r.pond}</p>
                  <p className="text-xs text-[var(--text-muted)]">{r.date} · Est. {r.biomass}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                r.status === 'On Track'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Operations;
