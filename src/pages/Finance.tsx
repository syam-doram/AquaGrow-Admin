import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  FileText, Search, Filter, Download, CheckCircle2, Clock,
  XCircle, CreditCard, History, BarChart3, Users, AlertTriangle,
  RefreshCw, Shield, Zap, Plus, Eye, Ban, Settings, Globe,
  TrendingDown, Package, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line
} from 'recharts';
import { Transaction } from '../types';
import { storageService } from '../services/storageService';
import { fetchExpenses, LiveExpense } from '../services/aquagrowApi';

// ─── Local Types ───────────────────────────────────────────────────────────────
type FinTab =
  | 'dashboard' | 'incoming' | 'outgoing' | 'status' | 'commission'
  | 'invoices' | 'refunds' | 'wallet' | 'gateway' | 'settlement'
  | 'expenses' | 'reports' | 'fraud' | 'tax';

interface IncomingPayment {
  id: string; fromId: string; type: string; amount: number;
  status: 'completed' | 'pending' | 'cancelled'; date: string;
  source: string; gateway: string; orderId?: string;
}
interface Payout {
  id: string; recipient: string; role: 'farmer' | 'provider' | 'supplier';
  amount: number; reason: string; status: 'PENDING' | 'APPROVED' | 'PAID' | 'HELD';
  requestedAt: string; method: string;
}
interface Refund {
  id: string; orderId: string; user: string; amount: number; reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED'; requestedAt: string; type: string;
}
interface Expense {
  id: string; category: string; description: string; amount: number; date: string; vendor: string;
}
interface WalletEntry {
  userId: string; name: string; role: string; balance: number; lastTopup: string;
}
interface FraudFlag {
  id: string; txId: string; user: string; reason: string; severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'INVESTIGATING' | 'CLEARED' | 'BLOCKED'; flaggedAt: string;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const INCOMING: IncomingPayment[] = [
  { id: 'IN-001', fromId: 'F-101 (John Doe)',       type: 'PAYMENT',    amount: 499,     status: 'completed', date: '2026-04-10', source: 'Subscription',        gateway: 'UPI',    orderId: 'ORD-220' },
  { id: 'IN-002', fromId: 'B-001 (AquaPrime)',       type: 'PAYMENT',    amount: 2116800, status: 'completed', date: '2026-04-12', source: 'Harvest Deal',         gateway: 'Online', orderId: 'HRV-001' },
  { id: 'IN-003', fromId: 'F-103 (Mike Ross)',       type: 'COMMISSION', amount: 105840,  status: 'completed', date: '2026-04-12', source: 'Harvest Commission',    gateway: 'Auto',   orderId: 'HRV-001' },
  { id: 'IN-004', fromId: 'F-104 (Sarah Connor)',    type: 'PAYMENT',    amount: 499,     status: 'cancelled', date: '2026-04-14', source: 'Subscription',         gateway: 'UPI',    orderId: 'ORD-221' },
  { id: 'IN-005', fromId: 'ORD-225 (Consumer)',      type: 'PAYMENT',    amount: 18500,   status: 'completed', date: '2026-04-15', source: 'Product Order',         gateway: 'Online', orderId: 'ORD-225' },
  { id: 'IN-006', fromId: 'P-201 (Green Valley)',    type: 'PAYMENT',    amount: 999,     status: 'pending',   date: '2026-04-16', source: 'Provider Sub',          gateway: 'UPI',    orderId: 'SUB-P01' },
];

const PAYOUTS: Payout[] = [
  { id: 'OUT-001', recipient: 'Mike Ross',       role: 'farmer',   amount: 2010960, reason: 'Harvest HRV-001 settlement', status: 'PAID',     requestedAt: '2026-04-13', method: 'Bank Transfer' },
  { id: 'OUT-002', recipient: 'Midwest Harvest', role: 'provider', amount: 45000,   reason: 'Transport & Harvest Service', status: 'APPROVED', requestedAt: '2026-04-14', method: 'UPI' },
  { id: 'OUT-003', recipient: 'GreenFeed Co.',   role: 'supplier', amount: 320000,  reason: 'Feed stock purchase Q2',      status: 'PENDING',  requestedAt: '2026-04-15', method: 'NEFT' },
  { id: 'OUT-004', recipient: 'John Doe',        role: 'farmer',   amount: 0,       reason: 'Harvest HRV-002 (pending)',   status: 'HELD',     requestedAt: '2026-04-16', method: 'Bank Transfer' },
];

const REFUNDS: Refund[] = [
  { id: 'REF-001', orderId: 'ORD-210', user: 'Sarah Connor', amount: 1200, reason: 'Damaged product received',   status: 'APPROVED',  requestedAt: '2026-04-12', type: 'Product' },
  { id: 'REF-002', orderId: 'SUB-002', user: 'Jane Smith',   amount: 499,  reason: 'Subscription cancelled',     status: 'PROCESSED', requestedAt: '2026-04-14', type: 'Subscription' },
  { id: 'REF-003', orderId: 'SVC-015', user: 'Anjali Devi',  amount: 800,  reason: 'Service not delivered',      status: 'REQUESTED', requestedAt: '2026-04-16', type: 'Service' },
  { id: 'REF-004', orderId: 'ORD-218', user: 'Tom Hardy',    amount: 2500, reason: 'Order cancellation',         status: 'REJECTED',  requestedAt: '2026-04-15', type: 'Product' },
];

const EXPENSES: Expense[] = [
  { id: 'EXP-001', category: 'Product Purchase', description: 'Feed inventory from GreenFeed',  amount: 320000, date: '2026-04-01', vendor: 'GreenFeed Co.' },
  { id: 'EXP-002', category: 'Logistics',        description: 'Delivery & transport Q1',        amount: 42000,  date: '2026-04-05', vendor: 'BlueWay Logistics' },
  { id: 'EXP-003', category: 'Salaries',         description: 'Mar staff salaries',             amount: 85000,  date: '2026-04-01', vendor: 'Internal' },
  { id: 'EXP-004', category: 'Marketing',        description: 'Google Ads – Apr',               amount: 15000,  date: '2026-04-10', vendor: 'Google' },
  { id: 'EXP-005', category: 'Infrastructure',   description: 'AWS hosting – Apr',              amount: 8500,   date: '2026-04-01', vendor: 'AWS' },
  { id: 'EXP-006', category: 'Misc',             description: 'Office supplies',                amount: 3200,   date: '2026-04-12', vendor: 'Various' },
];

const WALLETS: WalletEntry[] = [
  { userId: 'F-101', name: 'John Doe',          role: 'Farmer',   balance: 4500,   lastTopup: '2026-04-10' },
  { userId: 'F-103', name: 'Mike Ross',         role: 'Farmer',   balance: 18000,  lastTopup: '2026-04-12' },
  { userId: 'B-001', name: 'AquaPrime Exports', role: 'Buyer',    balance: 125000, lastTopup: '2026-04-11' },
  { userId: 'P-201', name: 'Green Valley',      role: 'Provider', balance: 2200,   lastTopup: '2026-04-09' },
];

const FRAUD_FLAGS: FraudFlag[] = [
  { id: 'FRD-001', txId: 'IN-004', user: 'Sarah Connor', reason: 'Payment failed 3x in 1 hour',          severity: 'MEDIUM', status: 'INVESTIGATING', flaggedAt: '2026-04-14' },
  { id: 'FRD-002', txId: 'REF-004', user: 'Tom Hardy',   reason: 'Refund request within 2h of delivery', severity: 'HIGH',   status: 'OPEN',          flaggedAt: '2026-04-15' },
  { id: 'FRD-003', txId: 'IN-006', user: 'Unknown',      reason: 'Duplicate transaction fingerprint',     severity: 'LOW',    status: 'CLEARED',       flaggedAt: '2026-04-16' },
];

const MONTHLY_TREND = [
  { month: 'Nov', revenue: 120000, expenses: 85000,  profit: 35000 },
  { month: 'Dec', revenue: 185000, expenses: 95000,  profit: 90000 },
  { month: 'Jan', revenue: 148000, expenses: 88000,  profit: 60000 },
  { month: 'Feb', revenue: 210000, expenses: 112000, profit: 98000 },
  { month: 'Mar', revenue: 268000, expenses: 130000, profit: 138000 },
  { month: 'Apr', revenue: 324000, expenses: 145000, profit: 179000 },
];

const GATEWAY_STATS = [
  { gateway: 'UPI (Razorpay)',    successRate: 97.2, volume: 1240000, failed: 35, settled: 1200000 },
  { gateway: 'Net Banking',       successRate: 94.8, volume: 880000,  failed: 46, settled: 835000 },
  { gateway: 'Credit/Debit Card', successRate: 91.5, volume: 320000,  failed: 27, settled: 293000 },
  { gateway: 'Manual/Offline',    successRate: 100,  volume: 45000,   failed: 0,  settled: 45000 },
];

const CATEGORY_INCOME = [
  { name: 'Harvest Deals',      value: 2116800, color: '#10b981' },
  { name: 'Commissions',        value: 105840,  color: '#f59e0b' },
  { name: 'Product Orders',     value: 18500,   color: '#3b82f6' },
  { name: 'Farmer Subs',        value: 1997,    color: '#8b5cf6' },
  { name: 'Provider Subs',      value: 999,     color: '#ec4899' },
];

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#18181b', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '11px' },
  itemStyle: { fontSize: '11px' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusBadge = ({ s }: { s: string }) => {
  const c =
    ['completed','APPROVED','PAID','PROCESSED','CLEARED','Ready'].includes(s)
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : ['pending','PENDING','REQUESTED','INVESTIGATING','OPEN'].includes(s)
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : ['cancelled','REJECTED','BLOCKED','HELD'].includes(s)
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c}`}>{s}</span>;
};

const SevBadge = ({ s }: { s: 'LOW' | 'MEDIUM' | 'HIGH' }) => {
  const c = s === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : s === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';
  return <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c}`}>{s}</span>;
};

