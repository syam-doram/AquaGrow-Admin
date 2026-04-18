import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, AlertTriangle, Users, Droplets, TrendingUp, Package,
  ShoppingCart, Zap, RefreshCw, CheckCircle, XCircle, Clock,
  Fish, Leaf, ChevronRight, Database, Wifi, WifiOff, Eye,
  BarChart2, DollarSign, FlaskConical, Star, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  fetchIntelligence, fetchFarmers, fetchPonds, fetchHarvestRequests,
  fetchWaterAlerts, fetchAllOrders, fetchROI, checkApiHealth,
  type IntelligenceData, type LiveFarmer, type LivePond,
  type LiveHarvestRequest, type LiveShopOrder,
} from '../services/aquagrowApi';

// ─── Alert badge colors ───────────────────────────────────────────────────────
const ALERT_COLORS: Record<string, string> = {
  CRITICAL_LOW_DO:  'bg-red-500/20 text-red-400 border-red-500/30',
  PH_OUT_OF_RANGE:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  HIGH_AMMONIA:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HIGH_MORTALITY:   'bg-red-600/20 text-red-300 border-red-600/30',
  HARVEST_READY:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PEAK_WSSV_RISK:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  WSSV_RISK:        'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STAGE_COLORS: Record<string, string> = {
  Nursery:       'bg-cyan-500/20 text-cyan-400',
  'Early Growth':'bg-green-500/20 text-green-400',
  'Mid Growth':  'bg-blue-500/20 text-blue-400',
  'Pre-Harvest': 'bg-amber-500/20 text-amber-400',
  'Harvest Ready':'bg-emerald-500/20 text-emerald-400',
  Harvest:       'bg-emerald-500/20 text-emerald-400',
};

const STATUS_COLORS: Record<string, string> = {
  assigned:   'bg-blue-500/20 text-blue-400',
  confirmed:  'bg-cyan-500/20 text-cyan-400',
  shipped:    'bg-amber-500/20 text-amber-400',
  delivered:  'bg-emerald-500/20 text-emerald-400',
  cancelled:  'bg-red-500/20 text-red-400',
  pending:    'bg-yellow-500/20 text-yellow-400',
  accepted:   'bg-blue-500/20 text-blue-400',
  completed:  'bg-emerald-500/20 text-emerald-400',
  paid:       'bg-purple-500/20 text-purple-400',
};

// ─── Small reusable components ────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; trend?: 'up' | 'down' | 'neutral';
}) => (
  <motion.div whileHover={{ y: -2 }}
    className="card p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold font-display mt-0.5">{value}</p>
      {sub && (
        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
          {trend === 'up' && <ArrowUpRight size={11} className="text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight size={11} className="text-red-400" />}
          {sub}
        </p>
      )}
    </div>
  </motion.div>
);

const SectionHeader = ({ title, sub, icon: Icon }: { title: string; sub?: string; icon?: React.ElementType }) => (
  <div className="flex items-center gap-3 mb-5">
    {Icon && <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Icon size={16} className="text-emerald-400" /></div>}
    <div>
      <h2 className="text-lg font-bold font-display">{title}</h2>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  </div>
);

// ─── Tab definition ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',    icon: BarChart2 },
  { id: 'farmers',    label: 'Farmers',     icon: Users },
  { id: 'ponds',      label: 'Ponds',       icon: Fish },
  { id: 'harvests',   label: 'Harvests',    icon: Leaf },
  { id: 'orders',     label: 'All Orders',  icon: ShoppingCart },
  { id: 'water',      label: 'Water Alerts',icon: Droplets },
  { id: 'revenue',    label: 'Revenue',     icon: DollarSign },
] as const;

type Tab = typeof TABS[number]['id'];

