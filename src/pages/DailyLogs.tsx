import React, { useState, useEffect } from 'react';
import { Search, Pill } from 'lucide-react';
import { fetchFeedLogs, fetchMedicineLogs, LiveFeedLog, LiveMedicineLog } from '../services/aquagrowApi';


const DailyLogs = () => {
  const [tab, setTab] = useState<'feed' | 'medicine'>('feed');
  const [feedLogs, setFeedLogs] = useState<LiveFeedLog[]>([]);
  const [medicineLogs, setMedicineLogs] = useState<LiveMedicineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([fetchFeedLogs(), fetchMedicineLogs()])
      .then(([f, m]) => { setFeedLogs(f); setMedicineLogs(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredFeed = feedLogs.filter(l =>
    !searchTerm ||
    l.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.pond?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMed = medicineLogs.filter(l =>
    !searchTerm ||
    l.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.pond?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.medicineName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalFeed: feedLogs.length,
    totalFeedKg: feedLogs.reduce((s, l) => s + (l.quantity || 0), 0),
    totalMedicine: medicineLogs.length,
    uniqueFarmers: new Set([...feedLogs.map(l => l.userId), ...medicineLogs.map(l => l.userId)]).size,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Daily Logs Management</h1>
          <p className="text-zinc-400">Live feed and medicine logs from all farmers — unified database view.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Feed Logs</p><h3 className="text-3xl font-display font-bold text-emerald-400">{stats.totalFeed}</h3></div>
        <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Feed (kg)</p><h3 className="text-3xl font-display font-bold text-blue-400">{stats.totalFeedKg.toFixed(1)}</h3></div>
        <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Medicine Logs</p><h3 className="text-3xl font-display font-bold text-purple-400">{stats.totalMedicine}</h3></div>
        <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Active Farmers</p><h3 className="text-3xl font-display font-bold text-amber-400">{stats.uniqueFarmers}</h3></div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          <button onClick={() => setTab('feed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'feed' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Feed Logs</button>
          <button onClick={() => setTab('medicine')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'medicine' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}>Medicine Logs</button>
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search by farmer or pond..." className="input-field w-full pl-12" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Feed Logs Table */}
      {tab === 'feed' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">Feed Logs <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span></h3>
            <span className="text-xs text-zinc-500">{loading ? 'Loading…' : `${filteredFeed.length} records`}</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Loading feed logs…</div>
            ) : filteredFeed.length === 0 ? (
              <div className="p-10 text-center text-zinc-600">No feed logs found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Farmer','Phone','Pond','Feed Type','Quantity','Unit','Date'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFeed.map(log => (
                    <tr key={log._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><p className="font-bold text-sm">{log.farmer?.name ?? '—'}</p></td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.farmer?.phoneNumber ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{log.pond?.name ?? log.pondId?.slice(-6) ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400 capitalize">{log.feedType ?? '—'}</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">{log.quantity}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.unit ?? 'kg'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.date ? new Date(log.date).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Medicine Logs Table */}
      {tab === 'medicine' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">Medicine Logs <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">LIVE</span></h3>
            <span className="text-xs text-zinc-500">{loading ? 'Loading…' : `${filteredMed.length} records`}</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Loading medicine logs…</div>
            ) : filteredMed.length === 0 ? (
              <div className="p-10 text-center text-zinc-600">No medicine logs found.</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Farmer','Phone','Pond','Medicine','Dosage','Quantity','Date'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMed.map(log => (
                    <tr key={log._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><p className="font-bold text-sm">{log.farmer?.name ?? '—'}</p></td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.farmer?.phoneNumber ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{log.pond?.name ?? log.pondId?.slice(-6) ?? '—'}</td>
                      <td className="px-5 py-4 font-bold text-purple-400">{log.medicineName ?? '—'}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{log.dosage ?? '—'}</td>
                      <td className="px-5 py-4 font-mono text-sm">{log.quantity ?? '—'} {log.unit ?? ''}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{log.date ? new Date(log.date).toLocaleDateString() : new Date(log.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLogs;
