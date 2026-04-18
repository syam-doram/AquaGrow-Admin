import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Globe, MapPin, ArrowUpRight,
  ArrowDownRight, Activity, Zap, Target, Bell, Download, Calendar,
  Scale, Star, Users, Cpu, RefreshCw, PieChart, Eye, AlertTriangle,
  CheckCircle2, ChevronUp, ChevronDown, DollarSign, Layers, Filter,
  Search, Wifi, WifiOff, Phone, Award, CreditCard, Database, Fish,
  ClipboardList, Pill, Waves, ArrowLeft, Info,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart,
  Scatter, ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchFarmers, fetchPonds, fetchIntelligence,
  fetchFeedLogs, fetchMedicineLogs,
  type LiveFarmer, type LivePond, type IntelligenceData,
  type LiveFeedLog, type LiveMedicineLog,
} from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'detail';
type LogTab  = 'feed' | 'medicine';
type Tab =
  // Farmer management
  | 'fm_all' | 'fm_active' | 'fm_ponds' | 'fm_logs' | 'fm_insights'
  // Market intelligence
  | 'prices' | 'trends' | 'demandsupply' | 'sizebased'
  | 'location' | 'buyerbehavior' | 'farmerperformance'
  | 'smartrec' | 'alerts' | 'external' | 'reports';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const PRICE_TABLE = [
  { count: 20, species: 'L. Vannamei', grade: 'A', priceToday: 540, priceYesterday: 525, priceLW: 510, trend: 'up', demand: 'High' },
  { count: 25, species: 'L. Vannamei', grade: 'A', priceToday: 510, priceYesterday: 510, priceLW: 500, trend: 'stable', demand: 'High' },
  { count: 30, species: 'L. Vannamei', grade: 'A', priceToday: 490, priceYesterday: 470, priceLW: 460, trend: 'up', demand: 'Very High' },
  { count: 40, species: 'L. Vannamei', grade: 'B', priceToday: 460, priceYesterday: 465, priceLW: 470, trend: 'down', demand: 'Medium' },
  { count: 50, species: 'L. Vannamei', grade: 'B', priceToday: 440, priceYesterday: 440, priceLW: 435, trend: 'stable', demand: 'Medium' },
  { count: 60, species: 'L. Vannamei', grade: 'B', priceToday: 420, priceYesterday: 425, priceLW: 430, trend: 'down', demand: 'Low' },
  { count: 80, species: 'L. Vannamei', grade: 'C', priceToday: 380, priceYesterday: 380, priceLW: 375, trend: 'stable', demand: 'Low' },
  { count: 30, species: 'P. Monodon', grade: 'A', priceToday: 620, priceYesterday: 600, priceLW: 590, trend: 'up', demand: 'High' },
  { count: 40, species: 'P. Monodon', grade: 'A', priceToday: 580, priceYesterday: 570, priceLW: 560, trend: 'up', demand: 'Medium' },
];

const PRICE_TREND_DATA = [
  { week: 'W1',  count30: 460, count40: 430, count50: 415, count60: 400 },
  { week: 'W2',  count30: 455, count40: 440, count50: 420, count60: 405 },
  { week: 'W3',  count30: 462, count40: 445, count50: 418, count60: 408 },
  { week: 'W4',  count30: 470, count40: 450, count50: 425, count60: 415 },
  { week: 'W5',  count30: 468, count40: 455, count50: 430, count60: 415 },
  { week: 'W6',  count30: 475, count40: 460, count50: 432, count60: 420 },
  { week: 'W7',  count30: 480, count40: 458, count50: 435, count60: 418 },
  { week: 'W8',  count30: 490, count40: 460, count50: 440, count60: 420 },
];

const DEMAND_SUPPLY_DATA = [
  { month: 'Oct', demand: 38000, supply: 29000 },
  { month: 'Nov', demand: 42000, supply: 35000 },
  { month: 'Dec', demand: 55000, supply: 40000 },
  { month: 'Jan', demand: 48000, supply: 44000 },
  { month: 'Feb', demand: 40000, supply: 46000 },
  { month: 'Mar', demand: 44000, supply: 38000 },
  { month: 'Apr', demand: 52000, supply: 35000 },
];

const SIZE_DATA = [
  { count: 20, price: 540, demand: 85, supplyKg: 8000 },
  { count: 25, price: 510, demand: 78, supplyKg: 12000 },
  { count: 30, price: 490, demand: 95, supplyKg: 15000 },
  { count: 40, price: 460, demand: 65, supplyKg: 18000 },
  { count: 50, price: 440, demand: 45, supplyKg: 22000 },
  { count: 60, price: 420, demand: 30, supplyKg: 14000 },
  { count: 80, price: 380, demand: 18, supplyKg: 8000 },
];

const LOCATION_DATA = [
  { location: 'Nellore, AP', avgPrice: 490, demand: 'Very High', supplyKg: 45000, trend: 'up', topBuyers: 3, growth: 18 },
  { location: 'Vijayawada, AP', avgPrice: 475, demand: 'High', supplyKg: 22000, trend: 'up', topBuyers: 2, growth: 12 },
  { location: 'Visakhapatnam, AP', avgPrice: 480, demand: 'High', supplyKg: 18000, trend: 'stable', topBuyers: 2, growth: 6 },
  { location: 'Kochi, KL', avgPrice: 510, demand: 'Medium', supplyKg: 12000, trend: 'up', topBuyers: 1, growth: 9 },
  { location: 'Chennai, TN', avgPrice: 460, demand: 'Medium', supplyKg: 9000, trend: 'down', topBuyers: 1, growth: -3 },
  { location: 'Bhimavaram, AP', avgPrice: 465, demand: 'Low', supplyKg: 5000, trend: 'stable', topBuyers: 1, growth: 1 },
];

const BUYER_BEHAVIOR = [
  { buyer: 'AquaPrime Exports', preferred: '30 count', priceRange: '₹480–510', totalKg: 42000, trend: 'up', activity: 'High', segment: 'Exporter' },
  { buyer: 'Blue Ocean Traders', preferred: '40 count', priceRange: '₹455–475', totalKg: 18000, trend: 'stable', activity: 'High', segment: 'Wholesaler' },
  { buyer: 'Coastal Seafood Co.', preferred: '30 count Tiger', priceRange: '₹580–620', totalKg: 9000, trend: 'up', activity: 'Medium', segment: 'Processor' },
  { buyer: 'Fresh Catch Ltd.', preferred: '50 count', priceRange: '₹430–450', totalKg: 2500, trend: 'down', activity: 'Low', segment: 'Local Trader' },
];

const FARMER_PERFORMANCE = [
  { farmer: 'Mike Ross', avgPriceReceived: 492, marketAvg: 480, premium: 12, practices: ['Grade A', 'certified', 'DOC 120'], deals: 3 },
  { farmer: 'John Doe', avgPriceReceived: 488, marketAvg: 480, premium: 8, practices: ['Grade A', 'OTP verified', 'DOC 90'], deals: 2 },
  { farmer: 'Jane Smith', avgPriceReceived: 458, marketAvg: 465, premium: -7, practices: ['Grade B', 'water alerts', 'DOC 47'], deals: 1 },
  { farmer: 'Anjali Devi', avgPriceReceived: 435, marketAvg: 460, premium: -25, practices: ['Grade C', 'flagged', 'DOC 60'], deals: 1 },
];

