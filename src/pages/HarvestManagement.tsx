import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, CheckCircle2, XCircle, Clock, Search, Filter, TrendingUp,
  DollarSign, Scale, X, Star, MapPin, Users, Zap, ShieldCheck,
  AlertTriangle, Truck, FileText, BarChart3, ArrowUpRight,
  ChevronRight, Flag, BadgeCheck, Bell, RefreshCw, Activity,
  Gavel, ClipboardList, Award, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Harvest, HarvestStage, HarvestBuyerOffer, HarvestDispute
} from '../types';
import { storageService } from '../services/storageService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab =
  | 'requests' | 'verification' | 'providers' | 'scheduling'
  | 'tracking' | 'quality' | 'finaldata' | 'certification'
  | 'buyers' | 'transport' | 'payments' | 'disputes'
  | 'rateconfirm' | 'analytics';

// ─── Seed Disputes ────────────────────────────────────────────────────────────
const SEED_DISPUTES: HarvestDispute[] = [
  { id: 'HDIS-001', harvestId: 'HRV-003', farmerName: 'John Doe', buyerName: 'Blue Ocean Traders', type: 'QUALITY_MISMATCH', description: 'Buyer reports shrimp size smaller than declared Grade B specs.', status: 'OPEN', createdAt: '2026-04-14' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STAGE_ORDER: HarvestStage[] = ['REQUESTED','APPROVED','SCHEDULED','IN_PROGRESS','COMPLETED'];

const STAGE_COLORS: Record<HarvestStage, string> = {
  REQUESTED:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SCHEDULED:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  IN_PROGRESS:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  COMPLETED:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED:     'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELLED:    'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
  RISK_HARVEST: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const StageBadge = ({ s }: { s: HarvestStage }) => (
  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STAGE_COLORS[s]}`}>
    {s.replace(/_/g, ' ')}
  </span>
);

const Check = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className="flex items-center gap-2 text-xs">
    {ok ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />}
    <span className={ok ? 'text-zinc-300' : 'text-zinc-500'}>{label}</span>
  </div>
);

const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${(n / 1000).toFixed(0)}K`;

// ─── Main Component ───────────────────────────────────────────────────────────
const HarvestManagement = () => {
  const [tab, setTab]           = useState<Tab>('requests');
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [disputes, setDisputes] = useState<HarvestDispute[]>(SEED_DISPUTES);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detail, setDetail]     = useState<Harvest | null>(null);

  // Rate confirm state
  const [rcHarvest, setRcHarvest]   = useState<Harvest | null>(null);
  const [auctionMode, setAuctionMode] = useState(false);
  const [minFloor, setMinFloor]     = useState(440);
  const [suggestPrice, setSuggest]  = useState(485);

  const load = () => {
    const raw = storageService.getHarvests();
    const migrated = raw.map((h: any) => ({
      species:     h.species ?? 'L. Vannamei',
      harvestType: h.harvestType ?? (h.isPartialHarvest ? 'PARTIAL' : 'TOTAL'),
      status:      h.status === 'PENDING_APPROVAL' ? 'REQUESTED' : h.status,
      createdAt:   h.createdAt ?? h.requestDate,
      updatedAt:   h.updatedAt ?? h.requestDate,
      deliveryStatus: h.deliveryStatus ?? 'NOT_DISPATCHED',
      paymentStatus:  h.paymentStatus  ?? 'PENDING',
      buyerOffers:    h.buyerOffers    ?? [],
      providerAssignments: h.providerAssignments ?? [],
      ...h,
    } as Harvest));
    setHarvests(migrated);
  };

  useEffect(() => { load(); }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    requested:  harvests.filter(h => h.status === 'REQUESTED').length,
    approved:   harvests.filter(h => h.status === 'APPROVED').length,
    scheduled:  harvests.filter(h => h.status === 'SCHEDULED').length,
    inProgress: harvests.filter(h => h.status === 'IN_PROGRESS').length,
    completed:  harvests.filter(h => h.status === 'COMPLETED').length,
    risk:       harvests.filter(h => h.riskFlag).length,
    revenue:    harvests.filter(h => h.status === 'COMPLETED').reduce((s, h) => s + (h.totalValue ?? 0), 0),
    commission: harvests.reduce((s, h) => s + (h.commission ?? 0), 0),
    openDisputes: disputes.filter(d => d.status === 'OPEN').length,
  }), [harvests, disputes]);

  const filtered = useMemo(() => harvests.filter(h => {
    const ms = h.farmerName.toLowerCase().includes(search.toLowerCase()) ||
               h.pondName.toLowerCase().includes(search.toLowerCase()) ||
               h.id.toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus === 'all' || h.status === filterStatus;
    return ms && mf;
  }), [harvests, search, filterStatus]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const advance = (id: string, to: HarvestStage, patch?: Partial<Harvest>) => {
    const h = harvests.find(x => x.id === id);
    if (!h) return;
    storageService.saveHarvest({ ...h, ...patch, status: to, updatedAt: new Date().toISOString().split('T')[0] } as any);
    load();
    setDetail(prev => prev?.id === id ? { ...prev, ...patch, status: to } : prev);
  };

  const rejectHarvest = (id: string) => {
    advance(id, 'REJECTED');
    setDetail(null);
  };

  const acceptOffer = (harvestId: string, offerId: string) => {
    setHarvests(prev => prev.map(h => {
      if (h.id !== harvestId) return h;
      const offer = h.buyerOffers?.find(o => o.id === offerId);
      return {
        ...h,
        buyerOffers: h.buyerOffers?.map(o => ({ ...o, status: o.id === offerId ? 'ACCEPTED' : 'REJECTED' })),
        confirmedBuyerId: offer?.buyerId,
        confirmedBuyerName: offer?.buyerName,
        finalPricePerKg: offer?.pricePerKg,
        dealLockedAt: new Date().toISOString().split('T')[0],
      };
    }));
  };

  const updateDispute = (id: string, patch: Partial<HarvestDispute>) =>
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'requests',    label: 'Requests',       icon: ClipboardList, badge: stats.requested },
    { id: 'verification',label: 'Pre-Harvest',    icon: ShieldCheck,   badge: stats.risk },
    { id: 'providers',   label: 'Provider Assign',icon: Users },
    { id: 'scheduling',  label: 'Scheduling',     icon: Clock,         badge: stats.approved },
    { id: 'tracking',    label: 'Stage Tracking', icon: Activity },
    { id: 'quality',     label: 'Quality Check',  icon: Star },
    { id: 'finaldata',   label: 'Final Data',     icon: Scale },
    { id: 'certification',label:'Certification',  icon: Award },
    { id: 'rateconfirm', label: 'Rate & Deal',    icon: Gavel },
    { id: 'buyers',      label: 'Buyer Integration', icon: Eye },
    { id: 'transport',   label: 'Transport',      icon: Truck },
    { id: 'payments',    label: 'Payments',       icon: DollarSign },
    { id: 'disputes',    label: 'Disputes',       icon: Flag,          badge: stats.openDisputes },
    { id: 'analytics',   label: 'Analytics',      icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Harvest Management</h1>
          <p className="text-zinc-400">Full harvest lifecycle — from request to payment settlement.</p>
        </div>
        {stats.risk > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-orange-500/5 border-orange-500/20 text-orange-400 text-sm">
            <AlertTriangle size={14} />{stats.risk} risk harvest{stats.risk > 1 ? 's' : ''} flagged
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
        {[
          { label: 'Requested', value: stats.requested, color: 'text-amber-400' },
          { label: 'Approved',  value: stats.approved,  color: 'text-blue-400' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-purple-400' },
          { label: 'In Prog.',  value: stats.inProgress,color: 'text-cyan-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
          { label: 'Risk Flag', value: stats.risk,      color: stats.risk > 0 ? 'text-orange-400' : 'text-zinc-600' },
          { label: 'Disputes',  value: stats.openDisputes, color: stats.openDisputes > 0 ? 'text-red-400' : '' },
          { label: 'Revenue',   value: fmtK(stats.revenue), color: 'text-emerald-400' },
          { label: 'Commission',value: fmtK(stats.commission), color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-xl font-display font-bold ${color || 'text-zinc-100'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={13} />{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-red-500/80 text-white'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ HARVEST REQUESTS ════════════════════════════════════════════════ */}
      {tab === 'requests' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-field w-full pl-11" placeholder="Search harvests..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={13} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                {(['REQUESTED','APPROVED','SCHEDULED','IN_PROGRESS','COMPLETED','REJECTED','RISK_HARVEST'] as HarvestStage[]).map(s => (
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['ID / Date','Farmer / Pond','Species','Type','Est. Qty','Quality','Status','Actions'].map(h => (
                      <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(h => (
                    <tr key={h.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetail(h)}>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-0.5 rounded w-fit">{h.id}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">{h.requestDate}</p>
                      </td>
                      <td className="px-5 py-4"><p className="font-bold text-sm">{h.farmerName}</p><p className="text-xs text-zinc-500">{h.pondName}</p></td>
                      <td className="px-5 py-4 text-sm text-zinc-300">{h.species}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${h.harvestType === 'TOTAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{h.harvestType}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">{h.estimatedQuantity.toLocaleString()} kg{h.actualQuantity ? <><br /><span className="text-xs text-emerald-400">↳ {h.actualQuantity.toLocaleString()} actual</span></> : null}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold ${h.quality === 'A' ? 'text-emerald-400' : h.quality === 'B' ? 'text-blue-400' : h.quality === 'C' ? 'text-amber-400' : 'text-red-400'}`}>Grade {h.quality}</span>
                        <p className="text-[10px] text-zinc-600">Count {h.shrimpCount}/kg</p>
                      </td>
                      <td className="px-5 py-4">
                        <StageBadge s={h.status} />
                        {h.riskFlag && <p className="text-[9px] text-orange-400 mt-1 flex items-center gap-1"><AlertTriangle size={9} />Risk</p>}
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {h.status === 'REQUESTED' && (
                            <>
                              <button onClick={() => advance(h.id, 'APPROVED')} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approve"><CheckCircle2 size={14} /></button>
                              <button onClick={() => rejectHarvest(h.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Reject"><XCircle size={14} /></button>
                            </>
                          )}
                          {h.status === 'APPROVED' && (
                            <button onClick={() => advance(h.id, 'SCHEDULED', { scheduledDate: new Date().toISOString().split('T')[0] })} className="text-xs font-bold px-2.5 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-all">Schedule</button>
                          )}
                          {h.status === 'SCHEDULED' && (
                            <button onClick={() => advance(h.id, 'IN_PROGRESS')} className="text-xs font-bold px-2.5 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-lg transition-all">Start</button>
                          )}
                          {h.status === 'IN_PROGRESS' && (
                            <button onClick={() => advance(h.id, 'COMPLETED', { actualQuantity: h.estimatedQuantity, harvestDate: new Date().toISOString().split('T')[0] })} className="text-xs font-bold px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-zinc-600">No harvests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRE-HARVEST VERIFICATION ════════════════════════════════════════ */}
      {tab === 'verification' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-emerald-500/10 flex items-start gap-3">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-emerald-400 text-sm">Smart Auto-Check</p><p className="text-xs text-zinc-400 mt-1">Logs complete + water stable + no major alerts → auto-approve harvest. If any check fails → block or flag as Risk Harvest.</p></div>
          </div>
          <div className="space-y-4">
            {harvests.filter(h => ['REQUESTED','APPROVED','RISK_HARVEST'].includes(h.status)).map(h => {
              const chk = h.preHarvestChecks;
              const allPass = chk && Object.values(chk).every(Boolean);
              return (
                <div key={h.id} className={`glass-panel p-6 border ${allPass ? 'border-emerald-500/10' : 'border-orange-500/10'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><StageBadge s={h.status} />{h.riskFlag && <span className="text-[10px] font-bold text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full bg-orange-500/5">RISK</span>}</div>
                      <p className="font-bold">{h.farmerName} — {h.pondName}</p>
                      <p className="text-xs text-zinc-500">{h.species} · {h.estimatedQuantity.toLocaleString()} kg est.</p>
                    </div>
                    {allPass ? (
                      <button onClick={() => advance(h.id, 'APPROVED')} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5"><CheckCircle2 size={13} />Auto-Approve</button>
                    ) : (
                      <button onClick={() => advance(h.id, 'RISK_HARVEST', { riskFlag: 'Pre-harvest checks failed. Manual review required.' })} className="text-xs font-bold px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5"><AlertTriangle size={13} />Flag Risk</button>
                    )}
                  </div>
                  {chk ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Check ok={chk.logsComplete}         label="Daily Logs Complete" />
                      <Check ok={chk.waterQualityStable}   label="Water Quality Stable" />
                      <Check ok={chk.noMajorAlerts}        label="No Major Alerts" />
                      <Check ok={chk.certificationEligible} label="Cert. Eligible" />
                      <Check ok={chk.growthStageReady}     label="Growth Stage Ready" />
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600">No pre-harvest check data available for this record.</p>
                  )}
                  {h.riskFlag && <p className="mt-3 text-xs text-orange-400 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10"><AlertTriangle size={11} className="inline mr-1" />{h.riskFlag}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PROVIDER ASSIGNMENT ══════════════════════════════════════════════ */}
      {tab === 'providers' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-blue-500/10 flex items-start gap-3">
            <Zap size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-blue-400 text-sm">Auto-Assign Logic</p><p className="text-xs text-zinc-400 mt-1">System matches providers by: Location → Rating → Availability. Admin can override or manually assign.</p></div>
          </div>

          {harvests.filter(h => ['APPROVED','SCHEDULED','IN_PROGRESS'].includes(h.status)).map(h => {
            const providers = storageService.getProviders().filter(p => p.availability === 'available');
            return (
              <div key={h.id} className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><p className="font-bold">{h.farmerName} — {h.pondName}</p><div className="flex items-center gap-2 mt-1"><StageBadge s={h.status} /><p className="text-xs text-zinc-500">{h.estimatedQuantity.toLocaleString()} kg · {h.species}</p></div></div>
                  <button onClick={() => {
                    const techProv = providers.find(p => p.category === 'Shrimp Logistics' || p.availability === 'available');
                    if (techProv) {
                      const newAssignment = { providerId: techProv.id, providerName: techProv.name, role: 'Harvest Technician' as const, assignedAt: new Date().toISOString().split('T')[0], status: 'ASSIGNED' as const };
                      advance(h.id, h.status, { providerAssignments: [...(h.providerAssignments ?? []), newAssignment] });
                    }
                  }} className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5"><Zap size={13} />Auto-Assign</button>
                </div>

                {/* Current assignments */}
                {(h.providerAssignments ?? []).length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Assigned Providers</p>
                    {(h.providerAssignments ?? []).map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2"><BadgeCheck size={13} className="text-emerald-400" /><p className="text-sm font-bold">{a.providerName}</p><span className="text-[9px] text-zinc-500 border border-white/10 px-1.5 py-0.5 rounded">{a.role}</span></div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-sm text-zinc-600">No providers assigned yet</div>
                )}

                {/* Available providers */}
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Available Providers</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {providers.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                        <div><p className="text-sm font-bold">{p.name}</p><p className="text-[10px] text-zinc-500">{p.category} · {p.location}</p><div className="flex items-center gap-0.5 mt-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= Math.round(p.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 fill-zinc-700'} />)}</div></div>
                        <button onClick={() => {
                          const newA = { providerId: p.id, providerName: p.name, role: 'Labor Team' as const, assignedAt: new Date().toISOString().split('T')[0], status: 'ASSIGNED' as const };
                          advance(h.id, h.status, { providerAssignments: [...(h.providerAssignments ?? []), newA] });
                        }} className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Assign</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {harvests.filter(h => ['APPROVED','SCHEDULED','IN_PROGRESS'].includes(h.status)).length === 0 && (
            <div className="glass-panel p-10 text-center text-zinc-600">No harvests pending provider assignment.</div>
          )}
        </div>
      )}

      {/* ═══ SCHEDULING ══════════════════════════════════════════════════════ */}
      {tab === 'scheduling' && (
        <div className="space-y-5">
          {harvests.filter(h => ['APPROVED','SCHEDULED'].includes(h.status)).map(h => (
            <div key={h.id} className="glass-panel p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-bold text-lg">{h.farmerName} — {h.pondName}</p><p className="text-sm text-zinc-400">{h.species} · {h.estimatedQuantity.toLocaleString()} kg · <StageBadge s={h.status} /></p></div>
                {h.status === 'APPROVED' && (
                  <button onClick={() => advance(h.id, 'SCHEDULED', { scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] })} className="text-xs font-bold px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Clock size={13} />Schedule Now</button>
                )}
                {h.status === 'SCHEDULED' && (
                  <button onClick={() => advance(h.id, 'IN_PROGRESS')} className="text-xs font-bold px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Activity size={13} />Mark In Progress</button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                {[
                  { label: 'Request Date', value: h.requestDate },
                  { label: 'Scheduled Date', value: h.scheduledDate ?? '—' },
                  { label: 'Providers', value: `${(h.providerAssignments ?? []).length} assigned` },
                  { label: 'Type', value: h.harvestType },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">{label}</p><p className="font-bold text-sm">{value}</p></div>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-xs font-bold text-zinc-500 mb-2">Notification Targets</p>
                <div className="flex flex-wrap gap-2">
                  {['Farmer notified ✓', 'Provider teams notified ✓', h.confirmedBuyerName ? `Buyer ${h.confirmedBuyerName} notified ✓` : 'No buyer assigned yet'].map(n => (
                    <span key={n} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {harvests.filter(h => ['APPROVED','SCHEDULED'].includes(h.status)).length === 0 && (
            <div className="glass-panel p-10 text-center text-zinc-600">No harvests pending scheduling.</div>
          )}
        </div>
      )}

      {/* ═══ STAGE TRACKING ══════════════════════════════════════════════════ */}
      {tab === 'tracking' && (
        <div className="space-y-6">
          {/* Kanban pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STAGE_ORDER.map(stage => {
              const stageHarvests = harvests.filter(h => h.status === stage);
              return (
                <div key={stage} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StageBadge s={stage} />
                    <span className="text-xs font-bold text-zinc-600">{stageHarvests.length}</span>
                  </div>
                  {stageHarvests.map(h => (
                    <div key={h.id} className="p-3 rounded-xl bg-zinc-800/60 border border-white/5 cursor-pointer hover:border-white/10 transition-all" onClick={() => setDetail(h)}>
                      <p className="text-xs font-bold">{h.farmerName}</p>
                      <p className="text-[10px] text-zinc-500">{h.pondName}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">{h.estimatedQuantity.toLocaleString()} kg</p>
                      {h.riskFlag && <AlertTriangle size={10} className="text-orange-400 mt-1" />}
                    </div>
                  ))}
                  {stageHarvests.length === 0 && <div className="p-3 rounded-xl border border-dashed border-white/5 text-center text-[10px] text-zinc-700">Empty</div>}
                </div>
              );
            })}
          </div>

          {/* Live execution tracking for IN_PROGRESS */}
          {harvests.filter(h => h.status === 'IN_PROGRESS').map(h => (
            <div key={h.id} className="glass-panel p-6 border border-cyan-500/10">
              <div className="flex items-center justify-between mb-4">
                <div><p className="font-bold text-lg flex items-center gap-2"><Activity size={16} className="text-cyan-400" /> Live Execution</p><p className="text-sm text-zinc-400">{h.farmerName} — {h.pondName}</p></div>
                <button onClick={() => advance(h.id, 'COMPLETED', { actualQuantity: h.estimatedQuantity, harvestDate: new Date().toISOString().split('T')[0] })} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Mark Completed</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">Est. Quantity</p><p className="font-bold font-mono">{h.estimatedQuantity.toLocaleString()} kg</p></div>
                <div className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">Providers On-Site</p><p className="font-bold">{(h.providerAssignments ?? []).length}</p></div>
                <div className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">Start Date</p><p className="font-bold">{h.scheduledDate ?? '—'}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ QUALITY CHECK ═══════════════════════════════════════════════════ */}
      {tab === 'quality' && (
        <div className="space-y-5">
          {harvests.filter(h => ['IN_PROGRESS','COMPLETED'].includes(h.status)).map(h => {
            const qc = h.qualityCheck;
            return (
              <div key={h.id} className="glass-panel p-6">
                <div className="flex items-start justify-between mb-4">
                  <div><p className="font-bold">{h.farmerName} — {h.pondName}</p><div className="flex items-center gap-2 mt-1"><StageBadge s={h.status} /></div></div>
                  {!qc && (
                    <button onClick={() => advance(h.id, h.status, { qualityCheck: { sizeCount: h.shrimpCount, avgWeight: 15, grade: h.quality, healthCondition: 'GOOD', certificateGenerated: h.quality === 'A', inspectorName: 'Auto-assigned Inspector', reportedAt: new Date().toISOString().split('T')[0] } })} className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Star size={13} />Record Quality Check</button>
                  )}
                </div>
                {qc ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Grade', value: `Grade ${qc.grade}`, color: qc.grade === 'A' ? 'text-emerald-400' : qc.grade === 'B' ? 'text-blue-400' : 'text-amber-400' },
                      { label: 'Size (count/kg)', value: qc.sizeCount, color: '' },
                      { label: 'Avg Weight', value: `${qc.avgWeight}g`, color: '' },
                      { label: 'Health', value: qc.healthCondition, color: qc.healthCondition === 'EXCELLENT' ? 'text-emerald-400' : qc.healthCondition === 'GOOD' ? 'text-blue-400' : 'text-amber-400' },
                      { label: 'Cert. Generated', value: qc.certificateGenerated ? 'YES ✓' : 'NO', color: qc.certificateGenerated ? 'text-emerald-400' : 'text-zinc-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p><p className={`font-bold ${color}`}>{value}</p></div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-zinc-600 text-sm">Quality check not yet recorded</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ FINAL DATA ENTRY ════════════════════════════════════════════════ */}
      {tab === 'finaldata' && (
        <div className="space-y-5">
          {harvests.filter(h => h.status === 'COMPLETED').map(h => (
            <div key={h.id} className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div><p className="font-bold text-lg">{h.id} — {h.farmerName}</p><p className="text-sm text-zinc-400">{h.pondName} · {h.species}</p></div>
                <StageBadge s={h.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Estimated Qty', value: `${h.estimatedQuantity.toLocaleString()} kg` },
                  { label: 'Actual Qty', value: h.actualQuantity ? `${h.actualQuantity.toLocaleString()} kg` : '—' },
                  { label: 'Yield Variance', value: h.actualQuantity ? `${(((h.actualQuantity - h.estimatedQuantity) / h.estimatedQuantity) * 100).toFixed(1)}%` : '—' },
                  { label: 'Remaining Stock', value: h.remainingStockKg ? `${h.remainingStockKg.toLocaleString()} kg` : 'None' },
                  { label: 'Price per kg', value: h.finalPricePerKg ? `₹${h.finalPricePerKg}` : h.pricePerKg ? `₹${h.pricePerKg}` : '—' },
                  { label: 'Total Value', value: h.totalValue ? `₹${h.totalValue.toLocaleString()}` : '—' },
                  { label: 'Commission', value: h.commission ? `₹${h.commission.toLocaleString()}` : '—' },
                  { label: 'Harvest Date', value: h.harvestDate ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p><p className="font-bold font-mono">{value}</p></div>
                ))}
              </div>
              {h.notes && <p className="mt-3 text-xs text-zinc-400 p-3 rounded-xl bg-white/5 border border-white/5">{h.notes}</p>}
            </div>
          ))}
          {harvests.filter(h => h.status === 'COMPLETED').length === 0 && (
            <div className="glass-panel p-10 text-center text-zinc-600">No completed harvests yet.</div>
          )}
        </div>
      )}

      {/* ═══ CERTIFICATION ═══════════════════════════════════════════════════ */}
      {tab === 'certification' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-amber-500/10 flex items-start gap-3">
            <Award size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-amber-400 text-sm">Auto-Certification</p><p className="text-xs text-zinc-400 mt-1">Grade A harvest + all pre-harvest checks pass → auto-generate certificate. Admin can approve/override/reject.</p></div>
          </div>

          {harvests.filter(h => h.status === 'COMPLETED' || h.qualityCheck?.certificateGenerated).map(h => {
            const eligible = h.quality === 'A' && h.preHarvestChecks && Object.values(h.preHarvestChecks).every(Boolean);
            const hasCert = h.certificationId;
            return (
              <div key={h.id} className={`glass-panel p-6 border ${hasCert ? 'border-emerald-500/10' : eligible ? 'border-amber-500/10' : 'border-white/5'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">{hasCert && <BadgeCheck size={16} className="text-emerald-400" />}<p className="font-bold">{h.farmerName}</p></div>
                    <p className="text-sm text-zinc-400">{h.pondName} · {h.species} · Grade {h.quality} · {h.actualQuantity?.toLocaleString() ?? h.estimatedQuantity.toLocaleString()} kg</p>
                  </div>
                  {hasCert ? (
                    <span className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-1.5"><Award size={13} />Certified · {h.certificationId}</span>
                  ) : eligible ? (
                    <div className="flex gap-2">
                      <button onClick={() => advance(h.id, h.status, { certificationId: `CERT-HRV-${h.id}` })} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-1.5"><Award size={13} />Generate Cert.</button>
                      <button className="text-xs font-bold px-4 py-2 bg-zinc-700/10 text-zinc-400 hover:bg-zinc-700 rounded-xl transition-all">Override</button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 bg-zinc-700/10 text-zinc-500 border border-zinc-700/20 rounded-xl">Not Eligible</span>
                  )}
                </div>
                {eligible && !hasCert && <p className="text-xs text-amber-400 mt-3 flex items-center gap-1"><Zap size={11} />All checks passed — eligible for auto-certification</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ RATE CONFIRMATION & DEAL ═════════════════════════════════════════ */}
      {tab === 'rateconfirm' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-panel p-6 border border-emerald-500/10">
              <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2"><DollarSign size={15} />Price Discovery Controls</h3>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Price Floor (min allowed)</label><div className="flex items-center gap-3"><input type="range" min={300} max={600} value={minFloor} onChange={e => setMinFloor(+e.target.value)} className="flex-1 accent-red-500" /><span className="font-mono font-bold text-red-400 w-16">₹{minFloor}</span></div></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Suggested Fair Price</label><div className="flex items-center gap-3"><input type="range" min={350} max={700} value={suggestPrice} onChange={e => setSuggest(+e.target.value)} className="flex-1 accent-emerald-500" /><span className="font-mono font-bold text-emerald-400 w-16">₹{suggestPrice}</span></div></div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex-1">Auction Mode</label>
                  <button onClick={() => setAuctionMode(p => !p)} className={`relative w-10 h-5 rounded-full transition-all ${auctionMode ? 'bg-amber-500' : 'bg-zinc-700'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${auctionMode ? 'left-5' : 'left-0.5'}`} /></button>
                  <span className={`text-xs font-bold ${auctionMode ? 'text-amber-400' : 'text-zinc-600'}`}>{auctionMode ? 'ON' : 'OFF'}</span>
                </div>
                {auctionMode && <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400"><Gavel size={11} className="inline mr-1" />Auction Mode: Multiple buyers bid — highest bid wins. Real-time bidding enabled.</div>}
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={15} className="text-blue-400" />Deal Flow</h3>
              <div className="flex items-center gap-1">
                {['Negotiation','Rate Confirmed','Advance Paid','Harvest','Delivery','Payment Done'].map((step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className="text-center"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border ${i < 2 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{i+1}</div><p className="text-[8px] text-zinc-500 mt-1 w-12 text-center leading-tight">{step}</p></div>
                    {i < arr.length - 1 && <div className={`flex-1 h-px ${i < 1 ? 'bg-emerald-500' : 'bg-zinc-700'} mb-3`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Buyer Offers per Harvest */}
          {harvests.filter(h => (h.buyerOffers ?? []).length > 0).map(h => (
            <div key={h.id} className="glass-panel overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div><p className="font-bold">{h.farmerName} — {h.pondName}</p><p className="text-xs text-zinc-500">{h.estimatedQuantity.toLocaleString()} kg {h.species} · Grade {h.quality}</p></div>
                {h.confirmedBuyerName && <span className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center gap-1"><CheckCircle2 size={11} />Locked: {h.confirmedBuyerName} @ ₹{h.finalPricePerKg}/kg</span>}
              </div>
              <div className="divide-y divide-white/5">
                {(h.buyerOffers ?? []).map((offer: HarvestBuyerOffer) => (
                  <div key={offer.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-bold text-sm">{offer.buyerName}</p>
                      <p className="text-xs text-zinc-500">{offer.quantityKg.toLocaleString()} kg · {offer.terms}</p>
                      <p className="text-[10px] text-zinc-600">{offer.offeredAt}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-mono font-bold text-lg ${offer.pricePerKg >= suggestPrice ? 'text-emerald-400' : offer.pricePerKg >= minFloor ? 'text-amber-400' : 'text-red-400'}`}>₹{offer.pricePerKg}/kg</p>
                        <p className="text-[10px] text-zinc-600">Total: ₹{(offer.pricePerKg * offer.quantityKg).toLocaleString()}</p>
                        {offer.pricePerKg < minFloor && <p className="text-[9px] text-red-400">⚠ Below floor price</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${offer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : offer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{offer.status}</span>
                      {offer.status === 'PENDING' && !h.confirmedBuyerId && offer.pricePerKg >= minFloor && (
                        <div className="flex gap-2">
                          <button onClick={() => acceptOffer(h.id, offer.id)} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Accept</button>
                          <button onClick={() => setHarvests(prev => prev.map(hh => hh.id !== h.id ? hh : { ...hh, buyerOffers: hh.buyerOffers?.map(o => o.id === offer.id ? { ...o, status: 'REJECTED' } : o) }))} className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ BUYER INTEGRATION ═══════════════════════════════════════════════ */}
      {tab === 'buyers' && (
        <div className="space-y-5">
          {harvests.filter(h => h.status === 'COMPLETED').map(h => (
            <div key={h.id} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div><p className="font-bold text-lg">{h.farmerName} — {h.pondName}</p><p className="text-sm text-zinc-400">{h.species} · Grade {h.quality} · {h.actualQuantity?.toLocaleString() ?? h.estimatedQuantity.toLocaleString()} kg</p></div>
                {h.certificationId && <span className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center gap-1.5"><Award size={11} />Certified</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Available Qty', value: `${(h.actualQuantity ?? h.estimatedQuantity).toLocaleString()} kg` },
                  { label: 'Quality Grade', value: `Grade ${h.quality}` },
                  { label: 'Certification', value: h.certificationId ?? 'None' },
                  { label: 'Suggested Price', value: `₹${suggestPrice}/kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p><p className="font-bold text-sm">{value}</p></div>
                ))}
              </div>
              {h.confirmedBuyerName ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 size={16} className="text-emerald-400" /><div><p className="font-bold text-sm text-emerald-400">Deal Confirmed — {h.confirmedBuyerName}</p><p className="text-xs text-zinc-500">Price locked at ₹{h.finalPricePerKg}/kg · {h.dealLockedAt}</p></div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setTab('rateconfirm')} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Bell size={13} />Notify Buyers</button>
                  {auctionMode && <button className="text-xs font-bold px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Gavel size={13} />Start Auction</button>}
                  <button className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Zap size={13} />Auto-Match Buyer</button>
                </div>
              )}
            </div>
          ))}
          {harvests.filter(h => h.status === 'COMPLETED').length === 0 && (
            <div className="glass-panel p-10 text-center text-zinc-600">No completed harvests for buyer integration.</div>
          )}
        </div>
      )}

      {/* ═══ TRANSPORT ═══════════════════════════════════════════════════════ */}
      {tab === 'transport' && (
        <div className="space-y-5">
          {harvests.filter(h => h.confirmedBuyerName || h.status === 'COMPLETED').map(h => (
            <div key={h.id} className="glass-panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div><p className="font-bold">{h.farmerName} → {h.confirmedBuyerName ?? '—'}</p><p className="text-sm text-zinc-400">{h.pondName} · {(h.actualQuantity ?? h.estimatedQuantity).toLocaleString()} kg</p></div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${h.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : h.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>{(h.deliveryStatus ?? 'NOT_DISPATCHED').replace(/_/g,' ')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Transport Provider</p><p className="font-bold text-sm">{h.transportProviderName ?? 'Not assigned'}</p></div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Tracking No.</p><p className="font-mono font-bold text-sm">{h.trackingNumber ?? '—'}</p></div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Delivery Date</p><p className="font-bold text-sm">{h.harvestDate ?? '—'}</p></div>
              </div>
              <div className="flex gap-2">
                {h.deliveryStatus === 'NOT_DISPATCHED' && <button onClick={() => advance(h.id, h.status, { deliveryStatus: 'IN_TRANSIT', transportProviderName: 'Midwest Harvest', trackingNumber: `TRK-${h.id}-${Date.now().toString().slice(-4)}` })} className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Truck size={13} />Dispatch Shipment</button>}
                {h.deliveryStatus === 'IN_TRANSIT' && <button onClick={() => advance(h.id, h.status, { deliveryStatus: 'DELIVERED' })} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><CheckCircle2 size={13} />Mark Delivered</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ PAYMENTS ════════════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Paid', value: harvests.filter(h => h.paymentStatus === 'PAID').reduce((s, h) => s + (h.totalValue ?? 0), 0), color: 'text-emerald-400' },
              { label: 'Advance Rcvd', value: harvests.filter(h => h.advancePaid).reduce((s, h) => s + (h.advanceAmount ?? 0), 0), color: 'text-blue-400' },
              { label: 'Pending', value: harvests.filter(h => h.paymentStatus === 'PENDING').reduce((s, h) => s + (h.totalValue ?? 0), 0), color: 'text-amber-400' },
              { label: 'Commission', value: stats.commission, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{label}</p><p className={`text-2xl font-display font-bold ${color}`}>{fmtK(value)}</p></div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="text-xl font-display font-bold">Payment Ledger</h3></div>
            <div className="divide-y divide-white/5">
              {harvests.map(h => (
                <div key={h.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-bold text-sm">{h.farmerName}</p>
                    <p className="text-xs text-zinc-500">{h.pondName} · {(h.actualQuantity ?? h.estimatedQuantity).toLocaleString()} kg{h.confirmedBuyerName ? ` → ${h.confirmedBuyerName}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-bold">{h.totalValue ? `₹${h.totalValue.toLocaleString()}` : '—'}</p>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${h.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : h.paymentStatus === 'ADVANCE_RECEIVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : h.paymentStatus === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{(h.paymentStatus ?? 'PENDING').replace(/_/g,' ')}</span>
                    {h.paymentStatus === 'ADVANCE_RECEIVED' && <button onClick={() => advance(h.id, h.status, { paymentStatus: 'PAID', farmerPaidAt: new Date().toISOString().split('T')[0] })} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Full Settle</button>}
                    {h.paymentStatus === 'PENDING' && h.status === 'COMPLETED' && <button onClick={() => advance(h.id, h.status, { paymentStatus: 'OVERDUE' })} className="text-xs text-zinc-600 hover:text-red-400 border border-white/5 px-2.5 py-1 rounded-lg transition-all">Flag Overdue</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DISPUTES ════════════════════════════════════════════════════════ */}
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-zinc-700/10 text-zinc-500 border-zinc-700/20">{d.type.replace(/_/g,' ')}</span>
                      <span className="text-[10px] text-zinc-600">Harvest: {d.harvestId}</span>
                    </div>
                    <p className="font-bold">{d.farmerName} ↔ {d.buyerName}</p>
                    <p className="text-sm text-zinc-400 p-3 rounded-xl bg-white/5 border border-white/5 mt-2">{d.description}</p>
                    {d.resolution && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckCircle2 size={11} />Resolution: {d.resolution}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {d.status === 'OPEN' && <button onClick={() => updateDispute(d.id, { status: 'INVESTIGATING' })} className="text-xs font-bold px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all">Investigate</button>}
                    {d.status === 'INVESTIGATING' && (
                      <>
                        <button onClick={() => updateDispute(d.id, { status: 'RESOLVED', resolution: 'Quality verified via harvest records. Payment adjusted.' })} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Resolve</button>
                        <button onClick={() => updateDispute(d.id, { resolution: 'Payment penalty applied to buyer.' })} className="text-xs font-bold px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">Penalize</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {disputes.length === 0 && <div className="p-10 text-center text-zinc-600">No disputes recorded.</div>}
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS ═══════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Harvests', value: harvests.length, color: 'text-zinc-100' },
              { label: 'Partial', value: harvests.filter(h => h.harvestType === 'PARTIAL').length, color: 'text-blue-400' },
              { label: 'Total (Full)', value: harvests.filter(h => h.harvestType === 'TOTAL').length, color: 'text-emerald-400' },
              { label: 'Avg Yield', value: `${(harvests.reduce((s, h) => s + h.estimatedQuantity, 0) / Math.max(harvests.length, 1)).toFixed(0)} kg`, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>

          {/* Revenue from harvest deals */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Revenue from Harvest Deals</h3>
            <div className="space-y-3">
              {harvests.filter(h => h.totalValue).map(h => {
                const maxVal = Math.max(...harvests.filter(x => x.totalValue).map(x => x.totalValue ?? 0));
                return (
                  <div key={h.id} className="flex items-center gap-4">
                    <p className="font-bold text-sm w-32 truncate">{h.farmerName}</p>
                    <p className="text-xs text-zinc-500 w-20">{h.pondName}</p>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((h.totalValue ?? 0) / maxVal) * 100}%` }} /></div>
                    <p className="font-mono font-bold text-emerald-400 w-20 text-right">{fmtK(h.totalValue ?? 0)}</p>
                    <StageBadge s={h.status} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Yield trend */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Harvest Yield Trend</h3>
            <div className="flex items-end gap-3 h-28">
              {[4500, 3200, 5100, 4800, 2200, 4320, 5500, 4900].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-emerald-500/50 hover:bg-emerald-500 transition-all" style={{ height: `${(v / 5500) * 100}px` }} title={`${v.toLocaleString()} kg`} />
                  <p className="text-[9px] text-zinc-700">H{i+1}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2 text-center">Historical harvest quantities (kg) across recent batches</p>
          </div>

          {/* Top farms */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Top Performing Farms</h3>
            <div className="space-y-3">
              {Object.entries(harvests.reduce((acc, h) => { acc[h.farmerName] = (acc[h.farmerName] ?? 0) + h.estimatedQuantity; return acc; }, {} as Record<string, number>))
                .sort((a, b) => b[1] - a[1]).map(([name, qty], i) => {
                  const maxQ = Math.max(...Object.values(harvests.reduce((acc, h) => { acc[h.farmerName] = (acc[h.farmerName] ?? 0) + h.estimatedQuantity; return acc; }, {} as Record<string, number>)));
                  return (
                    <div key={name} className="flex items-center gap-4">
                      <span className={`font-display font-bold text-lg w-6 text-center ${i === 0 ? 'text-amber-400' : 'text-zinc-600'}`}>#{i+1}</span>
                      <p className="font-bold text-sm w-28">{name}</p>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(qty / maxQ) * 100}%` }} /></div>
                      <p className="font-mono font-bold text-blue-400 w-24 text-right">{qty.toLocaleString()} kg</p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ HARVEST DETAIL SIDE PANEL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetail(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div><p className="font-mono text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-0.5 rounded mb-1">{detail.id}</p><h2 className="text-xl font-display font-bold">{detail.farmerName}</h2><p className="text-sm text-zinc-400">{detail.pondName} · {detail.species}</p></div>
                <button onClick={() => setDetail(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div className="flex items-center gap-3 flex-wrap">
                  <StageBadge s={detail.status} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detail.harvestType === 'TOTAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{detail.harvestType}</span>
                  <span className={`text-xs font-bold ${detail.quality === 'A' ? 'text-emerald-400' : detail.quality === 'B' ? 'text-blue-400' : 'text-amber-400'}`}>Grade {detail.quality}</span>
                  {detail.certificationId && <BadgeCheck size={14} className="text-emerald-400" />}
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Est. Qty', value: `${detail.estimatedQuantity.toLocaleString()} kg` },
                    { label: 'Actual Qty', value: detail.actualQuantity ? `${detail.actualQuantity.toLocaleString()} kg` : '—' },
                    { label: 'Price/kg', value: detail.finalPricePerKg ? `₹${detail.finalPricePerKg}` : detail.pricePerKg ? `₹${detail.pricePerKg}` : '—' },
                    { label: 'Total Value', value: detail.totalValue ? `₹${detail.totalValue.toLocaleString()}` : '—' },
                    { label: 'Commission', value: detail.commission ? `₹${detail.commission.toLocaleString()}` : '—' },
                    { label: 'Shrimp Count', value: `${detail.shrimpCount}/kg` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/5"><p className="text-[9px] text-zinc-500 mb-0.5">{label}</p><p className="font-bold text-sm">{value}</p></div>
                  ))}
                </div>

                {/* Pre-harvest checks */}
                {detail.preHarvestChecks && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">Pre-Harvest Checks</p>
                    <div className="space-y-1.5">
                      <Check ok={detail.preHarvestChecks.logsComplete} label="Daily logs complete" />
                      <Check ok={detail.preHarvestChecks.waterQualityStable} label="Water quality stable" />
                      <Check ok={detail.preHarvestChecks.noMajorAlerts} label="No major disease alerts" />
                      <Check ok={detail.preHarvestChecks.certificationEligible} label="Certification eligible" />
                      <Check ok={detail.preHarvestChecks.growthStageReady} label="Growth stage ready" />
                    </div>
                  </div>
                )}

                {/* Buyer deal */}
                {detail.confirmedBuyerName && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Confirmed Deal</p>
                    <p className="font-bold text-emerald-400">{detail.confirmedBuyerName}</p>
                    <p className="text-xs text-zinc-400">₹{detail.finalPricePerKg}/kg · Locked {detail.dealLockedAt}</p>
                  </div>
                )}

                {/* Transport */}
                {detail.transportProviderName && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Transport</p>
                    <p className="font-bold text-sm">{detail.transportProviderName}</p>
                    <p className="text-xs font-mono text-zinc-400">TRK: {detail.trackingNumber ?? '—'}</p>
                    <p className="text-xs text-zinc-500">{(detail.deliveryStatus ?? 'NOT_DISPATCHED').replace(/_/g,' ')}</p>
                  </div>
                )}

                {detail.notes && <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400">{detail.notes}</div>}
                {detail.riskFlag && <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs text-orange-400 flex items-start gap-2"><AlertTriangle size={11} className="mt-0.5 shrink-0" />{detail.riskFlag}</div>}
              </div>

              {/* Panel actions */}
              <div className="p-5 border-t border-white/5 space-y-2">
                <div className="flex gap-2">
                  {detail.status === 'REQUESTED' && (
                    <>
                      <button onClick={() => { advance(detail.id, 'APPROVED'); setDetail(prev => prev ? { ...prev, status: 'APPROVED' } : null); }} className="flex-1 btn-primary text-sm flex items-center justify-center gap-1.5"><CheckCircle2 size={14} />Approve</button>
                      <button onClick={() => rejectHarvest(detail.id)} className="flex-1 py-2 text-sm font-bold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"><XCircle size={14} />Reject</button>
                    </>
                  )}
                  {detail.status === 'APPROVED' && <button onClick={() => { advance(detail.id, 'SCHEDULED', { scheduledDate: new Date().toISOString().split('T')[0] }); setDetail(prev => prev ? { ...prev, status: 'SCHEDULED' } : null); }} className="w-full btn-primary text-sm flex items-center justify-center gap-1.5"><Clock size={14} />Schedule Harvest</button>}
                  {detail.status === 'SCHEDULED' && <button onClick={() => { advance(detail.id, 'IN_PROGRESS'); setDetail(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : null); }} className="w-full btn-primary text-sm flex items-center justify-center gap-1.5"><Activity size={14} />Start Harvest</button>}
                  {detail.status === 'IN_PROGRESS' && <button onClick={() => { advance(detail.id, 'COMPLETED', { actualQuantity: detail.estimatedQuantity, harvestDate: new Date().toISOString().split('T')[0] }); setDetail(prev => prev ? { ...prev, status: 'COMPLETED' } : null); }} className="w-full btn-primary text-sm flex items-center justify-center gap-1.5"><CheckCircle2 size={14} />Mark Completed</button>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HarvestManagement;