// ─── Main Component ───────────────────────────────────────────────────────────
const FarmIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Data states
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [farmers, setFarmers] = useState<LiveFarmer[]>([]);
  const [ponds, setPonds] = useState<LivePond[]>([]);
  const [harvests, setHarvests] = useState<LiveHarvestRequest[]>([]);
  const [orders, setOrders] = useState<LiveShopOrder[]>([]);
  const [waterAlerts, setWaterAlerts] = useState<any[]>([]);
  const [roi, setRoi] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchFarmer, setSearchFarmer] = useState('');
  const [filterStage, setFilterStage] = useState('all');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check API health first
      await checkApiHealth();
      setApiStatus('online');

      // Load all data in parallel
      const [i, f, p, h, o, w, r] = await Promise.allSettled([
        fetchIntelligence(),
        fetchFarmers(),
        fetchPonds(),
        fetchHarvestRequests(),
        fetchAllOrders(),         // unified: ShopOrders + ProviderOrders
        fetchWaterAlerts(),
        fetchROI(),
      ]);

      if (i.status === 'fulfilled') setIntel(i.value);
      if (f.status === 'fulfilled') setFarmers(f.value);
      if (p.status === 'fulfilled') setPonds(p.value);
      if (h.status === 'fulfilled') setHarvests(h.value);
      if (o.status === 'fulfilled') setOrders(o.value);
      if (w.status === 'fulfilled') setWaterAlerts(w.value);
      if (r.status === 'fulfilled') setRoi(r.value);

      setLastUpdated(new Date());
    } catch (e: any) {
      setApiStatus('offline');
      setError(e.message || 'Failed to connect to AquaGrow API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(loadAll, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const filteredPonds = ponds.filter(p => {
    const matchStage = filterStage === 'all' || p.stage === filterStage;
    return matchStage;
  });

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(searchFarmer.toLowerCase()) ||
    f.phoneNumber.includes(searchFarmer) ||
    (f.location || '').toLowerCase().includes(searchFarmer.toLowerCase())
  );

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading && !intel) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 h-24 bg-white/3" />
          ))}
        </div>
        <div className="card p-6 h-64 bg-white/3" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Farm Intelligence</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Live data from AquaGrow MongoDB •{' '}
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Fetching...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* API status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            apiStatus === 'online'  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
            apiStatus === 'offline' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                                       'border-zinc-500/30 bg-zinc-500/10 text-zinc-400'
          }`}>
            {apiStatus === 'online'  ? <Wifi size={11} /> : <WifiOff size={11} />}
            {apiStatus === 'online' ? 'DB Connected' : apiStatus === 'offline' ? 'API Offline' : 'Connecting...'}
          </div>
          <button onClick={loadAll} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">API Connection Error</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
            <p className="text-xs opacity-60 mt-1">Make sure you are logged in as an admin user (role: 'admin') in the AquaGrow system. The admin JWT token must be set via <code>setAdminToken()</code> from aquagrowApi.ts.</p>
          </div>
        </motion.div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-white/3 rounded-2xl border border-white/5 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* ══════════════════════════════════════╗
               OVERVIEW TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'overview' && intel && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={Users}      label="Total Farmers"      value={intel.summary.totalFarmers}            color="bg-blue-500/10 text-blue-400" />
                <KpiCard icon={Fish}       label="Active Ponds"       value={intel.summary.activePonds}             color="bg-cyan-500/10 text-cyan-400" />
                <KpiCard icon={Leaf}       label="Harvest Ready"      value={intel.summary.harvestReadyCount}       color="bg-emerald-500/10 text-emerald-400" trend="up" sub="Open harvest windows" />
                <KpiCard icon={AlertTriangle} label="Critical Risks"  value={intel.summary.criticalRiskCount}       color="bg-red-500/10 text-red-400" sub="WSSV / Disease risk ponds" />
                <KpiCard icon={ShoppingCart} label="Pending Orders"   value={intel.summary.pendingShopOrders}       color="bg-amber-500/10 text-amber-400" />
                <KpiCard icon={Package}    label="Feed (7 days)"      value={`${intel.summary.totalFeedKgLast7Days.toFixed(1)} kg`} color="bg-orange-500/10 text-orange-400" />
                <KpiCard icon={DollarSign} label="Total Revenue"      value={`₹${(intel.summary.totalRevenue / 100000).toFixed(1)}L`} color="bg-purple-500/10 text-purple-400" trend="up" />
                <KpiCard icon={TrendingUp} label="Avg ROI"            value={`${intel.summary.avgROI}%`}            color="bg-green-500/10 text-greenald-400" trend="up" />
              </div>

              {/* Stage Distribution */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <SectionHeader title="Culture Stage Distribution" sub="Active ponds by growth phase" icon={Activity} />
                  <div className="space-y-3">
                    {Object.entries(intel.stageDistribution).map(([stage, count]) => {
                      const total = intel.summary.activePonds || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={stage}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{stage}</span>
                            <span className="text-zinc-400">{count} ponds ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className="h-full bg-emerald-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(intel.stageDistribution).length === 0 && (
                      <p className="text-zinc-500 text-sm">No active ponds</p>
                    )}
                  </div>
                </div>

                {/* Subscription Breakdown */}
                <div className="card p-6">
                  <SectionHeader title="Subscription Plans" sub="Active farmer subscriptions" icon={Star} />
                  <div className="space-y-3">
                    {Object.entries(intel.subscriptionBreakdown).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="font-semibold capitalize text-sm">{plan.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-zinc-300 font-bold">{count}</span>
                      </div>
                    ))}
                    {Object.keys(intel.subscriptionBreakdown).length === 0 && (
                      <p className="text-zinc-500 text-sm">No subscription data</p>
                    )}
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="card p-6">
                <SectionHeader title="System Alerts" sub="Auto-detected from live DB" icon={AlertTriangle} />
                <div className="space-y-3">
                  {intel.systemAlerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle size={16} /> All ponds healthy — no critical alerts
                    </div>
                  ) : intel.systemAlerts.map((alert, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                        alert.severity === 'CRITICAL' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
                      }`}>
                      <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                      <div className="flex-1">
                        <span className={`font-bold text-xs px-2 py-0.5 rounded-full mr-2 ${alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {alert.severity}
                        </span>
                        <span className="font-medium">{alert.type.replace(/_/g, ' ')}</span>
                        <p className="text-zinc-400 text-xs mt-0.5">{alert.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Harvest Ready Ponds */}
              {intel.harvestReady.length > 0 && (
                <div className="card p-6">
                  <SectionHeader title="Harvest Ready Ponds" sub={`${intel.harvestReady.length} ponds ready for harvest`} icon={Leaf} />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {intel.harvestReady.map((p: any) => (
                      <div key={p._id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <p className="font-bold text-emerald-400">{p.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">DOC {p.doc} · {p.species || 'Vannamei'}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">HARVEST READY</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               FARMERS TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'farmers' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <input value={searchFarmer} onChange={e => setSearchFarmer(e.target.value)}
                  placeholder="Search by name, phone, location..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <span className="text-zinc-500 text-sm">{filteredFarmers.length} farmers</span>
              </div>

              {filteredFarmers.length === 0 ? (
                <div className="card p-12 text-center">
                  <Database size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500">{farmers.length === 0 ? 'No farmers in DB yet' : 'No matches found'}</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Farmer</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase hidden sm:table-cell">Phone</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase hidden md:table-cell">Location</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Plan</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase hidden lg:table-cell">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFarmers.map((f, i) => (
                        <motion.tr key={f._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl emerald-gradient flex items-center justify-center text-white text-xs font-bold">
                                {f.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{f.name}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">{f._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-zinc-300">{f.phoneNumber}</td>
                          <td className="px-5 py-3.5 hidden md:table-cell text-sm text-zinc-400">{f.location || '—'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              f.subscriptionStatus.includes('diamond') ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                              f.subscriptionStatus.includes('gold')    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              f.subscriptionStatus.includes('silver')  ? 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30' :
                              f.subscriptionStatus === 'pro'           ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                                          'bg-zinc-600/20 text-zinc-500 border-zinc-600/30'
                            }`}>
                              {f.subscriptionStatus.toUpperCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-zinc-500">
                            {new Date(f.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               PONDS TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'ponds' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                {['all', 'Nursery', 'Early Growth', 'Mid Growth', 'Pre-Harvest', 'Harvest Ready'].map(s => (
                  <button key={s} onClick={() => setFilterStage(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStage === s ? 'bg-emerald-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}>
                    {s === 'all' ? `All (${ponds.length})` : s}
                  </button>
                ))}
              </div>

              {filteredPonds.length === 0 ? (
                <div className="card p-12 text-center">
                  <Fish size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No ponds found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredPonds.map((pond, i) => (
                    <motion.div key={pond._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="card p-5 hover:border-emerald-500/30 transition-colors">
                      {/* Pond header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold">{pond.name}</p>
                          <p className="text-xs text-zinc-500">{pond.farmer?.name || pond.userId.slice(-6)} · {pond.species || 'Vannamei'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STAGE_COLORS[pond.stage] || 'bg-zinc-600/20 text-zinc-400'}`}>
                            {pond.stage}
                          </span>
                          <span className="text-[10px] text-zinc-500">DOC {pond.doc}</span>
                        </div>
                      </div>

                      {/* Water quality row */}
                      {pond.lastWaterLog ? (
                        <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 rounded-xl bg-white/3 border border-white/5">
                          <div className="text-center">
                            <p className="text-[10px] text-zinc-500">pH</p>
                            <p className={`text-sm font-bold ${(pond.lastWaterLog.ph || 0) < 7 || (pond.lastWaterLog.ph || 0) > 9 ? 'text-red-400' : 'text-white'}`}>
                              {pond.lastWaterLog.ph?.toFixed(1) || '—'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-zinc-500">DO</p>
                            <p className={`text-sm font-bold ${(pond.lastWaterLog.do || 0) < 4 ? 'text-red-400' : 'text-white'}`}>
                              {pond.lastWaterLog.do?.toFixed(1) || '—'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-zinc-500">Mortality</p>
                            <p className={`text-sm font-bold ${(pond.lastWaterLog.mortality || 0) > 50 ? 'text-red-400' : 'text-white'}`}>
                              {pond.lastWaterLog.mortality ?? '—'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-white/3 border border-white/5 mb-3 text-center text-xs text-zinc-600">
                          No water logs yet
                        </div>
                      )}

                      {/* Feed stats */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                        <span>Feed (7d): <span className="text-white font-bold">{pond.feedLast7Days.toFixed(1)} kg</span></span>
                        <span>Size: <span className="text-white font-bold">{pond.size ? `${pond.size} acres` : '—'}</span></span>
                      </div>

                      {/* Alerts */}
                      {pond.alerts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pond.alerts.map(a => (
                            <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${ALERT_COLORS[a] || 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30'}`}>
                              {a.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               HARVESTS TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'harvests' && (
            <div className="space-y-4">
              {harvests.length === 0 ? (
                <div className="card p-12 text-center">
                  <Leaf size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No harvest requests in DB</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Harvest ID</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Biomass</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Avg Weight</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase">Status</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase hidden md:table-cell">Final ₹</th>
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 uppercase hidden lg:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harvests.map((h, i) => (
                        <motion.tr key={h._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3.5 text-xs font-mono text-zinc-500">{h._id.slice(-8)}</td>
                          <td className="px-5 py-3.5 font-bold text-sm">{h.biomass} kg</td>
                          <td className="px-5 py-3.5 text-sm">{h.avgWeight} g</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[h.status] || 'bg-zinc-600/20 text-zinc-400'}`}>
                              {h.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell text-sm">
                            {h.finalTotal ? `₹${h.finalTotal.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-zinc-500">
                            {new Date(h.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               SHOP ORDERS TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['assigned', 'confirmed', 'shipped', 'delivered'] as const).map(s => {
                  const count = orders.filter(o => o.status === s).length;
                  return (
                    <div key={s} className={`card p-4 ${STATUS_COLORS[s]?.replace('text-', 'border-').replace('/20', '/30')}`}>
                      <p className="text-xs text-zinc-500 uppercase font-bold">{s}</p>
                      <p className="text-2xl font-bold mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>

              {orders.length === 0 ? (
                <div className="card p-12 text-center">
                  <ShoppingCart size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No shop orders in DB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o, i) => (
                    <motion.div key={o._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="card p-4 hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{o.farmerName || 'Unknown Farmer'}</p>
                          <p className="text-xs text-zinc-500">{o.farmerPhone} · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          {(o as any)._source === 'provider' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold mr-1">PROVIDER</span>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[o.status] || 'bg-zinc-600/20 text-zinc-400'}`}>
                            {o.status.toUpperCase()}
                          </span>
                          <p className="text-sm font-bold mt-1">₹{o.totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {o.items?.map((item, j) => (
                          <span key={j} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                            {item.productName} × {item.qty} {item.unit}
                          </span>
                        ))}
                      </div>
                      {o.providerName && (
                        <p className="text-xs text-zinc-500 mt-2">Provider: <span className="text-zinc-300">{o.providerName}</span></p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               WATER ALERTS TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'water' && (
            <div className="space-y-4">
              {waterAlerts.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle size={32} className="mx-auto text-emerald-500 mb-3" />
                  <p className="text-emerald-400 font-bold">All water parameters normal</p>
                  <p className="text-zinc-500 text-sm mt-1">No alerts in the past 48 hours</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waterAlerts.map((alert: any, i) => (
                    <motion.div key={alert._id || i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card p-4 border-l-4 border-l-red-500">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{alert.pond?.name || `Pond ${alert.pondId?.slice(-6)}`}</p>
                          <p className="text-xs text-zinc-500">{alert.date} · {alert.time || ''}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">ALERT</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {['pH', 'DO', 'Temp', 'NH3', 'Mortality'].map((param, j) => {
                          const vals = [alert.ph, alert.do, alert.temp, alert.ammonia, alert.mortality];
                          const isAlert = [
                            alert.ph < 7 || alert.ph > 9,
                            alert.do < 4,
                            false,
                            alert.ammonia > 0.5,
                            alert.mortality > 50,
                          ][j];
                          return (
                            <div key={param} className={`text-center p-2 rounded-lg ${isAlert ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/3'}`}>
                              <p className="text-[9px] text-zinc-500">{param}</p>
                              <p className={`text-sm font-bold ${isAlert ? 'text-red-400' : 'text-white'}`}>
                                {vals[j]?.toFixed?.(1) ?? vals[j] ?? '—'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {(alert.alerts || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.alerts.map((a: string) => (
                            <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{a}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════╗
               REVENUE TAB
          ══════════════════════════════════════╝ */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Revenue KPIs */}
              {intel && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon={DollarSign} label="Total Revenue"   value={`₹${(intel.summary.totalRevenue / 100000).toFixed(2)}L`} color="bg-emerald-500/10 text-emerald-400" />
                  <KpiCard icon={TrendingUp} label="Net Profit"      value={`₹${(intel.summary.totalProfit / 100000).toFixed(2)}L`}  color="bg-green-500/10 text-green-400" />
                  <KpiCard icon={BarChart2}  label="Average ROI"     value={`${intel.summary.avgROI}%`}                              color="bg-blue-500/10 text-blue-400" />
                  <KpiCard icon={Leaf}       label="Biomass Harvested" value={`${intel.summary.totalHarvestBiomassKg.toFixed(0)} kg`} color="bg-cyan-500/10 text-cyan-400" />
                </div>
              )}

              {roi.length === 0 ? (
                <div className="card p-12 text-center">
                  <DollarSign size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-500">No ROI entries in DB yet</p>
                  <p className="text-zinc-600 text-xs mt-1">ROI data comes from farmers completing harvest cycles</p>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="p-5 border-b border-white/5">
                    <SectionHeader title="ROI Entries" sub={`${roi.length} completed harvest cycles`} icon={DollarSign} />
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase">Farmer</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase">Harvest (kg)</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase">Revenue (₹)</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase">Net Profit (₹)</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase">ROI %</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roi.map((r: any, i) => (
                        <motion.tr key={r._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-sm">{r.farmer?.name || r.userId?.slice(-6) || '—'}</td>
                          <td className="px-5 py-3.5 text-sm">{r.harvestWeightKg?.toLocaleString('en-IN') || '—'}</td>
                          <td className="px-5 py-3.5 text-sm text-emerald-400 font-bold">
                            {r.totalRevenue ? `₹${r.totalRevenue.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            <span className={r.netProfit > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                              {r.netProfit ? `₹${r.netProfit.toLocaleString('en-IN')}` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {r.roi != null ? (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.roi > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {r.roi.toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell text-xs text-zinc-500">
                            {r.harvestDate || new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FarmIntelligence;