const ALERTS_DATA = [
  { id: 'ALT-001', type: 'PRICE_RISE', message: 'Count 30 price up ₹20/kg today — good time to harvest.', severity: 'positive', time: '2h ago' },
  { id: 'ALT-002', type: 'HIGH_DEMAND', message: 'Nellore buyers increased demand by 15%. Redirect supply now.', severity: 'info', time: '4h ago' },
  { id: 'ALT-003', type: 'PRICE_DROP', message: 'Count 60 price fell ₹10/kg this week. Low demand expected.', severity: 'warning', time: '1d ago' },
  { id: 'ALT-004', type: 'SUPPLY_SHORTAGE', message: 'Count 30 supply gap of 8,200 kg vs buyer demand.', severity: 'warning', time: '1d ago' },
  { id: 'ALT-005', type: 'SEASONAL', message: 'Festival season demand expected to spike +25% in next 3 weeks.', severity: 'info', time: '2d ago' },
];

const EXTERNAL_MARKET = [
  { market: 'Chennai Wholesale Market', count30: 485, count40: 455, count50: 435, date: '2026-04-17', source: 'Manual' },
  { market: 'Vijayawada Fish Market', count30: 478, count40: 448, count50: 428, date: '2026-04-17', source: 'Manual' },
  { market: 'US Import Price (FOB)', count30: 820, count40: 760, count50: 710, date: '2026-04-16', source: 'External' },
  { market: 'EU Import Price (CIF)', count30: 890, count40: 830, count50: 775, date: '2026-04-16', source: 'External' },
  { market: 'Japan Premium (FOB)', count30: 950, count40: 880, count50: 820, date: '2026-04-16', source: 'External' },
];

const SMART_RECS = [
  {
    farmerId: 'F-101', farmer: 'John Doe', pond: 'Pond Alpha', doc: 90, currentWeight: 15, count: 32,
    recommendation: 'Harvest Now',
    score: 92,
    rationale: 'Count 30–32 is in high demand. Market price ₹490/kg (+₹20 this week). Certified → premium buyer match possible.',
    expectedRevenue: 1078000,
    waitRevenue: 1024000,
    icon: 'up',
    color: 'emerald',
  },
  {
    farmerId: 'F-102', farmer: 'Jane Smith', pond: 'Smith Pond 1', doc: 47, currentWeight: 8, count: 70,
    recommendation: 'Wait 3 Weeks',
    score: 71,
    rationale: 'Currently Count 70 — low demand and price ₹390/kg. Growth to Count 40–50 can yield ₹440/kg. Water alerts → monitor closely.',
    expectedRevenue: 176000,
    waitRevenue: 220000,
    icon: 'wait',
    color: 'amber',
  },
  {
    farmerId: 'F-103', farmer: 'Mike Ross', pond: 'Ross Farm #1', doc: 120, currentWeight: 22, count: 28,
    recommendation: 'Already Harvested',
    score: 100,
    rationale: 'Harvested at Count 28–30 (Grade A). AquaPrime Exports deal locked @ ₹490/kg. Excellent timing.',
    expectedRevenue: 2116800,
    waitRevenue: 2116800,
    icon: 'done',
    color: 'blue',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '11px' },
  itemStyle: { fontSize: '11px' },
};

const MiniTrend = ({ t }: { t: 'up' | 'down' | 'stable' }) =>
  t === 'up'     ? <ArrowUpRight   size={13} className="text-emerald-400" /> :
  t === 'down'   ? <ArrowDownRight size={13} className="text-red-400" /> :
                   <span className="text-[10px] text-zinc-500 font-bold">—</span>;

