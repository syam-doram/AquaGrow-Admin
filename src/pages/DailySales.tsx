/**
 * DailySales.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner view: browse invoices by date, see payment breakdown,
 * farmer ledger summaries, and daily totals.
 *
 * Endpoints:
 *   GET /invoices?date=YYYY-MM-DD  → list invoices for a date
 *   GET /invoices/:id              → single invoice detail
 *   GET /invoices/summary?date=... → daily summary totals
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Calendar, Search, RefreshCw, ChevronDown,
  ChevronRight, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, DollarSign, Users, Package, CreditCard,
  Banknote, Smartphone, ArrowRight, Loader2, X, Eye,
  IndianRupee, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
// Backend stores plain ₹ numbers (NOT paise). Status is 'draft'|'finalized'|'paid'.
interface InvoiceItem {
  productId: string | { _id: string; name: string; code: string; unit: string };
  productName?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;    // ₹
  discountPercent?: number;
  total: number;        // ₹
}

interface InvoicePayment {
  method: string;
  amount: number;        // ₹
  reference?: string;
  createdAt?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  farmerId: string | { _id: string; name: string; phoneNumber: string };
  farmerName?: string;
  farmerMobile?: string;
  items: InvoiceItem[];
  totalAmount: number;   // ₹
  status: 'draft' | 'finalized' | 'paid' | 'cancelled';
  payments: InvoicePayment[];
  createdAt: string;
  createdByName?: string;
  shopId?: string;
  cultureId?: string;
}

interface DailySummary {
  date: string;
  invoiceCount: number;
  totalRevenue: number;  // ₹
  paidCount: number;
  draftCount: number;
  finalizedCount: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────
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

const fetchInvoices = (date: string) =>
  apiFetch<Invoice[]>(`/invoices?date=${date}`);

const fetchSummary = (date: string) =>
  apiFetch<DailySummary>(`/invoices/summary?date=${date}`).catch(() => null);

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Backend stores plain ₹ — no paise conversion needed.
const fmtRs = (v: number) => `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const todayISO = () => new Date().toISOString().slice(0, 10);

const Spinner = () => <Loader2 size={15} className="animate-spin" />;

// Map backend status values to display metadata
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:      { label: 'Unpaid',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  finalized:  { label: 'Partial', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  paid:       { label: 'Paid',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled:  { label: 'Cancelled', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

const METHOD_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Cash:   { label: 'Cash',   icon: <Banknote size={12} />,    color: 'text-emerald-400' },
  UPI:    { label: 'UPI',    icon: <Smartphone size={12} />,  color: 'text-blue-400' },
  Bank:   { label: 'Bank',   icon: <CreditCard size={12} />,  color: 'text-purple-400' },
  Credit: { label: 'Credit', icon: <ArrowRight size={12} />,  color: 'text-amber-400' },
  // lowercase aliases
  cash:   { label: 'Cash',   icon: <Banknote size={12} />,    color: 'text-emerald-400' },
  upi:    { label: 'UPI',    icon: <Smartphone size={12} />,  color: 'text-blue-400' },
  bank:   { label: 'Bank',   icon: <CreditCard size={12} />,  color: 'text-purple-400' },
  credit: { label: 'Credit', icon: <ArrowRight size={12} />,  color: 'text-amber-400' },
};

// ─── Invoice Detail Modal ─────────────────────────────────────────────────────
const InvoiceModal = ({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) => {
  // Derive paid amount by summing payments array
  const paidAmount = invoice.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = Math.max(0, invoice.totalAmount - paidAmount);
  const statusMeta = STATUS_META[invoice.status] ?? STATUS_META['draft'];
  // Resolve farmerId if populated
  const farmerName = invoice.farmerName ?? (typeof invoice.farmerId === 'object' ? (invoice.farmerId as any).name : 'Farmer');
  const farmerPhone = invoice.farmerMobile ?? (typeof invoice.farmerId === 'object' ? (invoice.farmerId as any).phoneNumber : String(invoice.farmerId));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Invoice #{invoice.invoiceNumber ?? invoice._id.slice(-6).toUpperCase()}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {fmtDate(invoice.createdAt)} · {fmtTime(invoice.createdAt)}
                {invoice.createdByName && ` · by ${invoice.createdByName}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Farmer */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">{farmerName}</p>
                <p className="text-xs text-zinc-500">{farmerPhone}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Items ({invoice.items.length})</p>
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 bg-white/3 text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                  <span className="col-span-5">Product</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>
                {invoice.items.map((item, i) => {
                  const prodName = item.productName ??
                    (typeof item.productId === 'object' ? (item.productId as any).name : String(item.productId));
                  const unit = item.unit ?? (typeof item.productId === 'object' ? (item.productId as any).unit : '');
                  return (
                    <div key={i} className={`grid grid-cols-12 px-4 py-3 text-xs ${i > 0 ? 'border-t border-white/5' : ''}`}>
                      <span className="col-span-5 text-zinc-200 font-medium">{prodName}</span>
                      <span className="col-span-2 text-right text-zinc-400">{item.quantity} {unit}</span>
                      <span className="col-span-2 text-right text-zinc-400">{fmtRs(item.unitPrice)}</span>
                      <span className="col-span-3 text-right text-zinc-200 font-bold">{fmtRs(item.total)}</span>
                    </div>
                  );
                })}
                <div className="grid grid-cols-12 px-4 py-3 border-t border-white/10 bg-white/3">
                  <span className="col-span-9 text-right text-xs font-bold text-zinc-300">Total</span>
                  <span className="col-span-3 text-right text-sm font-bold text-emerald-400">{fmtRs(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            {invoice.payments.length > 0 && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Payments</p>
                <div className="space-y-2">
                  {invoice.payments.map((pay, i) => {
                    const meta = METHOD_META[pay.method] ?? { label: pay.method, icon: <DollarSign size={12} />, color: 'text-zinc-400' };
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
                        <div className="flex items-center gap-2">
                          <span className={meta.color}>{meta.icon}</span>
                          <span className="text-xs text-zinc-300">{meta.label}</span>
                          {pay.reference && <span className="text-[10px] text-zinc-600">· {pay.reference}</span>}
                        </div>
                        <span className="text-xs font-bold text-zinc-200">{fmtRs(pay.amount)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between p-3 mt-2 rounded-xl bg-white/3 border border-white/8">
                  <span className="text-xs text-zinc-400">Paid so far</span>
                  <span className="text-xs font-bold text-emerald-400">{fmtRs(paidAmount)}</span>
                </div>
                {outstanding > 0 && (
                  <div className="flex justify-between p-3 mt-1 rounded-xl bg-red-500/5 border border-red-500/15">
                    <span className="text-xs text-zinc-400">Outstanding</span>
                    <span className="text-xs font-bold text-red-400">{fmtRs(outstanding)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DailySales: React.FC = () => {
  const [date, setDate]         = useState(todayISO());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary]   = useState<DailySummary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Invoice['status']>('ALL');
  const [selected, setSelected] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const [inv, sum] = await Promise.all([fetchInvoices(date), fetchSummary(date)]);
      setInvoices(inv);
      setSummary(sum);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // Helper: resolve farmer name from populated or plain field
  const farmerName = (inv: Invoice) =>
    inv.farmerName ?? (typeof inv.farmerId === 'object' ? (inv.farmerId as any).name : 'Farmer');
  const farmerPhone = (inv: Invoice) =>
    inv.farmerMobile ?? (typeof inv.farmerId === 'object' ? (inv.farmerId as any).phoneNumber : '');
  const farmerKey = (inv: Invoice) =>
    typeof inv.farmerId === 'object' ? (inv.farmerId as any)._id : String(inv.farmerId);

  const filtered = invoices.filter(inv => {
    const name  = farmerName(inv).toLowerCase();
    const phone = farmerPhone(inv);
    const matchSearch = name.includes(search.toLowerCase()) ||
      (inv.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Compute totals from invoice array — backend amounts are plain ₹
  const computedSummary = {
    invoiceCount:   invoices.length,
    uniqueFarmers:  new Set(invoices.map(i => farmerKey(i))).size,
    totalSales:     invoices.reduce((s, i) => s + (i.totalAmount || 0), 0),
    collected:      invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + (p.amount || 0), 0), 0),
    credit:         invoices.filter(i => i.status !== 'paid').reduce((s, i) => {
      const paid = i.payments.reduce((ps, p) => ps + (p.amount || 0), 0);
      return s + Math.max(0, (i.totalAmount || 0) - paid);
    }, 0),
  };

  // Payment breakdown from individual invoices
  const paymentBreakdown = invoices.reduce((acc, inv) => {
    inv.payments.forEach(p => {
      const key = p.method ?? 'Other';
      acc[key] = (acc[key] ?? 0) + (p.amount || 0);
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShoppingBag size={15} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Owner Dashboard</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Daily Sales</h1>
          <p className="text-zinc-400 text-sm">Review invoices, collections, and farmer credit for any business day.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/60 transition-all"
            />
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Invoices',    value: computedSummary.invoiceCount,  color: 'text-blue-400',    icon: <FileText size={16} /> },
          { label: 'Farmers',     value: computedSummary.uniqueFarmers,  color: 'text-purple-400',  icon: <Users size={16} /> },
          { label: 'Total Sales', value: fmtRs(computedSummary.totalSales), color: 'text-zinc-100', icon: <TrendingUp size={16} /> },
          { label: 'Collected',   value: fmtRs(computedSummary.collected), color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
          { label: 'On Credit',   value: fmtRs(computedSummary.credit),   color: 'text-amber-400',   icon: <Clock size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
              <span className={color}>{icon}</span>
            </div>
            <p className={`text-lg font-display font-bold ${color} truncate`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      {Object.keys(paymentBreakdown).length > 0 && (
        <div className="glass-panel p-5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-4">Collections by Payment Method</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['Cash', 'UPI', 'Bank', 'Credit'] as const).map(method => {
              const meta = METHOD_META[method];
              const amount = (paymentBreakdown[method] ?? 0) + (paymentBreakdown[method.toLowerCase()] ?? 0);
              return (
                <div key={method} className="p-4 rounded-xl bg-white/3 border border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{meta.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${meta.color}`}>{fmtRs(amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="glass-panel overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search farmer, invoice…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
            {(['ALL', 'draft', 'finalized', 'paid'] as const).map(s => {
              const label = s === 'ALL' ? 'All' : (STATUS_META[s]?.label ?? s);
              return (
                <button key={s} onClick={() => setStatusFilter(s as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-emerald-500 text-white'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading invoices for {date}…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-1">{error}</p>
            <button onClick={load} className="btn-secondary text-sm mt-3">Try Again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingBag size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {invoices.length === 0 ? `No invoices on ${date}` : 'No invoices match filters'}
            </p>
            <p className="text-zinc-600 text-sm">
              {invoices.length === 0 ? 'Sales will appear here once staff create invoices.' : 'Try a different filter.'}
            </p>
          </div>
        )}

        {/* Invoice rows */}
        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((inv, i) => {
              const statusMeta = STATUS_META[inv.status] ?? STATUS_META['draft'];
              const name = inv.farmerName ?? (typeof inv.farmerId === 'object' ? (inv.farmerId as any).name : 'Farmer');
              const paidAmt = inv.payments.reduce((s, p) => s + (p.amount || 0), 0);
              return (
                <motion.div
                  key={inv._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                  onClick={() => setSelected(inv)}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-zinc-100">{name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.cls}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        #{inv.invoiceNumber ?? inv._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-600">{fmtTime(inv.createdAt)}</span>
                      <span className="text-[10px] text-zinc-600">{inv.items.length} item{inv.items.length !== 1 ? 's' : ''}</span>
                      {inv.createdByName && <span className="text-[10px] text-zinc-600">by {inv.createdByName}</span>}
                    </div>
                  </div>

                  {/* Payment badges */}
                  <div className="hidden md:flex items-center gap-1.5 flex-wrap shrink-0">
                    {inv.payments.map((p, pi) => {
                      const meta = METHOD_META[p.method];
                      return (
                        <span key={pi} className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 ${meta?.color ?? 'text-zinc-400'}`}>
                          {meta?.icon}{meta?.label ?? p.method}
                        </span>
                      );
                    })}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-100">{fmtRs(inv.totalAmount)}</p>
                    {paidAmt < inv.totalAmount && (
                      <p className="text-[10px] text-amber-400">
                        Paid: {fmtRs(paidAmt)}
                      </p>
                    )}
                  </div>

                  <Eye size={14} className="text-zinc-600 shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-zinc-600">
              {filtered.length} of {invoices.length} invoices
            </p>
            <p className="text-xs text-zinc-400 font-bold">
              Total shown: {fmtRs(filtered.reduce((s, i) => s + (i.totalAmount || 0), 0))}
            </p>
          </div>
        )}
      </div>

      {/* Invoice detail modal */}
      {selected && <InvoiceModal invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default DailySales;
