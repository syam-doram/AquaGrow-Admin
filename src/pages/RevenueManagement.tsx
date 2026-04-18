import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, BarChart3,
  ArrowUpRight, ArrowDownRight, Zap, Users, Star, Cpu, Package,
  Truck, AlertTriangle, CheckCircle2, RefreshCw, PieChart,
  Activity, Target, Calendar, CreditCard, Building2, Layers,
  ChevronRight, X, Plus, Minus
} from 'lucide-react';
import { motion } from 'motion/react';
import { storageService } from '../services/storageService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'sources' | 'sales' | 'profit' | 'subscriptions' | 'providers'
         | 'iot' | 'expenses' | 'netprofit' | 'payouts' | 'refunds'
         | 'analytics' | 'forecast';

interface ExpenseEntry { id: string; label: string; category: string; amount: number; date: string; }
interface PayoutEntry { id: string; recipient: string; type: string; amount: number; status: 'PAID' | 'PENDING' | 'SCHEDULED'; date: string; }

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_EXPENSES: ExpenseEntry[] = [
  { id: 'EXP-001', label: 'AquaGrow Pro Feed 2mm — FeedMaster India', category: 'Product Cost', amount: 112000, date: '2026-04-01' },
  { id: 'EXP-002', label: 'WhiteSpot Shield Medicine — BioMed Aqua', category: 'Product Cost', amount: 65000, date: '2026-04-03' },
  { id: 'EXP-003', label: 'OxyBoost Aerator Stock — SmartAqua', category: 'Product Cost', amount: 73000, date: '2026-04-05' },
  { id: 'EXP-004', label: 'Zone A–B Delivery Logistics', category: 'Delivery', amount: 18500, date: '2026-04-10' },
  { id: 'EXP-005', label: 'Razorpay Gateway Charges (2%)', category: 'Platform', amount: 5200, date: '2026-04-15' },
  { id: 'EXP-006', label: 'Marketing — Google Ads Aqua Season', category: 'Marketing', amount: 22000, date: '2026-04-08' },
  { id: 'EXP-007', label: 'Operations — Admin Staff Salaries', category: 'Operations', amount: 85000, date: '2026-04-01' },
  { id: 'EXP-008', label: 'IoT Sensor Maintenance', category: 'Operations', amount: 9500, date: '2026-04-12' },
];

const SEED_PAYOUTS: PayoutEntry[] = [
  { id: 'PAY-001', recipient: 'FeedMaster India', type: 'Supplier', amount: 112000, status: 'PAID', date: '2026-04-05' },
  { id: 'PAY-002', recipient: 'BioMed Aqua', type: 'Supplier', amount: 65000, status: 'PAID', date: '2026-04-07' },
  { id: 'PAY-003', recipient: 'Green Valley (P-201)', type: 'Provider Commission', amount: 8400, status: 'PAID', date: '2026-04-10' },
  { id: 'PAY-004', recipient: 'Midwest Harvest (P-204)', type: 'Provider Commission', amount: 12800, status: 'PENDING', date: '2026-04-20' },
  { id: 'PAY-005', recipient: 'EcoHarvest (P-203)', type: 'Provider Commission', amount: 6200, status: 'SCHEDULED', date: '2026-04-25' },
  { id: 'PAY-006', recipient: 'Ravi Technician', type: 'Technician', amount: 4500, status: 'PENDING', date: '2026-04-22' },
];

const MONTHLY_DATA = [
  { month: 'Nov', sales: 185000, subscriptions: 18000, commission: 9000, installation: 12000, expenses: 172000 },
  { month: 'Dec', sales: 210000, subscriptions: 19500, commission: 10500, installation: 15000, expenses: 195000 },
  { month: 'Jan', sales: 195000, subscriptions: 21000, commission: 8000, installation: 11000, expenses: 183000 },
  { month: 'Feb', sales: 225000, subscriptions: 22500, commission: 12000, installation: 18000, expenses: 205000 },
  { month: 'Mar', sales: 248000, subscriptions: 24000, commission: 14000, installation: 21000, expenses: 219000 },
  { month: 'Apr', sales: 272000, subscriptions: 25500, commission: 16000, installation: 24000, expenses: 237000 },
];

// ─── Small Components ─────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, icon: Icon, trend }: {
  label: string; value: string | number; sub?: string;
  color?: string; icon: React.FC<any>; trend?: number;
}) => (
  <div className="glass-panel p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{label}</p>
      <div className={`p-2 rounded-xl ${color ?? 'bg-emerald-500/10 text-emerald-400'}`}><Icon size={16} /></div>
    </div>
    <p className={`text-3xl font-display font-bold ${color ? color.split(' ')[1] : 'text-emerald-400'}`}>{value}</p>
    {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(trend).toFixed(1)}% vs last month
      </div>
    )}
  </div>
);

const MiniBar = ({ value, max, color = 'bg-emerald-500' }: { value: number; max: number; color?: string }) => (
  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-1">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
);

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

