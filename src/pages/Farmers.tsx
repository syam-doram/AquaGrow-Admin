import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, MapPin, ShieldCheck, Wifi, WifiOff,
  Phone, Activity, TrendingUp, Award, CreditCard, BarChart3,
  Eye, RefreshCw, Bell, ChevronRight, Waves,
  ArrowLeft, Calendar, Info, Star, Database,
  Fish, Droplets, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchFarmers, fetchPonds, fetchIntelligence,
  type LiveFarmer, type LivePond, type IntelligenceData,
} from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'detail';
type Tab = 'all' | 'active' | 'ponds' | 'insights';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SUB_COLORS: Record<string, string> = {
  pro_diamond: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pro_gold:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pro_silver:  'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
  pro:         'bg-blue-500/20 text-blue-400 border-blue-500/30',
  free:        'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};

const ALERT_COLORS: Record<string, string> = {
  CRITICAL_LOW_DO: 'bg-red-500/20 text-red-400',
  PH_OUT_OF_RANGE: 'bg-orange-500/20 text-orange-400',
  HIGH_AMMONIA:    'bg-yellow-500/20 text-yellow-400',
  HIGH_MORTALITY:  'bg-red-600/20 text-red-300',
  HARVEST_READY:   'bg-emerald-500/20 text-emerald-400',
  PEAK_WSSV_RISK:  'bg-purple-500/20 text-purple-400',
};

const STAGE_COLORS: Record<string, string> = {
  Nursery:        'bg-cyan-500/20 text-cyan-400',
  'Early Growth': 'bg-green-500/20 text-green-400',
  'Mid Growth':   'bg-blue-500/20 text-blue-400',
  'Pre-Harvest':  'bg-amber-500/20 text-amber-400',
  'Harvest Ready':'bg-emerald-500/20 text-emerald-400',
  Harvest:        'bg-emerald-500/20 text-emerald-400',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Pond Card ────────────────────────────────────────────────────────────────
const PondCard = ({ pond }: { pond: LivePond }) => (
  <motion.div whileHover={{ y: -2 }}
    className="card p-5 hover:border-emerald-500/30 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-bold">{pond.name}</p>
        <p className="text-xs text-zinc-500">{pond.species || 'Vannamei'}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STAGE_COLORS[pond.stage] || 'bg-zinc-600/20 text-zinc-400'}`}>
          {pond.stage}
        </span>
        <span className="text-[10px] text-zinc-500">DOC {pond.doc}</span>
      </div>
    </div>
    {pond.lastWaterLog ? (
      <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 rounded-xl bg-white/3 border border-white/5">
        {[['pH', pond.lastWaterLog.ph, v => v < 7 || v > 9], ['DO', pond.lastWaterLog.do, v => v < 4], ['Mort.', pond.lastWaterLog.mortality, v => v > 50]].map(([k, v, bad]: any) => (
          <div key={String(k)} className="text-center">
            <p className="text-[10px] text-zinc-500">{k}</p>
            <p className={`text-sm font-bold ${v != null && bad(v) ? 'text-red-400' : 'text-white'}`}>
              {v?.toFixed?.(1) ?? v ?? '—'}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-2 text-center text-[10px] text-zinc-600 bg-white/3 rounded-xl mb-3">No water logs</div>
    )}
    <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
      <span>Feed 7d: <b className="text-white">{pond.feedLast7Days.toFixed(1)} kg</b></span>
      {pond.size && <span>Size: <b className="text-white">{pond.size} ac</b></span>}
    </div>
    {pond.alerts.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {pond.alerts.map(a => (
          <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${ALERT_COLORS[a] || 'bg-zinc-600/20 text-zinc-400'}`}>
            {a.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    )}
  </motion.div>
);

