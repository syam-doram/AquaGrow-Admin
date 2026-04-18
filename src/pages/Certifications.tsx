import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award, CheckCircle2, XCircle, Shield, Search, Filter, Star,
  RefreshCw, Wifi, WifiOff, Database, Users, Fish, BadgeCheck,
  AlertTriangle, TrendingUp, BarChart3, Clock, Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchHarvestRequests, fetchFarmers, fetchPonds, fetchIntelligence,
  type LiveHarvestRequest, type LiveFarmer, type LivePond, type IntelligenceData,
} from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
type CertType = 'TRUSTED_FARMER' | 'QUALITY_ASSURED' | 'HARVEST_CHAMPION' | 'ACTIVE_PRODUCER';

interface DerivedCert {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  certType: CertType;
  status: 'ELIGIBLE' | 'APPROVED' | 'NEEDS_REVIEW';
  criteria: { label: string; met: boolean }[];
  totalHarvests: number;
  completedHarvests: number;
  totalBiomass: number;
  avgWeight: number;
  activePonds: number;
  subscriptionStatus: string;
}

// ─── Cert config ─────────────────────────────────────────────────────────────
const CERT_CONFIG: Record<CertType, { label: string; icon: React.FC<any>; color: string; description: string }> = {
  TRUSTED_FARMER:   { label: 'Trusted Farmer',    icon: Shield,    color: 'text-emerald-400 bg-emerald-500/10', description: 'Consistently completes harvest requests' },
  QUALITY_ASSURED:  { label: 'Quality Assured',   icon: Star,      color: 'text-amber-400 bg-amber-500/10',    description: 'High avg shrimp weight & biomass quality' },
  HARVEST_CHAMPION: { label: 'Harvest Champion',  icon: Award,     color: 'text-purple-400 bg-purple-500/10',  description: 'Top 20% by total harvested biomass' },
  ACTIVE_PRODUCER:  { label: 'Active Producer',   icon: Fish,      color: 'text-blue-400 bg-blue-500/10',      description: 'Has active ponds with harvest ready status' },
};

