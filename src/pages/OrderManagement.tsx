import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag, Search, Filter, ChevronRight, X, CheckCircle2,
  XCircle, AlertTriangle, Truck, Package, DollarSign, RefreshCw,
  BarChart3, Bell, Cpu, Zap, Eye, Edit3, Printer, MapPin,
  Clock, TrendingUp, TrendingDown, ArrowUpRight, User,
  FileText, ArrowRight, Circle, Activity, Wifi, WifiOff, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopOrder, ShopOrderItem, ProductCategory } from '../types';
import { fetchAllOrders, updateShopOrderStatus as apiUpdateStatus, type LiveShopOrder } from '../services/aquagrowApi';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'orders' | 'workflow' | 'dispatch' | 'delivery'
         | 'returns' | 'payments' | 'inventory' | 'special' | 'analytics';

type OrderStatus = ShopOrder['status'];
type PayStatus   = ShopOrder['paymentStatus'];

interface Complaint {
  id: string; orderId: string; farmerName: string;
  issue: string; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FLOW: OrderStatus[] = ['PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PACKED:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHIPPED:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  RETURNED:  'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
};

const PAY_COLOR: Record<PayStatus, string> = {
  PENDING:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAID:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  FAILED:   'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const CAT_COLOR: Record<ProductCategory, string> = {
  Feed:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Medicine:   'text-red-400 bg-red-500/10 border-red-500/20',
  Aerator:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'IoT Device':'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Equipment:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Chemical:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// ─── Step Ownership Map ───────────────────────────────────────────────────────
// Maps each order status → the team member responsible at that stage
const STEP_OWNER: Record<OrderStatus, { name: string; role: string; color: string }> = {
  PENDING:   { name: 'Meena Kumari',  role: 'Order Executive',       color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  CONFIRMED: { name: 'Kiran Reddy',   role: 'Ops Manager',           color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  PACKED:    { name: 'Satish Goud',   role: 'Warehouse Manager',     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  SHIPPED:   { name: 'Srinivas Rao',  role: 'Logistics Coordinator', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  DELIVERED: { name: 'Ramesh Dora',   role: 'Delivery Agent',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { name: 'Kiran Reddy',   role: 'Ops Manager',           color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  RETURNED:  { name: 'Divya Sri',     role: 'Support Executive',     color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const OwnerChip = ({ status }: { status: OrderStatus }) => {
  const o = STEP_OWNER[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${o.color}`}>
      <User size={8} /> {o.name}
    </span>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const StatusBadge = ({ s }: { s: OrderStatus }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[s]}`}>{s}</span>
);
const PayBadge = ({ s }: { s: PayStatus }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PAY_COLOR[s]}`}>{s}</span>
);
const CatBadge = ({ c }: { c: ProductCategory }) => (
  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${CAT_COLOR[c] ?? ''}`}>{c}</span>
);

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
        {trend >= 0 ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
        {Math.abs(trend).toFixed(1)}% vs yesterday
      </div>
    )}
  </div>
);

// ─── Normalize DB order → ShopOrder shape ────────────────────────────────────
// Maps the backend's snake_case lowercase status to the admin's UPPERCASE status
const DB_STATUS_MAP: Record<string, ShopOrder['status']> = {
  assigned:  'PENDING',
  confirmed: 'CONFIRMED',
  shipped:   'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

const ADMIN_TO_API_STATUS: Record<string, string> = {
  CONFIRMED: 'confirmed',
  PACKED:    'confirmed', // no 'packed' in backend, map to confirmed
  SHIPPED:   'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

function normalizeDbOrder(o: LiveShopOrder): ShopOrder {
  const items: ShopOrderItem[] = (o.items || []).map((it: any, i: number) => ({
    productId:    it.productId || `prod-${i}`,
    productName:  it.productName || it.name || 'Unknown Product',
    category:     (it.category as ProductCategory) || 'Feed',
    quantity:     it.qty ?? it.quantity ?? 1,
    unit:         it.unit || 'kg',
    pricePerUnit: it.unitPrice ?? it.price ?? it.pricePerUnit ?? 0,   // maps backend unitPrice → ShopOrderItem.pricePerUnit
    totalPrice:   it.subtotal ?? (it.qty ?? 1) * (it.unitPrice ?? 0),
  }));

  return {
    id:              `DB-${o._id.slice(-8).toUpperCase()}`,
    _dbId:           o._id,                    // keep original _id for API calls
    farmerId:        o.farmerId,
    farmerName:      o.farmerName || 'Farmer',
    farmerPhone:     o.farmerPhone || '',
    deliveryAddress: 'See farmer profile',
    deliveryCharge:  0,
    items,
    totalAmount:     o.totalAmount ?? 0,       // required by ShopOrder
    discountAmount:  0,                        // required by ShopOrder
    finalAmount:     o.totalAmount ?? 0,
    paymentMethod:   'COD' as const,
    paymentStatus:   'PENDING' as const,
    status:          DB_STATUS_MAP[o.status] ?? 'PENDING',
    createdAt:       o.createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    updatedAt:       o.updatedAt ?? o.createdAt ?? new Date().toISOString(), // required by ShopOrder
    source:          'DB_LIVE',                // flag to distinguish live orders
    providerName:    o.providerName || '',
  } as unknown as ShopOrder & { _dbId: string; source: string; providerName: string };
}

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderManagement = () => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [dbOrderCount, setDbOrderCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [fStatus, setFStatus] = useState<string>('all');
  const [fPay,    setFPay]    = useState<string>('all');
  const [fCat,    setFCat]    = useState<string>('all');

  // Detail panel
  const [selected, setSelected] = useState<ShopOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [editTrackId, setEditTrackId] = useState<string | null>(null);

  // Notifications log
  const [notifications, setNotifications] = useState<{ id: string; msg: string; type: string; at: string }[]>([]);

  // Complaints (local state — no backend endpoint yet)
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const load = useCallback(async () => {
    try {
      setApiStatus('loading');
      const dbOrders = await fetchAllOrders();
      const normalized = dbOrders.map(normalizeDbOrder);
      setDbOrderCount(normalized.length);
      setApiStatus('online');
      setLastSync(new Date().toLocaleTimeString());
      setOrders(normalized);

      // Auto-generate arrival notification for newest order
      if (normalized.length > 0) {
        const newest = normalized[0];
        setNotifications(prev => {
          const exists = prev.some(n => n.id === `DB-${newest.id}`);
          if (exists) return prev;
          return [{ id: `DB-${newest.id}`, msg: `Live order ${newest.id} placed by ${newest.farmerName} — ${newest.items[0]?.productName || 'products'}`, type: 'NEW_ORDER', at: newest.createdAt }, ...prev];
        });
      }
    } catch {
      setApiStatus('offline');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 90 seconds
  useEffect(() => {
    const t = setInterval(load, 90 * 1000);
    return () => clearInterval(t);
  }, [load]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: orders.length,
      today: orders.filter(o => o.createdAt === today).length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      packed: orders.filter(o => o.status === 'PACKED').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      returned: orders.filter(o => o.status === 'RETURNED').length,
      failedPayment: orders.filter(o => o.paymentStatus === 'FAILED').length,
      pendingPayment: orders.filter(o => o.paymentStatus === 'PENDING').length,
      revenue: orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.finalAmount, 0),
    };
  }, [orders]);

  // ── Filtered orders ────────────────────────────────────────────────────────
  const filtered = useMemo(() => orders.filter(o => {
    const ms = o.farmerName.toLowerCase().includes(search.toLowerCase())
            || o.id.toLowerCase().includes(search.toLowerCase());
    const mst = fStatus === 'all' || o.status === fStatus;
    const mpa = fPay === 'all' || o.paymentStatus === fPay;
    const mca = fCat === 'all' || o.items.some(i => i.category === fCat);
    return ms && mst && mpa && mca;
  }), [orders, search, fStatus, fPay, fCat]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const advanceStatus = async (order: ShopOrder) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const dbId = (order as any)._dbId;
    const apiStatusVal = ADMIN_TO_API_STATUS[next];
    if (dbId && apiStatusVal) {
      try { await apiUpdateStatus(dbId, apiStatusVal); } catch { /* non-fatal */ }
    }
    // Optimistic update
    const extra: Partial<ShopOrder> = { status: next };
    if (next === 'DELIVERED') extra.deliveredAt = new Date().toISOString().split('T')[0];
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...extra } : o));
    if (selected?.id === order.id) setSelected(prev => prev ? { ...prev, ...extra } : null);
    pushNotif(order, next);
  };

  const cancelOrder = async (id: string, reason: string) => {
    const order = orders.find(o => o.id === id);
    const dbId = order ? (order as any)._dbId : null;
    if (dbId) {
      try { await apiUpdateStatus(dbId, 'cancelled'); } catch { /* non-fatal */ }
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' as OrderStatus } : o));
    setNotifications(prev => [{ id: `N${Date.now()}`, msg: `Order ${id} cancelled.`, type: 'CANCELLED', at: new Date().toLocaleString() }, ...prev]);
    setSelected(null);
  };

  const markPaid = (id: string) => {
    // Optimistic UI update — no backend payment endpoint yet
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: 'PAID' as const } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, paymentStatus: 'PAID' as const } : null);
  };

  const setTracking = (id: string) => {
    if (!trackingInput) return;
    // Optimistic update (tracking stored client-side for now)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, trackingId: trackingInput } : o));
    setNotifications(prev => [{ id: `N${Date.now()}`, msg: `Tracking ID ${trackingInput} added to ${id}`, type: 'SHIPPED', at: new Date().toLocaleString() }, ...prev]);
    setEditTrackId(null);
    setTrackingInput('');
  };

  const pushNotif = (o: ShopOrder, status: OrderStatus) => {
    const msgs: Partial<Record<OrderStatus, string>> = {
      CONFIRMED: `Order ${o.id} confirmed for ${o.farmerName}`,
      PACKED:    `Order ${o.id} packed and ready for dispatch`,
      SHIPPED:   `Order ${o.id} shipped to ${o.farmerName}`,
      DELIVERED: `Order ${o.id} delivered to ${o.farmerName} ✓`,
    };
    if (msgs[status]) {
      setNotifications(prev => [{ id: `N${Date.now()}`, msg: msgs[status]!, type: status, at: new Date().toLocaleTimeString() }, ...prev]);
    }
  };

  const reopenComplaint = (id: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
  };

  // ── Category breakdown for analytics ──────────────────────────────────────
  const catStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    orders.forEach(o => o.items.forEach(i => {
      if (!map[i.category]) map[i.category] = { count: 0, revenue: 0 };
      map[i.category].count++;
      map[i.category].revenue += i.totalPrice;
    }));
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [orders]);

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, badge: stats.pending },
    { id: 'orders',    label: 'Order List', icon: ShoppingBag },
    { id: 'workflow',  label: 'Status Pipeline', icon: ArrowRight, badge: stats.pending + stats.confirmed },
    { id: 'dispatch',  label: 'Dispatch', icon: Package, badge: stats.packed },
    { id: 'delivery',  label: 'Delivery & Tracking', icon: Truck, badge: stats.shipped },
    { id: 'returns',   label: 'Returns', icon: RefreshCw, badge: stats.returned },
    { id: 'payments',  label: 'Payments', icon: DollarSign, badge: stats.failedPayment + stats.pendingPayment },
    { id: 'inventory', label: 'Inventory Sync', icon: AlertTriangle },
    { id: 'special',   label: 'Special Handling', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Order Management</h1>
          <p className="text-zinc-400">Track, fulfil, and manage all product shop orders — including live farmer orders from AquaGrow app.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live DB status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
            apiStatus === 'online'  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
            apiStatus === 'offline' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                       'bg-zinc-500/5 border-zinc-500/20 text-zinc-500'
          }`}>
            {apiStatus === 'online' ? <Wifi size={13} /> : apiStatus === 'offline' ? <WifiOff size={13} /> : <RefreshCw size={13} className="animate-spin" />}
            {apiStatus === 'online' ? `${dbOrderCount} live orders` : apiStatus === 'offline' ? 'DB Offline' : 'Syncing...'}
          </div>
          {lastSync && <span className="text-[10px] text-zinc-600">Synced {lastSync}</span>}
          <button onClick={() => load()} disabled={apiStatus === 'loading'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={13} className={apiStatus === 'loading' ? 'animate-spin' : ''} /> Refresh
          </button>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${stats.pending > 0 ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
            <Bell size={14} />
            {stats.pending > 0 ? `${stats.pending} orders need attention` : 'All orders up to date'}
          </div>
        </div>
      </div>

      {/* Quick KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: "Today", value: stats.today, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, color: stats.pending > 0 ? 'text-amber-400' : '' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-400' },
          { label: 'Packed', value: stats.packed, color: 'text-purple-400' },
          { label: 'Shipped', value: stats.shipped, color: 'text-amber-400' },
          { label: 'Delivered', value: stats.delivered, color: 'text-emerald-400' },
          { label: 'Cancelled', value: stats.cancelled, color: stats.cancelled > 0 ? 'text-red-400' : '' },
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
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setFStatus('all'); setFPay('all'); setFCat('all'); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={13} />{t.label}
            {t.badge !== undefined && t.badge > 0 && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-red-500/80 text-white'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="Revenue Collected" value={`₹${(stats.revenue/1000).toFixed(0)}K`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-400" trend={9.7} />
            <KpiCard label="Pending Action" value={stats.pending + stats.confirmed} sub="Need confirm/dispatch" icon={AlertTriangle} color="bg-amber-500/10 text-amber-400" />
            <KpiCard label="In Transit" value={stats.shipped} sub={`${stats.packed} awaiting pickup`} icon={Truck} color="bg-blue-500/10 text-blue-400" />
            <KpiCard label="Failed Payments" value={stats.failedPayment} sub={`${stats.pendingPayment} pending COD`} icon={XCircle} color="bg-red-500/10 text-red-400" />
          </div>

          {/* Status funnel */}
          <div className="glass-panel p-6">
            <h3 className="text-xl font-display font-bold mb-6">Order Status Funnel</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {STATUS_FLOW.map((s, i) => {
                const count = orders.filter(o => o.status === s).length;
                const pct   = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center min-w-[90px]">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold border-2 ${count > 0 ? STATUS_COLOR[s].replace('bg-','border-').split(' ')[0] + ' ' + STATUS_COLOR[s] : 'border-zinc-800 bg-zinc-900 text-zinc-700'}`}>
                        {count}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-bold">{s}</p>
                      <p className="text-[9px] text-zinc-700">{pct}%</p>
                    </div>
                    {i < STATUS_FLOW.length - 1 && <ChevronRight size={18} className="text-zinc-700 shrink-0" />}
                  </React.Fragment>
                );
              })}
              <div className="w-px h-10 bg-zinc-800 mx-2 shrink-0" />
              {(['CANCELLED','RETURNED'] as OrderStatus[]).map(s => (
                <div key={s} className="flex flex-col items-center min-w-[90px]">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold ${STATUS_COLOR[s]}`}>
                    {orders.filter(o => o.status === s).length}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-bold">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Assignments — who owns each stage */}
          <div className="glass-panel p-6 border border-white/5">
            <h3 className="text-lg font-display font-bold mb-5 flex items-center gap-2">
              <User size={16} className="text-emerald-400" />
              Team Order Ownership — Stage-by-Stage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                {
                  team: '🧠 Operations Team',
                  accent: 'border-red-500/20 bg-red-500/5',
                  badge: 'text-red-400 bg-red-500/10 border-red-500/20',
                  stages: [
                    { status: 'PENDING' as OrderStatus,   member: 'Meena Kumari',  role: 'Order Executive',   task: 'Verify & confirm incoming orders' },
                    { status: 'CONFIRMED' as OrderStatus, member: 'Kiran Reddy',   role: 'Ops Manager',       task: 'Approve & coordinate dispatch' },
                  ],
                },
                {
                  team: '📦 Warehouse Team',
                  accent: 'border-amber-500/20 bg-amber-500/5',
                  badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  stages: [
                    { status: 'PACKED' as OrderStatus, member: 'Satish Goud',  role: 'Warehouse Manager', task: 'Oversee packing & batch check' },
                    { status: 'PACKED' as OrderStatus, member: 'Balu Naidu',   role: 'Picker / Packer',   task: 'Pick items, verify batch, pack' },
                  ],
                },
                {
                  team: '🚚 Logistics Team',
                  accent: 'border-teal-500/20 bg-teal-500/5',
                  badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                  stages: [
                    { status: 'SHIPPED' as OrderStatus,   member: 'Srinivas Rao', role: 'Delivery Coordinator', task: 'Route plan & assign agent' },
                    { status: 'DELIVERED' as OrderStatus, member: 'Ramesh Dora',  role: 'Delivery Agent',       task: 'Last-mile delivery & COD' },
                  ],
                },
                {
                  team: '📞 Customer Support',
                  accent: 'border-green-500/20 bg-green-500/5',
                  badge: 'text-green-400 bg-green-500/10 border-green-500/20',
                  stages: [
                    { status: 'RETURNED' as OrderStatus, member: 'Divya Sri',    role: 'Support Executive', task: 'Handle returns & refund requests' },
                    { status: 'CANCELLED' as OrderStatus, member: 'Kiran Reddy', role: 'Ops Manager',       task: 'Cancel, notify & reroute stock' },
                  ],
                },
              ].map(({ team, accent, badge, stages }) => (
                <div key={team} className={`p-4 rounded-2xl border ${accent}`}>
                  <p className="text-xs font-bold text-zinc-300 mb-3">{team}</p>
                  <div className="space-y-2">
                    {stages.map((s, i) => {
                      const count = orders.filter(o => o.status === s.status).length;
                      return (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold shrink-0 border ${badge}`}>{count}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-200 truncate">{s.member}</p>
                            <p className="text-[9px] text-zinc-500">{s.role}</p>
                            <p className="text-[9px] text-zinc-600 italic mt-0.5 truncate">{s.task}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Bell size={16} className="text-emerald-400" />Recent Order Notifications</h3>
            <div className="space-y-2">
              {notifications.slice(0,5).map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'DELIVERED' ? 'bg-emerald-500' : n.type === 'SHIPPED' ? 'bg-amber-500' : n.type === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <p className="text-sm text-zinc-300 flex-1">{n.msg}</p>
                  <span className="text-[10px] text-zinc-600 shrink-0">{n.at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ORDER LIST & FILTERS                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'orders' && (
        <div className="space-y-5">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Search order ID or farmer..." className="input-field w-full pl-11" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {[
              { label: 'Status', val: fStatus, set: setFStatus, opts: ['all','PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED','RETURNED'] },
              { label: 'Payment', val: fPay, set: setFPay, opts: ['all','PENDING','PAID','FAILED','REFUNDED'] },
              { label: 'Category', val: fCat, set: setFCat, opts: ['all','Feed','Medicine','Aerator','IoT Device','Equipment','Chemical'] },
            ].map(({ label, val, set, opts }) => (
              <div key={label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <Filter size={13} className="text-zinc-500" />
                <select value={val} onChange={e => set(e.target.value)} className="bg-transparent outline-none text-sm">
                  {opts.map(o => <option key={o} value={o}>{o === 'all' ? `All ${label}s` : o}</option>)}
                </select>
              </div>
            ))}
            <p className="flex items-center text-xs text-zinc-500 px-2">{filtered.length} orders</p>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Order', 'Farmer', 'Products', 'Amount', 'Payment', 'Status & Owner', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                   {filtered.map(o => {
                    const nextIdx = STATUS_FLOW.indexOf(o.status);
                    const next = nextIdx >= 0 && nextIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[nextIdx + 1] : null;
                    const isLive = (o as any).source === 'DB_LIVE';
                    return (
                      <tr key={o.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${isLive ? 'border-l-2 border-l-emerald-500/40' : ''}`} onClick={() => setSelected(o)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded">{o.id}</span>
                            {isLive && <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><Database size={8} />LIVE</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-sm">{o.farmerName}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-28">{(o as any).providerName ? `Provider: ${(o as any).providerName}` : o.deliveryAddress}</p>
                        </td>
                        <td className="px-5 py-4">
                          {o.items.slice(0,2).map((it, i) => <p key={i} className="text-xs"><span className="font-bold">{it.quantity}{it.unit}</span> <span className="text-zinc-400">{it.productName}</span></p>)}
                          {o.items.length > 2 && <p className="text-[10px] text-zinc-600">+{o.items.length - 2} more</p>}
                        </td>
                        <td className="px-5 py-4"><p className="font-mono font-bold text-sm">{fmt(o.finalAmount)}</p><p className="text-[10px] text-zinc-500">{o.paymentMethod}</p></td>
                        <td className="px-5 py-4"><PayBadge s={o.paymentStatus} /></td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <StatusBadge s={o.status} />
                            <OwnerChip status={o.status} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-400">{o.createdAt}</td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelected(o)} className="p-1.5 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg" title="View Details"><Eye size={14} /></button>
                            {next && <button onClick={() => advanceStatus(o)} className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all whitespace-nowrap">→ {next}</button>}
                            {!['CANCELLED','DELIVERED','RETURNED'].includes(o.status) && (
                              <button onClick={() => { if(window.confirm('Cancel this order?')) cancelOrder(o.id, 'Admin cancelled'); }} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><XCircle size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-16 text-center"><ShoppingBag size={36} className="text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No orders match your filters.</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATUS WORKFLOW — Kanban pipeline                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'workflow' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Visual pipeline view — drag or click <span className="text-emerald-400 font-bold">→ Advance</span> to move orders forward.</p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_FLOW.map(status => {
              const col = orders.filter(o => o.status === status);
              return (
                <div key={status} className="min-w-[220px] flex-shrink-0">
                  <div className={`flex items-center justify-between p-3 rounded-xl border mb-3 ${STATUS_COLOR[status]}`}>
                    <p className="font-bold text-xs tracking-wider">{status}</p>
                    <span className="font-display font-bold text-lg">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map(o => {
                      const idx = STATUS_FLOW.indexOf(o.status);
                      const next = idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                      return (
                        <motion.div key={o.id} whileHover={{ y: -2 }} className="glass-panel p-4 cursor-pointer" onClick={() => setSelected(o)}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-400/5 px-1.5 py-0.5 rounded">{o.id}</span>
                            <PayBadge s={o.paymentStatus} />
                          </div>
                          <p className="font-bold text-sm mb-1">{o.farmerName}</p>
                          <p className="text-xs text-zinc-500 mb-1.5">{o.items[0]?.productName}{o.items.length > 1 ? ` +${o.items.length-1}` : ''}</p>
                          <div className="mb-2"><OwnerChip status={o.status} /></div>
                          <p className="font-mono font-bold text-emerald-400 text-sm mb-3">{fmt(o.finalAmount)}</p>
                          {next && (
                            <button onClick={e => { e.stopPropagation(); advanceStatus(o); }}
                              className="w-full text-[10px] font-bold py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">
                              → {next}
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {col.length === 0 && <div className="p-6 rounded-xl bg-white/3 border border-white/5 text-center text-xs text-zinc-700">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PACKING & DISPATCH                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'dispatch' && (
        <div className="space-y-5">
          {orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PACKED').length === 0 ? (
            <div className="glass-panel py-20 text-center"><CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" /><p className="text-zinc-400">No orders pending packing or dispatch.</p></div>
          ) : (
            orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PACKED').map(o => (
              <div key={o.id} className="glass-panel p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <StatusBadge s={o.status} />
                    <span className="font-mono text-sm text-emerald-400">{o.id}</span>
                    <span className="font-bold">{o.farmerName}</span>
                    {/* Step ownership */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10px] font-bold text-amber-400">
                      <User size={10} /> {o.status === 'CONFIRMED' ? 'Pack: Satish Goud (WH Mgr) + Balu Naidu (Packer)' : 'Dispatch: Srinivas Rao (Logistics Coord)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Generate Invoice (simulated) */}
                    <button onClick={() => { alert(`Invoice INV-${o.id} generated for ${fmt(o.finalAmount)}`); }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all">
                      <FileText size={13} />Invoice
                    </button>
                    {/* Shipping Label */}
                    <button onClick={() => { alert(`Shipping label generated:\n${o.farmerName}\n${o.deliveryAddress}\nWeight: ${o.items.reduce((s, i) => s + i.quantity, 0)} units`); }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl transition-all">
                      <Printer size={13} />Shipping Label
                    </button>
                    {o.status === 'CONFIRMED' && (
                      <button onClick={() => advanceStatus(o)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">
                        Mark as PACKED →
                      </button>
                    )}
                    {o.status === 'PACKED' && (
                      <button onClick={() => advanceStatus(o)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all">
                        Mark as SHIPPED →
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Delivery Address</p>
                    <p className="text-sm"><MapPin size={12} className="inline mr-1 text-emerald-400" />{o.deliveryAddress}</p>
                    <p className="text-xs text-zinc-500">Delivery charge: {fmt(o.deliveryCharge)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 space-y-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Items to Pack</p>
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                        <span className="font-bold">{it.quantity} {it.unit}</span>
                        <span className="text-zinc-400">{it.productName}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 space-y-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Payment</p>
                    <PayBadge s={o.paymentStatus} />
                    <p className="text-sm font-mono font-bold">{fmt(o.finalAmount)}</p>
                    <p className="text-xs text-zinc-500">{o.paymentMethod}</p>
                    {o.paymentMethod === 'COD' && <p className="text-[10px] text-amber-400 font-bold">⚠ Cash on Delivery – collect on arrival</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DELIVERY & TRACKING                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'delivery' && (
        <div className="space-y-5">
          {orders.filter(o => ['CONFIRMED','PACKED','SHIPPED'].includes(o.status)).map(o => (
            <div key={o.id} className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-10 rounded-full ${o.status === 'SHIPPED' ? 'bg-amber-500' : o.status === 'PACKED' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-emerald-400">{o.id}</span><StatusBadge s={o.status} /></div>
                    <p className="font-bold">{o.farmerName} — <span className="text-zinc-400 font-normal text-sm">{o.deliveryAddress}</span></p>
                  </div>
                </div>
                {o.status === 'SHIPPED' && (
                  <button onClick={() => advanceStatus(o)} className="text-xs font-bold px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">
                    ✓ Mark Delivered
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1">Tracking ID</p>
                  {editTrackId === o.id ? (
                    <div className="flex items-center gap-1">
                      <input value={trackingInput} onChange={e => setTrackingInput(e.target.value)} className="input-field py-1 text-xs flex-1" placeholder="TRK-XXXX" autoFocus />
                      <button onClick={() => setTracking(o.id)} className="p-1 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={12} /></button>
                      <button onClick={() => { setEditTrackId(null); setTrackingInput(''); }} className="p-1 bg-white/5 rounded-lg text-zinc-400"><X size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{o.trackingId ?? '—'}</span>
                      <button onClick={() => { setEditTrackId(o.id); setTrackingInput(o.trackingId ?? ''); }} className="p-1 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg"><Edit3 size={11} /></button>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1">Est. Delivery</p>
                  <p className="font-bold text-sm">{o.estimatedDelivery ?? '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1">Delivery Partner</p>
                  <p className="font-bold text-sm">{o.deliveryPartnerId ?? 'Unassigned'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1">Delivery Charge</p>
                  <p className="font-mono font-bold text-emerald-400 text-sm">{fmt(o.deliveryCharge)}</p>
                </div>
              </div>
              {/* Timeline */}
              <div className="flex items-center gap-2 mt-4 overflow-x-auto">
                {STATUS_FLOW.map((s, i) => {
                  const done = STATUS_FLOW.indexOf(o.status) >= i;
                  return (
                    <React.Fragment key={s}>
                      <div className={`flex flex-col items-center min-w-[60px]`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
                          {done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        </div>
                        <p className={`text-[9px] mt-1 font-bold ${done ? 'text-emerald-400' : 'text-zinc-700'}`}>{s}</p>
                      </div>
                      {i < STATUS_FLOW.length - 1 && <div className={`flex-1 h-0.5 ${STATUS_FLOW.indexOf(o.status) > i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
          {orders.filter(o => ['CONFIRMED','PACKED','SHIPPED'].includes(o.status)).length === 0 && (
            <div className="glass-panel py-20 text-center"><Truck size={36} className="text-zinc-700 mx-auto mb-3" /><p className="text-zinc-500">No active deliveries.</p></div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* RETURNS & REFUNDS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'returns' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Returned Orders</p><p className="text-3xl font-display font-bold text-zinc-300">{stats.returned}</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Refunds Issued</p><p className="text-3xl font-display font-bold text-blue-400">{orders.filter(o => o.paymentStatus === 'REFUNDED').length}</p></div>
            <div className="glass-panel p-5"><p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Refund Value</p><p className="text-3xl font-display font-bold text-red-400">{fmt(orders.filter(o => o.paymentStatus === 'REFUNDED').reduce((s, o) => s + o.finalAmount, 0))}</p></div>
          </div>

          {/* Complaints */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Complaints & Issues</h3></div>
            <div className="divide-y divide-white/5">
              {complaints.map(c => (
                <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : c.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{c.status}</span>
                      <span className="font-mono text-xs text-emerald-400">{c.orderId}</span>
                      <span className="text-xs text-zinc-600">{c.createdAt}</span>
                    </div>
                    <p className="font-bold">{c.farmerName}</p>
                    <p className="text-sm text-zinc-400 mt-1">{c.issue}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {c.status !== 'RESOLVED' && (
                      <button onClick={() => reopenComplaint(c.id)} className="text-xs font-bold px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">Resolve</button>
                    )}
                    {c.status === 'OPEN' && (
                      <button onClick={() => setComplaints(prev => prev.map(x => x.id === c.id ? { ...x, status: 'IN_PROGRESS' } : x))} className="text-xs font-bold px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all">Investigate</button>
                    )}
                  </div>
                </div>
              ))}
              {complaints.length === 0 && <div className="py-12 text-center text-zinc-500">No complaints.</div>}
            </div>
          </div>

          {/* Returned orders */}
          {orders.filter(o => o.status === 'RETURNED' || o.status === 'CANCELLED').map(o => (
            <div key={o.id} className="glass-panel p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3"><StatusBadge s={o.status} /><span className="font-mono text-xs text-emerald-400">{o.id}</span><span className="font-bold">{o.farmerName}</span></div>
                <div className="flex items-center gap-2">
                  {o.paymentStatus === 'PAID' && o.status === 'RETURNED' && (
                    <button onClick={() => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: 'REFUNDED' as const } : x))}
                      className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all">
                      Issue Refund
                    </button>
                  )}
                  {o.status === 'RETURNED' && (
                    <button onClick={() => alert('Restock request noted — update inventory in your warehouse management system.')}
                      className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">
                      ↩ Restock Items
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm text-zinc-400">{o.returnReason ?? o.cancelReason ?? 'No reason provided'}</div>
              <p className="font-mono font-bold text-sm mt-2">{fmt(o.finalAmount)} · <PayBadge s={o.paymentStatus} /></p>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAYMENT STATUS MANAGEMENT                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {(['PAID','PENDING','FAILED','REFUNDED'] as PayStatus[]).map(s => (
              <div key={s} className="glass-panel p-5">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{s}</p>
                <p className={`text-3xl font-display font-bold ${PAY_COLOR[s].split(' ')[1]}`}>{orders.filter(o => o.paymentStatus === s).length}</p>
                <p className="text-xs text-zinc-500 mt-1">{fmt(orders.filter(o => o.paymentStatus === s).reduce((x, o) => x + o.finalAmount, 0))}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Payment Ledger</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-white/5 bg-white/5">
                  {['Order','Farmer','Amount','Method','Payment Status','Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4"><span className="font-mono text-xs text-emerald-400">{o.id}</span></td>
                      <td className="px-5 py-4 font-bold text-sm">{o.farmerName}</td>
                      <td className="px-5 py-4 font-mono font-bold">{fmt(o.finalAmount)}</td>
                      <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">{o.paymentMethod}</span></td>
                      <td className="px-5 py-4"><PayBadge s={o.paymentStatus} /></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {(o.paymentStatus === 'PENDING' || o.paymentStatus === 'FAILED') && (
                            <button onClick={() => markPaid(o.id)} className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><CheckCircle2 size={10} />Mark Paid</button>
                          )}
                          {o.paymentStatus === 'FAILED' && (
                            <button onClick={() => setOrders(prev => prev.map(x => x.id === o.id ? { ...x, paymentStatus: 'PENDING' as const } : x))}
                              className="text-[10px] font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"><RefreshCw size={10} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* INVENTORY SYNC                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'inventory' && (() => {
        // Derive unique products from live orders
        const productMap = new Map<string, { name: string; category: string; totalOrdered: number; activeOrdered: number }>();
        orders.forEach(o => {
          o.items.forEach(it => {
            const key = it.productName;
            const existing = productMap.get(key) ?? { name: key, category: it.category, totalOrdered: 0, activeOrdered: 0 };
            existing.totalOrdered += it.quantity;
            if (!['CANCELLED','RETURNED'].includes(o.status)) existing.activeOrdered += it.quantity;
            productMap.set(key, existing);
          });
        });
        const productRows = Array.from(productMap.values()).sort((a, b) => b.activeOrdered - a.activeOrdered);
        return (
          <div className="space-y-5">
            <div className="glass-panel p-5 border border-amber-500/10 flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <p className="text-sm text-zinc-300"><span className="font-bold text-amber-400">Live inventory view:</span> Product demand is calculated from active DB orders. Cancelled / returned orders are excluded from reserved count.</p>
            </div>
            <div className="glass-panel overflow-hidden">
              <div className="p-6 border-b border-white/5"><h3 className="text-xl font-display font-bold">Product Demand from Live Orders</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/5 bg-white/5">
                    {['Product','Category','Total Ordered','Active Orders','Cancelled/Returned'].map(h => (
                      <th key={h} className="px-5 py-4 text-xs font-bold text-zinc-500 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {productRows.map(p => (
                      <tr key={p.name} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 font-bold text-sm">{p.name}</td>
                        <td className="px-5 py-4"><CatBadge c={p.category as ProductCategory} /></td>
                        <td className="px-5 py-4 font-bold text-zinc-200">{p.totalOrdered}</td>
                        <td className="px-5 py-4 text-emerald-400 font-bold">{p.activeOrdered}</td>
                        <td className="px-5 py-4 text-red-400">{p.totalOrdered - p.activeOrdered}</td>
                      </tr>
                    ))}
                    {productRows.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-600">No product data in live orders.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SPECIAL PRODUCT HANDLING                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'special' && (
        <div className="space-y-6">
          {/* Feed & Medicine */}
          <div className="glass-panel p-6 border border-emerald-500/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Package size={18} className="text-emerald-400" />Feed & Medicine Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[{ label: 'Fast Delivery SLA', value: '24–48 hrs', color: 'text-emerald-400' }, { label: 'Bulk Order Threshold', value: '50 kg / 10 L', color: 'text-blue-400' }, { label: 'Cold-Chain Required', value: 'Medicines only', color: 'text-red-400' }].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">{label}</p><p className={`font-bold ${color}`}>{value}</p></div>
              ))}
            </div>
            {orders.filter(o => o.items.some(i => ['Feed','Medicine'].includes(i.category)) && !['DELIVERED','CANCELLED'].includes(o.status)).map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 mb-2">
                <div className="flex items-center gap-3">
                  {o.items.some(i => i.category === 'Medicine') && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">MEDICINE</span>}
                  {o.items.some(i => i.category === 'Feed') && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FEED</span>}
                  <span className="font-mono text-xs text-emerald-400">{o.id}</span>
                  <span className="font-bold">{o.farmerName}</span>
                </div>
                <div className="flex items-center gap-3"><StatusBadge s={o.status} /><button onClick={() => advanceStatus(o)} className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Fast Track →</button></div>
              </div>
            ))}
          </div>

          {/* Aerators */}
          <div className="glass-panel p-6 border border-blue-500/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-400" />Aerator Orders — Installation Required</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[{ label: 'Installation SLA', value: '3–5 days post delivery', color: 'text-blue-400' }, { label: 'Technician Required', value: 'Yes', color: 'text-amber-400' }, { label: 'Warranty', value: '1 Year Standard', color: 'text-emerald-400' }].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">{label}</p><p className={`font-bold ${color}`}>{value}</p></div>
              ))}
            </div>
            {orders.filter(o => o.items.some(i => i.category === 'Aerator')).map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-blue-500/10 mb-2">
                <div className="flex items-center gap-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">AERATOR</span><span className="font-mono text-xs text-emerald-400">{o.id}</span><span className="font-bold">{o.farmerName}</span></div>
                <div className="flex items-center gap-3"><StatusBadge s={o.status} /><button className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Assign Technician</button></div>
              </div>
            ))}
          </div>

          {/* IoT Devices */}
          <div className="glass-panel p-6 border border-purple-500/10">
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Cpu size={18} className="text-purple-400" />IoT Device Orders — Full Setup Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[{ label: 'Device Registration', value: 'Serial + Farmer Link', color: 'text-purple-400' }, { label: 'Technician Assignment', value: 'Mandatory', color: 'text-amber-400' }, { label: 'Warranty Period', value: '2 Years', color: 'text-emerald-400' }, { label: 'Remote Support', value: 'Via App Alert', color: 'text-blue-400' }].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl bg-white/5"><p className="text-[10px] text-zinc-500 mb-1">{label}</p><p className={`font-bold text-sm ${color}`}>{value}</p></div>
              ))}
            </div>
            {orders.filter(o => o.items.some(i => i.category === 'IoT Device')).map(o => (
              <div key={o.id} className="p-4 rounded-xl bg-white/5 border border-purple-500/10 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">IoT DEVICE</span><span className="font-mono text-xs text-emerald-400">{o.id}</span><span className="font-bold">{o.farmerName}</span><StatusBadge s={o.status} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Register Device Serial', 'Link to Farmer Account', 'Assign Installation Tech'].map((step, i) => (
                    <button key={step} className="text-xs font-bold px-3 py-2 bg-purple-500/5 text-purple-400 hover:bg-purple-500 hover:text-white rounded-xl transition-all border border-purple-500/10 flex items-center gap-1.5 justify-center">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[9px]">{i+1}</span>{step}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {orders.filter(o => o.items.some(i => i.category === 'IoT Device')).length === 0 && <p className="text-zinc-600 text-sm text-center py-4">No IoT device orders active.</p>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard label="Total Revenue" value={`₹${(stats.revenue/1000).toFixed(0)}K`} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" trend={9.7} />
            <KpiCard label="Avg Order Value" value={orders.length ? fmt(Math.round(orders.reduce((s, o) => s + o.finalAmount, 0) / orders.length)) : '₹0'} icon={DollarSign} color="bg-blue-500/10 text-blue-400" />
            <KpiCard label="Return Rate" value={`${orders.length > 0 ? ((stats.returned / orders.length) * 100).toFixed(1) : 0}%`} icon={RefreshCw} color="bg-red-500/10 text-red-400" />
            <KpiCard label="Failed Payment %" value={`${orders.length > 0 ? ((stats.failedPayment / orders.length) * 100).toFixed(1) : 0}%`} icon={XCircle} color="bg-amber-500/10 text-amber-400" />
          </div>

          {/* Category revenue */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Revenue by Product Category</h3>
            <div className="space-y-3">
              {catStats.map(([cat, data]) => {
                const max = catStats[0]?.[1]?.revenue ?? 1;
                return (
                  <div key={cat} className="flex items-center gap-4">
                    <div className="w-28 shrink-0"><CatBadge c={cat as ProductCategory} /></div>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.revenue / max) * 100}%` }} />
                    </div>
                    <p className="text-xs font-mono font-bold text-zinc-300 w-24 text-right">{fmt(data.revenue)}</p>
                    <p className="text-[10px] text-zinc-600 w-12">{data.count} items</p>
                  </div>
                );
              })}
              {catStats.length === 0 && <p className="text-zinc-600 text-sm">No sales data yet.</p>}
            </div>
          </div>

          {/* Top farmers by order value */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Top Farmers by Order Value</h3>
            <div className="space-y-3">
              {Object.entries(
                orders.reduce((acc, o) => { acc[o.farmerName] = (acc[o.farmerName] ?? 0) + o.finalAmount; return acc; }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([name, val], i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <span className={`font-display font-bold text-lg w-6 text-center ${i === 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>#{i+1}</span>
                  <User size={14} className="text-zinc-500 shrink-0" />
                  <p className="font-bold text-sm flex-1">{name}</p>
                  <p className="font-mono font-bold text-emerald-400">{fmt(val)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order trend (simulated weekly) */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-display font-bold mb-5">Weekly Order Trend</h3>
            <div className="flex items-end gap-2 h-28">
              {[14,22,18,35,28,42,38].map((v, i) => {
                const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-emerald-500/70 hover:bg-emerald-500 rounded-t transition-all" style={{ height: `${(v/42)*100}px` }} />
                    <p className="text-[9px] text-zinc-600">{days[i]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ORDER DETAIL SIDE PANEL                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-white/5 z-50 flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold">{selected.id}</h2>
                  <div className="flex items-center gap-2 mt-1"><StatusBadge s={selected.status} /><PayBadge s={selected.paymentStatus} /></div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {/* Farmer */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">Farmer Details</p>
                  <p className="font-bold">{selected.farmerName}</p>
                  <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1"><MapPin size={11} />{selected.deliveryAddress}</p>
                </div>
                {/* Items */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">Order Items</p>
                  <div className="space-y-3">
                    {selected.items.map((it, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <CatBadge c={it.category} />
                          <div><p className="text-sm font-bold">{it.productName}</p><p className="text-xs text-zinc-500">{it.quantity} {it.unit} × {fmt(it.pricePerUnit)}</p></div>
                        </div>
                        <p className="font-mono font-bold text-sm text-emerald-400">{fmt(it.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Payment summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Payment</p>
                  {[
                    { label: 'Sub-total', value: fmt(selected.totalAmount) },
                    { label: 'Discount', value: selected.discountAmount > 0 ? `−${fmt(selected.discountAmount)}` : '₹0' },
                    { label: 'Delivery', value: `+${fmt(selected.deliveryCharge)}` },
                    { label: 'Total', value: fmt(selected.finalAmount) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{label}</span>
                      <span className={`font-bold ${label === 'Total' ? 'text-emerald-400' : ''}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="text-zinc-500">Method</span><span className="font-bold">{selected.paymentMethod}</span>
                  </div>
                </div>
                {/* Tracking */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Tracking</p>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Tracking ID</span><span className="font-mono">{selected.trackingId ?? '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Est. Delivery</span><span>{selected.estimatedDelivery ?? '—'}</span></div>
                  {selected.deliveredAt && <div className="flex justify-between text-sm"><span className="text-zinc-500">Delivered At</span><span className="text-emerald-400">{selected.deliveredAt}</span></div>}
                </div>
                {/* Timeline */}
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">Order Timeline</p>
                  <div className="flex items-center gap-1">
                    {STATUS_FLOW.map((s, i) => {
                      const done = STATUS_FLOW.indexOf(selected.status) >= i;
                      return (
                        <React.Fragment key={s}>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500' : 'bg-zinc-800'}`}>{done ? <CheckCircle2 size={11} className="text-white" /> : <Circle size={11} className="text-zinc-600" />}</div>
                            <p className="text-[8px] mt-1 text-zinc-600 text-center w-12">{s}</p>
                          </div>
                          {i < STATUS_FLOW.length - 1 && <div className={`flex-1 h-0.5 mb-5 ${STATUS_FLOW.indexOf(selected.status) > i ? 'bg-emerald-500' : 'bg-zinc-800'}`} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Actions footer */}
              <div className="p-5 border-t border-white/5 space-y-2">
                {(() => {
                  const idx = STATUS_FLOW.indexOf(selected.status);
                  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                  return next ? (
                    <button onClick={() => { advanceStatus(selected); setSelected(prev => prev ? { ...prev, status: next } : null); }}
                      className="w-full btn-primary flex items-center justify-center gap-2">
                      <ArrowRight size={16} />Advance to {next}
                    </button>
                  ) : null;
                })()}
                {selected.paymentStatus === 'PENDING' && <button onClick={() => markPaid(selected.id)} className="w-full py-2 text-sm font-bold text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={15} />Mark Payment as Paid</button>}
                {!['CANCELLED','DELIVERED','RETURNED'].includes(selected.status) && (
                  <button onClick={() => { if(window.confirm('Cancel this order?')) cancelOrder(selected.id, 'Admin cancelled'); }}
                    className="w-full py-2 text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"><XCircle size={13} />Cancel Order</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
