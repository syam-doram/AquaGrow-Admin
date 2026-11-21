import React, { useState } from 'react';
import {
  Truck, MapPin, Navigation, Thermometer, Clock, CheckCircle2,
  AlertTriangle, Search, Filter, MoreVertical, Activity,
  Box, User, Phone, ArrowRight, ShieldCheck, RefreshCw,
  Plus, TrendingUp, Zap, PackageCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { LogisticsEntry } from '../types';

// No backend endpoint yet — logistics data will appear when connected

const STATUS_STYLES: Record<string, string> = {
  DELIVERED:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_TRANSIT:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PICKUP_SCHEDULED:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELAYED:           'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATS = [
  { label: 'Active Trucks', value: '—', icon: Truck, color: 'emerald', sub: 'Not connected' },
  { label: 'In Transit', value: '—', icon: Box, color: 'blue', sub: 'Not connected' },
  { label: 'Cold Storage', value: '—', icon: Thermometer, color: 'amber', sub: 'Not connected' },
  { label: 'Delivered Today', value: '—', icon: PackageCheck, color: 'teal', sub: 'Not connected' },
];

const SupplyChain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logistics] = useState<LogisticsEntry[]>([]);

  const filtered = logistics.filter(l =>
    l.truckId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Truck size={16} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Logistics</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Supply Chain Management</h1>
          <p className="text-[var(--text-secondary)]">Monitor harvest logistics, truck assignments, and cold storage tracking.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="btn-secondary flex items-center gap-2"><Navigation size={16} />Live Map</button>
          <button className="btn-primary flex items-center gap-2"><Plus size={16} />Assign Truck</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, sub }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
              color === 'blue'   ? 'bg-blue-500/10 text-blue-400' :
              color === 'amber'  ? 'bg-amber-500/10 text-amber-400' :
              'bg-teal-500/10 text-teal-400'
            }`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Logistics Tracking Table ── */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" /> Live Logistics Tracking
          </h3>
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search truck / order / driver..."
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
                {['Log ID / Order', 'Truck & Driver', 'Current Location', 'Cold Temp', 'ETA', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs text-[var(--text-muted)]">{log.id}</p>
                    <p className="font-bold text-sm text-emerald-400">{log.orderId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                        <User size={13} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{log.driverName}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{log.truckId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                      <MapPin size={13} className="text-emerald-400 shrink-0" />
                      {log.currentLocation}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {log.temperature !== undefined ? (
                      <span className={`flex items-center gap-1 font-mono font-bold text-sm ${log.temperature > -15 ? 'text-red-400' : 'text-emerald-400'}`}>
                        <Thermometer size={13} />
                        {log.temperature}°C
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <Clock size={11} /> {log.estimatedArrival}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[log.status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {log.status.replace(/_/g, ' ')}
                    </span>
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
              <Truck size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)] font-semibold mb-1">No logistics data yet.</p>
              <p className="text-xs text-[var(--text-muted)]">Connect your logistics system to see live truck tracking here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Insights Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cold Storage Health */}
        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <ShieldCheck size={16} className="text-emerald-400" /> Cold Storage Health
          </h3>
          <div className="py-10 text-center">
            <Thermometer size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-muted)]">Cold storage monitoring not yet configured.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Connect your cold chain sensors to view live hub status.</p>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-400" /> Logistics Efficiency
          </h3>
          <div className="py-10 text-center">
            <TrendingUp size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-muted)]">Efficiency metrics will appear here.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Connect your logistics system to track delivery performance.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupplyChain;
