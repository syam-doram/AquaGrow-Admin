import React, { useState } from 'react';
import {
  Truck, MapPin, Navigation, Thermometer, Clock, CheckCircle2,
  AlertTriangle, Search, Filter, MoreVertical, Activity,
  Box, User, Phone, ArrowRight, ShieldCheck, RefreshCw,
  Plus, TrendingUp, Zap, PackageCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { LogisticsEntry } from '../types';

const mockLogistics: LogisticsEntry[] = [
  { id: 'LOG-001', orderId: 'ORD-101', truckId: 'AP-05-TX-1234', driverName: 'Ramesh Kumar',   status: 'IN_TRANSIT',        currentLocation: 'Nellore Highway',       temperature: -18, estimatedArrival: '2026-04-10 18:30' },
  { id: 'LOG-002', orderId: 'ORD-102', truckId: 'AP-05-TX-5678', driverName: 'Suresh Singh',   status: 'PICKUP_SCHEDULED',  currentLocation: 'Coastal Valley Depot',   estimatedArrival: '2026-04-11 09:00' },
  { id: 'LOG-003', orderId: 'ORD-098', truckId: 'AP-05-TX-9012', driverName: 'Anil Babu',      status: 'DELIVERED',         currentLocation: 'ABC SeaFoods Facility',  temperature: -20, estimatedArrival: '2026-04-10 14:00' },
];

const STATUS_STYLES: Record<string, string> = {
  DELIVERED:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_TRANSIT:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PICKUP_SCHEDULED:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELAYED:           'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATS = [
  { label: 'Active Trucks', value: '18', icon: Truck, color: 'emerald', sub: '4 idle' },
  { label: 'In Transit', value: '12', icon: Box, color: 'blue', sub: '8 on time' },
  { label: 'Cold Storage', value: '85%', icon: Thermometer, color: 'amber', sub: '1 unit alert' },
  { label: 'Delivered Today', value: '42', icon: PackageCheck, color: 'teal', sub: '94% on-time' },
];

const SupplyChain = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockLogistics.filter(l =>
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
        </div>
      </div>

      {/* ── Insights Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cold Storage Health */}
        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <ShieldCheck size={16} className="text-emerald-400" /> Cold Storage Health
          </h3>
          <div className="space-y-3">
            {[
              { hub: 'Nellore Hub', units: 8, temp: -22, status: 'Optimal', color: 'emerald' },
              { hub: 'Coastal Depot', units: 4, temp: -12, status: 'Warning', color: 'red' },
              { hub: 'Zone A Facility', units: 6, temp: -20, status: 'Optimal', color: 'emerald' },
            ].map(h => (
              <div key={h.hub} className={`flex items-center justify-between p-4 rounded-xl border ${
                h.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
              }`}>
                <div className="flex items-center gap-3">
                  <Thermometer size={18} className={h.color === 'emerald' ? 'text-emerald-400' : 'text-red-400'} />
                  <div>
                    <p className="font-bold text-sm">{h.hub}</p>
                    <p className="text-xs text-[var(--text-muted)]">{h.units} Units Active</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${h.color === 'emerald' ? 'text-emerald-400' : 'text-red-400'}`}>{h.temp}°C</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{h.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="glass-panel p-6">
          <h3 className="font-display font-bold flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-400" /> Logistics Efficiency
          </h3>
          <div className="space-y-5">
            {[
              { label: 'On-Time Delivery', value: 94, display: '94%', color: 'emerald' },
              { label: 'Fuel Efficiency Index', value: 82, display: '82%', color: 'blue' },
              { label: 'Fleet Utilization', value: 75, display: '75%', color: 'amber' },
              { label: 'Cold Chain Integrity', value: 97, display: '97%', color: 'teal' },
            ].map(({ label, value, display, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
                  <span className={`font-bold text-sm ${
                    color === 'emerald' ? 'text-emerald-400' :
                    color === 'blue'   ? 'text-blue-400' :
                    color === 'amber'  ? 'text-amber-400' : 'text-teal-400'
                  }`}>{display}</span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      color === 'emerald' ? 'bg-emerald-500' :
                      color === 'blue'   ? 'bg-blue-500' :
                      color === 'amber'  ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupplyChain;
