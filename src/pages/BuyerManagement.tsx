import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, Plus, MapPin, TrendingUp, Star, Clock,
  Shield, CheckCircle2, XCircle, AlertTriangle, Users, DollarSign,
  BarChart3, ArrowUpRight, Trash2, X, Package, Bell, Eye,
  Filter, Flag, Zap, RefreshCw, ChevronRight, Edit3,
  BadgeCheck, UserX, Activity, MessageSquare, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BuyerCompany, BuyerDeal, BuyerPurchaseRequest, BuyerDispute,
  BuyerType, BuyerVerificationStatus, BuyerSegment
} from '../types';
import { storageService } from '../services/storageService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'profiles' | 'matching' | 'requests' | 'deals'
         | 'pricing' | 'payments' | 'commission' | 'activity'
         | 'ratings' | 'disputes' | 'segments' | 'analytics';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_DEALS: BuyerDeal[] = [
  { id: 'D-001', buyerId: 'B-001', buyerName: 'AquaPrime Exports', farmerId: 'F-101', farmerName: 'John Doe', species: 'L. Vannamei', quantityKg: 2000, pricePerKg: 485, totalValue: 970000, commission: 48500, status: 'DELIVERED', paymentStatus: 'PAID', deliveryDate: '2026-04-10', createdAt: '2026-04-05' },
  { id: 'D-002', buyerId: 'B-002', buyerName: 'Blue Ocean Traders', farmerId: 'F-102', farmerName: 'Jane Smith', species: 'L. Vannamei', quantityKg: 1500, pricePerKg: 470, totalValue: 705000, commission: 35250, status: 'DISPATCHED', paymentStatus: 'ADVANCE_PAID', deliveryDate: '2026-04-20', createdAt: '2026-04-12' },
  { id: 'D-003', buyerId: 'B-003', buyerName: 'Coastal Seafood Co.', farmerId: 'F-103', farmerName: 'Mike Ross', species: 'P. Monodon', quantityKg: 800, pricePerKg: 620, totalValue: 496000, commission: 24800, status: 'NEGOTIATING', paymentStatus: 'PENDING', createdAt: '2026-04-15' },
  { id: 'D-004', buyerId: 'B-001', buyerName: 'AquaPrime Exports', farmerId: 'F-101', farmerName: 'John Doe', species: 'L. Vannamei', quantityKg: 3000, pricePerKg: 490, totalValue: 1470000, commission: 73500, status: 'CONFIRMED', paymentStatus: 'ADVANCE_PAID', deliveryDate: '2026-05-01', createdAt: '2026-04-14' },
  { id: 'D-005', buyerId: 'B-004', buyerName: 'Fresh Catch Ltd.', farmerId: 'F-102', farmerName: 'Jane Smith', species: 'L. Vannamei', quantityKg: 500, pricePerKg: 455, totalValue: 227500, commission: 11375, status: 'DISPUTED', paymentStatus: 'PENDING', createdAt: '2026-04-08' },
];

const SEED_REQUESTS: BuyerPurchaseRequest[] = [
  { id: 'R-001', buyerId: 'B-001', buyerName: 'AquaPrime Exports', species: 'L. Vannamei', quantityKg: 5000, sizeCount: '40-50 count/kg', qualityGrade: 'A', maxPricePerKg: 500, preferredLocation: 'Nellore, AP', status: 'OPEN', createdAt: '2026-04-15' },
  { id: 'R-002', buyerId: 'B-003', buyerName: 'Coastal Seafood Co.', species: 'P. Monodon', quantityKg: 2000, sizeCount: '20-30 count/kg', qualityGrade: 'A', maxPricePerKg: 650, preferredLocation: 'Vizag, AP', status: 'MATCHED', matchedFarmerId: 'F-103', matchedFarmerName: 'Mike Ross', createdAt: '2026-04-13' },
  { id: 'R-003', buyerId: 'B-002', buyerName: 'Blue Ocean Traders', species: 'L. Vannamei', quantityKg: 1000, sizeCount: '60-70 count/kg', qualityGrade: 'B', maxPricePerKg: 420, preferredLocation: 'Krishna, AP', status: 'CLOSED', createdAt: '2026-04-10' },
];

const SEED_DISPUTES: BuyerDispute[] = [
  { id: 'DIS-001', buyerId: 'B-004', buyerName: 'Fresh Catch Ltd.', dealId: 'D-005', reportedBy: 'farmer', issue: 'Buyer did not pay on agreed date. 15 days overdue.', status: 'OPEN', createdAt: '2026-04-14' },
  { id: 'DIS-002', buyerId: 'B-003', buyerName: 'Coastal Seafood Co.', dealId: 'D-003', reportedBy: 'buyer', issue: 'Quality of shrimp did not match Grade A specification.', status: 'INVESTIGATING', createdAt: '2026-04-12' },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const VERIFICATION_COLORS: Record<BuyerVerificationStatus, string> = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  verified:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:  'bg-red-500/10 text-red-400 border-red-500/20',
  suspended: 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
};

const DEAL_STATUS_COLORS: Record<BuyerDeal['status'], string> = {
  NEGOTIATING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CONFIRMED:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DISPATCHED:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELIVERED:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DISPUTED:    'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELLED:   'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
};