const DemandBadge = ({ d }: { d: string }) => {
  const c = d === 'Very High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            d === 'High'     ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            d === 'Medium'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                               'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c}`}>{d}</span>;
};

const InfoCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
  <div className="glass-panel p-5">
    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">{label}</p>
    <p className={`text-2xl font-display font-bold ${color ?? 'text-zinc-100'}`}>{value}</p>
    {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
  </div>
);

// ─── Farmer Helpers ───────────────────────────────────────────────────────────
const SUB_COLORS: Record<string, string> = {
  pro_diamond: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pro_gold:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pro_silver:  'bg-zinc-400/20 text-zinc-300 border-zinc-400/30',
  pro:         'bg-blue-500/20 text-blue-400 border-blue-500/30',
  free:        'bg-zinc-700/20 text-zinc-500 border-zinc-700/30',
};
const ALERT_COLORS_FM: Record<string, string> = {
  CRITICAL_LOW_DO: 'bg-red-500/20 text-red-400',
  PH_OUT_OF_RANGE: 'bg-orange-500/20 text-orange-400',
  HIGH_AMMONIA:    'bg-yellow-500/20 text-yellow-400',
  HIGH_MORTALITY:  'bg-red-600/20 text-red-300',
  HARVEST_READY:   'bg-emerald-500/20 text-emerald-400',
  PEAK_WSSV_RISK:  'bg-purple-500/20 text-purple-400',
};
const STAGE_COLORS_FM: Record<string, string> = {
  Nursery:         'bg-cyan-500/20 text-cyan-400',
  'Early Growth':  'bg-green-500/20 text-green-400',
  'Mid Growth':    'bg-blue-500/20 text-blue-400',
  'Pre-Harvest':   'bg-amber-500/20 text-amber-400',
  'Harvest Ready': 'bg-emerald-500/20 text-emerald-400',
  Harvest:         'bg-emerald-500/20 text-emerald-400',
};
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const PondCard = ({ pond }: { pond: LivePond }) => (
  <motion.div whileHover={{ y: -2 }} className="card p-5 hover:border-emerald-500/30 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-bold">{pond.name}</p>
        <p className="text-xs text-zinc-500">{pond.species || 'Vannamei'}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STAGE_COLORS_FM[pond.stage] || 'bg-zinc-600/20 text-zinc-400'}`}>{pond.stage}</span>
        <span className="text-[10px] text-zinc-500">DOC {pond.doc}</span>
      </div>
    </div>
    {pond.lastWaterLog ? (
      <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 rounded-xl bg-white/3 border border-white/5">
        {[['pH', pond.lastWaterLog.ph, (v: number) => v < 7 || v > 9], ['DO', pond.lastWaterLog.do, (v: number) => v < 4], ['Mort.', pond.lastWaterLog.mortality, (v: number) => v > 50]].map(([k, v, bad]: any) => (
          <div key={String(k)} className="text-center">
            <p className="text-[10px] text-zinc-500">{k}</p>
            <p className={`text-sm font-bold ${v != null && bad(v) ? 'text-red-400' : 'text-white'}`}>{v?.toFixed?.(1) ?? v ?? '—'}</p>
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
          <span key={a} className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${ALERT_COLORS_FM[a] || 'bg-zinc-600/20 text-zinc-400'}`}>{a.replace(/_/g, ' ')}</span>
        ))}
      </div>
    )}
  </motion.div>
);

const FarmerDetail = ({ farmer, ponds, onBack }: { farmer: LiveFarmer; ponds: LivePond[]; onBack: () => void }) => {
  const fp = ponds.filter(p => p.userId === farmer._id);
  const active = fp.filter(p => p.status === 'active');
  const harvest = fp.filter(p => p.alerts.includes('HARVEST_READY'));
  const critical = fp.filter(p => p.alerts.some(a => ['CRITICAL_LOW_DO','HIGH_AMMONIA','HIGH_MORTALITY'].includes(a)));
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-y-auto">
      <div className="bg-zinc-900/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold">{farmer.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SUB_COLORS[farmer.subscriptionStatus] || SUB_COLORS.free}`}>{farmer.subscriptionStatus.replace('_',' ').toUpperCase()}</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">{farmer._id} · {farmer.location || 'No location'}</p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 hidden md:block">Joined {new Date(farmer.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{label:'Total Ponds',value:fp.length,color:'text-blue-400'},{label:'Active',value:active.length,color:'text-emerald-400'},{label:'Harvest Ready',value:harvest.length,color:'text-amber-400'},{label:'Critical',value:critical.length,color:'text-red-400'}].map(({label,value,color}) => (
            <div key={label} className="card p-4 text-center"><p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p><p className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</p></div>
          ))}
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Info size={18} className="text-emerald-400" /> Profile</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/3"><p className="text-[10px] text-zinc-500 mb-1">Phone</p><p className="font-bold flex items-center gap-1"><Phone size={12} className="text-emerald-400" />{farmer.phoneNumber}</p></div>
            <div className="p-3 rounded-xl bg-white/3"><p className="text-[10px] text-zinc-500 mb-1">Location</p><p className="font-bold flex items-center gap-1"><MapPin size={12} className="text-emerald-400" />{farmer.location || '—'}</p></div>
            <div className="p-3 rounded-xl bg-white/3"><p className="text-[10px] text-zinc-500 mb-1">Plan</p><p className="font-bold">{farmer.subscriptionStatus.replace('_',' ')}</p></div>
            <div className="p-3 rounded-xl bg-white/3"><p className="text-[10px] text-zinc-500 mb-1">Joined</p><p className="font-bold flex items-center gap-1"><Calendar size={12} className="text-emerald-400" />{new Date(farmer.createdAt).toLocaleDateString('en-IN')}</p></div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Fish size={18} className="text-cyan-400" /> Ponds ({fp.length})</h3>
          {fp.length === 0 ? (
            <div className="card p-10 text-center"><Fish size={28} className="mx-auto text-zinc-600 mb-2" /><p className="text-zinc-500 text-sm">No ponds found</p></div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{fp.map(p => <PondCard key={p._id} pond={p} />)}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MarketIntelligence = () => {
  // ── Market Intelligence state ────────────────────────────────────────────────
  const [tab, setTab]               = useState<Tab>('fm_all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [priceInput, setPriceInput] = useState<Record<number, number>>({});
  const [editMode, setEditMode]     = useState(false);
  const [range, setRange]           = useState('weekly');
  // ── Farmer Management state ──────────────────────────────────────────────────
  const [logTab, setLogTab]         = useState<LogTab>('feed');
  const [farmers, setFarmers]       = useState<LiveFarmer[]>([]);
  const [ponds, setPonds]           = useState<LivePond[]>([]);
  const [intel, setIntel]           = useState<IntelligenceData | null>(null);
  const [feedLogs, setFeedLogs]     = useState<LiveFeedLog[]>([]);
  const [medLogs, setMedLogs]       = useState<LiveMedicineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [fmLoading, setFmLoading]   = useState(true);
  const [apiStatus, setApiStatus]   = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync]     = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [logSearch, setLogSearch]   = useState('');
  const [filterSub, setFilterSub]   = useState('all');
  const [viewMode, setViewMode]     = useState<ViewMode>('list');
  const [selected, setSelected]     = useState<LiveFarmer | null>(null);

  const load = useCallback(async () => {
    setFmLoading(true); setApiStatus('loading');
    try {
      const [f, p, i] = await Promise.allSettled([fetchFarmers(), fetchPonds(), fetchIntelligence()]);
      if (f.status === 'fulfilled') setFarmers(f.value);
      if (p.status === 'fulfilled') setPonds(p.value);
      if (i.status === 'fulfilled') setIntel(i.value);
      setApiStatus('online'); setLastSync(new Date().toLocaleTimeString());
    } catch { setApiStatus('offline'); }
    finally { setFmLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60_000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (tab === 'fm_logs' && feedLogs.length === 0 && medLogs.length === 0) {
      setLogsLoading(true);
      Promise.all([fetchFeedLogs(), fetchMedicineLogs()])
        .then(([f, m]) => { setFeedLogs(f); setMedLogs(m); })
        .catch(console.error)
        .finally(() => setLogsLoading(false));
    }
  }, [tab]);

  const fmStats = useMemo(() => ({
    total:     farmers.length,
    active:    farmers.filter(f => f.subscriptionStatus !== 'free').length,
    premium:   farmers.filter(f => ['pro_diamond','pro_gold'].includes(f.subscriptionStatus)).length,
    withPonds: new Set(ponds.map(p => p.userId)).size,
  }), [farmers, ponds]);

  const filtered = useMemo(() => {
    let list = farmers;
    if (tab === 'fm_active') list = list.filter(f => f.subscriptionStatus !== 'free');
    if (search) list = list.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.phoneNumber.includes(search) ||
      (f.location || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterSub !== 'all') list = list.filter(f => f.subscriptionStatus === filterSub);
    return list;
  }, [farmers, tab, search, filterSub]);

  const filteredPrices = useMemo(() =>
    filterSpecies === 'all' ? PRICE_TABLE : PRICE_TABLE.filter(p => p.species === filterSpecies),
    [filterSpecies]
  );

  const openDetail = (f: LiveFarmer) => { setSelected(f); setViewMode('detail'); };
  const isFarmerTab = ['fm_all','fm_active','fm_ponds','fm_logs','fm_insights'].includes(tab);

  return (
    <>
      <AnimatePresence>
        {viewMode === 'detail' && selected && (
          <FarmerDetail farmer={selected} ponds={ponds} onBack={() => { setViewMode('list'); setSelected(null); }} />
        )}
      </AnimatePresence>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Farm Intelligence</h1>
          <p className="text-zinc-400">Farmer management, live pond data, market prices and AI-powered harvest recommendations.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isFarmerTab ? (
            <>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
                apiStatus === 'online'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                apiStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                          'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
              }`}>
                {apiStatus === 'online' ? <Wifi size={12} /> : apiStatus === 'offline' ? <WifiOff size={12} /> : <RefreshCw size={12} className="animate-spin" />}
                {apiStatus === 'online' ? 'DB Connected' : apiStatus === 'offline' ? 'DB Offline' : 'Syncing...'}
              </div>
              {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
              <button onClick={load} disabled={fmLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all">
                <RefreshCw size={14} className={fmLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                {['daily','weekly','monthly'].map(r => (
                  <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${range === r ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}>{r}</button>
                ))}
              </div>
              <button className="btn-secondary flex items-center gap-2 text-sm"><Download size={15} />Export</button>
            </>
          )}
        </div>
      </div>

      {/* Market pulse strip — market tabs only */}
      {!isFarmerTab && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Sentiment',    value: 'Bullish 🐂',  color: 'text-emerald-400', sub: 'High export demand' },
            { label: 'Demand Index', value: '8.4 / 10',    color: 'text-emerald-400', sub: 'Nellore + Kochi hot' },
            { label: 'Supply Gap',   value: '−12.5%',      color: 'text-red-400',     sub: 'Count 30 shortage' },
            { label: 'Avg Price/kg', value: '₹472',        color: '',                 sub: 'All species blended' },
            { label: 'Active Buyers',value: '4',           color: 'text-blue-400',    sub: 'Requesting supply' },
            { label: 'Volatility',   value: 'Low',         color: 'text-zinc-300',    sub: 'Stable 14 days' },
            { label: 'Best Count',   value: 'Count 30',    color: 'text-amber-400',   sub: '₹490/kg · Very High' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="glass-panel p-4">
              <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">{label}</p>
              <p className={`text-base font-display font-bold ${color}`}>{value}</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Farmer KPI strip — farmer tabs only */}
      {isFarmerTab && (
        <>
          {apiStatus === 'offline' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div><p className="font-bold text-sm">Cannot connect to AquaGrow database</p><p className="text-xs opacity-70 mt-0.5">Ensure you're logged in as an admin. The API token must be valid.</p></div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Farmers',    value: fmStats.total,    color: 'bg-blue-500/10 text-blue-400',       icon: Users },
              { label: 'Subscribed',       value: fmStats.active,   color: 'bg-emerald-500/10 text-emerald-400', icon: Star },
              { label: 'Premium (Gold+)',  value: fmStats.premium,  color: 'bg-yellow-500/10 text-yellow-400',   icon: Award },
              { label: 'Have Active Ponds',value: fmStats.withPonds,color: 'bg-cyan-500/10 text-cyan-400',       icon: Waves },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon size={20} /></div>
                <div><p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p><p className="text-2xl font-display font-bold mt-0.5">{value}</p></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tabs — grouped */}
      <div className="space-y-2">
        {[
          { label: '👨\u200D🌾 Farmer Management', items: [
            { id: 'fm_all' as Tab,      label: 'All Farmers',  icon: Users },
            { id: 'fm_active' as Tab,   label: 'Subscribed',   icon: Star },
            { id: 'fm_ponds' as Tab,    label: 'Pond Monitor', icon: Waves },
            { id: 'fm_logs' as Tab,     label: 'Daily Logs',   icon: ClipboardList },
            { id: 'fm_insights' as Tab, label: 'Farm Insights',icon: BarChart3 },
          ]},
          { label: '📈 Market Intelligence', items: [
            { id: 'prices' as Tab,           label: 'Price Tracking',    icon: DollarSign },
            { id: 'trends' as Tab,           label: 'Trend Analysis',    icon: TrendingUp },
            { id: 'demandsupply' as Tab,     label: 'Demand & Supply',   icon: Scale },
            { id: 'sizebased' as Tab,        label: 'Size-Based',        icon: Layers },
            { id: 'location' as Tab,         label: 'Location Insights', icon: MapPin },
            { id: 'buyerbehavior' as Tab,    label: 'Buyer Behavior',    icon: Eye },
            { id: 'farmerperformance' as Tab,label: 'Farmer vs Market',  icon: Users },
            { id: 'smartrec' as Tab,         label: 'Smart Recs',        icon: Cpu },
            { id: 'alerts' as Tab,           label: 'Alerts',            icon: Bell },
            { id: 'external' as Tab,         label: 'External Market',   icon: Globe },
            { id: 'reports' as Tab,          label: 'Reports',           icon: BarChart3 },
          ]},
        ].map(({ label, items }) => (
          <div key={label}>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-1 mb-1">{label}</p>
            <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
              {items.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                  <t.icon size={13} />{t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ FARMER TABS ══════════════════════════════════════════════════ */}

      {/* FM: ALL / ACTIVE FARMERS */}
      {(tab === 'fm_all' || tab === 'fm_active') && (
        <div className="space-y-4">
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
          {fmLoading ? (
            <div className="card p-12 text-center animate-pulse"><Database size={28} className="mx-auto text-zinc-700 mb-3" /><p className="text-zinc-600">Loading from MongoDB...</p></div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center"><Users size={32} className="mx-auto text-zinc-600 mb-3" /><p className="text-zinc-500">{farmers.length === 0 ? 'No farmers registered yet' : 'No matches found'}</p></div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-white/5 bg-white/3">
                  {['Farmer','Phone','Location','Plan','Ponds','Joined'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.map((f, i) => {
                    const fPonds = ponds.filter(p => p.userId === f._id);
                    const hasAlert = fPonds.some(p => p.alerts.length > 0);
                    return (
                      <motion.tr key={f._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                        onClick={() => openDetail(f)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`relative w-9 h-9 rounded-xl ${hasAlert ? 'bg-red-500/20' : 'bg-emerald-500/10'} flex items-center justify-center font-bold text-xs`}>
                              {getInitials(f.name)}
                              {hasAlert && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
                            </div>
                            <div><p className="font-semibold text-sm">{f.name}</p><p className="text-[10px] text-zinc-500 font-mono">{f._id.slice(-6)}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-zinc-300">{f.phoneNumber}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-400">{f.location || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${SUB_COLORS[f.subscriptionStatus] || SUB_COLORS.free}`}>
                            {f.subscriptionStatus.replace('_',' ').toUpperCase()}
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
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FM: POND MONITOR */}
      {tab === 'fm_ponds' && (
        <div className="space-y-5">
          {fmLoading ? (
            <div className="card p-12 text-center animate-pulse"><Database size={28} className="mx-auto text-zinc-700 mb-3" /><p className="text-zinc-600">Loading ponds...</p></div>
          ) : ponds.length === 0 ? (
            <div className="card p-12 text-center"><Fish size={32} className="mx-auto text-zinc-600 mb-3" /><p className="text-zinc-500">No ponds found in database</p></div>
          ) : (
            <>
              {ponds.some(p => p.alerts.length > 0) && (
                <div className="card p-5 border border-red-500/20 bg-red-500/5">
                  <p className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={15} /> Critical Pond Alerts</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {ponds.filter(p => p.alerts.some(a => ['CRITICAL_LOW_DO','HIGH_AMMONIA','HIGH_MORTALITY'].includes(a))).slice(0,6).map(p => (
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

      {/* FM: DAILY LOGS */}
      {tab === 'fm_logs' && (
        <div className="space-y-5">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
            <button onClick={() => setLogTab('feed')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${logTab === 'feed' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}><ClipboardList size={14} /> Feed Logs</button>
            <button onClick={() => setLogTab('medicine')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${logTab === 'medicine' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}><Pill size={14} /> Medicine Logs</button>
          </div>
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search by farmer or pond..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          {logTab === 'feed' && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">Feed Logs <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LIVE</span></h3>
                <span className="text-xs text-zinc-500">{logsLoading ? 'Loading…' : `${feedLogs.filter(l => !logSearch || l.farmer?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.pond?.name?.toLowerCase().includes(logSearch.toLowerCase())).length} records`}</span>
              </div>
              <div className="overflow-x-auto">
                {logsLoading ? <div className="p-10 text-center text-zinc-500">Loading feed logs…</div>
                 : feedLogs.length === 0 ? <div className="p-10 text-center text-zinc-600">No feed logs found in database.</div>
                 : (
                  <table className="w-full text-left"><thead><tr className="border-b border-white/5 bg-white/3">
                    {['Farmer','Phone','Pond','Feed Type','Qty','Unit','Date'].map(h => <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>)}
                  </tr></thead><tbody className="divide-y divide-white/5">
                    {feedLogs.filter(l => !logSearch || l.farmer?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.pond?.name?.toLowerCase().includes(logSearch.toLowerCase())).map(log => (
                      <tr key={log._id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-sm">{log.farmer?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{log.farmer?.phoneNumber ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-300">{log.pond?.name ?? log.pondId?.slice(-6) ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400 capitalize">{log.feedType ?? '—'}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">{log.quantity}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{log.unit ?? 'kg'}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{log.date ? new Date(log.date).toLocaleDateString('en-IN') : new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>
          )}
          {logTab === 'medicine' && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">Medicine Logs <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">LIVE</span></h3>
                <span className="text-xs text-zinc-500">{logsLoading ? 'Loading…' : `${medLogs.filter(l => !logSearch || l.farmer?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.pond?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.medicineName?.toLowerCase().includes(logSearch.toLowerCase())).length} records`}</span>
              </div>
              <div className="overflow-x-auto">
                {logsLoading ? <div className="p-10 text-center text-zinc-500">Loading medicine logs…</div>
                 : medLogs.length === 0 ? <div className="p-10 text-center text-zinc-600">No medicine logs found in database.</div>
                 : (
                  <table className="w-full text-left"><thead><tr className="border-b border-white/5 bg-white/3">
                    {['Farmer','Phone','Pond','Medicine','Dosage','Qty','Date'].map(h => <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>)}
                  </tr></thead><tbody className="divide-y divide-white/5">
                    {medLogs.filter(l => !logSearch || l.farmer?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.pond?.name?.toLowerCase().includes(logSearch.toLowerCase()) || l.medicineName?.toLowerCase().includes(logSearch.toLowerCase())).map(log => (
                      <tr key={log._id} className="hover:bg-white/3 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-sm">{log.farmer?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{log.farmer?.phoneNumber ?? '—'}</td>
                        <td className="px-5 py-3.5 text-sm text-zinc-300">{log.pond?.name ?? log.pondId?.slice(-6) ?? '—'}</td>
                        <td className="px-5 py-3.5 font-bold text-purple-400">{log.medicineName ?? '—'}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-400">{log.dosage ?? '—'}</td>
                        <td className="px-5 py-3.5 font-mono text-sm">{log.quantity ?? '—'} {log.unit ?? ''}</td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500">{log.date ? new Date(log.date).toLocaleDateString('en-IN') : new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FM: INSIGHTS */}
      {tab === 'fm_insights' && (
        <div className="space-y-6">
          {intel ? (
            <>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-400" /> Culture Stage Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(intel.stageDistribution).map(([stage, count]) => {
                    const pct = intel.summary.activePonds ? Math.round((count / intel.summary.activePonds) * 100) : 0;
                    return (
                      <div key={stage}>
                        <div className="flex items-center justify-between text-sm mb-1"><span>{stage}</span><span className="text-zinc-400">{count} ponds ({pct}%)</span></div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500 rounded-full" /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard size={18} className="text-blue-400" /> Subscription Plans</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(intel.subscriptionBreakdown).map(([plan, count]) => (
                    <div key={plan} className="p-4 rounded-xl bg-white/3 border border-white/5 text-center">
                      <p className="text-xs text-zinc-500 capitalize">{plan.replace('_',' ')}</p>
                      <p className="text-3xl font-display font-bold mt-1">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
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
            <div className="card p-12 text-center"><BarChart3 size={32} className="mx-auto text-zinc-600 mb-3" /><p className="text-zinc-500">{fmLoading ? 'Loading insights...' : 'No intelligence data available'}</p></div>
          )}
        </div>
      )}

      {/* ═══ PRICE TRACKING ══════════════════════════════════════════════════ */}
      {tab === 'prices' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <Filter size={13} className="text-zinc-500" />
                <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} className="bg-transparent outline-none text-sm">
                  <option value="all">All Species</option>
                  <option value="L. Vannamei">L. Vannamei</option>
                  <option value="P. Monodon">P. Monodon (Tiger)</option>
                </select>
              </div>
            </div>
            <button onClick={() => setEditMode(e => !e)} className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${editMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'}`}>
              {editMode ? '✓ Save Prices' : '✏ Edit Prices (Manual Input)'}
            </button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={15} className="text-emerald-400" />Live Price Table — {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</h3>
              <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Count (pc/kg)', 'Species', 'Grade', "Today's Price", 'Yesterday', 'Last Week', 'Change', 'Demand', editMode ? 'Set Price' : ''].filter(Boolean).map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPrices.map((row, i) => {
                    const change = row.priceToday - row.priceYesterday;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-lg text-emerald-400">{row.count}</td>
                        <td className="px-5 py-4 text-sm">{row.species}</td>
                        <td className="px-5 py-4"><span className={`text-xs font-bold ${row.grade === 'A' ? 'text-emerald-400' : row.grade === 'B' ? 'text-blue-400' : 'text-amber-400'}`}>Grade {row.grade}</span></td>
                        <td className="px-5 py-4 font-mono font-bold text-lg">₹{priceInput[row.count] ?? row.priceToday}</td>
                        <td className="px-5 py-4 font-mono text-zinc-400">₹{row.priceYesterday}</td>
                        <td className="px-5 py-4 font-mono text-zinc-600">₹{row.priceLW}</td>
                        <td className="px-5 py-4">
                          <span className={`flex items-center gap-1 font-bold text-sm ${change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {change > 0 ? <ChevronUp size={13} /> : change < 0 ? <ChevronDown size={13} /> : null}
                            {change !== 0 ? `${change > 0 ? '+' : ''}₹${change}` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4"><DemandBadge d={row.demand} /></td>
                        {editMode && (
                          <td className="px-5 py-4">
                            <input type="number" className="w-24 input-field py-1.5 text-sm" placeholder={String(row.priceToday)}
                              value={priceInput[row.count] ?? ''}
                              onChange={e => setPriceInput(prev => ({ ...prev, [row.count]: Number(e.target.value) }))} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['App Deal Data','Buyer Requests','Manual Admin Input'].map((src, i) => (
              <div key={src} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${['bg-emerald-500/10 text-emerald-400','bg-blue-500/10 text-blue-400','bg-amber-500/10 text-amber-400'][i]}`}>{i+1}</div>
                <div><p className="font-bold text-sm">Source: {src}</p><p className="text-[10px] text-zinc-500">{['Real deals → most accurate','Active buyer demand','Admin edits live prices'][i]}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TREND ANALYSIS ══════════════════════════════════════════════════ */}
      {tab === 'trends' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-bold flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" />Weekly Price Trend by Count</h3>
              <div className="flex gap-3 text-xs">
                {[['Count 30','#10b981'],['Count 40','#3b82f6'],['Count 50','#f59e0b'],['Count 60','#6366f1']].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: c }} /><span className="text-zinc-400">{l}</span></div>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={PRICE_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="week" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} domain={[380, 520]} tickFormatter={v => `₹${v}`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: any) => [`₹${v}/kg`, '']} />
                  <Line type="monotone" dataKey="count30" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="count40" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="count50" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="count60" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Seasonal pattern */}
            <div className="glass-panel p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={14} className="text-blue-400" />Seasonal Price Pattern</h3>
              <div className="space-y-3">
                {[
                  { season: 'Jan–Mar (Winter)', pattern: 'Low supply → High prices', direction: 'up' },
                  { season: 'Apr–Jun (Summer)', pattern: 'Harvest surge → Price dip', direction: 'down' },
                  { season: 'Jul–Sep (Monsoon)', pattern: 'Limited harvest, moderate demand', direction: 'stable' },
                  { season: 'Oct–Dec (Festival)', pattern: 'Demand spike +25%, best prices', direction: 'up' },
                ].map(({ season, pattern, direction }) => (
                  <div key={season} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div><p className="text-sm font-bold">{season}</p><p className="text-xs text-zinc-500">{pattern}</p></div>
                    <MiniTrend t={direction as any} />
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast */}
            <div className="glass-panel p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={14} className="text-amber-400" />7-Day Price Forecast</h3>
              <div className="space-y-3">
                {PRICE_TABLE.slice(0,5).map(row => {
                  const forecast = row.trend === 'up' ? row.priceToday + Math.floor(Math.random() * 15 + 5) : row.trend === 'down' ? row.priceToday - Math.floor(Math.random() * 10 + 3) : row.priceToday;
                  return (
                    <div key={`${row.count}-${row.species}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold">{row.count}</div><span className="text-sm">{row.species}</span></div>
                      <div className="flex items-center gap-2"><p className="font-mono font-bold">₹{forecast}/kg</p><MiniTrend t={row.trend as any} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 flex items-start gap-2">
                <Cpu size={11} className="mt-0.5 shrink-0" />AI advises: "Wait 5 days — Count 30 projected to reach ₹510/kg based on Ecuador supply shortage."
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DEMAND & SUPPLY ════════════════════════════════════════════════ */}
      {tab === 'demandsupply' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="Total Supply (kg)"  value="97,000"  color="text-blue-400"    sub="Available this month" />
            <InfoCard label="Buyer Demand (kg)"  value="52,000"  color="text-emerald-400" sub="Active open requests" />
            <InfoCard label="Supply Gap"         value="-8,200"  color="text-red-400"     sub="Count 30 shortage" />
            <InfoCard label="Supply Surplus"     value="+18,000" color="text-zinc-300"    sub="Count 50–60 excess" />
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2"><Activity size={16} className="text-emerald-400" />Monthly Demand vs Supply</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={DEMAND_SUPPLY_DATA}>
                  <defs>
                    <linearGradient id="gDemand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gSupply" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: any) => [`${(v/1000).toFixed(1)}K kg`, '']} />
                  <Area type="monotone" dataKey="demand" stroke="#10b981" fill="url(#gDemand)" strokeWidth={2} name="Demand" />
                  <Area type="monotone" dataKey="supply" stroke="#3b82f6" fill="url(#gSupply)" strokeWidth={2} name="Supply" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'High Demand + Low Supply', color: 'red', desc: 'Price will increase. Good time to harvest. Farmers with ready stock benefit most.', icon: TrendingUp },
              { title: 'Balanced Market', color: 'blue', desc: 'Stable prices. No urgency to harvest early or wait. Deal at current market rate.', icon: Scale },
              { title: 'Low Demand + High Supply', color: 'amber', desc: 'Price may drop. Consider value-adding (certification) or wait for demand to recover.', icon: TrendingDown },
            ].map(({ title, color, desc, icon: Icon }) => (
              <div key={title} className={`glass-panel p-5 border border-${color}-500/10`}>
                <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}><Icon size={16} className={`text-${color}-400`} /></div>
                <p className={`font-bold text-sm text-${color}-400 mb-1`}>{title}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SIZE-BASED ══════════════════════════════════════════════════════ */}
      {tab === 'sizebased' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2"><Layers size={16} className="text-purple-400" />Price & Demand by Shrimp Count (Size)</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={SIZE_DATA} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="count" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} tickFormatter={v => `C${v}`} />
                  <YAxis yAxisId="price" orientation="left" stroke="#10b981" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                  <YAxis yAxisId="demand" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: any, name: string) => [name === 'price' ? `₹${v}/kg` : `${v}%`, name === 'price' ? 'Price' : 'Demand']} />
                  <Bar yAxisId="price" dataKey="price" fill="#10b981" fillOpacity={0.7} radius={[6,6,0,0]} name="price" />
                  <Bar yAxisId="demand" dataKey="demand" fill="#f59e0b" fillOpacity={0.5} radius={[6,6,0,0]} name="demand" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-xs text-zinc-400">Price (₹/kg)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500" /><span className="text-xs text-zinc-400">Demand (%)</span></div>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Size Intelligence — Harvest Timing Guide</h3></div>
            <div className="divide-y divide-white/5">
              {SIZE_DATA.map(row => {
                const score = Math.round((row.price / 540) * 50 + (row.demand / 95) * 50);
                const rec = score > 80 ? 'Harvest Now' : score > 60 ? 'Good Timing' : score > 40 ? 'Wait' : 'Low Priority';
                const recColor = score > 80 ? 'text-emerald-400' : score > 60 ? 'text-blue-400' : score > 40 ? 'text-amber-400' : 'text-red-400';
                return (
                  <div key={row.count} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-mono font-bold">{row.count}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold font-mono">₹{row.price}/kg</p>
                        <DemandBadge d={row.demand >= 80 ? 'Very High' : row.demand >= 60 ? 'High' : row.demand >= 40 ? 'Medium' : 'Low'} />
                        <p className="text-xs text-zinc-500">{(row.supplyKg/1000).toFixed(0)}K kg available</p>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${score}%` }} /></div>
                    </div>
                    <div className="text-right w-28"><p className={`text-sm font-bold ${recColor}`}>{rec}</p><p className="text-[10px] text-zinc-600">Score: {score}%</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LOCATION INSIGHTS ═══════════════════════════════════════════════ */}
      {tab === 'location' && (
        <div className="space-y-5">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><MapPin size={16} className="text-blue-400" />Market Prices by Location</h3>
            <div className="space-y-3">
              {LOCATION_DATA.sort((a, b) => b.avgPrice - a.avgPrice).map((loc, i) => {
                const maxP = Math.max(...LOCATION_DATA.map(l => l.avgPrice));
                return (
                  <div key={loc.location} className={`flex items-center gap-4 p-4 rounded-xl border ${loc.demand === 'Very High' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/5 border-white/5'}`}>
                    <span className={`font-display font-bold text-lg w-6 text-center ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>#{i+1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5"><p className="font-bold">{loc.location}</p><DemandBadge d={loc.demand} /><MiniTrend t={loc.trend as any} /></div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(loc.avgPrice / maxP) * 100}%` }} /></div>
                        <p className="text-[10px] text-zinc-500">{(loc.supplyKg/1000).toFixed(0)}K kg supply · {loc.topBuyers} buyer{loc.topBuyers > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg">₹{loc.avgPrice}/kg</p>
                      <p className={`text-xs font-bold ${loc.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{loc.growth >= 0 ? '+' : ''}{loc.growth}% MoM</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6 border border-emerald-500/10">
            <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2"><Target size={14} />Best Selling Recommendation</h3>
            <p className="text-sm text-zinc-300">Based on current prices and demand, <span className="font-bold text-emerald-400">Nellore, AP</span> offers the highest returns (₹490/kg avg, Very High demand, 18% growth). Redirect available Count 30 supply to Nellore buyers for maximum margin.</p>
          </div>
        </div>
      )}

      {/* ═══ BUYER BEHAVIOR ══════════════════════════════════════════════════ */}
      {tab === 'buyerbehavior' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold flex items-center gap-2"><Eye size={14} className="text-blue-400" />Buyer Purchasing Patterns</h3></div>
            <div className="divide-y divide-white/5">
              {BUYER_BEHAVIOR.map(b => (
                <div key={b.buyer} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-sm font-bold">{b.buyer[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><p className="font-bold">{b.buyer}</p><span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-zinc-700/10 text-zinc-500 border-zinc-700/20">{b.segment}</span></div>
                    <p className="text-xs text-zinc-500">Prefers: <span className="text-zinc-300 font-bold">{b.preferred}</span> · Price range: {b.priceRange} · {(b.totalKg/1000).toFixed(0)}K kg total</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${b.activity === 'High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : b.activity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>{b.activity} Activity</span>
                    <MiniTrend t={b.trend as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Buyer Volume Distribution</h3>
            <div className="space-y-3">
              {BUYER_BEHAVIOR.map(b => {
                const maxVol = Math.max(...BUYER_BEHAVIOR.map(x => x.totalKg));
                return (
                  <div key={b.buyer} className="flex items-center gap-3">
                    <p className="font-bold text-xs w-36 truncate">{b.buyer}</p>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(b.totalKg / maxVol) * 100}%` }} /></div>
                    <p className="font-mono font-bold text-xs w-20 text-right text-blue-400">{(b.totalKg/1000).toFixed(0)}K kg</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FARMER vs MARKET ════════════════════════════════════════════════ */}
      {tab === 'farmerperformance' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold flex items-center gap-2"><Users size={14} className="text-purple-400" />Farmer Price Performance vs Market Average</h3></div>
            <div className="divide-y divide-white/5">
              {FARMER_PERFORMANCE.map((f, i) => (
                <div key={f.farmer} className={`p-5 ${f.premium >= 0 ? '' : 'opacity-80'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className={`text-lg font-display font-bold ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>#{i+1}</span><p className="font-bold">{f.farmer}</p>{i === 0 && <Star size={12} className="fill-amber-400 text-amber-400" />}</div>
                      <div className="flex flex-wrap gap-1.5 mt-1">{f.practices.map(p => <span key={p} className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/5 text-zinc-500">{p}</span>)}</div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg">₹{f.avgPriceReceived}/kg</p>
                      <p className={`text-sm font-bold ${f.premium >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{f.premium >= 0 ? '+' : ''}₹{f.premium} vs market</p>
                      <p className="text-[10px] text-zinc-600">Market avg: ₹{f.marketAvg}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 bg-zinc-700 rounded-full" style={{ width: `${(f.marketAvg / 520) * 100}%` }} />
                      <div className={`absolute inset-y-0 rounded-full transition-all ${f.premium >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${(f.avgPriceReceived / 520) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-500">{f.deals} deal{f.deals !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 border border-emerald-500/10">
            <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2"><Zap size={14} />What High-Value Farmers Do Differently</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['Grade A quality → premium buyers willing to pay more', 'Certified farmers get 5–15% price premium', 'DOC 100–120 days → optimal size for export count'].map(tip => (
                <div key={tip} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300 flex gap-2"><CheckCircle2 size={13} className="shrink-0 mt-0.5" />{tip}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SMART RECOMMENDATIONS ═══════════════════════════════════════════ */}
      {tab === 'smartrec' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-purple-500/20 flex items-start gap-3">
            <Cpu size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-purple-400">AI Decision Engine</p><p className="text-xs text-zinc-400 mt-1">Combines farmer logs (DOC, weight, water quality) + real market prices + buyer demand to recommend the optimal harvest timing and expected revenue for each farmer.</p></div>
          </div>

          {SMART_RECS.map(rec => {
            const gain = rec.waitRevenue - rec.expectedRevenue;
            const recColors: Record<string, { border: string; badge: string; score: string }> = {
              emerald: { border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400', score: 'text-emerald-400' },
              amber:   { border: 'border-amber-500/20',   badge: 'bg-amber-500/10 text-amber-400',   score: 'text-amber-400' },
              blue:    { border: 'border-blue-500/20',    badge: 'bg-blue-500/10 text-blue-400',     score: 'text-blue-400' },
            };
            const style = recColors[rec.color] ?? recColors.blue;
            return (
              <div key={rec.farmerId} className={`glass-panel p-6 border ${style.border}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg">{rec.farmer}</p>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>{rec.recommendation}</span>
                    </div>
                    <p className="text-sm text-zinc-400">{rec.pond} · DOC {rec.doc} days · ~{rec.count} count/kg · {rec.currentWeight}g avg</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-display font-bold ${style.score}`}>{rec.score}%</p>
                    <p className="text-[10px] text-zinc-600">AI confidence score</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                  <p className="text-xs text-zinc-400"><span className="font-bold text-zinc-200">Rationale: </span>{rec.rationale}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5"><p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">If Harvest Now</p><p className="font-mono font-bold text-emerald-400">₹{(rec.expectedRevenue/100000).toFixed(2)}L</p></div>
                  <div className="p-3 rounded-xl bg-white/5"><p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">If Wait 3W</p><p className="font-mono font-bold text-blue-400">₹{(rec.waitRevenue/100000).toFixed(2)}L</p></div>
                  <div className="p-3 rounded-xl bg-white/5"><p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Potential Gain</p><p className={`font-mono font-bold ${gain > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>{gain > 0 ? `+₹${(gain/1000).toFixed(0)}K` : 'Already optimal'}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ALERTS ══════════════════════════════════════════════════════════ */}
      {tab === 'alerts' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold">Market Alert Feed</h3>
            <button className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Bell size={13} />Configure Alerts</button>
          </div>

          <div className="space-y-3">
            {ALERTS_DATA.map(a => {
              const style = a.severity === 'positive' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' :
                            a.severity === 'warning'  ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' :
                                                        'border-blue-500/20 bg-blue-500/5 text-blue-400';
              const Icon = a.severity === 'positive' ? TrendingUp : a.severity === 'warning' ? AlertTriangle : Bell;
              return (
                <div key={a.id} className={`flex items-start gap-4 p-5 rounded-2xl border ${style}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.severity === 'positive' ? 'bg-emerald-500/10' : a.severity === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}><Icon size={16} /></div>
                  <div className="flex-1"><p className="font-bold text-sm text-zinc-100">{a.message}</p><div className="flex items-center gap-3 mt-1.5"><span className="text-[10px] font-bold uppercase opacity-70">{a.type.replace(/_/g,' ')}</span><span className="text-[10px] text-zinc-600">{a.time}</span></div></div>
                  <button className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Dismiss</button>
                </div>
              );
            })}
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Alert Rules Configuration</h3>
            <div className="space-y-3">
              {[
                { rule: 'Price Rise > ₹10/kg in a day', enabled: true },
                { rule: 'Price Drop > ₹10/kg in a day', enabled: true },
                { rule: 'Demand spike > 20% in a week', enabled: true },
                { rule: 'Supply gap > 10,000 kg for Count 30', enabled: false },
                { rule: 'Festival season alert (30 days before)', enabled: true },
              ].map(({ rule, enabled: init }) => {
                const [on, setOn] = React.useState(init);
                return (
                  <div key={rule} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm">{rule}</p>
                    <button onClick={() => setOn(p => !p)} className={`relative w-10 h-5 rounded-full transition-all ${on ? 'bg-emerald-500' : 'bg-zinc-700'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${on ? 'left-5' : 'left-0.5'}`} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXTERNAL MARKET ═════════════════════════════════════════════════ */}
      {tab === 'external' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-blue-500/10 flex items-start gap-3">
            <Globe size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-blue-400">External Market Tracking</p><p className="text-xs text-zinc-400 mt-1">Compare your platform prices vs external wholesale markets and export benchmarks. Helps keep AquaGrow competitive.</p></div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Market Comparison Table</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Market', 'Count 30', 'Count 40', 'Count 50', 'As of', 'Source'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* AquaGrow row first */}
                  <tr className="bg-emerald-500/5">
                    <td className="px-5 py-4 font-bold text-emerald-400">AquaGrow Platform</td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">₹490</td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">₹460</td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">₹440</td>
                    <td className="px-5 py-4 text-xs text-zinc-500">Live</td>
                    <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live Deals</span></td>
                  </tr>
                  {EXTERNAL_MARKET.map(m => (
                    <tr key={m.market} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-sm">{m.market}</td>
                      <td className="px-5 py-4 font-mono">₹{m.count30}<span className={`text-[10px] ml-1 ${m.count30 > 490 ? 'text-emerald-400' : 'text-red-400'}`}>{m.count30 > 490 ? '↑' : '↓'}</span></td>
                      <td className="px-5 py-4 font-mono">₹{m.count40}</td>
                      <td className="px-5 py-4 font-mono">₹{m.count50}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{m.date}</td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-700/10 text-zinc-500 border border-zinc-700/20">{m.source}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Zap size={14} className="text-amber-400" />Export Price Opportunity</h3>
            <p className="text-sm text-zinc-400">US import price for Count 30 is <span className="font-bold text-emerald-400">₹820/kg FOB</span> vs AquaGrow platform price <span className="font-bold">₹490/kg</span>. There is a significant export margin. Certified Grade A farmers with large batches should be matched with exporter buyers (e.g., AquaPrime Exports) to maximize earnings.</p>
          </div>
        </div>
      )}

      {/* ═══ REPORTS ══════════════════════════════════════════════════════════ */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCard label="Avg Market Price"    value="₹472/kg"  color="text-emerald-400" sub="Blended all counts" />
            <InfoCard label="Highest Location"    value="Kochi, KL" color="text-blue-400"   sub="₹510/kg avg" />
            <InfoCard label="Best Count (ROI)"    value="Count 30"  color="text-amber-400"  sub="₹490 · Very High demand" />
            <InfoCard label="Total Platform Vol." value="97,000 kg" color="" sub="Monthly supply side" />
          </div>

          {/* Revenue impact */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-emerald-400" />Revenue Impact by Size</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={SIZE_DATA.map(d => ({ ...d, revenue: d.price * d.supplyKg }))} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="count" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} tickFormatter={v => `C${v}`} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v: any) => [`₹${(v/100000).toFixed(2)}L`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[6,6,0,0]}>
                    {SIZE_DATA.map((_, i) => <Cell key={i} fill={['#10b981','#10b981','#10b981','#3b82f6','#f59e0b','#f59e0b','#6b7280'][i] ?? '#6b7280'} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Market Summary Report</h3></div>
            <div className="divide-y divide-white/5">
              {[
                { metric: 'Average market price (all sizes)', value: '₹472/kg', commentary: 'Stable, slight upward trend this week' },
                { metric: 'Highest demand region', value: 'Nellore, AP', commentary: '₹490/kg, +18% MoM growth' },
                { metric: 'Best harvest count', value: 'Count 30', commentary: 'Very High demand, ₹490/kg' },
                { metric: 'Supply gap (Count 30)', value: '−8,200 kg', commentary: 'Shortage → price expected to rise' },
                { metric: 'Export price premium', value: '+₹330/kg', commentary: 'US market @ ₹820 FOB vs platform ₹490' },
                { metric: 'Farmer premium (certified)', value: '+₹12/kg avg', commentary: 'Grade A certified farms earn more' },
                { metric: 'Platform commission earned', value: '₹2.15L', commentary: 'This month, all harvest deals combined' },
              ].map(({ metric, value, commentary }) => (
                <div key={metric} className="flex items-center gap-4 px-5 py-3.5">
                  <p className="text-sm text-zinc-400 flex-1">{metric}</p>
                  <p className="font-bold font-mono w-28 text-right">{value}</p>
                  <p className="text-xs text-zinc-600 w-52 text-right hidden md:block">{commentary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button className="btn-primary flex items-center gap-2 px-8"><Download size={16} />Download Full PDF Report</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default MarketIntelligence;
