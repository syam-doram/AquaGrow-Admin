/**
 * ShopDashboard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AquaGrow Shop ERP operational dashboard.
 *
 * Endpoints:
 *   GET /api/dashboard/summary        → KPIs, recentBills, lowStockProducts,
 *                                       expiringBatches, pendingInward
 *   GET /api/sales/invoices?limit=10&sort=desc  → fallback for recent bills
 *   GET /api/shop-orders?status=pending&limit=5 → pending farmer orders
 *   GET /api/purchase-orders?limit=5&sort=desc  → recent wholesale purchases
 *   GET /api/whatsapp/messages?status=failed&limit=5 → failed WA messages
 *   POST /api/whatsapp/retry/:id               → retry failed message
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, IndianRupee, TrendingUp, AlertTriangle, Package,
  Clock, Calendar, RefreshCw, Loader2, CheckCircle2, XCircle,
  ArrowRight, Truck, ShoppingBag, MessageSquare, RotateCcw,
  Banknote, CreditCard, Smartphone, ChevronRight, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── API Helper ──────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error((json as any).error || `Request failed: ${res.status}`);
  return json as T;
}

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtRs = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (s?: string) =>
  s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SalesSummary {
  totalSales: number;
  cashSales: number;
  upiSales: number;
  creditSales: number;
  totalBills: number;
  returns: number;
  netSales: number;
  creditRecoveredToday: number;
  outstandingFarmerBalance: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  expiringCount: number;
  recentBills: Bill[];
  lowStockProducts: LowStockProduct[];
  expiringBatches: ExpiringBatch[];
  pendingInward: PendingInward[];
}

interface Bill {
  _id: string;
  invoiceNumber: string;
  farmerName: string;
  createdAt: string;
  total: number;
  paymentMethod: string;
  status: string;
}

interface LowStockProduct {
  _id: string;
  name: string;
  category?: string;
  currentStock: number;
  unit: string;
}

interface ExpiringBatch {
  _id: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
}

interface ShopOrder {
  _id: string;
  orderNumber: string;
  farmerName: string;
  orderDate: string;
  products: { name: string }[];
  status: string;
  expectedDelivery?: string;
}

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  status: string;
  totalExpectedAmount: number;
}

interface PendingInward {
  _id: string;
  poNumber: string;
  supplierName: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  lastInwardDate?: string;
}

interface WhatsAppMessage {
  _id: string;
  farmerName: string;
  template: string;
  failureReason?: string;
  createdAt: string;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, icon, accent = 'text-emerald-400', children, action }) => (
  <div className="glass-panel overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <div className="flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <h2 className="text-sm font-bold text-zinc-200">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  pending:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  confirmed:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  paid:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  credit:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  cancelled:  'bg-red-500/15 text-red-400 border-red-500/30',
  draft:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  sent:       'bg-blue-500/15 text-blue-400 border-blue-500/30',
  received:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partially_received: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  delivered:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls = statusColor[status.toLowerCase()] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ msg }: { msg: string }) => (
  <div className="py-10 text-center text-zinc-600 text-sm">{msg}</div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const ShopDashboard: React.FC = () => {
  const [summary, setSummary]       = useState<SalesSummary | null>(null);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [failedWA, setFailedWA]     = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [retrying, setRetrying]     = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, orders, pos, wa] = await Promise.all([
        apiFetch<SalesSummary>('/dashboard/summary'),
        apiFetch<ShopOrder[]>('/shop-orders?status=pending&limit=5'),
        apiFetch<PurchaseOrder[]>('/purchase-orders?limit=5&sort=desc'),
        apiFetch<WhatsAppMessage[]>('/whatsapp/messages?status=failed&limit=5'),
      ]);
      setSummary(sum);
      setShopOrders(orders);
      setPurchaseOrders(pos);
      setFailedWA(wa);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      await apiFetch(`/whatsapp/retry/${id}`, { method: 'POST' });
      showToast('Message queued for retry');
      await load();
    } catch (err: any) {
      showToast(err.message ?? 'Retry failed', 'error');
    } finally {
      setRetrying(null);
    }
  };

  // ── KPI card definitions ─────────────────────────────────────────────────
  const kpiCards = summary ? [
    {
      label: "Today's Total Sales",
      value: fmtRs(summary.totalSales),
      icon: <IndianRupee size={18} />,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: (
        <div className="flex gap-3 mt-1 flex-wrap">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Banknote size={9} className="text-green-400" /> Cash {fmtRs(summary.cashSales)}</span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Smartphone size={9} className="text-blue-400" /> UPI {fmtRs(summary.upiSales)}</span>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1"><CreditCard size={9} className="text-amber-400" /> Credit {fmtRs(summary.creditSales)}</span>
        </div>
      ),
    },
    {
      label: 'Credit Recovered Today',
      value: fmtRs(summary.creditRecoveredToday),
      icon: <TrendingUp size={18} />,
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      sub: null,
    },
    {
      label: 'Outstanding Balance',
      value: fmtRs(summary.outstandingFarmerBalance),
      icon: <CreditCard size={18} />,
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      sub: <span className="text-[10px] text-zinc-600">Farmer credit outstanding</span>,
    },
    {
      label: 'Low Stock Products',
      value: summary.lowStockCount,
      icon: <Package size={18} />,
      accent: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
      sub: (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
          <AlertTriangle size={9} /> {summary.lowStockCount} items
        </span>
      ),
    },
    {
      label: 'Pending Orders',
      value: summary.pendingOrdersCount,
      icon: <Clock size={18} />,
      accent: 'text-zinc-400',
      bg: 'bg-zinc-500/10 border-zinc-500/20',
      sub: null,
    },
    {
      label: 'Expiring Products',
      value: summary.expiringCount,
      icon: <Calendar size={18} />,
      accent: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      sub: <span className="text-[10px] text-zinc-600">Within 30 days</span>,
    },
  ] : [];

  // ── Sales bar widths ───────────────────────────────────────────────────────
  const totalForBars = summary ? (summary.cashSales + summary.upiSales + summary.creditSales) || 1 : 1;
  const barPct = (v: number) => `${Math.round((v / totalForBars) * 100)}%`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-zinc-500 text-sm">Loading Shop Dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center glass-panel p-10">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-bold mb-3">{error}</p>
          <button onClick={load} className="btn-secondary text-sm flex items-center gap-2 mx-auto">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-xl ${
              toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <LayoutDashboard size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Shop Dashboard</h1>
          <p className="text-zinc-400 text-sm">Today's operational overview — sales, stock, orders &amp; alerts.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="btn-secondary flex items-center gap-2 text-sm shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel p-5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold leading-tight">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.bg}`}>
                <span className={card.accent}>{card.icon}</span>
              </div>
            </div>
            <p className={`text-2xl font-display font-bold ${card.accent}`}>{card.value}</p>
            {card.sub && <div>{card.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* ── Today's Sales Breakdown ── */}
      {summary && (
        <SectionCard title="Today's Sales Breakdown" icon={<TrendingUp size={16} />}>
          <div className="p-5 grid md:grid-cols-2 gap-6">
            {/* Numbers */}
            <div className="space-y-3">
              {[
                { label: 'Cash', value: summary.cashSales, color: 'bg-green-500', icon: <Banknote size={12} className="text-green-400" /> },
                { label: 'UPI', value: summary.upiSales, color: 'bg-blue-500', icon: <Smartphone size={12} className="text-blue-400" /> },
                { label: 'Credit', value: summary.creditSales, color: 'bg-amber-500', icon: <CreditCard size={12} className="text-amber-400" /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">{icon} {label}</span>
                    <span className="text-xs font-bold text-zinc-200">{fmtRs(value)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: barPct(value) }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Summary */}
            <div className="flex flex-col justify-center gap-3 border-l border-white/5 pl-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Bills</span>
                <span className="font-bold text-zinc-200">{summary.totalBills}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Gross Sales</span>
                <span className="font-bold text-zinc-200">{fmtRs(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Returns</span>
                <span className="font-bold text-red-400">- {fmtRs(summary.returns)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                <span className="text-zinc-300 font-bold">Net Sales</span>
                <span className="font-bold text-emerald-400">{fmtRs(summary.netSales)}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Recent Bills ── */}
      <SectionCard title="Recent Bills (Last 10)" icon={<IndianRupee size={16} />} accent="text-emerald-400">
        <div className="overflow-x-auto">
          {(!summary?.recentBills || summary.recentBills.length === 0) ? (
            <EmptyState msg="No bills today yet." />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Invoice #', 'Farmer', 'Time', 'Total', 'Method', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary!.recentBills.map((bill, i) => (
                  <motion.tr
                    key={bill._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-zinc-200">{bill.invoiceNumber}</td>
                    <td className="px-4 py-3 text-zinc-400">{bill.farmerName}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtTime(bill.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-zinc-200">{fmtRs(bill.total)}</td>
                    <td className="px-4 py-3 text-zinc-400 capitalize">{bill.paymentMethod}</td>
                    <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {/* ── Pending Farmer Orders ── */}
      <SectionCard
        title="Pending Farmer Orders"
        icon={<Clock size={16} />}
        accent="text-zinc-400"
        action={
          <a href="/shop-orders" className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            View All <ChevronRight size={11} />
          </a>
        }
      >
        <div className="overflow-x-auto">
          {shopOrders.length === 0 ? (
            <EmptyState msg="No pending orders." />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Order #', 'Farmer', 'Date', 'Products', 'Status', 'Expected Delivery'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shopOrders.map((o, i) => (
                  <motion.tr
                    key={o._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-zinc-200">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-zinc-400">{o.farmerName}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(o.orderDate)}</td>
                    <td className="px-4 py-3 text-zinc-400">{o.products?.length ?? 0} item{(o.products?.length ?? 0) !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(o.expectedDelivery)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {/* ── Low Stock Alert ── */}
      <SectionCard title="Low Stock Alert" icon={<Package size={16} />} accent="text-orange-400"
        action={
          <a href="/products" className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            Manage Stock <ChevronRight size={11} />
          </a>
        }
      >
        {(!summary?.lowStockProducts || summary.lowStockProducts.length === 0) ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-zinc-500 text-sm">All products are adequately stocked.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {summary!.lowStockProducts.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Package size={13} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-200 truncate">{p.name}</p>
                  {p.category && (
                    <span className="text-[9px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${p.currentStock <= 5 ? 'text-red-400' : 'text-orange-400'}`}>
                    {p.currentStock} {p.unit}
                  </p>
                  <p className="text-[10px] text-zinc-600">current stock</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Expiring Products Alert ── */}
      <SectionCard title="Expiring Products (within 30 days)" icon={<Calendar size={16} />} accent="text-red-400">
        {(!summary?.expiringBatches || summary.expiringBatches.length === 0) ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <p className="text-zinc-500 text-sm">No products expiring soon.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['Product', 'Batch #', 'Expiry Date', 'Days Remaining'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary!.expiringBatches.map((b, i) => {
                  const daysColor =
                    b.daysRemaining <= 7  ? 'text-red-400' :
                    b.daysRemaining <= 15 ? 'text-amber-400' :
                                            'text-yellow-400';
                  return (
                    <motion.tr
                      key={b._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className="hover:bg-white/2 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-zinc-200">{b.productName}</td>
                      <td className="px-4 py-3 text-zinc-400">{b.batchNumber}</td>
                      <td className="px-4 py-3 text-zinc-400">{fmtDate(b.expiryDate)}</td>
                      <td className={`px-4 py-3 font-bold ${daysColor}`}>{b.daysRemaining}d</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Recent Wholesale Purchases ── */}
      <SectionCard title="Recent Wholesale Purchases" icon={<ShoppingBag size={16} />} accent="text-blue-400"
        action={
          <a href="/wholesale-orders" className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            View All <ChevronRight size={11} />
          </a>
        }
      >
        <div className="overflow-x-auto">
          {purchaseOrders.length === 0 ? (
            <EmptyState msg="No recent purchase orders." />
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['PO #', 'Supplier', 'Date', 'Status', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purchaseOrders.map((po, i) => (
                  <motion.tr
                    key={po._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-zinc-200">{po.poNumber}</td>
                    <td className="px-4 py-3 text-zinc-400">{po.supplierName}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(po.orderDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                    <td className="px-4 py-3 font-bold text-zinc-200">{fmtRs(po.totalExpectedAmount)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {/* ── Pending Goods Inward ── */}
      <SectionCard title="Pending Goods Inward" icon={<Truck size={16} />} accent="text-amber-400">
        <div className="overflow-x-auto">
          {(!summary?.pendingInward || summary.pendingInward.length === 0) ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <p className="text-zinc-500 text-sm">No pending goods inward.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {['PO #', 'Supplier', 'Ordered', 'Received', 'Pending', 'Last Inward'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summary!.pendingInward.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-zinc-200">{p.poNumber}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.supplierName}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.orderedQty}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{p.receivedQty}</td>
                    <td className="px-4 py-3 text-amber-400 font-bold">{p.pendingQty}</td>
                    <td className="px-4 py-3 text-zinc-500">{fmtDate(p.lastInwardDate)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SectionCard>

      {/* ── Failed WhatsApp Messages (only if count > 0) ── */}
      {failedWA.length > 0 && (
        <SectionCard title="Failed WhatsApp Messages" icon={<MessageSquare size={16} />} accent="text-red-400"
          action={
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
              <AlertCircle size={9} /> {failedWA.length} failed
            </span>
          }
        >
          <div className="divide-y divide-white/5">
            {failedWA.map((msg, i) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <XCircle size={13} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-200">{msg.farmerName}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    Template: {msg.template}
                    {msg.failureReason && <span className="text-red-400 ml-2">— {msg.failureReason}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-600 mb-1">{fmtDate(msg.createdAt)}</p>
                  <button
                    onClick={() => handleRetry(msg._id)}
                    disabled={retrying === msg._id}
                    className="flex items-center gap-1 text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {retrying === msg._id ? <Loader2 size={9} className="animate-spin" /> : <RotateCcw size={9} />}
                    Retry
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

    </div>
  );
};

export default ShopDashboard;