const SEGMENT_COLORS: Record<BuyerSegment, string> = {
  'high-value': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'frequent':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'exporter':   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'inactive':   'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
  'new':        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

// ─── Sub-components ──────────────────────────────────────────────────────────
const VerifBadge = ({ s }: { s: BuyerVerificationStatus }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${VERIFICATION_COLORS[s]}`}>{s.toUpperCase()}</span>
);
const SegmentBadge = ({ s }: { s: BuyerSegment }) => (
  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${SEGMENT_COLORS[s]}`}>{s}</span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BuyerManagement = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [buyers, setBuyers] = useState<BuyerCompany[]>([]);
  const [deals, setDeals] = useState<BuyerDeal[]>(SEED_DEALS);
  const [requests, setRequests] = useState<BuyerPurchaseRequest[]>(SEED_REQUESTS);
  const [disputes, setDisputes] = useState<BuyerDispute[]>(SEED_DISPUTES);
  const [search, setSearch] = useState('');
  const [filterVerif, setFilterVerif] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeg, setFilterSeg] = useState<string>('all');
  const [selected, setSelected] = useState<BuyerCompany | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(440);
  const [suggestedPrice, setSuggestedPrice] = useState(480);

  const [newBuyer, setNewBuyer] = useState<Partial<BuyerCompany>>({
    buyerType: 'Wholesaler', verificationStatus: 'pending', segment: 'new',
    isVerifiedBadge: false, otpVerified: false, baseRate: 470, demand: 1000,
    rating: 0, paymentSpeed: 'AVERAGE', status: 'active',
    totalDealsCompleted: 0, totalSpent: 0, commissionRate: 5, activeOrders: 0,
    joinedAt: new Date().toISOString().split('T')[0],
  });

  const load = () => {
    const raw = storageService.getBuyers();
    // Migrate old buyers that lack new fields
    const migrated = raw.map((b: any) => ({
      contactPerson: b.contactPerson ?? b.name,
      phone: b.phone ?? '+91 00000 00000',
      buyerType: b.buyerType ?? 'Wholesaler' as BuyerType,
      verificationStatus: b.verificationStatus ?? (b.status === 'active' ? 'verified' : 'pending') as BuyerVerificationStatus,
      segment: b.segment ?? 'new' as BuyerSegment,
      isVerifiedBadge: b.isVerifiedBadge ?? (b.status === 'active'),
      otpVerified: b.otpVerified ?? true,
      totalDealsCompleted: b.totalDealsCompleted ?? b.activeOrders ?? 0,
      totalSpent: b.totalSpent ?? b.demand * b.baseRate / 100,
      commissionRate: b.commissionRate ?? 5,
      joinedAt: b.joinedAt ?? '2026-01-01',
      ...b,
    } as BuyerCompany));
    setBuyers(migrated);
  };

  useEffect(() => { load(); }, []);

  // ── Computed Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:        buyers.length,
    active:       buyers.filter(b => b.status === 'active').length,
    verified:     buyers.filter(b => b.verificationStatus === 'verified').length,
    pending:      buyers.filter(b => b.verificationStatus === 'pending').length,
    suspended:    buyers.filter(b => b.status === 'suspended').length,
    totalDemand:  buyers.reduce((s, b) => s + b.demand, 0),
    totalDeals:   deals.filter(d => d.status === 'DELIVERED').length,
    totalRevenue: deals.filter(d => d.paymentStatus === 'PAID').reduce((s, d) => s + d.totalValue, 0),
    totalCommission: deals.reduce((s, d) => s + d.commission, 0),
    openDisputes: disputes.filter(d => d.status === 'OPEN').length,
  }), [buyers, deals, disputes]);

  // ── Filtered buyers ────────────────────────────────────────────────────────
  const filtered = useMemo(() => buyers.filter(b => {
    const ms  = b.name.toLowerCase().includes(search.toLowerCase()) || b.location.toLowerCase().includes(search.toLowerCase());
    const mv  = filterVerif === 'all' || b.verificationStatus === filterVerif;
    const mt  = filterType  === 'all' || b.buyerType === filterType;
    const mse = filterSeg   === 'all' || b.segment === filterSeg;
    return ms && mv && mt && mse;
  }), [buyers, search, filterVerif, filterType, filterSeg]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setVerification = (id: string, status: BuyerVerificationStatus) => {
    const b = buyers.find(x => x.id === id);
    if (b) {
      storageService.saveBuyer({ ...b, verificationStatus: status, isVerifiedBadge: status === 'verified', status: status === 'suspended' ? 'suspended' : status === 'rejected' ? 'inactive' : 'active' } as any);
      load();
    }
  };

  const handleAdd = () => {
    if (!newBuyer.name || !newBuyer.location) return;
    storageService.saveBuyer({ ...newBuyer, id: `B-${Date.now()}` } as any);
    setIsAddOpen(false);
    setNewBuyer({ buyerType: 'Wholesaler', verificationStatus: 'pending', segment: 'new', isVerifiedBadge: false, otpVerified: false, baseRate: 470, demand: 1000, rating: 0, paymentSpeed: 'AVERAGE', status: 'active', totalDealsCompleted: 0, totalSpent: 0, commissionRate: 5, activeOrders: 0, joinedAt: new Date().toISOString().split('T')[0] });
    load();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this buyer?')) { storageService.deleteBuyer(id); load(); setSelected(null); }
  };

  const updateDeal = (id: string, patch: Partial<BuyerDeal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const updateDispute = (id: string, patch: Partial<BuyerDispute>) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'overview',   label: 'Overview',         icon: Activity,      badge: stats.pending },
    { id: 'profiles',   label: 'Profiles',          icon: Users },
    { id: 'matching',   label: 'Farmer Matching',   icon: Zap },
    { id: 'requests',   label: 'Purchase Requests', icon: Package,       badge: requests.filter(r => r.status === 'OPEN').length },
    { id: 'deals',      label: 'Deals',             icon: FileText },
    { id: 'pricing',    label: 'Pricing Control',   icon: DollarSign },
    { id: 'payments',   label: 'Payments',          icon: CheckCircle2 },
    { id: 'commission', label: 'Commission',        icon: TrendingUp },
    { id: 'activity',   label: 'Activity',          icon: Clock },
    { id: 'ratings',    label: 'Ratings',           icon: Star },
    { id: 'disputes',   label: 'Disputes',          icon: Flag,          badge: stats.openDisputes },
    { id: 'segments',   label: 'Segments',          icon: Filter },
    { id: 'analytics',  label: 'Analytics',         icon: BarChart3 },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Buyer Management</h1>
          <p className="text-zinc-400">Verify, match, and manage all harvest buyers on the AquaGrow marketplace.</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.openDisputes > 0 && <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-red-500/5 border-red-500/20 text-red-400 text-sm"><Flag size={13} />{stats.openDisputes} open disputes</div>}
          {tab === 'profiles' && <button onClick={() => setIsAddOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Buyer</button>}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Buyers', value: stats.total, color: '' },
          { label: 'Active', value: stats.active, color: 'text-emerald-400' },
          { label: 'Verified', value: stats.verified, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, color: stats.pending > 0 ? 'text-amber-400' : '' },
          { label: 'Suspended', value: stats.suspended, color: stats.suspended > 0 ? 'text-red-400' : '' },
          { label: 'Demand', value: `${(stats.totalDemand / 1000).toFixed(0)}T`, color: 'text-blue-400' },
          { label: 'Commission', value: fmtK(stats.totalCommission), color: 'text-radiant-sun' },
          { label: 'Disputes', value: stats.openDisputes, color: stats.openDisputes > 0 ? 'text-red-400' : '' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-2xl font-display font-bold ${color || 'text-zinc-100'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={13} />{t.label}
            {t.badge !== undefined && t.badge > 0 && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-red-500/80 text-white'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Pending verifications alert */}
          {stats.pending > 0 && (
            <div className="glass-panel p-5 border border-amber-500/10 flex items-center gap-4">
              <AlertTriangle size={20} className="text-amber-400 shrink-0" />
              <div className="flex-1"><p className="font-bold text-amber-400">{stats.pending} buyer{stats.pending > 1 ? 's' : ''} awaiting verification</p><p className="text-xs text-zinc-500">Review and approve to enable marketplace access.</p></div>
              <button onClick={() => setTab('profiles')} className="text-xs font-bold px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all">Review Now</button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Revenue from Buyers', value: fmtK(stats.totalRevenue), color: 'bg-emerald-500/10 text-emerald-400', icon: DollarSign, trend: 12.4 },
              { label: 'Total Commission Earned', value: fmtK(stats.totalCommission), color: 'bg-amber-500/10 text-amber-400', icon: TrendingUp, trend: 8.7 },
              { label: 'Deals Delivered', value: stats.totalDeals, color: 'bg-blue-500/10 text-blue-400', icon: Package },
              { label: 'Monthly Demand', value: `${(stats.totalDemand / 1000).toFixed(1)}T`, color: 'bg-purple-500/10 text-purple-400', icon: Activity },
            ].map(({ label, value, color, icon: Icon, trend }) => (
              <div key={label} className="glass-panel p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{label}</p>
                  <div className={`p-2 rounded-xl ${color}`}><Icon size={16} /></div>
                </div>
                <p className={`text-3xl font-display font-bold ${color.split(' ')[1]}`}>{value}</p>
                {trend && <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-400"><ArrowUpRight size={12} />{trend}%</div>}
              </div>
            ))}
          </div>

          {/* Recent deals */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-display font-bold mb-5">Recent Deals</h3>
            <div className="space-y-3">
              {deals.slice(0, 4).map(d => (
                <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DEAL_STATUS_COLORS[d.status]}`}>{d.status}</span>
                  <div className="flex-1"><p className="font-bold text-sm">{d.buyerName} ↔ {d.farmerName}</p><p className="text-xs text-zinc-500">{d.quantityKg.toLocaleString()} kg {d.species} @ ₹{d.pricePerKg}/kg</p></div>
                  <div className="text-right"><p className="font-mono font-bold text-emerald-400">{fmtK(d.totalValue)}</p><p className="text-[10px] text-zinc-600">Commission: {fmtK(d.commission)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROFILES ═══════════════════════════════════════════════════════ */}
      {tab === 'profiles' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input className="input-field w-full pl-11" placeholder="Search buyers..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {[
              { val: filterVerif, set: setFilterVerif, opts: ['all','pending','verified','rejected','suspended'], label: 'Verification' },
              { val: filterType,  set: setFilterType,  opts: ['all','Wholesaler','Exporter','Local Trader','Retailer','Processor'], label: 'Type' },
              { val: filterSeg,   set: setFilterSeg,   opts: ['all','high-value','frequent','exporter','inactive','new'], label: 'Segment' },
            ].map(({ val, set, opts, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <Filter size={13} className="text-zinc-500" />
                <select value={val} onChange={e => set(e.target.value)} className="bg-transparent outline-none text-sm">
                  {opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${label}s` : o}</option>)}
                </select>
              </div>
            ))}
            <p className="flex items-center text-xs text-zinc-500 px-2">{filtered.length} buyers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(b => (
              <motion.div key={b.id} whileHover={{ y: -2 }} className="glass-panel p-6 cursor-pointer" onClick={() => setSelected(b)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-xl font-display font-bold text-blue-400">{b.name.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold">{b.name}</p>
                        {b.isVerifiedBadge && <BadgeCheck size={14} className="text-emerald-400" />}
                      </div>
                      <p className="text-xs text-zinc-500">{b.buyerType}</p>
                    </div>
                  </div>
                  <VerifBadge s={b.verificationStatus} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400"><MapPin size={11} className="text-zinc-600" />{b.location}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400"><Package size={11} className="text-zinc-600" />Demand: <span className="font-bold text-zinc-200">{b.demand.toLocaleString()} kg/mo</span></div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400"><DollarSign size={11} className="text-zinc-600" />Base Rate: <span className="font-bold text-emerald-400">₹{b.baseRate}/kg</span></div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= b.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 fill-zinc-700'} />)}<span className="text-xs text-zinc-500 ml-1">{b.rating.toFixed(1)}</span></div>
                  <div className="flex items-center gap-2">
                    <SegmentBadge s={b.segment} />
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${b.paymentSpeed === 'FAST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : b.paymentSpeed === 'SLOW' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{b.paymentSpeed}</span>
                  </div>
                </div>

                {b.verificationStatus === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setVerification(b.id, 'verified')} className="flex-1 text-xs font-bold py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1"><CheckCircle2 size={12} />Approve</button>
                    <button onClick={() => setVerification(b.id, 'rejected')} className="flex-1 text-xs font-bold py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-1"><XCircle size={12} />Reject</button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ FARMER MATCHING ════════════════════════════════════════════════ */}
      {tab === 'matching' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 border border-emerald-500/10 flex items-start gap-3">
            <Zap size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-400 text-sm">Smart AquaGrow Advantage</p>
              <p className="text-xs text-zinc-400 mt-1">Farmer gets certified → automatically visible to premium buyers. Only verified buyers see certified farmer harvests. Location + species + quality grade drives auto-matching.</p>
            </div>
          </div>

          {/* Matching rules */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Matching Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { rule: 'Certified Farmers → Premium Buyers', icon: Shield, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10', desc: 'Only farmers with Trusted/Certified status appear to premium/exporter buyers' },
                { rule: 'Location-Based Matching', icon: MapPin, color: 'text-blue-400 bg-blue-500/5 border-blue-500/10', desc: 'Buyers set preferred zones; farmers in those zones are auto-matched first' },
                { rule: 'Quality Grade Filter', icon: Star, color: 'text-amber-400 bg-amber-500/5 border-amber-500/10', desc: 'Grade A buyers only see Grade A certified harvest listings' },
              ].map(({ rule, icon: Icon, color, desc }) => (
                <div key={rule} className={`p-4 rounded-xl border ${color.split(' ').slice(1).join(' ')}`}>
                  <Icon size={16} className={color.split(' ')[0]} />
                  <p className="font-bold text-sm mt-2">{rule}</p>
                  <p className="text-xs text-zinc-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer → Farmer match table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Active Buyer → Farmer Matches</h3></div>
            <div className="divide-y divide-white/5">
              {buyers.filter(b => b.verificationStatus === 'verified').slice(0, 5).map(b => {
                const farmers = storageService.getFarmers().filter(f => f.trustedFarmer || f.registrationStatus === 'approved');
                return (
                  <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {b.isVerifiedBadge && <BadgeCheck size={14} className="text-emerald-400" />}
                      <div><p className="font-bold text-sm">{b.name}</p><p className="text-xs text-zinc-500">{b.buyerType} · {b.location}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-zinc-400">{farmers.length} eligible farmers</p>
                      <button className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">View Matches</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PURCHASE REQUESTS ══════════════════════════════════════════════ */}
      {tab === 'requests' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Buyer Purchase Requests</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Buyer','Species','Qty (kg)','Size','Grade','Max Price','Location','Status','Action'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-sm">{r.buyerName}</td>
                      <td className="px-5 py-4 text-zinc-300">{r.species}</td>
                      <td className="px-5 py-4 font-mono font-bold">{r.quantityKg.toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{r.sizeCount}</td>
                      <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.qualityGrade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : r.qualityGrade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>Grade {r.qualityGrade}</span></td>
                      <td className="px-5 py-4 font-mono text-emerald-400">₹{r.maxPricePerKg}/kg</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{r.preferredLocation}</td>
                      <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : r.status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>{r.status}</span></td>
                      <td className="px-5 py-4">
                        {r.status === 'OPEN' && (
                          <button onClick={() => { const f = storageService.getFarmers().find(x => x.registrationStatus === 'approved'); if (f) setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'MATCHED', matchedFarmerId: f.id, matchedFarmerName: f.name } : x)); }}
                            className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Auto-Match</button>
                        )}
                        {r.status === 'MATCHED' && <p className="text-xs text-emerald-400">→ {r.matchedFarmerName}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DEALS ══════════════════════════════════════════════════════════ */}
      {tab === 'deals' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">Active & Past Deals</h3>
              <div className="text-sm text-zinc-500">Total: <span className="font-bold text-emerald-400">{fmtK(deals.reduce((s, d) => s + d.totalValue, 0))}</span></div>
            </div>
            <div className="divide-y divide-white/5">
              {deals.map(d => (
                <div key={d.id} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DEAL_STATUS_COLORS[d.status]}`}>{d.status}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : d.paymentStatus === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{d.paymentStatus}</span>
                      <span className="font-mono text-xs text-zinc-600">{d.id} · {d.createdAt}</span>
                    </div>
                    <p className="font-bold">{d.buyerName} ↔ <span className="text-zinc-400 font-normal">{d.farmerName}</span></p>
                    <p className="text-sm text-zinc-500">{d.quantityKg.toLocaleString()} kg {d.species} @ ₹{d.pricePerKg}/kg{d.deliveryDate ? ` · Delivery: ${d.deliveryDate}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right"><p className="font-mono font-bold text-lg text-emerald-400">{fmtK(d.totalValue)}</p><p className="text-[10px] text-zinc-600">Commission: {fmtK(d.commission)}</p></div>
                    <div className="flex gap-2">
                      {d.status === 'NEGOTIATING' && <button onClick={() => updateDeal(d.id, { status: 'CONFIRMED' })} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Confirm</button>}
                      {d.status === 'CONFIRMED' && <button onClick={() => updateDeal(d.id, { status: 'DISPATCHED' })} className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all">Dispatch</button>}
                      {d.paymentStatus === 'ADVANCE_PAID' && d.status === 'DELIVERED' && <button onClick={() => updateDeal(d.id, { paymentStatus: 'PAID' })} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Mark Paid</button>}
                      {d.status === 'DISPUTED' && <span className="text-xs text-red-400 font-bold">Under Dispute</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRICING CONTROL ════════════════════════════════════════════════ */}
      {tab === 'pricing' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border border-emerald-500/10">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400" />Price Floor & Suggestion Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Minimum Price (Floor)</label>
                <div className="flex items-center gap-3"><input type="range" min={300} max={600} value={minPrice} onChange={e => setMinPrice(+e.target.value)} className="flex-1 accent-red-500" /><span className="font-mono font-bold text-red-400 w-16">₹{minPrice}/kg</span></div>
                <p className="text-xs text-zinc-500">No deal below this price will be approved. Protects farmer interests.</p>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Suggested Fair Price</label>
                <div className="flex items-center gap-3"><input type="range" min={350} max={700} value={suggestedPrice} onChange={e => setSuggestedPrice(+e.target.value)} className="flex-1 accent-emerald-500" /><span className="font-mono font-bold text-emerald-400 w-16">₹{suggestedPrice}/kg</span></div>
                <p className="text-xs text-zinc-500">Recommended price shown to both farmers and buyers during negotiation.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 p-4 rounded-xl bg-white/5">
              <div className="flex-1">
                <p className="text-sm font-bold">Current Market Spread</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                  <span className="text-red-400 font-bold">Floor: ₹{minPrice}</span> ·
                  <span className="text-emerald-400 font-bold">Suggested: ₹{suggestedPrice}</span> ·
                  <span className="text-zinc-300">Market Avg: ₹{Math.round(buyers.reduce((s, b) => s + b.baseRate, 0) / (buyers.length || 1))}</span>
                </div>
              </div>
              <div className="h-8 bg-zinc-800 rounded-full overflow-hidden flex-1 max-w-40">
                <div className="h-full bg-gradient-to-r from-red-500 to-emerald-500 rounded-full" style={{ width: `${((suggestedPrice - minPrice) / (700 - minPrice)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Price trend */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Price Trend — L. Vannamei</h3>
            <div className="flex items-end gap-2 h-24">
              {[450, 465, 458, 472, 481, 476, 485, 490, 488, 495, 485, suggestedPrice].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t transition-all ${i === 11 ? 'bg-emerald-500' : 'bg-emerald-500/40'}`} style={{ height: `${((v - 440) / (600 - 440)) * 80}px` }} title={`₹${v}/kg`} />
                  {i % 3 === 0 && <p className="text-[8px] text-zinc-700">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Now'][i]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAYMENTS ═══════════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Paid', value: fmt(deals.filter(d => d.paymentStatus === 'PAID').reduce((s, d) => s + d.totalValue, 0)), color: 'text-emerald-400' },
              { label: 'Advance Paid', value: fmt(deals.filter(d => d.paymentStatus === 'ADVANCE_PAID').reduce((s, d) => s + d.totalValue, 0)), color: 'text-blue-400' },
              { label: 'Pending', value: fmt(deals.filter(d => d.paymentStatus === 'PENDING').reduce((s, d) => s + d.totalValue, 0)), color: 'text-amber-400' },
              { label: 'Overdue', value: fmt(deals.filter(d => d.paymentStatus === 'OVERDUE').reduce((s, d) => s + d.totalValue, 0)), color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{label}</p><p className={`text-2xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Payment Ledger</h3></div>
            <div className="divide-y divide-white/5">
              {deals.map(d => (
                <div key={d.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-bold text-sm">{d.buyerName}</p>
                    <p className="text-xs text-zinc-500">{d.quantityKg.toLocaleString()} kg · {d.createdAt}{d.deliveryDate ? ` → ${d.deliveryDate}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-bold">{fmt(d.totalValue)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : d.paymentStatus === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{d.paymentStatus}</span>
                    {d.paymentStatus === 'ADVANCE_PAID' && <button onClick={() => updateDeal(d.id, { paymentStatus: 'PAID' })} className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Mark Full Payment</button>}
                    {d.paymentStatus === 'PENDING' && <button onClick={() => updateDeal(d.id, { paymentStatus: 'OVERDUE' })} className="text-xs text-zinc-600 hover:text-red-400 border border-white/5 px-2.5 py-1 rounded-lg">Flag Overdue</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMMISSION ═════════════════════════════════════════════════════ */}
      {tab === 'commission' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Total Commission Earned</p><p className="text-3xl font-display font-bold text-amber-400">{fmtK(stats.totalCommission)}</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Avg Commission Rate</p><p className="text-3xl font-display font-bold text-emerald-400">{buyers.length > 0 ? (buyers.reduce((s, b) => s + b.commissionRate, 0) / buyers.length).toFixed(1) : 0}%</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Highest Single Deal</p><p className="text-3xl font-display font-bold text-blue-400">{fmtK(Math.max(...deals.map(d => d.commission)))}</p></div>
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Commission by Buyer</h3></div>
            {Object.entries(
              deals.reduce((acc, d) => { acc[d.buyerName] = (acc[d.buyerName] ?? 0) + d.commission; return acc; }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1]).map(([name, comm], i) => {
              const maxComm = Math.max(...Object.values(deals.reduce((acc, d) => { acc[d.buyerName] = (acc[d.buyerName] ?? 0) + d.commission; return acc; }, {} as Record<string, number>)));
              return (
                <div key={name} className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
                  <span className={`font-display font-bold text-lg w-6 text-center ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>#{i+1}</span>
                  <p className="font-bold text-sm flex-1">{name}</p>
                  <div className="w-40 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${(comm / maxComm) * 100}%` }} /></div>
                  <p className="font-mono font-bold text-amber-400 w-20 text-right">{fmtK(comm)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ ACTIVITY ═══════════════════════════════════════════════════════ */}
      {tab === 'activity' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Buyer Activity Monitoring</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Buyer','Type','Deals Done','Total Spent','Response Rate','Last Active','Status'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {buyers.map(b => {
                    const buyerDeals = deals.filter(d => d.buyerId === b.id);
                    const responseRate = buyerDeals.length > 0 ? Math.min(100, Math.round((buyerDeals.filter(d => d.status !== 'CANCELLED').length / buyerDeals.length) * 100)) : 0;
                    return (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><p className="font-bold text-sm">{b.name}</p><p className="text-xs text-zinc-500">{b.location}</p></td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{b.buyerType}</span></td>
                        <td className="px-5 py-4 font-bold text-blue-400">{buyerDeals.length}</td>
                        <td className="px-5 py-4 font-mono text-emerald-400">{fmtK(buyerDeals.reduce((s, d) => s + d.totalValue, 0))}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${responseRate >= 80 ? 'bg-emerald-500' : responseRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${responseRate}%` }} /></div>
                            <span className="text-xs font-bold">{responseRate}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{b.lastActiveAt ?? 'N/A'}</td>
                        <td className="px-5 py-4"><VerifBadge s={b.verificationStatus} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RATINGS ════════════════════════════════════════════════════════ */}
      {tab === 'ratings' && (
        <div className="space-y-5">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Star size={16} className="text-amber-400" />Buyer Ratings (given by Farmers)</h3>
            <div className="space-y-4">
              {buyers.sort((a, b) => b.rating - a.rating).map((b, i) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <span className={`font-display font-bold text-xl w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : 'text-zinc-600'}`}>#{i+1}</span>
                  <div className={`w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-display font-bold text-blue-400 border border-white/5`}>{b.name.charAt(0)}</div>
                  <div className="flex-1"><p className="font-bold text-sm">{b.name}</p><p className="text-xs text-zinc-500">{b.buyerType} · {b.paymentSpeed} payer</p></div>
                  <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= Math.round(b.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 fill-zinc-700'} />)}</div>
                  <span className="font-bold text-sm text-amber-400 w-8">{b.rating.toFixed(1)}</span>
                  <SegmentBadge s={b.segment} />
                  {b.rating < 3 && <button className="text-xs text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-all"><Flag size={11} className="inline mr-1" />Flag</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DISPUTES ═══════════════════════════════════════════════════════ */}
      {tab === 'disputes' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'Open', value: disputes.filter(d => d.status === 'OPEN').length, color: 'text-red-400' },
              { label: 'Investigating', value: disputes.filter(d => d.status === 'INVESTIGATING').length, color: 'text-amber-400' },
              { label: 'Resolved', value: disputes.filter(d => d.status === 'RESOLVED').length, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>
          <div className="glass-panel divide-y divide-white/5">
            {disputes.map(d => (
              <div key={d.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : d.status === 'INVESTIGATING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{d.status}</span>
                      <span className="text-[10px] text-zinc-600">Reported by: {d.reportedBy} · Deal: {d.dealId}</span>
                    </div>
                    <p className="font-bold">{d.buyerName}</p>
                    <p className="text-sm text-zinc-400 mt-1 p-3 rounded-lg bg-white/5 border border-white/5">{d.issue}</p>
                    {d.action && <p className="text-xs font-bold text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={10} />Action taken: {d.action}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {d.status === 'OPEN' && <button onClick={() => updateDispute(d.id, { status: 'INVESTIGATING' })} className="text-xs font-bold px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all">🔍 Investigate</button>}
                    {d.status === 'INVESTIGATING' && (
                      <>
                        <button onClick={() => updateDispute(d.id, { status: 'RESOLVED' })} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">✓ Resolve</button>
                        <button onClick={() => updateDispute(d.id, { action: 'WARNING' })} className="text-xs font-bold px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all">⚠ Issue Warning</button>
                        <button onClick={() => { updateDispute(d.id, { action: 'SUSPENSION', status: 'RESOLVED' }); setVerification(d.buyerId, 'suspended'); }} className="text-xs font-bold px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">🚫 Suspend Buyer</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SEGMENTS ═══════════════════════════════════════════════════════ */}
      {tab === 'segments' && (
        <div className="space-y-6">
          {(['high-value','frequent','exporter','inactive','new'] as BuyerSegment[]).map(seg => {
            const segBuyers = buyers.filter(b => b.segment === seg);
            const segDeals = deals.filter(d => segBuyers.some(b => b.id === d.buyerId));
            return (
              <div key={seg} className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><SegmentBadge s={seg} /><p className="font-bold capitalize">{seg} Buyers</p><span className="text-zinc-600 text-sm">({segBuyers.length})</span></div>
                  <div className="text-sm text-zinc-500">Total Value: <span className="font-bold text-emerald-400">{fmtK(segDeals.reduce((s, d) => s + d.totalValue, 0))}</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {segBuyers.map(b => (
                    <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                      {b.isVerifiedBadge && <BadgeCheck size={11} className="text-emerald-400" />}
                      <p className="text-sm font-bold">{b.name}</p>
                      <p className="text-[10px] text-zinc-500">{b.location}</p>
                    </div>
                  ))}
                  {segBuyers.length === 0 && <p className="text-zinc-600 text-sm">No buyers in this segment.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ANALYTICS ══════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Buyers', value: stats.total, color: 'text-zinc-100', icon: Users },
              { label: 'Active Buyers', value: stats.active, color: 'text-emerald-400', icon: Activity },
              { label: 'Deals Completed', value: stats.totalDeals, color: 'text-blue-400', icon: Package },
              { label: 'Revenue from Buyers', value: fmtK(stats.totalRevenue), color: 'text-emerald-400', icon: DollarSign },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="glass-panel p-5">
                <div className="flex items-start justify-between mb-3"><p className="text-[10px] text-zinc-500 uppercase font-bold">{label}</p><div className="p-2 rounded-xl bg-white/5"><Icon size={15} className="text-zinc-400" /></div></div>
                <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Top buyers by purchase volume */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Top Buyers by Purchase Volume</h3>
            <div className="space-y-3">
              {Object.entries(deals.reduce((acc, d) => { acc[d.buyerName] = (acc[d.buyerName] ?? 0) + d.totalValue; return acc; }, {} as Record<string, number>))
                .sort((a, b) => b[1] - a[1]).map(([name, val], i) => {
                  const maxVal = Math.max(...Object.values(deals.reduce((acc, d) => { acc[d.buyerName] = (acc[d.buyerName] ?? 0) + d.totalValue; return acc; }, {} as Record<string, number>)));
                  return (
                    <div key={name} className="flex items-center gap-4">
                      <span className={`font-display font-bold text-lg w-6 text-center ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>#{i+1}</span>
                      <p className="font-bold text-sm w-36 truncate">{name}</p>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(val / maxVal) * 100}%` }} /></div>
                      <p className="font-mono font-bold text-emerald-400 w-20 text-right">{fmtK(val)}</p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Buyer type distribution */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Buyer Type Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(['Wholesaler','Exporter','Local Trader','Retailer','Processor'] as BuyerType[]).map(type => {
                const count = buyers.filter(b => b.buyerType === type).length;
                return (
                  <div key={type} className="p-4 rounded-xl bg-white/5 text-center">
                    <p className="text-[10px] text-zinc-500 mb-1">{type}</p>
                    <p className="text-2xl font-display font-bold text-blue-400">{count}</p>
                    <p className="text-[9px] text-zinc-600">{buyers.length > 0 ? Math.round((count / buyers.length) * 100) : 0}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BUYER DETAIL SIDE PANEL ════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-xl font-display font-bold text-blue-400">{selected.name.charAt(0)}</div>
                  <div>
                    <div className="flex items-center gap-1.5"><h2 className="text-xl font-display font-bold">{selected.name}</h2>{selected.isVerifiedBadge && <BadgeCheck size={16} className="text-emerald-400" />}</div>
                    <VerifBadge s={selected.verificationStatus} />
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {/* Profile */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Profile</p>
                  {[
                    { label: 'Contact', value: selected.contactPerson ?? selected.name },
                    { label: 'Phone', value: selected.phone ?? '—' },
                    { label: 'Email', value: selected.email ?? '—' },
                    { label: 'Location', value: selected.location },
                    { label: 'Type', value: selected.buyerType },
                    { label: 'Preferred Species', value: selected.preferredSpecies ?? 'Any' },
                    { label: 'License No.', value: selected.licenseNumber ?? 'Not provided' },
                    { label: 'GST', value: selected.gstNumber ?? 'Not provided' },
                    { label: 'OTP Verified', value: selected.otpVerified ? 'Yes ✓' : 'No' },
                    { label: 'Joined', value: selected.joinedAt },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm"><span className="text-zinc-500">{label}</span><span className="font-bold text-right max-w-48 truncate">{value}</span></div>
                  ))}
                </div>
                {/* Performance */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Base Rate', value: `₹${selected.baseRate}/kg`, color: 'text-emerald-400' },
                    { label: 'Monthly Demand', value: `${selected.demand.toLocaleString()} kg`, color: 'text-blue-400' },
                    { label: 'Total Spent', value: fmtK(selected.totalSpent), color: 'text-amber-400' },
                    { label: 'Commission Rate', value: `${selected.commissionRate}%`, color: 'text-purple-400' },
                    { label: 'Deals Done', value: String(selected.totalDealsCompleted), color: 'text-zinc-200' },
                    { label: 'Payment Speed', value: selected.paymentSpeed, color: 'text-zinc-200' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 mb-0.5">{label}</p><p className={`font-bold ${color}`}>{value}</p></div>
                  ))}
                </div>
                {/* Notes */}
                {selected.notes && <div className="p-4 rounded-xl bg-white/5 border border-white/5"><p className="text-[10px] text-zinc-500 mb-1">Admin Notes</p><p className="text-sm text-zinc-300">{selected.notes}</p></div>}
              </div>
              {/* Actions */}
              <div className="p-5 border-t border-white/5 space-y-2">
                {selected.verificationStatus === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => { setVerification(selected.id, 'verified'); setSelected(prev => prev ? { ...prev, verificationStatus: 'verified', isVerifiedBadge: true } : null); }} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1.5"><CheckCircle2 size={14} />Approve Buyer</button>
                    <button onClick={() => { setVerification(selected.id, 'rejected'); setSelected(null); }} className="flex-1 py-2 text-sm font-bold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"><XCircle size={14} />Reject</button>
                  </div>
                )}
                {selected.verificationStatus === 'verified' && (
                  <button onClick={() => { setVerification(selected.id, 'suspended'); setSelected(prev => prev ? { ...prev, verificationStatus: 'suspended' } : null); }} className="w-full py-2 text-xs text-zinc-600 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5"><UserX size={13} />Suspend Buyer</button>
                )}
                <button onClick={() => handleDelete(selected.id)} className="w-full py-2 text-xs text-zinc-700 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"><Trash2 size={13} />Remove Buyer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ ADD BUYER MODAL ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl glass-panel p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Building2 size={20} /></div><h2 className="text-2xl font-display font-bold">Add Buyer</h2></div>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Company Name *', key: 'name', type: 'text', placeholder: 'AquaPrime Exports' },
                  { label: 'Contact Person', key: 'contactPerson', type: 'text', placeholder: 'Ramesh Kumar' },
                  { label: 'Phone', key: 'phone', type: 'text', placeholder: '+91 98001 00000' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'buyer@email.com' },
                  { label: 'Location', key: 'location', type: 'text', placeholder: 'Nellore, AP' },
                  { label: 'GST Number', key: 'gstNumber', type: 'text', placeholder: '29AAAAA0000A1Z5' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                    <input type={type} placeholder={placeholder} value={(newBuyer as any)[key] ?? ''} onChange={e => setNewBuyer({ ...newBuyer, [key]: e.target.value })} className="input-field w-full" />
                  </div>
                ))}
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Buyer Type</label>
                  <select value={newBuyer.buyerType} onChange={e => setNewBuyer({ ...newBuyer, buyerType: e.target.value as any })} className="input-field w-full bg-zinc-900">
                    {['Wholesaler','Exporter','Local Trader','Retailer','Processor'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Commission Rate (%)</label><input type="number" value={newBuyer.commissionRate ?? 5} onChange={e => setNewBuyer({ ...newBuyer, commissionRate: +e.target.value })} className="input-field w-full" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base Rate (₹/kg)</label><input type="number" value={newBuyer.baseRate ?? 470} onChange={e => setNewBuyer({ ...newBuyer, baseRate: +e.target.value })} className="input-field w-full" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Monthly Demand (kg)</label><input type="number" value={newBuyer.demand ?? 1000} onChange={e => setNewBuyer({ ...newBuyer, demand: +e.target.value })} className="input-field w-full" /></div>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Internal Notes</label>
                <textarea rows={2} value={newBuyer.notes ?? ''} onChange={e => setNewBuyer({ ...newBuyer, notes: e.target.value })} className="input-field w-full resize-none" placeholder="e.g. High-value export buyer, priority verification" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                <button onClick={() => setIsAddOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAdd} disabled={!newBuyer.name || !newBuyer.location} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Building2 size={16} />Add Buyer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyerManagement;
