import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Users, TrendingUp, Package, Plus, Search, Edit3,
  Trash2, X, CheckCircle2, ArrowUpRight, BarChart3, Zap, Shield,
  Bell, RefreshCw, Gift, PieChart, Settings, AlertTriangle,
  Lock, Unlock, Calendar, DollarSign, ChevronDown, ChevronUp,
  Star, Cpu, Filter, Eye, Clock, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart as RPieChart, Pie
} from 'recharts';
import { SubscriptionPlan, FarmerSubscription, Coupon } from '../types';
import { storageService } from '../services/storageService';

// ─── Local Types ───────────────────────────────────────────────────────────────
type Tab =
  | 'plans' | 'features' | 'users' | 'lifecycle' | 'billing'
  | 'autorenewal' | 'coupons' | 'usage' | 'notifications'
  | 'revenue' | 'analytics' | 'manual';

interface BillingTx {
  id: string; userId: string; userName: string; plan: string; amount: number;
  method: 'UPI' | 'Online' | 'Offline'; status: 'SUCCESS' | 'FAILED' | 'PENDING';
  date: string; type: 'farmer' | 'provider' | 'buyer';
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_BILLING: BillingTx[] = [
  { id: 'TX-001', userId: 'F-103', userName: 'Mike Ross', plan: 'Pro', amount: 1499, method: 'UPI', status: 'SUCCESS', date: '2026-04-05', type: 'farmer' },
  { id: 'TX-002', userId: 'F-101', userName: 'John Doe', plan: 'Basic', amount: 499, method: 'Online', status: 'SUCCESS', date: '2026-04-10', type: 'farmer' },
  { id: 'TX-003', userId: 'F-102', userName: 'Jane Smith', plan: 'Free', amount: 0, method: 'Offline', status: 'SUCCESS', date: '2026-04-01', type: 'farmer' },
  { id: 'TX-004', userId: 'P-201', userName: 'Green Valley', plan: 'Provider Premium', amount: 999, method: 'UPI', status: 'SUCCESS', date: '2026-04-12', type: 'provider' },
  { id: 'TX-005', userId: 'F-104', userName: 'Sarah Connor', plan: 'Basic', amount: 499, method: 'Online', status: 'FAILED', date: '2026-04-14', type: 'farmer' },
  { id: 'TX-006', userId: 'B-001', userName: 'AquaPrime Exports', plan: 'Buyer Pro', amount: 1999, method: 'Online', status: 'PENDING', date: '2026-04-16', type: 'buyer' },
];

const FEATURE_GATES: { feature: string; plans: Record<string, boolean>; category: string }[] = [
  { feature: 'Daily Logs (Unlimited)', category: 'Core', plans: { Free: false, Basic: true, Pro: true, Enterprise: true } },
  { feature: 'Pond Management', category: 'Core', plans: { Free: true, Basic: true, Pro: true, Enterprise: true } },
  { feature: 'Certification Access', category: 'Premium', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
  { feature: 'Market Intelligence', category: 'Premium', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
  { feature: 'IoT Device Integration', category: 'Premium', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
  { feature: 'Priority Buyer Visibility', category: 'Premium', plans: { Free: false, Basic: false, Pro: false, Enterprise: true } },
  { feature: 'Premium Provider Leads', category: 'Provider', plans: { Free: false, Basic: false, Pro: false, Enterprise: true } },
  { feature: 'Advanced Analytics', category: 'Analytics', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
  { feature: 'AI Harvest Recommendations', category: 'AI', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
  { feature: 'Auction/Bidding Access', category: 'Marketplace', plans: { Free: false, Basic: false, Pro: false, Enterprise: true } },
  { feature: 'Export Price Intelligence', category: 'Marketplace', plans: { Free: false, Basic: false, Pro: false, Enterprise: true } },
  { feature: 'Priority Support', category: 'Support', plans: { Free: false, Basic: false, Pro: true, Enterprise: true } },
];

const MRR_DATA = [
  { month: 'Nov', mrr: 18400 },
  { month: 'Dec', mrr: 24800 },
  { month: 'Jan', mrr: 31200 },
  { month: 'Feb', mrr: 36500 },
  { month: 'Mar', mrr: 42100 },
  { month: 'Apr', mrr: 48950 },
];

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '11px' },
  itemStyle: { fontSize: '11px' },
};

const PLAN_COLORS = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b'];

// ─── Sub-components ────────────────────────────────────────────────────────────
const StatusBadge = ({ s }: { s: string }) => {
  const c = s === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : s === 'EXPIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : s === 'GRACE_PERIOD' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : s === 'SUSPENDED' || s === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : s === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : s === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c}`}>{s}</span>;
};

const SwitchToggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} className={`relative w-9 h-5 rounded-full transition-all ${on ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${on ? 'left-4' : 'left-0.5'}`} />
  </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const Subscriptions = () => {
  const [tab, setTab] = useState<Tab>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [farmerSubs, setFarmerSubs] = useState<FarmerSubscription[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [billing] = useState<BillingTx[]>(SEED_BILLING);
  const [featureGates, setFeatureGates] = useState(FEATURE_GATES.map(f => ({ ...f })));
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [couponModal, setCouponModal] = useState(false);
  const [manualModal, setManualModal] = useState<FarmerSubscription | null>(null);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: '', discountType: 'PERCENT', discountValue: 10, usageLimit: 100, expiresAt: '2026-12-31', isActive: true, usedCount: 0,
  });
  const [autoRenewalMap, setAutoRenewalMap] = useState<Record<string, boolean>>({});
  const [notifRules, setNotifRules] = useState({
    expiryReminder7: true, expiryReminder1: true, paymentFailed: true, upgradeNudge: true, renewalConfirm: true,
  });

  const load = () => {
    setPlans(storageService.getPlans());
    setFarmerSubs(storageService.getFarmerSubs());
    setCoupons(storageService.getCoupons());
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    active:       farmerSubs.filter(s => s.status === 'ACTIVE').length,
    expiringSoon: farmerSubs.filter(s => { const d = new Date(s.endDate); const n = new Date(); return d > n && (d.getTime() - n.getTime()) / 86400000 < 30; }).length,
    suspended:    farmerSubs.filter(s => s.status === 'SUSPENDED').length,
    grace:        farmerSubs.filter(s => s.status === 'GRACE_PERIOD').length,
    totalRevenue: billing.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0),
    mrr:    48950,
    churn:  6.4,
    convRate: 38,
  }), [farmerSubs, billing]);

  const planDist = useMemo(() => plans.map((p, i) => ({
    name: p.name,
    value: farmerSubs.filter(s => s.planId === p.id).length,
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  })), [plans, farmerSubs]);

  const filtered = useMemo(() => farmerSubs.filter(s => {
    const ms = s.farmerName.toLowerCase().includes(search.toLowerCase()) || s.planName.toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus === 'all' || s.status === filterStatus;
    return ms && mf;
  }), [farmerSubs, search, filterStatus]);

  const togglePlan = (plan: SubscriptionPlan) => { storageService.savePlan({ ...plan, isActive: !plan.isActive }); load(); };
  const handleCreateCoupon = () => {
    if (!newCoupon.code) return;
    storageService.saveCoupon({ ...(newCoupon as Coupon), id: `CPN-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] });
    setCouponModal(false); load();
  };
  const deleteCoupon = (id: string) => { storageService.deleteCoupon(id); load(); };
  const manualAction = (sub: FarmerSubscription, action: 'extend' | 'pause' | 'activate') => {
    const patch: Partial<FarmerSubscription> = action === 'extend'
      ? { endDate: new Date(new Date(sub.endDate).getTime() + 30 * 86400000).toISOString().split('T')[0] }
      : action === 'pause' ? { status: 'SUSPENDED' }
      : { status: 'ACTIVE' };
    storageService.saveFarmerSub({ ...sub, ...patch });
    setManualModal(null); load();
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'plans',        label: 'Plans',         icon: Package },
    { id: 'features',    label: 'Feature Control',icon: Shield },
    { id: 'users',       label: 'User Subs',      icon: Users },
    { id: 'lifecycle',   label: 'Lifecycle',      icon: RefreshCw },
    { id: 'billing',     label: 'Billing',        icon: CreditCard },
    { id: 'autorenewal', label: 'Auto-Renewal',   icon: Zap },
    { id: 'coupons',     label: 'Coupons',        icon: Gift },
    { id: 'usage',       label: 'Usage Limits',   icon: Activity },
    { id: 'notifications',label:'Notifications',  icon: Bell },
    { id: 'revenue',     label: 'Revenue',        icon: DollarSign },
    { id: 'analytics',   label: 'Analytics',      icon: BarChart3 },
    { id: 'manual',      label: 'Manual Controls',icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Subscription Management</h1>
          <p className="text-zinc-400">Full control over plans, feature gates, billing, and subscriber lifecycle.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Active',      value: stats.active,          color: 'text-emerald-400' },
          { label: 'Expiring 30d',value: stats.expiringSoon,    color: stats.expiringSoon > 0 ? 'text-amber-400' : '' },
          { label: 'Grace Period',value: stats.grace,           color: stats.grace > 0 ? 'text-orange-400' : '' },
          { label: 'Suspended',   value: stats.suspended,       color: stats.suspended > 0 ? 'text-red-400' : '' },
          { label: 'MRR',         value: `₹${(stats.mrr/1000).toFixed(1)}K`, color: 'text-emerald-400' },
          { label: 'Revenue',     value: `₹${(stats.totalRevenue/1000).toFixed(1)}K`, color: '' },
          { label: 'Conv. Rate',  value: `${stats.convRate}%`,  color: 'text-blue-400' },
          { label: 'Churn',       value: `${stats.churn}%`,     color: 'text-red-400' },
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
          </button>
        ))}
      </div>

      {/* ═══ PLANS ════════════════════════════════════════════════════════════ */}
      {tab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <motion.div key={plan.id} whileHover={{ y: -4 }} className={`glass-panel p-6 relative ${plan.isPopular ? 'border border-emerald-500/30' : ''}`}>
                {plan.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-bold text-white">MOST POPULAR</div>}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[i % 4] }} />
                  <button onClick={() => togglePlan(plan)} className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${plan.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{plan.isActive ? 'ACTIVE' : 'DISABLED'}</button>
                </div>
                <h3 className="text-2xl font-display font-bold mb-0.5">{plan.name}</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-4">For {plan.targetRole}s</p>
                {plan.price === 0 ? (
                  <p className="text-3xl font-display font-bold text-emerald-400 mb-1">Free</p>
                ) : (
                  <div className="mb-1">
                    <p className="text-3xl font-display font-bold" style={{ color: PLAN_COLORS[i % 4] }}>₹{plan.price}<span className="text-lg text-zinc-500">/mo</span></p>
                    <p className="text-[10px] text-zinc-500">₹{plan.yearlyPrice}/yr · Save {Math.round(((plan.price * 12 - plan.yearlyPrice) / (plan.price * 12)) * 100)}%</p>
                  </div>
                )}
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  {plan.features.map(f => (
                    <div key={f.name} className="flex items-start gap-2 text-xs">
                      {f.included ? <CheckCircle2 size={11} className="text-emerald-400 mt-0.5 shrink-0" /> : <span className="text-zinc-700 w-3 mt-0.5">✗</span>}
                      <span className={f.included ? 'text-zinc-300' : 'text-zinc-600'}>{f.name}{f.limit && <span className="text-zinc-500"> ({f.limit})</span>}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-1 text-[9px] text-zinc-600">
                  <span>🏊 {plan.limits.ponds === -1 ? '∞' : plan.limits.ponds} ponds</span>
                  <span>📡 {plan.limits.iotDevices === -1 ? '∞' : plan.limits.iotDevices} IoT</span>
                  <span>📋 {plan.limits.dailyLogs === -1 ? '∞' : plan.limits.dailyLogs} logs</span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-500">{planDist.find(d => d.name === plan.name)?.value ?? 0} subscribers</span>
                </div>
              </motion.div>
            ))}
            {/* Add Plan placeholder */}
            <div className="glass-panel p-6 border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-all"><Plus size={20} className="text-zinc-500 group-hover:text-emerald-400" /></div>
              <p className="text-sm text-zinc-500 group-hover:text-emerald-400 transition-all font-bold">Create New Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FEATURE CONTROL ══════════════════════════════════════════════════ */}
      {tab === 'features' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-purple-500/20 flex items-start gap-3">
            <Shield size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-purple-400 text-sm">Feature Gate Control</p><p className="text-xs text-zinc-400 mt-1">Enable or disable individual features per plan — no code changes needed. Changes apply immediately to new sessions.</p></div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-64">Feature</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                    {['Free','Basic','Pro','Enterprise'].map(p => (
                      <th key={p} className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: PLAN_COLORS[['Free','Basic','Pro','Enterprise'].indexOf(p)] }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {featureGates.map((row, i) => (
                    <tr key={row.feature} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-bold">{row.feature}</td>
                      <td className="px-5 py-3.5"><span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-500">{row.category}</span></td>
                      {['Free','Basic','Pro','Enterprise'].map(p => (
                        <td key={p} className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center">
                            <SwitchToggle
                              on={row.plans[p]}
                              onToggle={() => setFeatureGates(prev => prev.map((r, ri) => ri === i ? { ...r, plans: { ...r.plans, [p]: !r.plans[p] } } : r))}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ USER SUBSCRIPTIONS ══════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-field w-full pl-11 text-sm" placeholder="Search subscribers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={13} className="text-zinc-500" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Status</option>
                {['ACTIVE','EXPIRED','GRACE_PERIOD','SUSPENDED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">All Subscriber Accounts</h3>
              <span className="text-xs text-zinc-500">{filtered.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Subscriber','Plan','Status','Expires','Amount Paid','Ponds Usage','Payment','Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(sub => {
                    const plan = plans.find(p => p.id === sub.planId);
                    const maxPonds = plan?.limits.ponds ?? 1;
                    const pct = maxPonds === -1 ? 40 : Math.min(100, (sub.usagePonds / maxPonds) * 100);
                    const isNearLimit = pct > 80;
                    return (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><p className="font-bold text-sm">{sub.farmerName}</p><p className="text-[10px] text-zinc-600">{sub.farmerId}</p></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{sub.planName}</span></td>
                        <td className="px-5 py-4"><StatusBadge s={sub.status} /></td>
                        <td className="px-5 py-4 text-sm text-zinc-400">{sub.endDate === '2099-01-01' ? '∞ Forever' : sub.endDate}</td>
                        <td className="px-5 py-4 font-mono font-bold">₹{sub.amountPaid.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isNearLimit ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                            <span className={`text-xs ${isNearLimit ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>{sub.usagePonds}/{maxPonds === -1 ? '∞' : maxPonds}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{sub.paymentMethod}</td>
                        <td className="px-5 py-4">
                          <button onClick={() => setManualModal(sub)} className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Manage</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LIFECYCLE ═══════════════════════════════════════════════════════ */}
      {tab === 'lifecycle' && (
        <div className="space-y-6">
          {/* Lifecycle flow */}
          <div className="glass-panel p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2"><RefreshCw size={14} className="text-blue-400" />Subscription Lifecycle Flow</h3>
            <div className="flex items-center gap-1 flex-wrap">
              {['Active','Expiring Soon','Grace Period','Expired','Suspended'].map((stage, i, arr) => {
                const colors = ['bg-emerald-500 text-white','bg-amber-500 text-white','bg-orange-500 text-white','bg-red-500 text-white','bg-zinc-700 text-zinc-300'];
                const counts = [stats.active, stats.expiringSoon, stats.grace, farmerSubs.filter(s => s.status === 'EXPIRED').length, stats.suspended];
                return (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${colors[i]}`}>{stage}</div>
                      <span className="text-[10px] text-zinc-600">{counts[i]} users</span>
                    </div>
                    {i < arr.length - 1 && <div className="flex-1 min-w-4 h-px bg-zinc-700 mx-1 mt-[-12px]" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Plan Duration Options', options: ['30 days', '90 days', '180 days', '365 days'], icon: Calendar },
              { label: 'Grace Period', options: ['3 days', '7 days', '14 days', '30 days'], icon: Clock },
              { label: 'Post-Expiry Action', options: ['Auto downgrade to Free', 'Suspend access', 'Send reminder only'], icon: AlertTriangle },
            ].map(({ label, options, icon: Icon }) => (
              <div key={label} className="glass-panel p-5">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><Icon size={13} className="text-emerald-400" />{label}</h3>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={label} defaultChecked={i === 0} className="accent-emerald-500" />
                      <span className="text-sm text-zinc-300">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Expiring soon list */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" />Expiring Within 30 Days</h3>
              <button className="text-xs font-bold px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Bell size={12} />Send Renewal Reminders</button>
            </div>
            <div className="divide-y divide-white/5">
              {farmerSubs.filter(s => { const d = new Date(s.endDate); const n = new Date(); return d > n && (d.getTime() - n.getTime()) / 86400000 < 30; }).map(s => {
                const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / 86400000);
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-4">
                    <div><p className="font-bold text-sm">{s.farmerName}</p><p className="text-xs text-zinc-500">{s.planName} · Expires {s.endDate}</p></div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${daysLeft <= 7 ? 'text-red-400' : 'text-amber-400'}`}>{daysLeft} days left</span>
                      <button onClick={() => manualAction(s, 'extend')} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Extend 30d</button>
                    </div>
                  </div>
                );
              })}
              {stats.expiringSoon === 0 && <p className="p-6 text-center text-zinc-600 text-sm">No subscriptions expiring in the next 30 days.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BILLING ══════════════════════════════════════════════════════════ */}
      {tab === 'billing' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Successful', value: billing.filter(t => t.status === 'SUCCESS').length, color: 'text-emerald-400', sub: `₹${billing.filter(t => t.status === 'SUCCESS').reduce((s, t) => s+t.amount,0).toLocaleString()}` },
              { label: 'Failed', value: billing.filter(t => t.status === 'FAILED').length, color: 'text-red-400', sub: 'Retry needed' },
              { label: 'Pending', value: billing.filter(t => t.status === 'PENDING').length, color: 'text-amber-400', sub: 'Awaiting confirmation' },
            ].map(({ label, value, color, sub }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-3xl font-display font-bold ${color}`}>{value}</p><p className="text-xs text-zinc-500 mt-1">{sub}</p></div>
            ))}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Transaction History</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Tx ID','User','Role','Plan','Amount','Method','Status','Date','Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {billing.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-emerald-400/70">{tx.id}</td>
                      <td className="px-5 py-4 font-bold text-sm">{tx.userName}</td>
                      <td className="px-5 py-4"><span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-500 capitalize">{tx.type}</span></td>
                      <td className="px-5 py-4 text-sm">{tx.plan}</td>
                      <td className="px-5 py-4 font-mono font-bold">₹{tx.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{tx.method}</td>
                      <td className="px-5 py-4"><StatusBadge s={tx.status} /></td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{tx.date}</td>
                      <td className="px-5 py-4">
                        {tx.status === 'FAILED' && <button className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Retry</button>}
                        {tx.status === 'PENDING' && <button className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Verify</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ AUTO-RENEWAL ════════════════════════════════════════════════════ */}
      {tab === 'autorenewal' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-emerald-500/10 flex items-start gap-3">
            <Zap size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-emerald-400">Auto-Renewal:</span> Reduces churn by auto-charging on expiry. Admin can control per-user. 7-day and 1-day reminders are sent before renewal.</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Auto-Renewal Status per Subscriber</h3>
              <div className="flex gap-2">
                <button className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Enable All</button>
                <button className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">Disable All</button>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {farmerSubs.map(s => {
                const on = autoRenewalMap[s.id] ?? s.status === 'ACTIVE';
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-4">
                    <div><p className="font-bold text-sm">{s.farmerName}</p><p className="text-xs text-zinc-500">{s.planName} · Expires {s.endDate}</p></div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs ${on ? 'text-emerald-400' : 'text-zinc-600'}`}>{on ? 'Auto-Renewal ON' : 'Off'}</span>
                      <SwitchToggle on={on} onToggle={() => setAutoRenewalMap(prev => ({ ...prev, [s.id]: !on }))} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Retry Failed Payments</h3>
            {billing.filter(t => t.status === 'FAILED').length === 0 ? (
              <p className="text-zinc-600 text-sm">No failed payments to retry.</p>
            ) : (
              <div className="space-y-3">
                {billing.filter(t => t.status === 'FAILED').map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div><p className="font-bold">{tx.userName}</p><p className="text-xs text-zinc-500 mt-0.5">{tx.plan} · ₹{tx.amount} · {tx.date}</p></div>
                    <button className="text-xs font-bold px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><RefreshCw size={12} />Retry Payment</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ COUPONS ══════════════════════════════════════════════════════════ */}
      {tab === 'coupons' && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setCouponModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Create Coupon</button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    {['Code','Discount','Type','Usage','Expires','Status','Action'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><span className="font-mono font-bold text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 px-3 py-1 rounded-lg">{c.code}</span></td>
                      <td className="px-5 py-4 font-bold">{c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500 capitalize">{c.discountType.toLowerCase()}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.usedCount / c.usageLimit) * 100}%` }} /></div>
                          <span className="text-xs text-zinc-400">{c.usedCount}/{c.usageLimit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-400">{c.expiresAt}</td>
                      <td className="px-5 py-4"><StatusBadge s={c.isActive ? 'ACTIVE' : 'EXPIRED'} /></td>
                      <td className="px-5 py-4"><button onClick={() => deleteCoupon(c.id)} className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-all"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Referral program cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Referral Reward', desc: 'Farmer refers → both get 1 month free', code: 'REFER2GROW', discount: '1 month' },
              { label: 'Festival Offer', desc: 'Diwali special 30% off Pro plan', code: 'DIWALI30', discount: '30%' },
              { label: 'First-year Discount', desc: 'New signups get 20% off annual', code: 'WELCOME20', discount: '20%' },
            ].map(({ label, desc, code, discount }) => (
              <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"><Gift size={14} className="text-amber-400" /></div>
                <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-zinc-500 mt-0.5">{desc}</p><p className="font-mono text-xs text-emerald-400 mt-1">{code} — {discount}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ USAGE LIMITS ════════════════════════════════════════════════════ */}
      {tab === 'usage' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold flex items-center gap-2"><Activity size={14} className="text-blue-400" />Usage vs Plan Limits per Subscriber</h3></div>
            <div className="divide-y divide-white/5">
              {farmerSubs.map(s => {
                const plan = plans.find(p => p.id === s.planId);
                const maxPonds = plan?.limits.ponds ?? 1;
                const maxIoT = plan?.limits.iotDevices ?? 0;
                const maxLogs = plan?.limits.dailyLogs ?? 30;
                const pondsUsed = s.usagePonds;
                const iotUsed = Math.floor(Math.random() * 3);  // simulated
                const logsUsed = Math.floor(Math.random() * 25 + 5);
                const pPct = maxPonds === -1 ? 30 : Math.min(100, (pondsUsed / maxPonds) * 100);
                const iPct = maxIoT === 0 ? 100 : maxIoT === -1 ? 30 : Math.min(100, (iotUsed / maxIoT) * 100);
                const lPct = maxLogs === -1 ? 50 : Math.min(100, (logsUsed / maxLogs) * 100);
                const LimitBar = ({ used, max, label }: { used: number; max: number; label: string }) => {
                  const pct = max === -1 ? 40 : Math.min(100, (used / Math.max(max, 1)) * 100);
                  const over = pct >= 80;
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-zinc-600 w-6">{label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                      <span className={`text-[10px] font-bold w-12 text-right ${over ? 'text-red-400' : 'text-zinc-400'}`}>{used}/{max === -1 ? '∞' : max}</span>
                    </div>
                  );
                };
                return (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="font-bold text-sm">{s.farmerName}</p><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{s.planName}</span></div>
                      {pPct >= 80 && <span className="text-[10px] font-bold text-red-400 flex items-center gap-1"><AlertTriangle size={10} />Near limit!</span>}
                    </div>
                    <div className="space-y-1.5">
                      <LimitBar used={pondsUsed} max={maxPonds} label="🏊" />
                      <LimitBar used={iotUsed} max={maxIoT} label="📡" />
                      <LimitBar used={logsUsed} max={maxLogs} label="📋" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ NOTIFICATIONS ═══════════════════════════════════════════════════ */}
      {tab === 'notifications' && (
        <div className="space-y-5">
          <div className="glass-panel p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2"><Bell size={14} className="text-amber-400" />Notification Rules</h3>
            <div className="space-y-3">
              {[
                { key: 'expiryReminder7', label: '7-day expiry reminder', desc: 'Send notification 7 days before subscription expires' },
                { key: 'expiryReminder1', label: '1-day expiry reminder', desc: 'Send urgent reminder 1 day before expiry' },
                { key: 'paymentFailed',   label: 'Payment failed alert', desc: 'Notify user immediately when payment fails' },
                { key: 'upgradeNudge',    label: 'Upgrade suggestion', desc: 'Suggest Premium when user hits 80% of plan limits' },
                { key: 'renewalConfirm',  label: 'Renewal confirmation', desc: 'Send confirmation when auto-renewal succeeds' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-zinc-500">{desc}</p></div>
                  <SwitchToggle
                    on={notifRules[key as keyof typeof notifRules]}
                    onToggle={() => setNotifRules(prev => ({ ...prev, [key]: !prev[key as keyof typeof notifRules] }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Send Manual Notification</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Target</label><select className="input-field w-full bg-zinc-900"><option>All Subscribers</option><option>Expiring Soon</option><option>Suspended</option><option>Free Plan Users</option></select></div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Type</label><select className="input-field w-full bg-zinc-900"><option>Renewal Reminder</option><option>Upgrade Offer</option><option>Payment Reminder</option><option>Feature Update</option></select></div>
              </div>
              <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Message</label><textarea className="input-field w-full h-20 resize-none" placeholder="Your subscription is expiring in 7 days. Renew now to keep access..." /></div>
              <div className="flex justify-end"><button className="btn-primary flex items-center gap-2"><Bell size={15} />Send Notification</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REVENUE ══════════════════════════════════════════════════════════ */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'MRR', value: `₹${(stats.mrr/1000).toFixed(1)}K`, sub: '+16% vs last month', color: 'text-emerald-400' },
              { label: 'Annual Run Rate', value: `₹${((stats.mrr * 12)/100000).toFixed(1)}L`, sub: 'At current MRR', color: 'text-blue-400' },
              { label: 'Total Collected', value: `₹${stats.totalRevenue.toLocaleString()}`, sub: 'All time', color: '' },
              { label: 'Avg Rev / User', value: `₹${Math.round(stats.totalRevenue / Math.max(farmerSubs.length,1))}`, sub: 'ARPU', color: 'text-purple-400' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-2xl font-display font-bold ${color || 'text-zinc-100'}`}>{value}</p>{sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}</div>
            ))}
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" />Monthly Recurring Revenue (MRR)</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MRR_DATA}>
                  <defs><linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip {...CHART_STYLE} formatter={(v: any) => [`₹${v.toLocaleString()}`, 'MRR']} />
                  <Area type="monotone" dataKey="mrr" stroke="#10b981" fill="url(#mrrGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plan-wise revenue */}
          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Revenue by Plan</h3>
            <div className="space-y-3">
              {plans.map((plan, i) => {
                const rev = farmerSubs.filter(s => s.planId === plan.id).reduce((sum, s) => sum + s.amountPaid, 0);
                const maxRev = Math.max(...plans.map(p => farmerSubs.filter(s => s.planId === p.id).reduce((sum, s) => sum + s.amountPaid, 0)));
                return (
                  <div key={plan.id} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PLAN_COLORS[i % 4] }} />
                    <p className="font-bold text-sm w-24">{plan.name}</p>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${maxRev > 0 ? (rev/maxRev)*100 : 0}%`, backgroundColor: PLAN_COLORS[i % 4] }} /></div>
                    <p className="font-mono font-bold text-sm w-24 text-right" style={{ color: PLAN_COLORS[i % 4] }}>₹{rev.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600 w-16 text-right">{farmerSubs.filter(s => s.planId === plan.id).length} users</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS ════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Free → Paid Conv.', value: `${stats.convRate}%`, color: 'text-emerald-400', icon: ArrowUpRight },
              { label: 'Monthly Churn', value: `${stats.churn}%`, color: 'text-red-400', icon: ChevronDown },
              { label: 'Most Popular Plan', value: 'Pro', color: 'text-purple-400', icon: Star },
              { label: 'Avg Sub Duration', value: '9.2 mo', color: 'text-blue-400', icon: Clock },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="glass-panel p-5 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.replace('text-','bg-').replace('400','500/10')}`}><Icon size={16} className={color} /></div>
                <div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{label}</p><p className={`text-2xl font-display font-bold ${color}`}>{value}</p></div>
              </div>
            ))}
          </div>

          {/* Plan distribution donut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="font-bold mb-5">Plan Distribution</h3>
              <div className="flex items-center gap-6">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie data={planDist.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                        {planDist.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                      </Pie>
                      <Tooltip {...CHART_STYLE} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {planDist.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-sm">{d.name}</span></div>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="font-bold mb-5">Key Metrics Summary</h3>
              <div className="space-y-4">
                {[
                  { label: 'Free → Paid Conversion', value: stats.convRate, max: 100, color: '#10b981', suffix: '%' },
                  { label: 'Retention Rate', value: 100 - stats.churn, max: 100, color: '#3b82f6', suffix: '%' },
                  { label: 'MRR Growth (MoM)', value: 16, max: 50, color: '#f59e0b', suffix: '%' },
                  { label: 'Auto-Renewal Rate', value: 72, max: 100, color: '#8b5cf6', suffix: '%' },
                ].map(({ label, value, max, color, suffix }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-zinc-400">{label}</span><span className="font-bold" style={{ color }}>{value}{suffix}</span></div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(value/max)*100}%`, backgroundColor: color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MANUAL CONTROLS ════════════════════════════════════════════════ */}
      {tab === 'manual' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-amber-500/10 flex items-start gap-3">
            <Settings size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div><p className="font-bold text-amber-400 text-sm">Admin Override Power</p><p className="text-xs text-zinc-400 mt-1">Use these controls responsibly. All manual actions are logged. You can activate, extend, pause, or issue refunds for any user's subscription.</p></div>
          </div>

          <div className="glass-panel divide-y divide-white/5">
            {farmerSubs.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold text-sm">{s.farmerName}</p>
                  <div className="flex items-center gap-2 mt-0.5"><StatusBadge s={s.status} /><span className="text-xs text-zinc-500">{s.planName} · ends {s.endDate}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => manualAction(s, 'extend')} className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Calendar size={11} />+30d</button>
                  {s.status === 'ACTIVE'
                    ? <button onClick={() => manualAction(s, 'pause')} className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Lock size={11} />Pause</button>
                    : <button onClick={() => manualAction(s, 'activate')} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Unlock size={11} />Activate</button>}
                  <button className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><DollarSign size={11} />Refund</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {couponModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCouponModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-display font-bold">Create Coupon</h2><button onClick={() => setCouponModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button></div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Coupon Code</label><input type="text" placeholder="e.g. MONSOON30" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="input-field w-full font-mono" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Discount Type</label><select value={newCoupon.discountType} onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'PERCENT' | 'FIXED' })} className="input-field w-full bg-zinc-900"><option value="PERCENT">Percentage</option><option value="FIXED">Fixed ₹</option></select></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Value</label><input type="number" value={newCoupon.discountValue} onChange={e => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })} className="input-field w-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Usage Limit</label><input type="number" value={newCoupon.usageLimit} onChange={e => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })} className="input-field w-full" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Expires At</label><input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} className="input-field w-full" /></div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setCouponModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleCreateCoupon} disabled={!newCoupon.code} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Gift size={15} />Create</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscriptions;
