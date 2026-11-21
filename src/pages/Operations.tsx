import React, { useState, useEffect } from 'react';
import {
  Waves, Search, AlertTriangle, Activity,
  Cpu, Calendar, TrendingUp, MoreVertical,
  RefreshCw, PlayCircle, Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { LivePond, fetchPonds } from '../services/aquagrowApi';

// ── Status helpers for LivePond (backend uses lowercase) ─────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  active:           { label: 'Active',           cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  harvested:        { label: 'Harvested',         cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: 'bg-blue-400' },
  archive:          { label: 'Archived',          cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         dot: 'bg-zinc-400' },
  planned:          { label: 'Planned',           cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20',   dot: 'bg-purple-400' },
  harvest_pending:  { label: 'Harvest Pending',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      dot: 'bg-amber-400' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const c = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', dot: 'bg-zinc-400' };
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
  const [ponds, setPonds] = useState<LivePond[]>([]);
  const [pondsLoading, setPondsLoading] = useState(true);

  useEffect(() => {
    fetchPonds()
      .then(data => { setPonds(data); })
      .catch(() => { setPonds([]); })
      .finally(() => setPondsLoading(false));
  }, []);

  const filtered = ponds.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.farmer?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    active:    ponds.filter(p => p.status === 'active').length,
    alert:     ponds.filter(p => p.alerts && p.alerts.length > 0).length,
    harvested: ponds.filter(p => p.status === 'harvested' || p.status === 'harvest_pending').length,
    archive:   ponds.filter(p => p.status === 'archive').length,
  };

  // Upcoming harvests: active ponds sorted by DOC desc (highest DOC = closest to harvest)
  const upcomingHarvests = ponds
    .filter(p => p.status === 'active' || p.status === 'harvest_pending')
    .sort((a, b) => b.doc - a.doc)
    .slice(0, 5);

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
          { label: 'Active Ponds',      value: pondsLoading ? '…' : `${stats.active}`,    icon: Waves,         color: 'emerald', sub: `${ponds.length} total` },
          { label: 'Near Harvest',      value: pondsLoading ? '…' : `${upcomingHarvests.length}`, icon: Calendar, color: 'teal', sub: 'Sorted by DOC' },
          { label: 'With Alerts',       value: pondsLoading ? '…' : `${stats.alert}`,     icon: AlertTriangle, color: 'red',     sub: 'Needs attention' },
          { label: 'Harvested / Pending', value: pondsLoading ? '…' : `${stats.harvested}`, icon: TrendingUp, color: 'blue',    sub: 'Completed cycles' },
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
          { label: 'Active',           count: stats.active,    color: 'emerald' },
          { label: 'Alerts',           count: stats.alert,     color: 'red' },
          { label: 'Harvested',        count: stats.harvested, color: 'blue' },
          { label: 'Archived',         count: stats.archive,   color: 'zinc' },
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
            <Activity size={18} className="text-teal-400" /> Active Ponds &amp; Health
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
                {['Pond / Farmer', 'Species & Size', 'DOC / Stage', 'Feed (7d)', 'Last Water Log', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((pond) => (
                <tr key={pond._id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-[var(--text-muted)]">{pond._id.slice(-6)}</p>
                    <p className="font-bold text-sm">{pond.farmer?.name ?? '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{pond.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">{pond.species ?? '—'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{pond.size != null ? `${pond.size} acres` : '—'} · {pond.seedCount != null ? `${pond.seedCount.toLocaleString()} seed` : '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-teal-400">DOC {pond.doc}</p>
                    <p className="text-xs text-[var(--text-muted)]">{pond.stage}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{pond.feedLast7Days.toLocaleString()} kg</p>
                    <p className="text-xs text-[var(--text-muted)]">{pond.feedLogCount} logs</p>
                  </td>
                  <td className="px-5 py-4">
                    {pond.lastWaterLog ? (
                      <div className="space-y-0.5">
                        {pond.lastWaterLog.ph != null && <p className="text-xs text-[var(--text-muted)]">pH {pond.lastWaterLog.ph}</p>}
                        {pond.lastWaterLog.do != null && <p className="text-xs text-[var(--text-muted)]">DO {pond.lastWaterLog.do}</p>}
                        {pond.lastWaterLog.temp != null && <p className="text-xs text-[var(--text-muted)]">Temp {pond.lastWaterLog.temp}°C</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)]">No log</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={pond.status} />
                    {pond.alerts && pond.alerts.length > 0 && (
                      <p className="text-[9px] text-red-400 mt-1">{pond.alerts.length} alert{pond.alerts.length > 1 ? 's' : ''}</p>
                    )}
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
              <p className="text-[var(--text-muted)]">
                {pondsLoading ? 'Loading ponds…' : ponds.length === 0 ? 'No ponds found. Add ponds to get started.' : 'No ponds match your search.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Harvest Schedule ── */}
      <div className="glass-panel p-6">
        <h3 className="font-display font-bold flex items-center gap-2 mb-5">
          <Zap size={16} className="text-amber-400" /> Near-Harvest Ponds (by DOC)
        </h3>
        <div className="space-y-3">
          {upcomingHarvests.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)] text-sm">No active ponds. Add ponds to see harvest schedule.</p>
            </div>
          ) : upcomingHarvests.map(r => (
            <div key={r._id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Calendar size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">{r.farmer?.name ?? '—'} — {r.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">DOC {r.doc} · {r.species ?? '—'} · {r.size != null ? `${r.size} acres` : '—'}</p>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Operations;