const KPI = ({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color?: string; icon: React.FC<any> }) => (
  <div className="glass-panel p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${(color ?? 'text-emerald-400').replace('text-','bg-').replace('400','500/10')}`}><Icon size={18} className={color ?? 'text-emerald-400'} /></div>
    </div>
    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{label}</p>
    <h3 className={`text-2xl font-display font-bold ${color ?? 'text-zinc-100'}`}>{value}</h3>
    {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Finance = () => {
  const [tab, setTab] = useState<FinTab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalFarmerPayouts: 0, totalProfit: 0, commissions: 0, walletBalance: 0 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [wallets, setWallets] = useState<WalletEntry[]>(WALLETS);
  const [payouts, setPayouts] = useState<Payout[]>(PAYOUTS);
  const [refunds, setRefunds] = useState<Refund[]>(REFUNDS);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>(FRAUD_FLAGS);
  const [liveExpenses, setLiveExpenses] = useState<LiveExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setStats(storageService.getFinanceStats());
    fetchExpenses().then(setLiveExpenses).catch(console.error).finally(() => setExpensesLoading(false));
  }, []);

  const totalExpenses = EXPENSES.reduce((s, e) => s + e.amount, 0);
  const totalIncoming = INCOMING.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalRefunded = REFUNDS.filter(r => r.status === 'PROCESSED').reduce((s, r) => s + r.amount, 0);
  const netProfit = MONTHLY_TREND[MONTHLY_TREND.length-1].profit;

  const tabs: { id: FinTab; label: string; icon: React.FC<any> }[] = [
    { id: 'dashboard',   label: 'Dashboard',    icon: BarChart3 },
    { id: 'incoming',    label: 'Incoming',     icon: ArrowUpRight },
    { id: 'outgoing',    label: 'Payouts',      icon: ArrowDownRight },
    { id: 'status',      label: 'Tx Status',    icon: Activity },
    { id: 'commission',  label: 'Commission',   icon: DollarSign },
    { id: 'invoices',    label: 'Invoices',     icon: FileText },
    { id: 'refunds',     label: 'Refunds',      icon: RefreshCw },
    { id: 'wallet',      label: 'Wallets',      icon: Wallet },
    { id: 'gateway',     label: 'Gateway',      icon: Globe },
    { id: 'settlement',  label: 'Settlement',   icon: CheckCircle2 },
    { id: 'expenses',    label: 'Expenses',     icon: TrendingDown },
    { id: 'reports',     label: 'Reports',      icon: TrendingUp },
    { id: 'fraud',       label: 'Fraud',        icon: Shield },
    { id: 'tax',         label: 'Tax',          icon: FileText },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Finance & Payments</h1>
          <p className="text-zinc-400">Complete financial control — payments, payouts, commissions, settlements, and fraud monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2 text-sm"><FileText size={15} />Generate Invoice</button>
          <button className="btn-primary flex items-center gap-2 text-sm"><Download size={15} />Export Report</button>
        </div>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Revenue',  value: `₹${(totalIncoming/100000).toFixed(2)}L`,  color: 'text-emerald-400', sub: 'This month' },
          { label: 'Net Profit',     value: `₹${(netProfit/1000).toFixed(0)}K`,         color: 'text-blue-400',    sub: 'Apr 2026' },
          { label: 'Pending Pmt',    value: `₹${INCOMING.filter(t=>t.status==='pending').reduce((s,t)=>s+t.amount,0).toLocaleString()}`, color: 'text-amber-400', sub: 'To collect' },
          { label: 'Refunded',       value: `₹${totalRefunded.toLocaleString()}`,        color: 'text-red-400',     sub: 'Issued this month' },
          { label: 'Commissions',    value: '₹1,05,840',                                  color: 'text-purple-400',  sub: 'Earned' },
          { label: 'Fraud Alerts',   value: `${FRAUD_FLAGS.filter(f=>f.status==='OPEN'||f.status==='INVESTIGATING').length}`, color: 'text-red-400', sub: 'Open cases' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="glass-panel p-4">
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
            <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>
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

      {/* ═══ DASHBOARD ════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <KPI label="Total Revenue"  value={`₹${totalIncoming.toLocaleString()}`}                                                              sub="+12.5% vs last month" color="text-emerald-400" icon={DollarSign} />
            <KPI label="Total Payouts"  value={`₹${(PAYOUTS.filter(p=>p.status==='PAID').reduce((s,p)=>s+p.amount,0)/100000).toFixed(2)}L`}      sub="Farmers + Providers"  color="text-red-400"     icon={ArrowDownRight} />
            <KPI label="Commissions"    value="₹1,05,840"                                                                                          sub="5% harvest deals"     color="text-amber-400"   icon={Zap} />
            <KPI label="Net Profit"     value={`₹${netProfit.toLocaleString()}`}                                                                  sub="Revenue − Expenses"   color="text-blue-400"    icon={TrendingUp} />
            <KPI label="Wallet Balance" value={`₹${wallets.reduce((s,w)=>s+w.balance,0).toLocaleString()}`}                                       sub="Across all users"     color="text-purple-400"  icon={Wallet} />
          </div>

          {/* Revenue vs Expenses chart */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" />Monthly Revenue vs Expenses vs Profit</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_TREND} barSize={24} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip {...CHART_STYLE} formatter={(v: any) => [`₹${v.toLocaleString()}`, '']} />
                  <Bar dataKey="revenue"  fill="#10b981" fillOpacity={0.85} radius={[4,4,0,0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" fillOpacity={0.7}  radius={[4,4,0,0]} name="Expenses" />
                  <Bar dataKey="profit"   fill="#3b82f6" fillOpacity={0.85} radius={[4,4,0,0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-3 justify-center">
              {[['Revenue','#10b981'],['Expenses','#ef4444'],['Profit','#3b82f6']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: c }} /><span className="text-xs text-zinc-400">{l}</span></div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Income by Source</h3>
            <div className="space-y-3">
              {CATEGORY_INCOME.map(cat => {
                const total = CATEGORY_INCOME.reduce((s, c) => s + c.value, 0);
                const pct = (cat.value / total) * 100;
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <p className="text-sm w-36">{cat.name}</p>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} /></div>
                    <p className="font-mono font-bold text-sm w-28 text-right">₹{cat.value.toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600 w-10 text-right">{pct.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Recent Transactions</h3>
              <button onClick={() => setTab('incoming')} className="text-xs text-emerald-400 hover:underline">View All →</button>
            </div>
            <div className="divide-y divide-white/5">
              {INCOMING.slice(0,5).map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                  <div><p className="font-bold text-sm">{t.id}</p><p className="text-xs text-zinc-500">{t.source} · {t.date}</p></div>
                  <div className="flex items-center gap-3">
                    <StatusBadge s={t.status} />
                    <p className={`font-mono font-bold ${t.status === 'completed' ? 'text-emerald-400' : t.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                      {t.status === 'cancelled' ? '—' : `+₹${t.amount.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INCOMING ════════════════════════════════════════════════════════ */}
      {tab === 'incoming' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48"><Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" /><input className="input-field w-full pl-11 text-sm" placeholder="Search by ID, user, order..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={13} className="text-zinc-500" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Sources</option>
                {['Subscription','Harvest Deal','Product Order','Harvest Commission','Provider Sub'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-400" />Incoming Payments</h3>
              <span className="text-xs text-zinc-500">Collected: ₹{totalIncoming.toLocaleString()}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Payment ID','From','Source','Amount','Gateway','Status','Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {INCOMING.filter(t =>
                    (filterType === 'all' || t.source === filterType) &&
                    (search === '' || t.id.toLowerCase().includes(search.toLowerCase()) || t.fromId.toLowerCase().includes(search.toLowerCase()))
                  ).map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-emerald-400/80">{t.id}</td>
                      <td className="px-5 py-4 font-bold text-sm">{t.fromId}</td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-400">{t.source}</span></td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">+₹{t.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{t.gateway}</td>
                      <td className="px-5 py-4"><StatusBadge s={t.status} /></td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ OUTGOING / PAYOUTS ═══════════════════════════════════════════════ */}
      {tab === 'outgoing' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['PAID','APPROVED','PENDING','HELD'] as const).map(s => {
              const items = payouts.filter(p => p.status === s);
              const color = s === 'PAID' ? 'text-emerald-400' : s === 'APPROVED' ? 'text-blue-400' : s === 'PENDING' ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={s} className="glass-panel p-5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{s}</p>
                  <p className={`text-2xl font-display font-bold ${color}`}>{items.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">₹{items.reduce((sum,p)=>sum+p.amount,0).toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold flex items-center gap-2"><ArrowDownRight size={14} className="text-red-400" />Payout Management</h3></div>
            <div className="divide-y divide-white/5">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${p.role === 'farmer' ? 'bg-emerald-500/10 text-emerald-400' : p.role === 'provider' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>{p.role[0].toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.recipient}</p>
                    <p className="text-xs text-zinc-500">{p.reason} · {p.method} · {p.requestedAt}</p>
                  </div>
                  <p className="font-mono font-bold text-red-400 shrink-0">−₹{p.amount.toLocaleString()}</p>
                  <StatusBadge s={p.status} />
                  <div className="flex gap-2">
                    {p.status === 'PENDING'  && <button onClick={() => setPayouts(prev => prev.map(x => x.id===p.id?{...x,status:'APPROVED'}:x))} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Approve</button>}
                    {p.status === 'APPROVED' && <button onClick={() => setPayouts(prev => prev.map(x => x.id===p.id?{...x,status:'PAID'}:x))}     className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Mark Paid</button>}
                    {p.status === 'HELD'     && <button onClick={() => setPayouts(prev => prev.map(x => x.id===p.id?{...x,status:'APPROVED'}:x))} className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all">Release</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TX STATUS ════════════════════════════════════════════════════════ */}
      {tab === 'status' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">All Transaction Status</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Tx ID','From → To','Type','Amount','Status','Date','Action'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-emerald-400/80">{t.id}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{t.fromId} → {t.toId}</td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-400">{t.type}</span></td>
                      <td className="px-5 py-4 font-mono font-bold">₹{t.amount.toLocaleString()}</td>
                      <td className="px-5 py-4"><StatusBadge s={t.status} /></td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{t.date}</td>
                      <td className="px-5 py-4">
                        {t.status === 'pending'   && <button className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Verify</button>}
                        {t.status === 'cancelled' && <button className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Retry</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMMISSION ═══════════════════════════════════════════════════════ */}
      {tab === 'commission' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Harvest Deal Commission', rate: 5,  earned: 105840, example: '5% of ₹21.17L deal = ₹1.06L', color: 'emerald' },
              { label: 'Product Sales Margin',    rate: 12, earned: 2220,   example: '12% on ₹18,500 orders',       color: 'blue' },
              { label: 'Provider Service Comm.',  rate: 8,  earned: 3600,   example: '8% on provider services',     color: 'purple' },
            ].map(({ label, rate, earned, example, color }) => (
              <div key={label} className={`glass-panel p-6 border border-${color}-500/10`}>
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p>
                <div className="flex items-end gap-2 mb-3">
                  <p className={`text-4xl font-display font-bold text-${color}-400`}>{rate}%</p>
                  <p className="text-xs text-zinc-500 mb-1">per transaction</p>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3"><div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${rate * 5}%` }} /></div>
                <p className={`text-xl font-bold text-${color}-400`}>₹{earned.toLocaleString()} earned</p>
                <p className="text-[10px] text-zinc-600 mt-1">{example}</p>
                <div className="flex gap-2 mt-4">
                  <input type="number" defaultValue={rate} className="input-field w-20 py-1.5 text-sm" />
                  <button className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Update %</button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Commission Ledger</h3></div>
            <div className="divide-y divide-white/5">
              {INCOMING.filter(t => t.type === 'COMMISSION').map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div><p className="font-bold text-sm">{t.id}</p><p className="text-xs text-zinc-500">{t.source} · {t.date}</p></div>
                  <p className="font-mono font-bold text-amber-400">+₹{t.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INVOICES ════════════════════════════════════════════════════════ */}
      {tab === 'invoices' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-blue-500/10 flex items-start gap-3">
            <FileText size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-blue-400">Auto-Invoice System:</span> Invoices auto-generated on payment completion. GST @ 18% on products/subscriptions; 0% on agricultural harvest deals. Download or share via PDF.</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Invoice Register</h3>
              <button className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><Plus size={13} />Generate Invoice</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Invoice #','Party','Description','Base Amount','GST','Total','Date','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {INCOMING.filter(t => t.status === 'completed').map((t, i) => {
                    const gstAmt = ['Subscription','Product Order','Provider Sub'].includes(t.source) ? Math.round(t.amount * 0.18 / 1.18) : 0;
                    const base = t.amount - gstAmt;
                    return (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-blue-400">INV-{String(i+1).padStart(3,'0')}</td>
                        <td className="px-5 py-4 font-bold text-sm">{t.fromId}</td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{t.source}</td>
                        <td className="px-5 py-4 font-mono">₹{base.toLocaleString()}</td>
                        <td className="px-5 py-4 font-mono text-amber-400">{gstAmt > 0 ? `+₹${gstAmt.toLocaleString()}` : '—'}</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">₹{t.amount.toLocaleString()}</td>
                        <td className="px-5 py-4 text-xs text-zinc-500">{t.date}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            <button className="text-xs font-bold px-2.5 py-1 bg-white/5 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1"><Eye size={11} />View</button>
                            <button className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg flex items-center gap-1"><Download size={11} />PDF</button>
                          </div>
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

      {/* ═══ REFUNDS ══════════════════════════════════════════════════════════ */}
      {tab === 'refunds' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['REQUESTED','APPROVED','PROCESSED','REJECTED'] as const).map(s => {
              const items = refunds.filter(r => r.status === s);
              const color = s === 'PROCESSED' ? 'text-emerald-400' : s === 'APPROVED' ? 'text-blue-400' : s === 'REQUESTED' ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={s} className="glass-panel p-5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{s}</p>
                  <p className={`text-3xl font-display font-bold ${color}`}>{items.length}</p>
                  <p className="text-xs text-zinc-500 mt-1">₹{items.reduce((s,r)=>s+r.amount,0).toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Refund Requests</h3></div>
            <div className="divide-y divide-white/5">
              {refunds.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm">{r.user}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-500">{r.type}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{r.orderId} · {r.reason} · {r.requestedAt}</p>
                  </div>
                  <p className="font-mono font-bold text-red-400 shrink-0">₹{r.amount.toLocaleString()}</p>
                  <StatusBadge s={r.status} />
                  <div className="flex gap-2">
                    {r.status === 'REQUESTED' && <>
                      <button onClick={() => setRefunds(prev => prev.map(x => x.id===r.id?{...x,status:'APPROVED'}:x))} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Approve</button>
                      <button onClick={() => setRefunds(prev => prev.map(x => x.id===r.id?{...x,status:'REJECTED'}:x))} className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">Reject</button>
                    </>}
                    {r.status === 'APPROVED' && <button onClick={() => setRefunds(prev => prev.map(x => x.id===r.id?{...x,status:'PROCESSED'}:x))} className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Process</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WALLET ══════════════════════════════════════════════════════════ */}
      {tab === 'wallet' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-purple-500/10 flex items-start gap-3">
            <Wallet size={16} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-purple-400">Internal Wallet:</span> Users can store balance for fast checkout, advance payments, and refund credit. Admin can top-up, deduct, or freeze wallets.</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Wallet Balances</h3>
              <p className="text-sm text-emerald-400 font-bold">Total: ₹{wallets.reduce((s,w)=>s+w.balance,0).toLocaleString()}</p>
            </div>
            <div className="divide-y divide-white/5">
              {wallets.map(w => (
                <div key={w.userId} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold shrink-0">{w.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{w.name}</p>
                    <p className="text-xs text-zinc-500">{w.userId} · {w.role} · Last topup: {w.lastTopup}</p>
                  </div>
                  <p className="font-mono font-bold text-lg text-purple-400 shrink-0">₹{w.balance.toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setWallets(prev => prev.map(x => x.userId===w.userId?{...x,balance:x.balance+500}:x))} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">+₹500</button>
                    <button onClick={() => setWallets(prev => prev.map(x => x.userId===w.userId?{...x,balance:Math.max(0,x.balance-500)}:x))} className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">−₹500</button>
                    <button className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Ban size={11} />Freeze</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ GATEWAY ══════════════════════════════════════════════════════════ */}
      {tab === 'gateway' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {GATEWAY_STATS.map(g => (
              <div key={g.gateway} className={`glass-panel p-5 border ${g.successRate >= 96 ? 'border-emerald-500/10' : g.successRate >= 92 ? 'border-amber-500/10' : 'border-red-500/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{g.gateway}</h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${g.successRate >= 96 ? 'bg-emerald-500/10 text-emerald-400' : g.successRate >= 92 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{g.successRate}% success</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.successRate}%` }} /></div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-[9px] text-zinc-600 uppercase font-bold">Volume</p><p className="font-mono font-bold text-sm">₹{(g.volume/100000).toFixed(2)}L</p></div>
                  <div><p className="text-[9px] text-zinc-600 uppercase font-bold">Failed</p><p className="font-mono font-bold text-sm text-red-400">{g.failed}</p></div>
                  <div><p className="text-[9px] text-zinc-600 uppercase font-bold">Settled</p><p className="font-mono font-bold text-sm text-emerald-400">₹{(g.settled/100000).toFixed(2)}L</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SETTLEMENT ══════════════════════════════════════════════════════ */}
      {tab === 'settlement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { cycle: 'Instant',  desc: 'Released within minutes of payment confirmation.',          badge: 'Premium',  color: 'emerald' },
              { cycle: 'Daily',    desc: 'Batch settled at end of each business day at 6 PM.',        badge: 'Standard', color: 'blue' },
              { cycle: 'Weekly',   desc: 'Weekly batch on every Monday covering previous 7 days.',    badge: 'Economy',  color: 'amber' },
            ].map(({ cycle, desc, badge, color }) => (
              <div key={cycle} className={`glass-panel p-6 border border-${color}-500/10`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xl font-display font-bold text-${color}-400`}>{cycle}</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400`}>{badge}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">{desc}</p>
                <div className="flex gap-2">
                  <button className={`text-xs font-bold px-3 py-1.5 bg-${color}-500/10 text-${color}-400 hover:bg-${color}-500 hover:text-white rounded-lg transition-all`}>Set Default</button>
                  <button className="text-xs font-bold px-3 py-1.5 bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all">Trigger Now</button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Pending Settlements</h3></div>
            <div className="divide-y divide-white/5">
              {payouts.filter(p => p.status === 'APPROVED').map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4">
                  <div><p className="font-bold">{p.recipient}</p><p className="text-xs text-zinc-500">{p.reason}</p></div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-red-400">₹{p.amount.toLocaleString()}</p>
                    <button onClick={() => setPayouts(prev => prev.map(x => x.id===p.id?{...x,status:'PAID'}:x))} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-2"><CheckCircle2 size={12} />Release</button>
                  </div>
                </div>
              ))}
              {payouts.filter(p => p.status === 'APPROVED').length === 0 && <p className="p-6 text-center text-zinc-600 text-sm">No pending settlements.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXPENSES ════════════════════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(
              EXPENSES.reduce((acc, e) => { acc[e.category] = (acc[e.category]||0) + e.amount; return acc; }, {} as Record<string,number>)
            ).slice(0,3).map(([cat, amt]) => (
              <div key={cat} className="glass-panel p-5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{cat}</p>
                <p className="text-2xl font-display font-bold text-red-400">₹{amt.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><TrendingDown size={14} className="text-red-400" />Farmer Expenses — Live from DB <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">LIVE</span></h3>
              <span className="text-xs text-zinc-500">{expensesLoading ? 'Loading…' : `${liveExpenses.length} records`}</span>
            </div>
            <div className="overflow-x-auto">
              {expensesLoading ? (
                <div className="p-8 text-center text-zinc-500">Loading farmer expenses…</div>
              ) : liveExpenses.length === 0 ? (
                <div className="p-8 text-center text-zinc-600">No farmer expenses recorded yet.</div>
              ) : (
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/5 bg-white/5">
                    {['Farmer','Phone','Pond','Type','Amount','Note','Date'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {liveExpenses.map(e => (
                      <tr key={e._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-bold text-sm">{e.farmer?.name ?? '—'}</td>
                        <td className="px-5 py-4 text-xs text-zinc-500">{e.farmer?.phoneNumber ?? '—'}</td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{e.pond?.name ?? '—'}</td>
                        <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-400 capitalize">{e.type}</span></td>
                        <td className="px-5 py-4 font-mono font-bold text-red-400">₹{e.amount.toLocaleString()}</td>
                        <td className="px-5 py-4 text-xs text-zinc-500">{e.note ?? '—'}</td>
                        <td className="px-5 py-4 text-xs text-zinc-500">{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><TrendingDown size={14} className="text-red-400" />Expense Register — Total: ₹{totalExpenses.toLocaleString()}</h3>
              <button className="text-xs font-bold px-4 py-2 bg-white/5 text-zinc-400 hover:text-white rounded-xl flex items-center gap-2 transition-all"><Plus size={13} />Add Expense</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['ID','Category','Description','Vendor','Amount','Date'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {EXPENSES.map(e => (
                    <tr key={e.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-zinc-600">{e.id}</td>
                      <td className="px-5 py-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white/5 border-white/10 text-zinc-400">{e.category}</span></td>
                      <td className="px-5 py-4 text-sm">{e.description}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{e.vendor}</td>
                      <td className="px-5 py-4 font-mono font-bold text-red-400">₹{e.amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">{e.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REPORTS & ANALYTICS ══════════════════════════════════════════════ */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Revenue',  value: `₹${MONTHLY_TREND[5].revenue.toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Monthly Expenses', value: `₹${MONTHLY_TREND[5].expenses.toLocaleString()}`, color: 'text-red-400' },
              { label: 'Net Profit',       value: `₹${netProfit.toLocaleString()}`, color: 'text-blue-400' },
              { label: 'Profit Margin',    value: `${Math.round((netProfit/MONTHLY_TREND[5].revenue)*100)}%`, color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p><p className={`text-2xl font-display font-bold ${color}`}>{value}</p></div>
            ))}
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-5">6-Month Financial Trend</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} dx={-4} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip {...CHART_STYLE} formatter={(v: any) => [`₹${v.toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="revenue"  stroke="#10b981" strokeWidth={2.5} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2}   dot={false} name="Expenses" strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="profit"   stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold">Financial Summary Report (Apr 2026)</h3>
              <button className="btn-primary flex items-center gap-2 text-sm"><Download size={14} />Export PDF</button>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { metric: 'Gross Revenue',         value: `₹${MONTHLY_TREND[5].revenue.toLocaleString()}`, commentary: '+22% vs March' },
                { metric: 'Total Expenses',         value: `₹${MONTHLY_TREND[5].expenses.toLocaleString()}`, commentary: '+11% vs March' },
                { metric: 'Net Profit',             value: `₹${netProfit.toLocaleString()}`, commentary: `${Math.round((netProfit/MONTHLY_TREND[5].revenue)*100)}% margin` },
                { metric: 'Harvest Deal Revenue',   value: '₹21,16,800', commentary: '1 major deal (HRV-001)' },
                { metric: 'Commission Earned',      value: '₹1,05,840', commentary: '5% on harvest deal' },
                { metric: 'Subscription Revenue',   value: '₹2,996', commentary: 'Farmer + Provider subs' },
                { metric: 'GST Collected',          value: '₹3,330', commentary: 'Products & subscriptions @ 18%' },
                { metric: 'Total Refunds Issued',   value: `₹${totalRefunded.toLocaleString()}`, commentary: '2 processed refunds' },
                { metric: 'Pending Collections',    value: `₹${INCOMING.filter(t=>t.status==='pending').reduce((s,t)=>s+t.amount,0).toLocaleString()}`, commentary: 'UPI pending' },
              ].map(({ metric, value, commentary }) => (
                <div key={metric} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm text-zinc-400">{metric}</p>
                  <div className="text-right"><p className="font-bold font-mono">{value}</p><p className="text-[10px] text-zinc-600">{commentary}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FRAUD ════════════════════════════════════════════════════════════ */}
      {tab === 'fraud' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-red-500/10 flex items-start gap-3">
            <Shield size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-red-400">Fraud & Risk Monitoring:</span> System flags suspicious transactions — repeated failures, duplicate fingerprints, abnormal amounts, and immediate refund requests. Admin reviews and blocks if needed.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(['OPEN','INVESTIGATING','CLEARED'] as const).map(s => {
              const cnt = fraudFlags.filter(f => f.status === s).length;
              const color = s === 'OPEN' ? 'text-red-400' : s === 'INVESTIGATING' ? 'text-amber-400' : 'text-emerald-400';
              return <div key={s} className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{s}</p><p className={`text-3xl font-display font-bold ${color}`}>{cnt}</p></div>;
            })}
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5"><h3 className="font-bold">Fraud Flag Registry</h3></div>
            <div className="divide-y divide-white/5">
              {fraudFlags.map(f => (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5"><p className="font-bold text-sm">{f.user}</p><SevBadge s={f.severity} /><StatusBadge s={f.status} /></div>
                    <p className="text-xs text-zinc-500">{f.txId} · {f.reason} · {f.flaggedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    {(f.status === 'OPEN' || f.status === 'INVESTIGATING') && <>
                      <button onClick={() => setFraudFlags(prev => prev.map(x => x.id===f.id?{...x,status:'INVESTIGATING'}:x))} className="text-xs font-bold px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg transition-all">Investigate</button>
                      <button onClick={() => setFraudFlags(prev => prev.map(x => x.id===f.id?{...x,status:'CLEARED'}:x))}       className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Clear</button>
                      <button onClick={() => setFraudFlags(prev => prev.map(x => x.id===f.id?{...x,status:'BLOCKED'}:x))}       className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Ban size={11} />Block</button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-bold mb-3">Auto-Detection Rules</h3>
            <div className="space-y-2">
              {[
                '3+ payment failures in 1 hour → flag MEDIUM',
                'Refund request within 2h of confirmed delivery → flag HIGH',
                'Duplicate transaction fingerprint within 5 min → flag LOW',
                'Amount > ₹5L from unverified user → flag HIGH',
                'IP/device location mismatch → flag MEDIUM',
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 text-xs text-zinc-400"><Shield size={11} className="text-red-400 shrink-0" />{rule}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAX & COMPLIANCE ════════════════════════════════════════════════ */}
      {tab === 'tax' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-amber-500/10 flex items-start gap-3">
            <FileText size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-amber-400">Tax & Compliance:</span> GST (18%) on products and subscriptions. Harvest deals are agricultural produce — 0% GST. TDS @ 2% (Section 194C) on provider payments above ₹30,000.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'GST (Products)',     value: '₹2,220',   sub: '18% on ₹18,500',   color: 'text-amber-400' },
              { label: 'GST (Subs)',          value: '₹1,079',   sub: '18% on ₹5,994',    color: 'text-amber-400' },
              { label: 'TDS (Providers)',     value: '₹4,500',   sub: '2% on ₹2.25L',     color: 'text-red-400' },
              { label: 'GST (Agricultural)', value: '₹0',       sub: 'Exempt — 0%',       color: 'text-emerald-400' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="glass-panel p-5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{label}</p>
                <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
                <p className="text-xs text-zinc-600 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Tax Reports & Filing Status</h3>
            <div className="space-y-3">
              {[
                { name: 'GSTR-1 (Apr 2026)',     status: 'Ready',   date: '2026-05-11', desc: 'Outward supplies — products & subscriptions' },
                { name: 'GSTR-3B (Apr 2026)',    status: 'Pending', date: '2026-05-20', desc: 'Monthly summary return' },
                { name: 'TDS Certificate Q4',    status: 'Ready',   date: '2026-04-30', desc: 'Form 16A for providers @ 2% (Section 194C)' },
                { name: 'Annual P&L Statement',  status: 'Pending', date: '2026-07-31', desc: 'Full year financial summary' },
              ].map(({ name, status, date, desc }) => (
                <div key={name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div><p className="font-bold text-sm">{name}</p><p className="text-xs text-zinc-500">{desc} · Due: {date}</p></div>
                  <div className="flex items-center gap-3">
                    <StatusBadge s={status === 'Ready' ? 'completed' : 'pending'} />
                    {status === 'Ready' && <button className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Download size={11} />Export</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
