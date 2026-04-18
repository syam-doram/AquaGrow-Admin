import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, CheckCircle2, XCircle, Clock, Search, Filter, TrendingUp,
  DollarSign, Scale, Star, Users, AlertTriangle, Truck, BarChart3,
  ArrowUpRight, BadgeCheck, RefreshCw, Activity, Award, Fish, Wifi, WifiOff,
  Leaf, ArrowDownRight, ClipboardList, ChevronRight, Database, Waves,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchHarvestRequests, fetchPonds, fetchFarmers, fetchIntelligence,
  approveHarvestRequest, completeHarvestRequest, updateHarvestRequest,
  type LiveHarvestRequest, type LivePond, type LiveFarmer, type IntelligenceData,
} from '../services/aquagrowApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  accepted:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
};

const StatusBadge = ({ s }: { s: string }) => (
  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[s] ?? 'bg-zinc-700/10 text-zinc-400 border-zinc-700/20'}`}>
    {s.replace(/_/g, ' ').toUpperCase()}
  </span>
);

const fmtK = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n.toFixed(0)}`;

type Tab = 'requests' | 'active' | 'completed' | 'ponds' | 'analytics';

// ─── Approve Modal ────────────────────────────────────────────────────────────
const ApproveModal = ({
  harvest, onClose, onApprove,
}: { harvest: LiveHarvestRequest; onClose: () => void; onApprove: (price: number, finalWeight: number) => void }) => {
  const [price, setPrice] = useState(harvest.price ?? 450);
  const [weight, setWeight] = useState(harvest.biomass);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md card p-8 shadow-2xl space-y-5">
        <div>
          <h3 className="text-xl font-display font-bold">Approve Harvest</h3>
          <p className="text-sm text-zinc-400 mt-1">Set final weight & price before approving</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Final Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(+e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Price per kg (₹)</label>
            <input type="number" value={price} onChange={e => setPrice(+e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-xs text-zinc-400">Estimated total</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">₹{(price * weight).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 text-sm font-bold py-2.5 px-4 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={() => onApprove(price, weight)} className="flex-1 text-sm font-bold py-2.5 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
            <CheckCircle2 size={14} /> Approve
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Complete Modal ───────────────────────────────────────────────────────────
const CompleteModal = ({
  harvest, onClose, onComplete,
}: { harvest: LiveHarvestRequest; onClose: () => void; onComplete: (finalTotal: number) => void }) => {
  const defaultTotal = (harvest.price ?? 450) * (harvest.finalWeight ?? harvest.biomass);
  const [total, setTotal] = useState(defaultTotal);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md card p-8 shadow-2xl space-y-5">
        <div>
          <h3 className="text-xl font-display font-bold">Mark as Completed</h3>
          <p className="text-sm text-zinc-400 mt-1">Confirm final payment total</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Final Total (₹)</label>
            <input type="number" value={total} onChange={e => setTotal(+e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-[10px] text-zinc-500">Final Weight</p>
              <p className="font-bold text-sm">{(harvest.finalWeight ?? harvest.biomass).toLocaleString()} kg</p>
            </div>
            <div className="p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-[10px] text-zinc-500">Price /kg</p>
              <p className="font-bold text-sm">₹{harvest.price ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 text-sm font-bold py-2.5 px-4 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={() => onComplete(total)} className="flex-1 text-sm font-bold py-2.5 px-4 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
            <BadgeCheck size={14} /> Complete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const HarvestManagement = () => {
  const [tab, setTab] = useState<Tab>('requests');
  const [harvests, setHarvests] = useState<LiveHarvestRequest[]>([]);
  const [ponds, setPonds] = useState<LivePond[]>([]);
  const [farmers, setFarmers] = useState<LiveFarmer[]>([]);
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [approveTarget, setApproveTarget] = useState<LiveHarvestRequest | null>(null);
  const [completeTarget, setCompleteTarget] = useState<LiveHarvestRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiStatus('loading');
    try {
      const [h, p, f, i] = await Promise.allSettled([
        fetchHarvestRequests(),
        fetchPonds(),
        fetchFarmers(),
        fetchIntelligence(),
      ]);
      if (h.status === 'fulfilled') setHarvests(h.value);
      if (p.status === 'fulfilled') setPonds(p.value);
      if (f.status === 'fulfilled') setFarmers(f.value);
      if (i.status === 'fulfilled') setIntel(i.value);
      setApiStatus('online');
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      setApiStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Enrich harvests with farmer/pond info ────────────────────────────────────
  const enriched = useMemo(() => harvests.map(h => {
    const pond = ponds.find(p => p._id === h.pondId);
    const farmer = farmers.find(f => f._id === h.userId);
    return { ...h, _pond: pond, _farmer: farmer };
  }), [harvests, ponds, farmers]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:   harvests.filter(h => h.status === 'pending').length,
    accepted:  harvests.filter(h => h.status === 'accepted').length,
    completed: harvests.filter(h => h.status === 'completed').length,
    rejected:  harvests.filter(h => h.status === 'rejected').length,
    totalBiomass: harvests.reduce((s, h) => s + h.biomass, 0),
    completedRevenue: harvests.filter(h => h.status === 'completed').reduce((s, h) => s + (h.finalTotal ?? 0), 0),
    harvestReady: ponds.filter(p => p.alerts.includes('HARVEST_READY')).length,
  }), [harvests, ponds]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => enriched.filter(h => {
    const farmerName = h._farmer?.name ?? '';
    const pondName   = h._pond?.name   ?? '';
    const ms = [farmerName, pondName, h._id].some(s => s.toLowerCase().includes(search.toLowerCase()));
    const mf = filterStatus === 'all' || h.status === filterStatus;
    return ms && mf;
  }), [enriched, search, filterStatus]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleApprove = async (price: number, finalWeight: number) => {
    if (!approveTarget) return;
    setActionLoading(approveTarget._id);
    try {
      await approveHarvestRequest(approveTarget._id, price, finalWeight);
      setApproveTarget(null);
      await load();
    } catch (e: any) {
      alert('Failed to approve: ' + e.message);
    } finally { setActionLoading(null); }
  };

  const handleComplete = async (finalTotal: number) => {
    if (!completeTarget) return;
    setActionLoading(completeTarget._id);
    try {
      await completeHarvestRequest(completeTarget._id, finalTotal);
      setCompleteTarget(null);
      await load();
    } catch (e: any) {
      alert('Failed to complete: ' + e.message);
    } finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this harvest request?')) return;
    setActionLoading(id);
    try {
      await updateHarvestRequest(id, { status: 'rejected' });
      await load();
    } catch (e: any) {
      alert('Failed to reject: ' + e.message);
    } finally { setActionLoading(null); }
  };

  const TABS: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'requests',  label: 'All Requests',   icon: ClipboardList, badge: stats.pending },
    { id: 'active',    label: 'Active / Accepted', icon: Activity,   badge: stats.accepted },
    { id: 'completed', label: 'Completed',       icon: BadgeCheck,   badge: stats.completed },
    { id: 'ponds',     label: 'Harvest-Ready Ponds', icon: Fish,     badge: stats.harvestReady },
    { id: 'analytics', label: 'Analytics',       icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-1">Harvest Management</h1>
          <p className="text-zinc-400 text-sm">Live harvest requests from AquaGrow MongoDB</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            apiStatus === 'online'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            apiStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                      'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            {apiStatus === 'online' ? <Wifi size={12} /> : apiStatus === 'offline' ? <WifiOff size={12} /> : <RefreshCw size={12} className="animate-spin" />}
            {apiStatus === 'online' ? 'DB Live' : apiStatus === 'offline' ? 'DB Offline' : 'Syncing...'}
          </div>
          {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Pending',       value: stats.pending,    color: 'text-amber-400',   icon: Clock },
          { label: 'Accepted',      value: stats.accepted,   color: 'text-blue-400',    icon: CheckCircle2 },
          { label: 'Completed',     value: stats.completed,  color: 'text-emerald-400', icon: BadgeCheck },
          { label: 'Rejected',      value: stats.rejected,   color: 'text-red-400',     icon: XCircle },
          { label: 'Total Biomass', value: `${stats.totalBiomass.toLocaleString()} kg`, color: 'text-cyan-400', icon: Scale },
          { label: 'Revenue',       value: fmtK(stats.completedRevenue), color: 'text-emerald-400', icon: DollarSign },
          { label: 'Ready Ponds',   value: stats.harvestReady, color: stats.harvestReady > 0 ? 'text-amber-400' : 'text-zinc-600', icon: Fish },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-4 text-center">
            <Icon size={16} className={`mx-auto mb-1.5 ${color}`} />
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">{label}</p>
            <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/3 rounded-2xl border border-white/5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
            <t.icon size={13} />{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-red-500/80 text-white'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ ALL REQUESTS ══════════════════════════════════════════════════════ */}
      {(tab === 'requests' || tab === 'active' || tab === 'completed') && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Search farmer, pond..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Filter size={13} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <span className="flex items-center text-xs text-zinc-500 px-1">{filtered.length} records</span>
          </div>

          {loading ? (
            <div className="card p-12 text-center animate-pulse">
              <Database size={28} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-600">Loading from MongoDB...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Package size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">{harvests.length === 0 ? 'No harvest requests in database' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/3">
                      {['ID', 'Farmer', 'Pond', 'Biomass', 'Avg Wt', 'Price /kg', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered
                      .filter(h =>
                        tab === 'requests'  ? true :
                        tab === 'active'    ? h.status === 'accepted' :
                        tab === 'completed' ? h.status === 'completed' : true
                      )
                      .map((h, i) => (
                      <motion.tr key={h._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-0.5 rounded w-fit">{h._id.slice(-8)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-bold text-sm">{h._farmer?.name ?? `User…${h.userId.slice(-4)}`}</p>
                            <p className="text-[10px] text-zinc-500">{h._farmer?.phoneNumber ?? '—'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm text-zinc-300">{h._pond?.name ?? `Pond…${h.pondId.slice(-4)}`}</p>
                            {h._pond && <p className="text-[10px] text-zinc-500">{h._pond.species ?? 'Vannamei'} · DOC {h._pond.doc}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold">{h.biomass.toLocaleString()} kg</td>
                        <td className="px-5 py-4 text-sm">{h.avgWeight}g</td>
                        <td className="px-5 py-4">
                          {h.price ? <span className="text-emerald-400 font-bold font-mono">₹{h.price}</span> : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          {h.finalTotal ? <span className="text-emerald-400 font-bold font-mono">{fmtK(h.finalTotal)}</span> :
                           h.price ? <span className="text-zinc-400 font-mono text-sm">{fmtK(h.price * h.biomass)}</span> :
                           <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-5 py-4"><StatusBadge s={h.status} /></td>
                        <td className="px-5 py-4 text-xs text-zinc-500">{new Date(h.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {h.status === 'pending' && (
                              <>
                                <button onClick={() => setApproveTarget(h)}
                                  disabled={actionLoading === h._id}
                                  className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approve">
                                  <CheckCircle2 size={14} />
                                </button>
                                <button onClick={() => handleReject(h._id)}
                                  disabled={actionLoading === h._id}
                                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Reject">
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                            {h.status === 'accepted' && (
                              <button onClick={() => setCompleteTarget(h)}
                                disabled={actionLoading === h._id}
                                className="text-xs font-bold px-2.5 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-all">
                                {actionLoading === h._id ? '...' : 'Complete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ HARVEST-READY PONDS ═══════════════════════════════════════════════ */}
      {tab === 'ponds' && (
        <div className="space-y-5">
          {/* Alert banner */}
          {stats.harvestReady > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <div>
                <p className="font-bold">{stats.harvestReady} pond{stats.harvestReady > 1 ? 's' : ''} ready for harvest</p>
                <p className="text-xs opacity-70 mt-0.5">These ponds have reached harvest-ready stage — farmer may have already submitted a request above.</p>
              </div>
            </div>
          )}

          {ponds.filter(p => p.alerts.includes('HARVEST_READY') || p.stage === 'Harvest Ready').length === 0 ? (
            <div className="card p-12 text-center">
              <Fish size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">No ponds currently at harvest-ready stage</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ponds.filter(p => p.alerts.includes('HARVEST_READY') || p.stage === 'Harvest Ready').map((pond, i) => {
                const hasRequest = harvests.some(h => h.pondId === pond._id && ['pending','accepted'].includes(h.status));
                return (
                  <motion.div key={pond._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-5 border border-amber-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">{pond.name}</p>
                        <p className="text-xs text-zinc-500">{pond.farmer?.name ?? '—'} · {pond.species ?? 'Vannamei'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400">HARVEST READY</span>
                        <span className="text-[10px] text-zinc-500">DOC {pond.doc}</span>
                      </div>
                    </div>
                    {pond.lastWaterLog && (
                      <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 rounded-xl bg-white/3 border border-white/5 text-center">
                        <div><p className="text-[10px] text-zinc-500">pH</p><p className="text-sm font-bold">{pond.lastWaterLog.ph?.toFixed(1) ?? '—'}</p></div>
                        <div><p className="text-[10px] text-zinc-500">DO</p><p className="text-sm font-bold">{pond.lastWaterLog.do?.toFixed(1) ?? '—'}</p></div>
                        <div><p className="text-[10px] text-zinc-500">Temp</p><p className="text-sm font-bold">{pond.lastWaterLog.temp?.toFixed(1) ?? '—'}°</p></div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Feed 7d: <b className="text-white">{pond.feedLast7Days.toFixed(1)} kg</b></span>
                      {pond.size && <span>Size: <b className="text-white">{pond.size} ac</b></span>}
                    </div>
                    {hasRequest && (
                      <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-bold flex items-center gap-1">
                        <ClipboardList size={10} /> Harvest request submitted
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYTICS ════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary from intelligence */}
          {intel && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3"><DollarSign size={18} /></div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Revenue</p>
                <p className="text-2xl font-display font-bold text-emerald-400 mt-1">{fmtK(intel.summary.totalRevenue)}</p>
              </div>
              <div className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3"><Scale size={18} /></div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Biomass Harvested</p>
                <p className="text-2xl font-display font-bold text-blue-400 mt-1">{intel.summary.totalHarvestBiomassKg.toFixed(0)} kg</p>
              </div>
              <div className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3"><TrendingUp size={18} /></div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Avg ROI</p>
                <p className="text-2xl font-display font-bold text-purple-400 mt-1">{intel.summary.avgROI}%</p>
              </div>
              <div className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3"><Fish size={18} /></div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Harvest Ready</p>
                <p className="text-2xl font-display font-bold text-amber-400 mt-1">{intel.summary.harvestReadyCount}</p>
              </div>
            </div>
          )}

          {/* Live stats breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-400" /> Status Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Pending Review',  value: stats.pending,   total: harvests.length, color: 'bg-amber-500' },
                  { label: 'Accepted',         value: stats.accepted,  total: harvests.length, color: 'bg-blue-500' },
                  { label: 'Completed',        value: stats.completed, total: harvests.length, color: 'bg-emerald-500' },
                  { label: 'Rejected',         value: stats.rejected,  total: harvests.length, color: 'bg-red-500' },
                ].map(({ label, value, total, color }) => {
                  const pct = total ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-zinc-300">{label}</span>
                        <span className="text-zinc-500">{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                          className={`h-full ${color} rounded-full`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent completed */}
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><BadgeCheck size={18} className="text-emerald-400" /> Recent Completed</h3>
              {enriched.filter(h => h.status === 'completed').slice(0, 6).length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">No completed harvests yet</div>
              ) : (
                <div className="space-y-3">
                  {enriched.filter(h => h.status === 'completed').slice(0, 6).map(h => (
                    <div key={h._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                      <div>
                        <p className="text-sm font-bold">{h._farmer?.name ?? `User…${h.userId.slice(-4)}`}</p>
                        <p className="text-[10px] text-zinc-500">{h._pond?.name ?? `Pond…${h.pondId.slice(-4)}`} · {h.biomass} kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-sm">{h.finalTotal ? fmtK(h.finalTotal) : '—'}</p>
                        <p className="text-[10px] text-zinc-500">₹{h.price ?? '—'}/kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top harvest farmers */}
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Users size={18} className="text-blue-400" /> Top Harvest Farmers (by biomass)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/3">
                  {['Farmer', 'Total Requests', 'Total Biomass', 'Completed', 'Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {Object.entries(
                    enriched.reduce((acc, h) => {
                      const key = h.userId;
                      if (!acc[key]) acc[key] = { farmer: h._farmer, requests: 0, biomass: 0, completed: 0, revenue: 0 };
                      acc[key].requests++;
                      acc[key].biomass += h.biomass;
                      if (h.status === 'completed') { acc[key].completed++; acc[key].revenue += h.finalTotal ?? 0; }
                      return acc;
                    }, {} as Record<string, any>)
                  )
                  .sort((a, b) => b[1].biomass - a[1].biomass)
                  .slice(0, 8)
                  .map(([uid, d], i) => (
                    <tr key={uid} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 text-xs font-bold w-4">#{i + 1}</span>
                          <div>
                            <p className="font-bold text-sm">{d.farmer?.name ?? `User…${uid.slice(-6)}`}</p>
                            <p className="text-[10px] text-zinc-500">{d.farmer?.phoneNumber ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{d.requests}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{d.biomass.toLocaleString()} kg</td>
                      <td className="px-4 py-3"><span className="text-emerald-400 font-bold">{d.completed}</span></td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{d.revenue ? fmtK(d.revenue) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveModal harvest={approveTarget} onClose={() => setApproveTarget(null)} onApprove={handleApprove} />
        )}
        {completeTarget && (
          <CompleteModal harvest={completeTarget} onClose={() => setCompleteTarget(null)} onComplete={handleComplete} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HarvestManagement;