// ─── Farmer Detail View ───────────────────────────────────────────────────────
const FarmerDetail = ({ farmer, ponds, onBack }: {
  farmer: LiveFarmer;
  ponds: LivePond[];
  onBack: () => void;
}) => {
  const farmerPonds = ponds.filter(p => p.userId === farmer._id);
  const activePonds = farmerPonds.filter(p => p.status === 'active');
  const harvestReady = farmerPonds.filter(p => p.alerts.includes('HARVEST_READY'));
  const criticalPonds = farmerPonds.filter(p =>
    p.alerts.some(a => ['CRITICAL_LOW_DO', 'HIGH_AMMONIA', 'HIGH_MORTALITY'].includes(a))
  );

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col pt-16 md:pt-0 overflow-y-auto">
      {/* Navbar */}
      <div className="bg-zinc-900/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold">{farmer.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SUB_COLORS[farmer.subscriptionStatus] || SUB_COLORS.free}`}>
                {farmer.subscriptionStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">{farmer._id} · {farmer.location || 'No location'}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 hidden md:block">
          Joined {new Date(farmer.createdAt).toLocaleDateString('en-IN')}
        </span>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Ponds', value: farmerPonds.length, color: 'text-blue-400' },
            { label: 'Active Ponds', value: activePonds.length, color: 'text-emerald-400' },
            { label: 'Harvest Ready', value: harvestReady.length, color: 'text-amber-400' },
            { label: 'Critical Alerts', value: criticalPonds.length, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p>
              <p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Profile */}
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Info size={18} className="text-emerald-400" /> Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-[10px] text-zinc-500 mb-1">Phone</p>
              <p className="font-bold flex items-center gap-1"><Phone size={12} className="text-emerald-400" />{farmer.phoneNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-[10px] text-zinc-500 mb-1">Location</p>
              <p className="font-bold flex items-center gap-1"><MapPin size={12} className="text-emerald-400" />{farmer.location || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-[10px] text-zinc-500 mb-1">Plan</p>
              <p className="font-bold">{farmer.subscriptionStatus.replace('_', ' ')}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/3">
              <p className="text-[10px] text-zinc-500 mb-1">Joined</p>
              <p className="font-bold flex items-center gap-1"><Calendar size={12} className="text-emerald-400" />{new Date(farmer.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Ponds */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Fish size={18} className="text-cyan-400" /> Ponds ({farmerPonds.length})</h3>
          {farmerPonds.length === 0 ? (
            <div className="card p-10 text-center">
              <Fish size={28} className="mx-auto text-zinc-600 mb-2" />
              <p className="text-zinc-500 text-sm">No ponds found for this farmer</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {farmerPonds.map(p => <PondCard key={p._id} pond={p} />)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Farmers = () => {
  const [tab, setTab]               = useState<Tab>('all');
  const [farmers, setFarmers]       = useState<LiveFarmer[]>([]);
  const [ponds, setPonds]           = useState<LivePond[]>([]);
  const [intel, setIntel]           = useState<IntelligenceData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [apiStatus, setApiStatus]   = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync]     = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [filterSub, setFilterSub]   = useState('all');
  const [viewMode, setViewMode]     = useState<ViewMode>('list');
  const [selected, setSelected]     = useState<LiveFarmer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiStatus('loading');
    try {
      const [f, p, i] = await Promise.allSettled([fetchFarmers(), fetchPonds(), fetchIntelligence()]);
      if (f.status === 'fulfilled') setFarmers(f.value);
      if (p.status === 'fulfilled') setPonds(p.value);
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
  useEffect(() => {
    const t = setInterval(load, 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    farmers.length,
    active:   farmers.filter(f => f.subscriptionStatus !== 'free').length,
    premium:  farmers.filter(f => ['pro_diamond','pro_gold'].includes(f.subscriptionStatus)).length,
    withPonds:new Set(ponds.map(p => p.userId)).size,
  }), [farmers, ponds]);

  // ── Filtered ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = farmers;
    if (tab === 'active') list = list.filter(f => f.subscriptionStatus !== 'free');
    if (search) list = list.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.phoneNumber.includes(search) ||
      (f.location || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterSub !== 'all') list = list.filter(f => f.subscriptionStatus === filterSub);
    return list;
  }, [farmers, tab, search, filterSub]);

  const openDetail = (f: LiveFarmer) => { setSelected(f); setViewMode('detail'); };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <AnimatePresence>
        {viewMode === 'detail' && selected && (
          <FarmerDetail
            farmer={selected}
            ponds={ponds}
            onBack={() => { setViewMode('list'); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-1">Farmer Management</h1>
          <p className="text-zinc-400 text-sm">Live data from AquaGrow MongoDB — shared with the mobile app</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            apiStatus === 'online'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            apiStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                       'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            {apiStatus === 'online' ? <Wifi size={12} /> : apiStatus === 'offline' ? <WifiOff size={12} /> : <RefreshCw size={12} className="animate-spin" />}
            {apiStatus === 'online' ? 'DB Connected' : apiStatus === 'offline' ? 'DB Offline' : 'Syncing...'}
          </div>
          {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {apiStatus === 'offline' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Cannot connect to AquaGrow database</p>
            <p className="text-xs opacity-70 mt-0.5">Ensure you're logged in as an admin user. The API token must be valid.</p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Farmers',    value: stats.total,    color: 'bg-blue-500/10 text-blue-400',    icon: Users },
          { label: 'Subscribed',       value: stats.active,   color: 'bg-emerald-500/10 text-emerald-400', icon: Star },
          { label: 'Premium (Gold+)',  value: stats.premium,  color: 'bg-yellow-500/10 text-yellow-400', icon: Award },
          { label: 'Have Active Ponds',value: stats.withPonds,color: 'bg-cyan-500/10 text-cyan-400',    icon: Waves },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p>
              <p className="text-2xl font-display font-bold mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/3 rounded-2xl border border-white/5 w-fit">
        {([
          { id: 'all', label: 'All Farmers', icon: Users },
          { id: 'active', label: 'Subscribed', icon: Star },
          { id: 'ponds', label: 'Pond Monitor', icon: Waves },
          { id: 'insights', label: 'Insights', icon: BarChart3 },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: ALL / ACTIVE FARMERS ═══════ */}
      {(tab === 'all' || tab === 'active') && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, phone, location..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={13} className="text-zinc-500" />
              <select value={filterSub} onChange={e => setFilterSub(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="pro_silver">Silver</option>
                <option value="pro_gold">Gold</option>
                <option value="pro_diamond">Diamond</option>
              </select>
            </div>
            <p className="flex items-center text-xs text-zinc-500 px-2">{filtered.length} farmers</p>
          </div>

          {loading ? (
            <div className="card p-12 text-center animate-pulse">
              <Database size={28} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-600">Loading from MongoDB...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Users size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">{farmers.length === 0 ? 'No farmers registered yet in database' : 'No matches found'}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/3">
                    {['Farmer', 'Phone', 'Location', 'Plan', 'Ponds', 'Joined'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => {
                    const fPonds = ponds.filter(p => p.userId === f._id);
                    const hasAlert = fPonds.some(p => p.alerts.length > 0);
                    return (
                      <motion.tr key={f._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                        onClick={() => openDetail(f)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`relative w-9 h-9 rounded-xl ${hasAlert ? 'bg-red-500/20' : 'bg-emerald-500/10'} flex items-center justify-center font-bold text-xs`}>
                              {getInitials(f.name)}
                              {hasAlert && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{f.name}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">{f._id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-300">{f.phoneNumber}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-400">{f.location || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SUB_COLORS[f.subscriptionStatus] || SUB_COLORS.free}`}>
                            {f.subscriptionStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Waves size={12} className="text-blue-400" />
                            <span className="text-sm font-bold">{fPonds.length}</span>
                            {fPonds.filter(p => p.status === 'active').length > 0 && (
                              <span className="text-[10px] text-emerald-400">({fPonds.filter(p => p.status === 'active').length} active)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">
                          {new Date(f.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB: POND MONITOR ═══════ */}
      {tab === 'ponds' && (
        <div className="space-y-5">
          {loading ? (
            <div className="card p-12 text-center animate-pulse"><Database size={28} className="mx-auto text-zinc-700 mb-3" /><p className="text-zinc-600">Loading ponds...</p></div>
          ) : ponds.length === 0 ? (
            <div className="card p-12 text-center"><Fish size={32} className="mx-auto text-zinc-600 mb-3" /><p className="text-zinc-500">No ponds found in database</p></div>
          ) : (
            <>
              {/* Alert summary */}
              {ponds.some(p => p.alerts.length > 0) && (
                <div className="card p-5 border border-red-500/20 bg-red-500/5">
                  <p className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={15} /> Critical Pond Alerts</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {ponds.filter(p => p.alerts.some(a => ['CRITICAL_LOW_DO','HIGH_AMMONIA','HIGH_MORTALITY'].includes(a))).slice(0, 6).map(p => (
                      <div key={p._id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle size={11} className="text-red-400 shrink-0" />
                        <span className="font-bold">{p.name}</span>
                        <span className="text-zinc-400">({p.farmer?.name || p.userId.slice(-6)})</span>
                        <span className="text-red-300">{p.alerts.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {ponds.map(p => <PondCard key={p._id} pond={p} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ TAB: INSIGHTS ═══════ */}
      {tab === 'insights' && (
        <div className="space-y-6">
          {intel ? (
            <>
              {/* Stage distribution */}
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Culture Stage Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(intel.stageDistribution).map(([stage, count]) => {
                    const pct = intel.summary.activePonds ? Math.round((count / intel.summary.activePonds) * 100) : 0;
                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{stage}</span><span className="text-zinc-400">{count} ponds ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                            className="h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subscription breakdown */}
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard size={18} className="text-blue-400" /> Subscription Plans</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(intel.subscriptionBreakdown).map(([plan, count]) => (
                    <div key={plan} className="p-4 rounded-xl bg-white/3 border border-white/5 text-center">
                      <p className="text-xs text-zinc-500 capitalize">{plan.replace('_', ' ')}</p>
                      <p className="text-3xl font-display font-bold mt-1">{count}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top feed consumers */}
              {intel.topFeedConsumers.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-amber-400" /> Top Feed Consumers (7 days)</h3>
                  <div className="space-y-2">
                    {intel.topFeedConsumers.map((c, i) => {
                      const f = farmers.find(x => x._id === c.farmerId);
                      return (
                        <div key={c.farmerId} className="flex items-center gap-4 p-3 rounded-xl bg-white/3">
                          <span className="text-zinc-600 font-bold w-5">#{i+1}</span>
                          <span className="flex-1 font-bold">{f?.name || c.farmerId.slice(-6)}</span>
                          <span className="text-emerald-400 font-bold">{c.feedKg.toFixed(1)} kg</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <BarChart3 size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-500">{loading ? 'Loading insights...' : 'No intelligence data available'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Farmers;
