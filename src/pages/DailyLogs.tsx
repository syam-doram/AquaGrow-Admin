import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Search, Filter, Eye, Flag, Clock, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyLog } from '../types';
import { storageService } from '../services/storageService';

const StatusIcon = ({ status }: { status: DailyLog['status'] }) => {
  if (status === 'submitted') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'flagged') return <Flag size={14} className="text-red-400" />;
  return <Clock size={14} className="text-radiant-sun" />;
};

const DailyLogs = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  useEffect(() => { loadData(); }, []);
  const loadData = () => setLogs(storageService.getLogs());

  const stats = {
    submitted: logs.filter(l => l.status === 'submitted').length,
    missing: logs.filter(l => l.status === 'missing').length,
    flagged: logs.filter(l => l.status === 'flagged').length,
    abnormal: logs.filter(l => l.isAbnormal).length,
  };

  const filtered = logs.filter(l => {
    const ms = l.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.pondName.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = filterStatus === 'all' || l.status === filterStatus;
    return ms && mf;
  });

  const handleFlagLog = (log: DailyLog) => {
    const reason = prompt(`Flag reason for ${log.id}:`);
    if (reason) { storageService.flagLog(log.id, reason); loadData(); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Daily Logs Management</h1>
          <p className="text-zinc-400">Track daily submissions, detect missing logs, and flag suspicious data.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5"><div className="flex items-center justify-between mb-3"><div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={18} /></div></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Submitted Today</p><h3 className="text-3xl font-display font-bold text-emerald-400">{stats.submitted}</h3></div>
        <div className="glass-panel p-5"><div className="flex items-center justify-between mb-3"><div className="p-2.5 rounded-xl bg-radiant-sun/10 text-radiant-sun"><Clock size={18} /></div></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Missing Logs</p><h3 className="text-3xl font-display font-bold text-radiant-sun">{stats.missing}</h3></div>
        <div className="glass-panel p-5"><div className="flex items-center justify-between mb-3"><div className="p-2.5 rounded-xl bg-red-500/10 text-red-400"><Flag size={18} /></div></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Flagged Logs</p><h3 className="text-3xl font-display font-bold text-red-400">{stats.flagged}</h3></div>
        <div className="glass-panel p-5"><div className="flex items-center justify-between mb-3"><div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400"><AlertTriangle size={18} /></div></div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Abnormal Data</p><h3 className="text-3xl font-display font-bold text-orange-400">{stats.abnormal}</h3></div>
      </div>

      {/* Automation Rules Banner */}
      <div className="glass-panel p-5 border border-emerald-500/10 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><Activity size={18} /></div>
          <div>
            <p className="font-bold text-emerald-400 text-sm">Automation Rules Active</p>
            <p className="text-xs text-zinc-400">Missing logs trigger warning notifications → 3 consecutive days missing → feature restriction</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search by farmer, pond, or log ID..." className="input-field w-full pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <Filter size={16} className="text-zinc-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="missing">Missing</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Log ID / Farmer</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pond</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Feed (kg)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Mortality</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">DO / pH / Temp</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(log => (
                <tr key={log.id} className={`hover:bg-white/5 transition-colors ${log.isAbnormal ? 'bg-red-500/3' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-zinc-400">{log.id}</p>
                    <p className="font-bold text-zinc-100">{log.farmerName}</p>
                    {log.isAbnormal && <p className="text-[10px] text-red-400 mt-0.5">⚠ Abnormal</p>}
                  </td>
                  <td className="px-6 py-4"><p className="text-sm text-zinc-300">{log.pondName}</p></td>
                  <td className="px-6 py-4"><p className="text-sm text-zinc-400">{log.date}</p></td>
                  <td className="px-6 py-4"><p className="font-mono font-bold">{log.status === 'missing' ? '—' : log.feedGiven}</p></td>
                  <td className="px-6 py-4">
                    <p className={`font-mono font-bold ${log.mortalityCount > 50 ? 'text-red-400' : 'text-zinc-100'}`}>
                      {log.status === 'missing' ? '—' : log.mortalityCount}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'missing' ? (
                      <span className="text-zinc-600 text-xs italic">No data</span>
                    ) : (
                      <div className="text-xs space-y-0.5">
                        <p className="text-blue-400">{log.dissolvedOxygen} mg/L O₂</p>
                        <p className="text-zinc-400">pH {log.waterPh} • {log.temperature}°C</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={log.status} />
                      <span className={`text-xs font-medium ${log.status === 'submitted' ? 'text-emerald-400' : log.status === 'flagged' ? 'text-red-400' : 'text-radiant-sun'}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setSelectedLog(log)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"><Eye size={16} /></button>
                      {log.status !== 'flagged' && log.status !== 'missing' && (
                        <button onClick={() => handleFlagLog(log)} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"><Flag size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-xl font-display font-bold">Log Detail — {selectedLog.id}</h2><p className="text-sm text-zinc-400">{selectedLog.farmerName} • {selectedLog.pondName} • {selectedLog.date}</p></div>
                <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              {selectedLog.isAbnormal && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-xs font-bold text-red-400 uppercase mb-1">⚠ Abnormal Flag</p>
                  <p className="text-sm text-zinc-300">{selectedLog.abnormalReason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Feed Given', value: `${selectedLog.feedGiven} kg` },
                  { label: 'Mortality Count', value: selectedLog.mortalityCount },
                  { label: 'Water pH', value: selectedLog.waterPh },
                  { label: 'Dissolved O₂', value: `${selectedLog.dissolvedOxygen} mg/L` },
                  { label: 'Temperature', value: `${selectedLog.temperature}°C` },
                  { label: 'Submitted At', value: selectedLog.submittedAt || 'Not submitted' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
                    <p className="font-bold text-zinc-100">{String(value)}</p>
                  </div>
                ))}
              </div>
              {selectedLog.notes && (<div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5"><p className="text-xs text-zinc-500 uppercase font-bold mb-1">Notes</p><p className="text-sm text-zinc-300">{selectedLog.notes}</p></div>)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyLogs;