// ─── Main Component ───────────────────────────────────────────────────────────
const RevenueManagement = () => {
  const [tab, setTab] = useState<Tab>('sources');
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(SEED_EXPENSES);
  const [payouts, setPayouts] = useState<PayoutEntry[]>(SEED_PAYOUTS);
  const [addExpModal, setAddExpModal] = useState(false);
  const [newExp, setNewExp] = useState({ label: '', category: 'Product Cost', amount: 0 });

  // ── Load Real Data ──────────────────────────────────────────────────────────
  const shopOrders = storageService.getShopOrders();
  const products = storageService.getProducts();
  const providers = storageService.getProviders();
  const farmers = storageService.getFarmers();

  // ── Revenue Calculations ────────────────────────────────────────────────────
  const revenue = useMemo(() => {
    const paidOrders = shopOrders.filter(o => o.paymentStatus === 'PAID');
    const productSales = paidOrders.reduce((s, o) => s + o.finalAmount, 0);
    const deliveryRevenue = shopOrders.reduce((s, o) => s + o.deliveryCharge, 0);

    // Subscription MRR — simulated
    const farmerMRR = 100 * 299; // 100 farmers × ₹299
    const providerMRR = providers.filter(p => p.subscriptionModel === 'premium').length * 999
      + providers.filter(p => p.subscriptionModel === 'verified').length * 1999;
    const subscriptionRev = farmerMRR + providerMRR;

    // Provider commission
    const commissionRev = providers
      .filter(p => p.status === 'verified')
      .reduce((s, p) => s + (p.commissionRate ?? 5) * 800, 0); // assumed ₹800/service avg

    // IoT & Device
    const iotProducts = products.filter(p => p.category === 'IoT Device' || p.category === 'Aerator');
    const iotSales = iotProducts.reduce((s, p) => s + p.sellingPrice * p.soldCount, 0);
    const installCharge = 22 * 1500; // 22 devices × ₹1500 install fee
    const serviceCharge = 8 * 800;   // 8 service visits

    const total = productSales + subscriptionRev + commissionRev + deliveryRevenue;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = total - totalExpenses;

    return {
      productSales, deliveryRevenue, subscriptionRev, commissionRev,
      iotSales, installCharge, serviceCharge,
      farmerMRR, providerMRR,
      total, totalExpenses, netProfit,
      profitMargin: total > 0 ? (netProfit / total) * 100 : 0,
    };
  }, [shopOrders, products, providers, expenses]);

  // ── Expense Categories ──────────────────────────────────────────────────────
  const expCats = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => { cats[e.category] = (cats[e.category] ?? 0) + e.amount; });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // ── Product Profitability ───────────────────────────────────────────────────
  const productProfit = useMemo(() => products.map(p => {
    const costPct = p.category === 'Feed' ? 0.72 : p.category === 'Medicine' ? 0.65 : p.category === 'IoT Device' ? 0.68 : 0.70;
    const cost = p.sellingPrice * costPct;
    const profit = (p.sellingPrice - cost) * p.soldCount;
    const margin = ((p.sellingPrice - cost) / p.sellingPrice) * 100;
    return { ...p, cost, profit, margin };
  }).sort((a, b) => b.profit - a.profit), [products]);

  // ── Top Spending Farmers ────────────────────────────────────────────────────
  const farmerSpending = useMemo(() => farmers.map(f => {
    const orders = shopOrders.filter(o => o.farmerId === f.id);
    const spent = orders.reduce((s, o) => s + o.finalAmount, 0);
    return { ...f, spent, orderCount: orders.length };
  }).sort((a, b) => b.spent - a.spent), [farmers, shopOrders]);

  // ── Refunds & Losses ───────────────────────────────────────────────────────
  const refundOrders = shopOrders.filter(o => o.paymentStatus === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'CANCELLED');
  const totalRefunds = refundOrders.filter(o => o.paymentStatus === 'REFUNDED').reduce((s, o) => s + o.finalAmount, 0);
  const cancelledLoss = refundOrders.filter(o => o.status === 'CANCELLED').reduce((s, o) => s + o.finalAmount, 0);

  // ── Forecast ──────────────────────────────────────────────────────────────
  const FORECAST = [
    { month: 'May', rev: 295000, exp: 252000, note: 'Shrimp stocking season — high feed demand' },
    { month: 'Jun', rev: 318000, exp: 268000, note: 'Monsoon — medicine spike expected' },
    { month: 'Jul', rev: 280000, exp: 245000, note: 'Mid-cycle — stable, IoT subscriptions grow' },
    { month: 'Aug', rev: 340000, exp: 282000, note: 'Pre-harvest peak — aerator + logistics surge' },
    { month: 'Sep', rev: 365000, exp: 298000, note: 'Harvest season — max feed & logistics' },
  ];

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'sources', label: 'Revenue Sources', icon: PieChart },
    { id: 'sales', label: 'Sales Tracking', icon: ShoppingBag },
    { id: 'profit', label: 'Profit Calc', icon: DollarSign },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'providers', label: 'Provider Revenue', icon: Building2 },
    { id: 'iot', label: 'IoT Revenue', icon: Cpu },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'netprofit', label: 'Net Profit', icon: Activity },
    { id: 'payouts', label: 'Payouts', icon: Truck },
    { id: 'refunds', label: 'Refunds & Losses', icon: RefreshCw },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'forecast', label: 'Forecasting', icon: Target },
  ];

  const handleAddExpense = () => {
    if (!newExp.label || newExp.amount <= 0) return;
    setExpenses(prev => [...prev, {
      id: `EXP-${Date.now()}`, ...newExp, date: new Date().toISOString().split('T')[0],
    }]);
    setNewExp({ label: '', category: 'Product Cost', amount: 0 });
    setAddExpModal(false);
  };

  const handlePayoutStatus = (id: string, status: PayoutEntry['status']) => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Revenue Management</h1>
          <p className="text-zinc-400">Track income, expenses, profits, payouts, and financial forecasts.</p>
        </div>
        {tab === 'expenses' && (
          <button onClick={() => setAddExpModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} />Add Expense</button>
        )}
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Revenue', value: fmtK(revenue.total), color: 'bg-emerald-500/10 text-emerald-400', icon: TrendingUp, trend: 9.7 },
          { label: 'Net Profit', value: fmtK(revenue.netProfit), color: 'bg-radiant-sun/10 text-radiant-sun', icon: DollarSign, trend: 12.3 },
          { label: 'Profit Margin', value: `${revenue.profitMargin.toFixed(1)}%`, color: 'bg-blue-500/10 text-blue-400', icon: Activity, trend: 2.1 },
          { label: 'MRR', value: fmtK(revenue.subscriptionRev), color: 'bg-purple-500/10 text-purple-400', icon: CreditCard, trend: 5.4 },
          { label: 'Total Expenses', value: fmtK(revenue.totalExpenses), color: 'bg-red-500/10 text-red-400', icon: TrendingDown, trend: -3.2 },
          { label: 'Commission Rev', value: fmtK(revenue.commissionRev), color: 'bg-orange-500/10 text-orange-400', icon: Building2, trend: 18.0 },
        ].map(({ label, value, color, icon: Icon, trend }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}><Icon size={14} /></div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">{label}</p>
            <p className={`text-xl font-display font-bold ${color.split(' ')[1]}`}>{value}</p>
            <div className={`flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{Math.abs(trend)}%
            </div>
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

      {/* ═══ REVENUE SOURCES ══════════════════════════════════════════════════ */}
      {tab === 'sources' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><PieChart size={18} className="text-emerald-400" />Revenue Breakdown</h3>
            {[
              { label: 'Product Sales', value: revenue.productSales, color: 'bg-emerald-500', icon: ShoppingBag },
              { label: 'Farmer Subscriptions', value: revenue.farmerMRR, color: 'bg-purple-500', icon: Users },
              { label: 'Provider Subscriptions', value: revenue.providerMRR, color: 'bg-blue-500', icon: Building2 },
              { label: 'Provider Commission', value: revenue.commissionRev, color: 'bg-orange-500', icon: Star },
              { label: 'IoT Device Sales', value: revenue.iotSales, color: 'bg-cyan-500', icon: Cpu },
              { label: 'Installation Charges', value: revenue.installCharge, color: 'bg-violet-500', icon: Zap },
              { label: 'Delivery Revenue', value: revenue.deliveryRevenue, color: 'bg-radiant-sun', icon: Truck },
            ].map(({ label, value, color, icon: Icon }) => {
              const pct = revenue.total > 0 ? (value / revenue.total) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-4 mb-4">
                  <div className={`w-2.5 h-7 rounded-full ${color} shrink-0`} />
                  <Icon size={14} className="text-zinc-400 shrink-0" />
                  <p className="text-sm font-medium w-44 shrink-0">{label}</p>
                  <MiniBar value={value} max={revenue.total} color={color} />
                  <p className="text-sm font-mono font-bold w-24 text-right">{fmt(value)}</p>
                  <p className="text-xs text-zinc-500 w-10 text-right">{pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
          {/* Monthly trend */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-display font-bold mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" />6-Month Revenue Trend</h3>
            <div className="flex items-end gap-3 h-40 relative">
              <div className="absolute inset-x-0 border-t border-white/5 top-0" />
              <div className="absolute inset-x-0 border-t border-white/5 top-1/2" />
              {MONTHLY_DATA.map((m, i) => {
                const maxRev = Math.max(...MONTHLY_DATA.map(x => x.sales + x.subscriptions + x.commission + x.installation));
                const total = m.sales + m.subscriptions + m.commission + m.installation;
                const h = (total / maxRev) * 100;
                const expH = (m.expenses / maxRev) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                      <div className="flex-1 bg-emerald-500/80 rounded-t-sm" style={{ height: `${h}%` }} title={`Revenue: ${fmt(total)}`} />
                      <div className="flex-1 bg-red-400/60 rounded-t-sm" style={{ height: `${expH}%` }} title={`Expenses: ${fmt(m.expenses)}`} />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold">{m.month}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><p className="text-xs text-zinc-400">Revenue</p></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400/60" /><p className="text-xs text-zinc-400">Expenses</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SALES TRACKING ═══════════════════════════════════════════════════ */}
      {tab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="Total Orders Value" value={fmtK(revenue.productSales + revenue.deliveryRevenue)} icon={ShoppingBag} color="bg-emerald-500/10 text-emerald-400" trend={9.7} />
            <KpiCard label="This Month Sales" value={fmtK(272000)} icon={TrendingUp} color="bg-blue-500/10 text-blue-400" trend={9.7} />
            <KpiCard label="Avg Order Value" value={shopOrders.length ? fmt(Math.round(shopOrders.reduce((s, o) => s + o.finalAmount, 0) / shopOrders.length)) : '₹0'} icon={DollarSign} color="bg-purple-500/10 text-purple-400" />
            <KpiCard label="Total Orders" value={shopOrders.length} icon={Package} color="bg-orange-500/10 text-orange-400" trend={4.2} />
          </div>

          {/* Daily sales chart */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-display font-bold mb-5">Daily Sales — April 2026</h3>
            <div className="flex items-end gap-1 h-28">
              {Array.from({ length: 17 }, (_, i) => {
                const vals = [2800, 4500, 1200, 8900, 6700, 3400, 12000, 5600, 4200, 9800, 7300, 2100, 11500, 8800, 6400, 13200, 9400];
                const max = Math.max(...vals);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-emerald-500/70 hover:bg-emerald-500 rounded-t transition-all cursor-pointer" style={{ height: `${(vals[i] / max) * 100}px` }} title={`Day ${i + 1}: ${fmt(vals[i])}`} />
                    {(i + 1) % 4 === 0 && <p className="text-[9px] text-zinc-600">{i + 1}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category sales */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Category-wise Revenue vs Profit</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Category</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Items</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Revenue</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Est. Cost</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Gross Profit</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Margin</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {['Feed','Medicine','Aerator','IoT Device','Chemical','Equipment'].map(cat => {
                    const catProds = productProfit.filter(p => p.category === cat);
                    const rev = catProds.reduce((s, p) => s + p.sellingPrice * p.soldCount, 0);
                    const costPct = cat === 'Feed' ? 0.72 : cat === 'Medicine' ? 0.65 : cat === 'IoT Device' ? 0.68 : 0.70;
                    const cost = rev * costPct;
                    const profit = rev - cost;
                    const margin = rev > 0 ? (profit / rev) * 100 : 0;
                    return (
                      <tr key={cat} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-bold">{cat}</td>
                        <td className="px-5 py-4 text-zinc-400">{catProds.length}</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">{fmt(rev)}</td>
                        <td className="px-5 py-4 font-mono text-red-400">{fmt(cost)}</td>
                        <td className="px-5 py-4 font-mono font-bold">{fmt(profit)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <MiniBar value={margin} max={40} color={margin > 30 ? 'bg-emerald-500' : margin > 20 ? 'bg-radiant-sun' : 'bg-red-500'} />
                            <span className="text-xs font-bold text-zinc-300 w-10">{margin.toFixed(0)}%</span>
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

      {/* ═══ PROFIT CALCULATION ═══════════════════════════════════════════════ */}
      {tab === 'profit' && (
        <div className="space-y-6">
          {/* Formula Banner */}
          <div className="glass-panel p-5 border border-emerald-500/10">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-2 tracking-wider">Profit Formula</p>
            <div className="flex items-center gap-3 flex-wrap text-sm font-mono font-bold">
              <span className="text-emerald-400">Selling Price</span>
              <Minus size={14} className="text-zinc-500" />
              <span className="text-red-400">Cost Price</span>
              <Minus size={14} className="text-zinc-500" />
              <span className="text-orange-400">Expenses</span>
              <span className="text-zinc-600">=</span>
              <span className="text-radiant-sun text-lg">Net Profit</span>
            </div>
          </div>

          {/* Product profitability table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Product-wise Profit Breakdown</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Product</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Selling ₹</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Est. Cost ₹</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Gross / Unit</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Units Sold</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Total Profit</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Margin</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {productProfit.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-zinc-500">{p.category}</p></td>
                      <td className="px-5 py-4 font-mono text-emerald-400 font-bold">{fmt(p.sellingPrice)}</td>
                      <td className="px-5 py-4 font-mono text-red-400">{fmt(Math.round(p.cost))}</td>
                      <td className="px-5 py-4 font-mono text-blue-400">+{fmt(Math.round(p.sellingPrice - p.cost))}</td>
                      <td className="px-5 py-4 text-zinc-300">{p.soldCount}</td>
                      <td className="px-5 py-4 font-mono font-bold text-radiant-sun">{fmtK(Math.round(p.profit))}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <MiniBar value={p.margin} max={40} color={p.margin > 30 ? 'bg-emerald-500' : p.margin > 20 ? 'bg-radiant-sun' : 'bg-red-500'} />
                          <span className="text-xs font-bold w-10">{p.margin.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision Insights */}
          <div className="glass-panel p-6 border border-emerald-500/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Zap size={16} className="text-emerald-400" />Decision Insights</h3>
            <div className="space-y-2">
              {[
                { text: `${productProfit[0]?.name ?? 'Feed'} category giving highest profit — consider expanding stock.`, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                { text: 'IoT devices have low sales volume → need promotion or bundle offer.', color: 'text-radiant-sun', bg: 'bg-radiant-sun/5 border-radiant-sun/10' },
                { text: 'Medicine margin is highest (35%) — priority revenue driver.', color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
              ].map((ins, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${ins.bg}`}>
                  <ChevronRight size={14} className={`${ins.color} shrink-0 mt-0.5`} />
                  <p className="text-sm text-zinc-300">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUBSCRIPTIONS REVENUE ════════════════════════════════════════════ */}
      {tab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="Total MRR" value={fmtK(revenue.subscriptionRev)} icon={CreditCard} color="bg-purple-500/10 text-purple-400" trend={5.4} />
            <KpiCard label="Farmer MRR" value={fmtK(revenue.farmerMRR)} icon={Users} color="bg-emerald-500/10 text-emerald-400" trend={3.2} />
            <KpiCard label="Provider MRR" value={fmtK(revenue.providerMRR)} icon={Building2} color="bg-blue-500/10 text-blue-400" trend={8.6} />
            <KpiCard label="Annual Run Rate" value={fmtK(revenue.subscriptionRev * 12)} icon={TrendingUp} color="bg-radiant-sun/10 text-radiant-sun" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Farmer Plan Breakdown */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Users size={16} className="text-emerald-400" />Farmer Subscription Plans</h3>
              <div className="space-y-4">
                {[
                  { plan: 'Basic (Free)', count: 20, price: 0, color: 'text-zinc-400' },
                  { plan: 'Silver ₹299/mo', count: 62, price: 299, color: 'text-blue-400' },
                  { plan: 'Gold ₹599/mo', count: 24, price: 599, color: 'text-radiant-sun' },
                  { plan: 'Platinum ₹999/mo', count: 14, price: 999, color: 'text-purple-400' },
                ].map(row => {
                  const mrr = row.count * row.price;
                  return (
                    <div key={row.plan} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-bold ${row.color}`}>{row.plan}</span>
                        <span className="text-zinc-300">{row.count} farmers · <span className="text-emerald-400 font-mono">{fmt(mrr)}/mo</span></span>
                      </div>
                      <MiniBar value={mrr} max={revenue.farmerMRR} color="bg-emerald-500" />
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Provider Subscription */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Building2 size={16} className="text-blue-400" />Provider Subscription Plans</h3>
              <div className="space-y-4">
                {[
                  { plan: 'Free', count: storageService.getProviders().filter(p => p.subscriptionModel === 'free').length, price: 0, color: 'text-zinc-400' },
                  { plan: 'Premium ₹999/mo', count: storageService.getProviders().filter(p => p.subscriptionModel === 'premium').length, price: 999, color: 'text-blue-400' },
                  { plan: 'Verified ₹1999/mo', count: storageService.getProviders().filter(p => p.subscriptionModel === 'verified').length, price: 1999, color: 'text-radiant-sun' },
                ].map(row => {
                  const mrr = row.count * row.price;
                  return (
                    <div key={row.plan} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-bold ${row.color}`}>{row.plan}</span>
                        <span className="text-zinc-300">{row.count} providers · <span className="text-blue-400 font-mono">{fmt(mrr)}/mo</span></span>
                      </div>
                      <MiniBar value={Math.max(mrr, 100)} max={revenue.providerMRR || 1000} color="bg-blue-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROVIDER REVENUE ═════════════════════════════════════════════════ */}
      {tab === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            <KpiCard label="Provider Commission" value={fmtK(revenue.commissionRev)} icon={DollarSign} color="bg-orange-500/10 text-orange-400" trend={18.0} />
            <KpiCard label="Provider Subscriptions" value={fmtK(revenue.providerMRR)} icon={CreditCard} color="bg-blue-500/10 text-blue-400" trend={8.6} />
            <KpiCard label="Total Provider Revenue" value={fmtK(revenue.commissionRev + revenue.providerMRR)} icon={Building2} color="bg-emerald-500/10 text-emerald-400" trend={12.4} />
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Top Revenue-Generating Providers</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">#</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Provider</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Category</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Subscription</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Commission Rate</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Est. Monthly Rev</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Assigned Farmers</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {storageService.getProviders().filter(p => p.status === 'verified').sort((a, b) => b.performanceScore - a.performanceScore).map((p, i) => {
                    const subRev = p.subscriptionModel === 'verified' ? 1999 : p.subscriptionModel === 'premium' ? 999 : 0;
                    const commRev = (p.commissionRate ?? 5) * 800;
                    const total = subRev + commRev;
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><span className={`font-display font-bold text-lg ${i === 0 ? 'text-radiant-gold' : i === 1 ? 'text-zinc-300' : 'text-zinc-600'}`}>#{i + 1}</span></td>
                        <td className="px-5 py-4"><p className="font-bold">{p.name}</p><p className="text-xs text-zinc-500">{p.location}</p></td>
                        <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.category}</span></td>
                        <td className="px-5 py-4"><span className="text-xs font-bold text-purple-400">{p.subscriptionModel?.toUpperCase() ?? 'FREE'}</span></td>
                        <td className="px-5 py-4 font-mono text-zinc-300">{p.commissionRate ?? 5}%</td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">{fmt(total)}</td>
                        <td className="px-5 py-4 text-zinc-300">{p.assignedFarmersCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ IoT REVENUE ══════════════════════════════════════════════════════ */}
      {tab === 'iot' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="IoT Device Sales" value={fmtK(revenue.iotSales)} icon={Cpu} color="bg-cyan-500/10 text-cyan-400" trend={24.1} sub="From all IoT & Aerator products" />
            <KpiCard label="Installation Revenue" value={fmtK(revenue.installCharge)} icon={Zap} color="bg-violet-500/10 text-violet-400" trend={11.0} sub={`${22} devices × ₹1,500`} />
            <KpiCard label="Service Revenue" value={fmtK(revenue.serviceCharge)} icon={Activity} color="bg-blue-500/10 text-blue-400" sub="8 maintenance visits" />
            <KpiCard label="Total IoT Revenue" value={fmtK(revenue.iotSales + revenue.installCharge + revenue.serviceCharge)} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" trend={19.7} />
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Cpu size={16} className="text-cyan-400" />IoT Product Performance</h3>
            <div className="space-y-4">
              {products.filter(p => p.category === 'IoT Device' || p.category === 'Aerator').map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-zinc-500">{p.category} · SKU: {p.sku}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div><p className="text-[9px] text-zinc-500 mb-0.5">Units Sold</p><p className="font-bold text-blue-400">{p.soldCount}</p></div>
                    <div><p className="text-[9px] text-zinc-500 mb-0.5">Price</p><p className="font-bold text-zinc-200">{fmt(p.sellingPrice)}</p></div>
                    <div><p className="text-[9px] text-zinc-500 mb-0.5">Revenue</p><p className="font-bold text-emerald-400">{fmtK(p.sellingPrice * p.soldCount)}</p></div>
                    <div><p className="text-[9px] text-zinc-500 mb-0.5">Stock</p><p className="font-bold text-zinc-300">{p.stockQty}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-radiant-sun/5 border border-radiant-sun/10 flex items-center gap-3">
              <AlertTriangle size={16} className="text-radiant-sun shrink-0" />
              <p className="text-sm text-zinc-300"><span className="font-bold text-radiant-sun">IoT devices have low sales volume</span> → Consider bundle offers (Device + Installation + 1yr Maintenance) or targeted ads during stocking season.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXPENSES ═════════════════════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {expCats.slice(0, 4).map(([cat, amt]) => (
              <div key={cat} className="glass-panel p-5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">{cat}</p>
                <p className="text-2xl font-display font-bold text-red-400">{fmtK(amt)}</p>
                <p className="text-xs text-zinc-500 mt-1">{((amt / revenue.totalExpenses) * 100).toFixed(0)}% of expenses</p>
              </div>
            ))}
          </div>

          {/* Expense breakdown bar */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Expense Category Breakdown</h3>
            <div className="space-y-4">
              {expCats.map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-4">
                  <p className="text-sm font-medium w-28 shrink-0">{cat}</p>
                  <MiniBar value={amt} max={revenue.totalExpenses} color="bg-red-400/70" />
                  <p className="font-mono font-bold text-sm text-red-400 w-24 text-right">{fmt(amt)}</p>
                  <p className="text-xs text-zinc-500 w-10">{((amt / revenue.totalExpenses) * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expense list */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold">Expense Log</h3>
              <p className="text-sm font-mono font-bold text-red-400">Total: {fmt(revenue.totalExpenses)}</p>
            </div>
            <div className="divide-y divide-white/5">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{e.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{e.category}</span>
                      <span className="text-[10px] text-zinc-600">{e.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-red-400">{fmt(e.amount)}</p>
                    <button onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><X size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ NET PROFIT ═══════════════════════════════════════════════════════ */}
      {tab === 'netprofit' && (
        <div className="space-y-6">
          {/* P&L Summary */}
          <div className="glass-panel p-8 border border-emerald-500/10">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2"><Activity size={18} className="text-emerald-400" />Profit & Loss Summary — April 2026</h3>
            <div className="space-y-3">
              {[
                { label: 'Product Sales Revenue', value: revenue.productSales, type: 'income' },
                { label: 'Subscription Revenue', value: revenue.subscriptionRev, type: 'income' },
                { label: 'Provider Commission', value: revenue.commissionRev, type: 'income' },
                { label: 'Delivery Revenue', value: revenue.deliveryRevenue, type: 'income' },
                { label: 'IoT / Device Revenue', value: revenue.iotSales + revenue.installCharge, type: 'income' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-400">{row.label}</span>
                  <span className="font-mono font-bold text-emerald-400">+ {fmt(row.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="font-bold text-base">Total Revenue</span>
                <span className="font-mono font-bold text-xl text-emerald-400">{fmt(revenue.total)}</span>
              </div>
              {expCats.map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-400">{cat}</span>
                  <span className="font-mono font-bold text-red-400">− {fmt(amt)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="font-bold text-base">Total Expenses</span>
                <span className="font-mono font-bold text-xl text-red-400">− {fmt(revenue.totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between py-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 mt-2">
                <span className="font-display font-bold text-2xl">Net Profit</span>
                <span className={`font-mono font-bold text-3xl ${revenue.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(revenue.netProfit)}</span>
              </div>
              <p className="text-center text-sm text-zinc-500">Profit Margin: <span className="font-bold text-emerald-400">{revenue.profitMargin.toFixed(1)}%</span></p>
            </div>
          </div>

          {/* Monthly profit trend */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Monthly Net Profit Trend</h3>
            <div className="flex items-end gap-3 h-32">
              {MONTHLY_DATA.map(m => {
                const total = m.sales + m.subscriptions + m.commission + m.installation;
                const profit = total - m.expenses;
                const maxProfit = Math.max(...MONTHLY_DATA.map(x => (x.sales + x.subscriptions + x.commission + x.installation) - x.expenses));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-mono text-emerald-400">{fmtK(profit)}</p>
                    <div className="w-full bg-emerald-500/80 hover:bg-emerald-500 rounded-t transition-all" style={{ height: `${(profit / maxProfit) * 80}px` }} />
                    <p className="text-[10px] text-zinc-500 font-bold">{m.month}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAYOUTS ══════════════════════════════════════════════════════════ */}
      {tab === 'payouts' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Paid Out</p><p className="text-3xl font-display font-bold text-emerald-400">{fmt(payouts.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Pending</p><p className="text-3xl font-display font-bold text-radiant-sun">{fmt(payouts.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0))}</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Scheduled</p><p className="text-3xl font-display font-bold text-blue-400">{fmt(payouts.filter(p => p.status === 'SCHEDULED').reduce((s, p) => s + p.amount, 0))}</p></div>
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Payout Queue</h3></div>
            <div className="divide-y divide-white/5">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1">
                    <p className="font-bold">{p.recipient}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.type}</span>
                      <span className="text-[10px] text-zinc-600">{p.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-bold text-sm">{fmt(p.amount)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'PENDING' ? 'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{p.status}</span>
                    {p.status === 'PENDING' && (
                      <button onClick={() => handlePayoutStatus(p.id, 'PAID')} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center gap-1"><CheckCircle2 size={11} />Pay Now</button>
                    )}
                    {p.status === 'SCHEDULED' && (
                      <button onClick={() => handlePayoutStatus(p.id, 'PENDING')} className="text-xs text-zinc-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-xl transition-all">Activate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ REFUNDS & LOSSES ═════════════════════════════════════════════════ */}
      {tab === 'refunds' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="Total Refunds" value={fmt(totalRefunds)} icon={RefreshCw} color="bg-red-500/10 text-red-400" />
            <KpiCard label="Cancelled Orders" value={refundOrders.filter(o => o.status === 'CANCELLED').length} icon={X} color="bg-orange-500/10 text-orange-400" />
            <KpiCard label="Cancelled Value" value={fmt(cancelledLoss)} icon={TrendingDown} color="bg-red-500/10 text-red-400" />
            <KpiCard label="Refund Rate" value={`${shopOrders.length > 0 ? ((refundOrders.length / shopOrders.length) * 100).toFixed(1) : 0}%`} icon={AlertTriangle} color="bg-radiant-sun/10 text-radiant-sun" />
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Refunds, Cancellations & Returns</h3></div>
            {refundOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/5 bg-white/5">
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Order</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Farmer</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Amount</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Order Status</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Payment Status</th>
                    <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Loss Type</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {refundOrders.map(o => (
                      <tr key={o.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><span className="font-mono text-xs text-emerald-400">{o.id}</span></td>
                        <td className="px-5 py-4 font-bold text-sm">{o.farmerName}</td>
                        <td className="px-5 py-4 font-mono font-bold text-red-400">{fmt(o.finalAmount)}</td>
                        <td className="px-5 py-4"><span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">{o.status}</span></td>
                        <td className="px-5 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.paymentStatus === 'REFUNDED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{o.paymentStatus}</span></td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{o.paymentStatus === 'REFUNDED' ? 'Cash Refund' : o.status === 'CANCELLED' ? 'Cancellation Loss' : 'Return Processing'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center"><CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" /><p className="text-zinc-400">No refunds or losses recorded.</p></div>
            )}
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS ════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Insights banner */}
          <div className="glass-panel p-5 border border-emerald-500/10">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><Zap size={14} />Smart Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { text: `"${productProfit[0]?.name}" is your highest-profit product`, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                { text: 'IoT Device sales are 40% below target → run IoT bundle promotion', color: 'text-radiant-sun', bg: 'bg-radiant-sun/5 border-radiant-sun/10' },
                { text: 'Provider commission revenue grew 18% this month', color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' },
              ].map((ins, i) => (
                <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 ${ins.bg}`}>
                  <ChevronRight size={12} className={`${ins.color} shrink-0 mt-0.5`} />
                  <p className="text-xs text-zinc-300">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top farmers by spending */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Users size={16} className="text-purple-400" />Top Farmers by Spending</h3>
              <div className="space-y-3">
                {farmerSpending.filter(f => f.spent > 0).slice(0, 5).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className={`text-base font-display font-bold w-5 text-center ${i === 0 ? 'text-radiant-gold' : 'text-zinc-600'}`}>#{i + 1}</span>
                    <div className="flex-1"><p className="font-bold text-sm">{f.name}</p><p className="text-[10px] text-zinc-500">{f.orderCount} orders</p></div>
                    <p className="font-mono font-bold text-emerald-400">{fmt(f.spent)}</p>
                  </div>
                ))}
                {farmerSpending.filter(f => f.spent > 0).length === 0 && <p className="text-zinc-500 text-sm">No orders recorded yet.</p>}
              </div>
            </div>

            {/* Product profit ranking */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Star size={16} className="text-radiant-gold" />Highest Profit Products</h3>
              <div className="space-y-3">
                {productProfit.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`text-base font-display font-bold w-5 text-center ${i === 0 ? 'text-radiant-gold' : 'text-zinc-600'}`}>#{i + 1}</span>
                    <div className="flex-1"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-zinc-500">{p.category}</p></div>
                    <div className="text-right"><p className="font-mono font-bold text-emerald-400 text-sm">{fmtK(Math.round(p.profit))}</p><p className="text-[9px] text-zinc-500">{p.margin.toFixed(0)}% margin</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FORECAST ═════════════════════════════════════════════════════════ */}
      {tab === 'forecast' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 border border-blue-500/10">
            <div className="flex items-center gap-3 mb-1">
              <Target size={16} className="text-blue-400" />
              <p className="font-bold text-blue-400 text-sm">AI Revenue Forecast — Next 5 Months</p>
            </div>
            <p className="text-xs text-zinc-500">Based on historical growth rate (9.7%/month), seasonal patterns, and subscription MRR growth.</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Monthly Revenue Forecast</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Month</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Forecast Revenue</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Forecast Expenses</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Forecast Profit</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Growth</th>
                  <th className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">Seasonal Note</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {FORECAST.map((m, i) => {
                    const profit = m.rev - m.exp;
                    const prevRev = i === 0 ? 272000 : FORECAST[i-1].rev;
                    const growth = ((m.rev - prevRev) / prevRev) * 100;
                    return (
                      <tr key={m.month} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4"><span className="font-display font-bold text-blue-400">{m.month} '26</span></td>
                        <td className="px-5 py-4 font-mono font-bold text-emerald-400">{fmt(m.rev)}</td>
                        <td className="px-5 py-4 font-mono text-red-400">{fmt(m.exp)}</td>
                        <td className="px-5 py-4 font-mono font-bold text-radiant-sun">{fmt(profit)}</td>
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-1 text-xs font-bold ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(growth).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{m.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seasonal demand */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2"><Calendar size={16} className="text-radiant-sun" />Seasonal Demand Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { season: 'Stocking Season (May–Jun)', products: ['Feed (Post-larvae)', 'pH Regulators', 'Aerators'], demand: 'VERY HIGH', color: 'text-red-400 bg-red-500/5 border-red-500/10' },
                { season: 'Mid-Cycle (Jul–Aug)', products: ['Feed (Grower)', 'Medicines', 'IoT Sensors'], demand: 'HIGH', color: 'text-radiant-sun bg-radiant-sun/5 border-radiant-sun/10' },
                { season: 'Harvest Season (Sep)', products: ['Feed (Finisher)', 'Logistics', 'Aerators'], demand: 'PEAK', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
              ].map(s => (
                <div key={s.season} className={`p-5 rounded-xl border ${s.color.split(' ').slice(1).join(' ')}`}>
                  <p className="font-bold text-sm mb-1">{s.season}</p>
                  <p className={`text-xs font-bold mb-3 ${s.color.split(' ')[0]}`}>Demand: {s.demand}</p>
                  <div className="space-y-1">
                    {s.products.map(p => <p key={p} className="text-xs text-zinc-400 flex items-center gap-1"><ChevronRight size={10} />{p}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ──────────────────────────────────────────────── */}
      {addExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAddExpModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md glass-panel p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center"><TrendingDown size={20} /></div><h2 className="text-2xl font-display font-bold">Add Expense</h2></div>
              <button onClick={() => setAddExpModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description *</label><input type="text" value={newExp.label} onChange={e => setNewExp({ ...newExp, label: e.target.value })} className="input-field w-full" placeholder="e.g. Medicine stock purchase April" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                  <select value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })} className="input-field w-full bg-zinc-900">
                    {['Product Cost', 'Delivery', 'Platform', 'Marketing', 'Operations'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount (₹)</label><input type="number" value={newExp.amount || ''} onChange={e => setNewExp({ ...newExp, amount: +e.target.value })} className="input-field w-full" /></div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button onClick={() => setAddExpModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddExpense} disabled={!newExp.label || newExp.amount <= 0} className="btn-primary flex items-center gap-2 disabled:opacity-50"><Plus size={16} />Add Expense</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RevenueManagement;