const STATUS_STYLES: Record<string, string> = {
  ELIGIBLE:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  APPROVED:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  NEEDS_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: DerivedCert['status'] }) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[status]}`}>
    {status.replace(/_/g, ' ')}
  </span>
);

// ─── Derive certifications from live data ────────────────────────────────────
function deriveCertifications(
  farmers: LiveFarmer[],
  harvests: LiveHarvestRequest[],
  ponds: LivePond[],
): DerivedCert[] {
  // Top biomass threshold (top 20%)
  const farmersWithBiomass = farmers.map(f => ({
    id: f._id,
    biomass: harvests.filter(h => h.userId === f._id && h.status === 'completed').reduce((s, h) => s + h.biomass, 0),
  }));
  const sorted = [...farmersWithBiomass].sort((a, b) => b.biomass - a.biomass);
  const topThreshold = sorted[Math.floor(sorted.length * 0.2)]?.biomass ?? 0;

  return farmers.map(farmer => {
    const fHarvests   = harvests.filter(h => h.userId === farmer._id);
    const completed   = fHarvests.filter(h => h.status === 'completed');
    const totalBiomass = completed.reduce((s, h) => s + h.biomass, 0);
    const avgWeight    = fHarvests.length ? fHarvests.reduce((s, h) => s + h.avgWeight, 0) / fHarvests.length : 0;
    const fPonds       = ponds.filter(p => p.userId === farmer._id);
    const activePonds  = fPonds.filter(p => p.status === 'active').length;
    const hasHarvestReady = fPonds.some(p => p.alerts.includes('HARVEST_READY'));
    const isSubscribed = farmer.subscriptionStatus !== 'free';

    // Determine cert type (priority order)
    let certType: CertType;
    if (totalBiomass >= topThreshold && topThreshold > 0 && completed.length >= 3) {
      certType = 'HARVEST_CHAMPION';
    } else if (avgWeight >= 15 && completed.length >= 2) {
      certType = 'QUALITY_ASSURED';
    } else if (completed.length >= 2 && isSubscribed) {
      certType = 'TRUSTED_FARMER';
    } else {
      certType = 'ACTIVE_PRODUCER';
    }

    // Criteria check
    const criteria: { label: string; met: boolean }[] = [
      { label: 'Has completed harvests (≥1)',       met: completed.length >= 1 },
      { label: 'Subscribed to a plan',              met: isSubscribed },
      { label: 'Has active ponds',                  met: activePonds > 0 },
      { label: 'Avg shrimp weight ≥ 10g',           met: avgWeight >= 10 },
      { label: 'Total biomass ≥ 500 kg harvested',  met: totalBiomass >= 500 },
    ];

    if (certType === 'HARVEST_CHAMPION') {
      criteria.push({ label: 'Top 20% by biomass across all farmers', met: totalBiomass >= topThreshold });
    }
    if (certType === 'QUALITY_ASSURED') {
      criteria.push({ label: 'Avg shrimp weight ≥ 15g',     met: avgWeight >= 15 });
      criteria.push({ label: 'Completed ≥ 2 harvests',       met: completed.length >= 2 });
    }
    if (certType === 'ACTIVE_PRODUCER') {
      criteria.push({ label: 'Has harvest-ready pond',       met: hasHarvestReady });
    }

    const allMet = criteria.every(c => c.met);
    const status: DerivedCert['status'] = allMet ? 'ELIGIBLE' : fHarvests.length > 0 ? 'NEEDS_REVIEW' : 'NEEDS_REVIEW';

    return {
      farmerId: farmer._id,
      farmerName: farmer.name,
      farmerPhone: farmer.phoneNumber,
      certType,
      status,
      criteria,
      totalHarvests: fHarvests.length,
      completedHarvests: completed.length,
      totalBiomass,
      avgWeight,
      activePonds,
      subscriptionStatus: farmer.subscriptionStatus,
    };
  }).sort((a, b) => (b.completedHarvests - a.completedHarvests) || (b.totalBiomass - a.totalBiomass));
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Certifications = () => {
  const [farmers, setFarmers]   = useState<LiveFarmer[]>([]);
  const [harvests, setHarvests] = useState<LiveHarvestRequest[]>([]);
  const [ponds, setPonds]       = useState<LivePond[]>([]);
  const [intel, setIntel]       = useState<IntelligenceData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync]   = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filterCert, setFilterCert] = useState<'all' | CertType>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<DerivedCert | null>(null);
  // Track approved in session (since there's no certs endpoint, we store locally)
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setApiStatus('loading');
    try {
      const [f, h, p, i] = await Promise.allSettled([
        fetchFarmers(), fetchHarvestRequests(), fetchPonds(), fetchIntelligence(),
      ]);
      if (f.status === 'fulfilled') setFarmers(f.value);
      if (h.status === 'fulfilled') setHarvests(h.value);
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

  // ── Derived certs ──────────────────────────────────────────────────────────
  const certs = useMemo(() => deriveCertifications(farmers, harvests, ponds), [farmers, harvests, ponds]);

  const enrichedCerts = useMemo(() => certs.map(c => ({
    ...c,
    status: approved.has(c.farmerId) ? 'APPROVED' as const : c.status,
  })), [certs, approved]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    eligible:    enrichedCerts.filter(c => c.status === 'ELIGIBLE').length,
    approved:    enrichedCerts.filter(c => c.status === 'APPROVED').length,
    needsReview: enrichedCerts.filter(c => c.status === 'NEEDS_REVIEW').length,
    champions:   enrichedCerts.filter(c => c.certType === 'HARVEST_CHAMPION').length,
  }), [enrichedCerts]);

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => enrichedCerts.filter(c => {
    const ms = c.farmerName.toLowerCase().includes(search.toLowerCase()) ||
               c.farmerPhone.includes(search);
    const mc = filterCert === 'all' || c.certType === filterCert;
    const ms2 = filterStatus === 'all' || c.status === filterStatus;
    return ms && mc && ms2;
  }), [enrichedCerts, search, filterCert, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-1">Certifications</h1>
          <p className="text-zinc-400 text-sm">Auto-derived from live harvest & farm data — AquaGrow MongoDB</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Eligible',       value: stats.eligible,    color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 },
          { label: 'Approved',       value: stats.approved,    color: 'text-blue-400 bg-blue-500/10',       icon: BadgeCheck },
          { label: 'Needs Review',   value: stats.needsReview, color: 'text-amber-400 bg-amber-500/10',     icon: Clock },
          { label: 'Champions',      value: stats.champions,   color: 'text-purple-400 bg-purple-500/10',   icon: Award },
        ].map(({ label, value, color, icon: Icon }) => {
          const [text, bg] = color.split(' ');
          return (
            <div key={label} className="card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={20} className={text} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p>
                <p className={`text-3xl font-display font-bold ${text} mt-0.5`}>{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cert type overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(CERT_CONFIG) as [CertType, typeof CERT_CONFIG[CertType]][]).map(([type, cfg]) => {
          const count = enrichedCerts.filter(c => c.certType === type).length;
          const eligibleCount = enrichedCerts.filter(c => c.certType === type && c.status === 'ELIGIBLE').length;
          const [textColor, bgColor] = cfg.color.split(' ');
          return (
            <button key={type} onClick={() => setFilterCert(filterCert === type ? 'all' : type)}
              className={`card p-5 text-left hover:border-white/20 transition-all ${filterCert === type ? 'border-white/20 bg-white/3' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} mb-3`}>
                <cfg.icon size={18} className={textColor} />
              </div>
              <p className="font-bold text-sm">{cfg.label}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 mb-2">{cfg.description}</p>
              <p className={`text-2xl font-display font-bold ${textColor}`}>{count}
                <span className="text-base text-zinc-500 font-normal"> farmers</span>
              </p>
              {eligibleCount > 0 && (
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> {eligibleCount} eligible
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Eligibility Rules */}
      <div className="card p-6">
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" /> Auto-Eligibility Criteria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(Object.entries(CERT_CONFIG) as [CertType, typeof CERT_CONFIG[CertType]][]).map(([type, cfg]) => {
            const [textColor, bgColor] = cfg.color.split(' ');
            const rules: Record<CertType, string[]> = {
              HARVEST_CHAMPION:  ['Top 20% by total biomass', '≥ 3 completed harvests', 'Any subscription plan'],
              QUALITY_ASSURED:   ['Avg shrimp weight ≥ 15g', '≥ 2 completed harvests', 'Active subscription'],
              TRUSTED_FARMER:    ['≥ 2 completed harvests', 'Subscribed user (any plan)', 'Has active ponds'],
              ACTIVE_PRODUCER:   ['Has active ponds', 'At least 1 harvest request', 'Harvest-ready pond preferred'],
            };
            return (
              <div key={type} className="p-4 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bgColor}`}>
                    <cfg.icon size={14} className={textColor} />
                  </div>
                  <p className={`font-bold text-sm ${textColor}`}>{cfg.label}</p>
                </div>
                <div className="space-y-1.5">
                  {rules[type].map(rule => (
                    <div key={rule} className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />{rule}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search by farmer name or phone..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Filter size={13} className="text-zinc-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
            <option value="all">All Status</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="APPROVED">Approved</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Award size={13} className="text-zinc-500" />
          <select value={filterCert} onChange={e => setFilterCert(e.target.value as any)} className="bg-transparent outline-none text-sm">
            <option value="all">All Cert Types</option>
            <option value="HARVEST_CHAMPION">Harvest Champion</option>
            <option value="QUALITY_ASSURED">Quality Assured</option>
            <option value="TRUSTED_FARMER">Trusted Farmer</option>
            <option value="ACTIVE_PRODUCER">Active Producer</option>
          </select>
        </div>
        <span className="flex items-center text-xs text-zinc-500 px-1">{filtered.length} farmers</span>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="card p-12 text-center animate-pulse">
          <Database size={28} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-zinc-600">Loading from MongoDB...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Award size={32} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-500">{farmers.length === 0 ? 'No farmer data in DB yet' : 'No matches found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cert, i) => {
            const cfg = CERT_CONFIG[cert.certType];
            const [textColor, bgColor] = cfg.color.split(' ');
            const allMet = cert.criteria.every(c => c.met);
            return (
              <motion.div key={cert.farmerId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className={`card p-6 cursor-pointer hover:border-white/20 transition-all ${cert.status === 'ELIGIBLE' ? 'border-emerald-500/20' : cert.status === 'APPROVED' ? 'border-blue-500/20' : ''}`}
                onClick={() => setSelected(cert)}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgColor}`}>
                      <cfg.icon size={20} className={textColor} />
                    </div>
                    <div>
                      <p className="font-bold">{cert.farmerName}</p>
                      <p className="text-xs text-zinc-500">{cert.farmerPhone}</p>
                    </div>
                  </div>
                  <StatusBadge status={cert.status} />
                </div>

                {/* Cert type label */}
                <p className={`text-xs font-bold ${textColor} mb-3`}>{cfg.label}</p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/3 text-center">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Harvests</p>
                    <p className="font-bold text-sm">{cert.completedHarvests}/{cert.totalHarvests}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/3 text-center">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Biomass</p>
                    <p className="font-bold text-sm">{cert.totalBiomass >= 1000 ? `${(cert.totalBiomass/1000).toFixed(1)}t` : `${cert.totalBiomass}kg`}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/3 text-center">
                    <p className="text-[10px] text-zinc-500 mb-0.5">Ponds</p>
                    <p className="font-bold text-sm">{cert.activePonds}</p>
                  </div>
                </div>

                {/* Criteria preview (top 3) */}
                <div className="space-y-1.5">
                  {cert.criteria.slice(0, 3).map(c => (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      {c.met ? <CheckCircle2 size={11} className="text-emerald-400 shrink-0" /> : <XCircle size={11} className="text-red-400 shrink-0" />}
                      <span className={c.met ? 'text-zinc-300' : 'text-zinc-600'}>{c.label}</span>
                    </div>
                  ))}
                  {cert.criteria.length > 3 && (
                    <p className="text-[10px] text-zinc-600">+{cert.criteria.length - 3} more criteria →</p>
                  )}
                </div>

                {/* Bottom */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cert.subscriptionStatus === 'pro_diamond' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                    cert.subscriptionStatus === 'pro_gold' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    cert.subscriptionStatus === 'pro_silver' ? 'bg-zinc-400/20 text-zinc-300 border-zinc-400/30' :
                    cert.subscriptionStatus === 'pro' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    'bg-zinc-700/20 text-zinc-500 border-zinc-700/30'
                  }`}>{cert.subscriptionStatus.toUpperCase().replace(/_/g, ' ')}</span>
                  {allMet && cert.status !== 'APPROVED' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> All criteria met</span>
                  )}
                  {cert.status === 'APPROVED' && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1"><BadgeCheck size={10} /> Certified ✓</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (() => {
          const cfg = CERT_CONFIG[selected.certType];
          const [textColor, bgColor] = cfg.color.split(' ');
          const isApproved = selected.status === 'APPROVED';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelected(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-lg card p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
                      <cfg.icon size={22} className={textColor} />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold">{selected.farmerName}</h2>
                      <p className="text-sm text-zinc-400">{selected.farmerPhone}</p>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* Cert type */}
                <div className={`px-4 py-3 rounded-xl ${bgColor} border border-white/5 mb-5`}>
                  <p className={`font-bold text-sm ${textColor}`}>{cfg.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{cfg.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Total Harvests', value: selected.totalHarvests },
                    { label: 'Completed',       value: selected.completedHarvests },
                    { label: 'Total Biomass',   value: `${selected.totalBiomass} kg` },
                    { label: 'Avg Weight',      value: `${selected.avgWeight.toFixed(1)}g` },
                    { label: 'Active Ponds',    value: selected.activePonds },
                    { label: 'Subscription',    value: selected.subscriptionStatus.replace(/_/g, ' ') },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
                      <p className="font-bold text-sm capitalize">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Criteria */}
                <div className="mb-6">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Criteria Check</p>
                  <div className="space-y-2">
                    {selected.criteria.map(c => (
                      <div key={c.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                        <span className="text-sm text-zinc-300">{c.label}</span>
                        {c.met
                          ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          : <XCircle     size={16} className="text-red-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setSelected(null)}
                    className="px-4 py-2 bg-white/5 text-zinc-400 hover:bg-white/10 rounded-xl transition-all text-sm font-medium">
                    Close
                  </button>
                  {isApproved ? (
                    <button onClick={() => { setApproved(prev => { const s = new Set(prev); s.delete(selected.farmerId); return s; }); setSelected(null); }}
                      className="px-4 py-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2">
                      <XCircle size={14} /> Revoke
                    </button>
                  ) : (
                    <button onClick={() => { setApproved(prev => new Set([...prev, selected.farmerId])); setSelected(null); }}
                      className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl transition-all text-sm font-bold flex items-center gap-2">
                      <BadgeCheck size={14} /> Approve Certification
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default Certifications;
