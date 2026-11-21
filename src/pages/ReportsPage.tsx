/**
 * ReportsPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive reports hub for AquaGrow Shop ERP.
 *
 * Tabs:
 *   1. Sales Report
 *   2. Purchase Report
 *   3. Stock & Inventory (sub-tabs: Valuation | Batch-wise | Expiry)
 *   4. Farmer Credit
 *   5. Supplier Ledger
 *   6. GST Report
 *   7. Expenses
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, ShoppingCart, Package, Users, BookOpen,
  Receipt, Truck, RefreshCw, Download, Search, AlertTriangle,
  CheckCircle2, Loader2, X, ChevronDown, IndianRupee,
  CalendarDays, Phone, MapPin, TrendingUp, TrendingDown,
  AlertCircle, Clock, FileText, Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── API Helper ───────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRs = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Spinner = ({ size = 15 }: { size?: number }) => (
  <Loader2 size={size} className="animate-spin" />
);

const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="p-14 flex flex-col items-center gap-3">
    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    <p className="text-zinc-500 text-sm">{label}</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="p-10 text-center">
    <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
    <p className="text-red-400 font-bold text-sm mb-3">{message}</p>
    <button onClick={onRetry} className="btn-secondary text-sm">Try Again</button>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="p-14 text-center">
    <FileText size={36} className="text-zinc-700 mx-auto mb-3" />
    <p className="text-zinc-500 text-sm">{label}</p>
  </div>
);

const iCls = 'bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider';

// ─── Summary Card ─────────────────────────────────────────────────────────────
const SummaryCard = ({
  label, value, color = 'text-zinc-100', icon,
}: {
  label: string; value: string; color?: string; icon?: React.ReactNode;
}) => (
  <div className="glass-panel p-5">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
      {icon && <span className={color}>{icon}</span>}
    </div>
    <p className={`text-lg font-display font-bold ${color} truncate`}>{value}</p>
  </div>
);

// ─── CSV Export Helper ─────────────────────────────────────────────────────────
function downloadCsv(url: string) {
  const token = getAdminToken();
  const link = document.createElement('a');
  link.href = `${BASE_URL}${url}`;
  if (token) link.setAttribute('data-token', token); // bearer sent via URL param fallback
  // Best-effort: open in new tab; real implementation sends auth header via fetch+blob
  window.open(`${BASE_URL}${url}&token=${encodeURIComponent(token ?? '')}`, '_blank');
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — SALES REPORT
// ═══════════════════════════════════════════════════════════════════════════════
interface SaleRow {
  _id: string;
  date: string;
  invoiceNumber: string;
  farmerName: string;
  itemCount: number;
  total: number;
  method: string;
  status: string;
}
interface SalesSummary {
  totalSales: number;
  cash: number;
  upi: number;
  credit: number;
  returns: number;
  netSales: number;
}
interface SalesData { summary: SalesSummary; rows: SaleRow[] }

const SalesReport: React.FC = () => {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo]     = useState(today());
  const [farmer, setFarmer] = useState('');
  const [method, setMethod] = useState('');
  const [data, setData]   = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ from, to, ...(farmer ? { farmerId: farmer } : {}), ...(method ? { method } : {}) }).toString();
      const d = await apiFetch<SalesData>(`/reports/sales?${qs}`);
      setData(d);
    } catch (e: any) { setError(e.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [from, to, farmer, method]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () =>
    downloadCsv(`/reports/sales?from=${from}&to=${to}&format=csv`);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[130px]">
          <label className={lCls}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={iCls + ' w-full'} />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className={lCls}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className={iCls + ' w-full'} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className={lCls}>Farmer Search</label>
          <input type="text" value={farmer} onChange={e => setFarmer(e.target.value)} placeholder="Name / ID…" className={iCls + ' w-full'} />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className={lCls}>Payment Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className={iCls + ' w-full'}>
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-[38px]">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={exportCsv} className="btn-primary flex items-center gap-2 text-sm h-[38px]">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard label="Total Sales" value={fmtRs(summary.totalSales)} icon={<IndianRupee size={15} />} />
          <SummaryCard label="Cash" value={fmtRs(summary.cash)} color="text-emerald-400" icon={<TrendingUp size={15} />} />
          <SummaryCard label="UPI" value={fmtRs(summary.upi)} color="text-blue-400" icon={<Receipt size={15} />} />
          <SummaryCard label="Credit" value={fmtRs(summary.credit)} color="text-amber-400" icon={<Clock size={15} />} />
          <SummaryCard label="Returns" value={fmtRs(summary.returns)} color="text-red-400" icon={<TrendingDown size={15} />} />
          <SummaryCard label="Net Sales" value={fmtRs(summary.netSales)} color="text-emerald-300" icon={<BarChart3 size={15} />} />
        </div>
      )}

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading && <LoadingState label="Loading sales…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && (!data?.rows.length) && <EmptyState label="No sales records for this period" />}
        {!loading && !error && !!data?.rows.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Invoice#</th>
                  <th className="px-4 py-3 text-left">Farmer</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.rows.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-zinc-400 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-200">{r.invoiceNumber}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.farmerName}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{r.itemCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-100">{fmtRs(r.total)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400 capitalize">{r.method}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        r.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>{r.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{data.rows.length} records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — PURCHASE REPORT
// ═══════════════════════════════════════════════════════════════════════════════
interface PurchaseRow {
  _id: string;
  date: string;
  poNumber: string;
  supplierName: string;
  itemCount: number;
  total: number;
  status: string;
  receivedDate?: string;
}
interface PurchaseSummary { totalPurchases: number; paid: number; pending: number; returns: number; }
interface PurchaseData { summary: PurchaseSummary; rows: PurchaseRow[] }

const PurchaseReport: React.FC = () => {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo]   = useState(today());
  const [supplier, setSupplier] = useState('');
  const [status, setStatus]   = useState('');
  const [data, setData]   = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ from, to, ...(supplier ? { supplierId: supplier } : {}), ...(status ? { status } : {}) }).toString();
      setData(await apiFetch<PurchaseData>(`/reports/purchases?${qs}`));
    } catch (e: any) { setError(e.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [from, to, supplier, status]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[130px]"><label className={lCls}>From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[130px]"><label className={lCls}>To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[150px]"><label className={lCls}>Supplier</label><input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Name / ID…" className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[130px]">
          <label className={lCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={iCls + ' w-full'}>
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-[38px]">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => downloadCsv(`/reports/purchases?from=${from}&to=${to}&format=csv`)} className="btn-primary flex items-center gap-2 text-sm h-[38px]">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Purchases" value={fmtRs(summary.totalPurchases)} icon={<ShoppingCart size={15} />} />
          <SummaryCard label="Paid" value={fmtRs(summary.paid)} color="text-emerald-400" icon={<CheckCircle2 size={15} />} />
          <SummaryCard label="Pending" value={fmtRs(summary.pending)} color="text-amber-400" icon={<Clock size={15} />} />
          <SummaryCard label="Returns" value={fmtRs(summary.returns)} color="text-red-400" icon={<TrendingDown size={15} />} />
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading && <LoadingState label="Loading purchases…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !data?.rows.length && <EmptyState label="No purchase records for this period" />}
        {!loading && !error && !!data?.rows.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">PO#</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.rows.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-zinc-400 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-200">{r.poNumber}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.supplierName}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{r.itemCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-100">{fmtRs(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === 'received' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        r.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        r.status === 'sent' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(r.receivedDate)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{data.rows.length} records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — STOCK & INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════
interface StockValuationRow {
  _id: string;
  productName: string;
  category: string;
  stockQty: number;
  unit: string;
  mrp: number;
  purchaseRate: number;
  stockValue: number;
}

interface BatchRow {
  _id: string;
  productName: string;
  batchNumber: string;
  supplierName: string;
  purchaseDate: string;
  expiryDate: string;
  qty: number;
  status: string;
}

interface ExpiryRow {
  _id: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  qty: number;
  daysLeft: number;
}
interface ExpiryData { expired: ExpiryRow[]; expiringSoon: ExpiryRow[]; expiringMonth: ExpiryRow[] }

type StockSubTab = 'valuation' | 'batch' | 'expiry';

const StockInventory: React.FC = () => {
  const [subTab, setSubTab] = useState<StockSubTab>('valuation');

  // Valuation
  const [valData, setValData]     = useState<StockValuationRow[]>([]);
  const [valLoad, setValLoad]     = useState(false);
  const [valErr, setValErr]       = useState<string | null>(null);

  // Batch
  const [batchData, setBatchData] = useState<BatchRow[]>([]);
  const [batchLoad, setBatchLoad] = useState(false);
  const [batchErr, setBatchErr]   = useState<string | null>(null);
  const [batchFilter, setBatchFilter] = useState<'all' | 'soon' | 'expired'>('all');

  // Expiry
  const [expData, setExpData]     = useState<ExpiryData | null>(null);
  const [expLoad, setExpLoad]     = useState(false);
  const [expErr, setExpErr]       = useState<string | null>(null);

  const loadValuation = useCallback(async () => {
    setValLoad(true); setValErr(null);
    try { setValData(await apiFetch<StockValuationRow[]>('/reports/stock-valuation')); }
    catch (e: any) { setValErr(e.message ?? 'Failed'); }
    finally { setValLoad(false); }
  }, []);

  const loadBatch = useCallback(async () => {
    setBatchLoad(true); setBatchErr(null);
    try { setBatchData(await apiFetch<BatchRow[]>('/reports/batch-stock')); }
    catch (e: any) { setBatchErr(e.message ?? 'Failed'); }
    finally { setBatchLoad(false); }
  }, []);

  const loadExpiry = useCallback(async () => {
    setExpLoad(true); setExpErr(null);
    try { setExpData(await apiFetch<ExpiryData>('/reports/expiry')); }
    catch (e: any) { setExpErr(e.message ?? 'Failed'); }
    finally { setExpLoad(false); }
  }, []);

  useEffect(() => {
    if (subTab === 'valuation') loadValuation();
    else if (subTab === 'batch') loadBatch();
    else loadExpiry();
  }, [subTab, loadValuation, loadBatch, loadExpiry]);

  const totalValue = valData.reduce((s, r) => s + r.stockValue, 0);

  const filteredBatch = batchData.filter(r => {
    if (batchFilter === 'all') return true;
    if (batchFilter === 'expired') return r.status === 'expired';
    if (batchFilter === 'soon') return r.status === 'expiring_soon';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8 w-fit">
        {([
          ['valuation', 'Stock Valuation', <Layers size={12} />],
          ['batch',     'Batch-wise',      <Package size={12} />],
          ['expiry',    'Expiry Report',   <AlertCircle size={12} />],
        ] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => setSubTab(key as StockSubTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              subTab === key ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Valuation ── */}
      {subTab === 'valuation' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-200">Stock Valuation</p>
            <button onClick={loadValuation} disabled={valLoad} className="btn-secondary flex items-center gap-2 text-xs">
              <RefreshCw size={12} className={valLoad ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {valLoad && <LoadingState label="Loading valuation…" />}
          {!valLoad && valErr && <ErrorState message={valErr} onRetry={loadValuation} />}
          {!valLoad && !valErr && !valData.length && <EmptyState label="No stock data" />}
          {!valLoad && !valErr && !!valData.length && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Stock Qty</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-right">MRP</th>
                    <th className="px-4 py-3 text-right">Purchase Rate</th>
                    <th className="px-4 py-3 text-right">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {valData.map((r, i) => (
                    <motion.tr key={r._id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                      className="hover:bg-white/2 transition-all">
                      <td className="px-4 py-3 font-medium text-zinc-100">{r.productName}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{r.category}</td>
                      <td className="px-4 py-3 text-right text-zinc-200">{r.stockQty.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{r.unit}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{fmtRs(r.mrp)}</td>
                      <td className="px-4 py-3 text-right text-zinc-400">{fmtRs(r.purchaseRate)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">{fmtRs(r.stockValue)}</td>
                    </motion.tr>
                  ))}
                  <tr className="border-t-2 border-white/10 bg-white/3">
                    <td colSpan={6} className="px-4 py-3 text-sm font-bold text-zinc-300">Total Stock Value</td>
                    <td className="px-4 py-3 text-right font-bold text-lg text-emerald-300">{fmtRs(totalValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Batch-wise ── */}
      {subTab === 'batch' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
              {(['all', 'soon', 'expired'] as const).map(f => (
                <button key={f} onClick={() => setBatchFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                    batchFilter === f ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}>
                  {f === 'soon' ? 'Expiring Soon' : f === 'all' ? 'All' : 'Expired'}
                </button>
              ))}
            </div>
            <button onClick={loadBatch} disabled={batchLoad} className="btn-secondary flex items-center gap-2 text-xs">
              <RefreshCw size={12} className={batchLoad ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {batchLoad && <LoadingState label="Loading batches…" />}
          {!batchLoad && batchErr && <ErrorState message={batchErr} onRetry={loadBatch} />}
          {!batchLoad && !batchErr && !filteredBatch.length && <EmptyState label="No batch records" />}
          {!batchLoad && !batchErr && !!filteredBatch.length && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Batch#</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">Purchased</th>
                    <th className="px-4 py-3 text-left">Expiry</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBatch.map((r, i) => (
                    <motion.tr key={r._id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                      className="hover:bg-white/2 transition-all">
                      <td className="px-4 py-3 font-medium text-zinc-100">{r.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{r.batchNumber}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{r.supplierName}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(r.purchaseDate)}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{fmtDate(r.expiryDate)}</td>
                      <td className="px-4 py-3 text-right text-zinc-200">{r.qty}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          r.status === 'expired' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                          r.status === 'expiring_soon' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>{r.status.replace('_', ' ')}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-white/5">
                <p className="text-[10px] text-zinc-600">{filteredBatch.length} batches</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Expiry Report ── */}
      {subTab === 'expiry' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={loadExpiry} disabled={expLoad} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={13} className={expLoad ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {expLoad && <LoadingState label="Loading expiry data…" />}
          {!expLoad && expErr && <ErrorState message={expErr} onRetry={loadExpiry} />}
          {!expLoad && !expErr && expData && (
            <>
              {/* Expired */}
              <ExpirySection title="Expired" color="red" rows={expData.expired} />
              {/* ≤7 days */}
              <ExpirySection title="Expiring within 7 days" color="orange" rows={expData.expiringSoon} />
              {/* ≤30 days */}
              <ExpirySection title="Expiring within 30 days" color="amber" rows={expData.expiringMonth} />
            </>
          )}
          {!expLoad && !expErr && !expData && <EmptyState label="No expiry data available" />}
        </div>
      )}
    </div>
  );
};

const ExpirySection = ({
  title, color, rows,
}: { title: string; color: 'red' | 'orange' | 'amber'; rows: ExpiryRow[] }) => {
  const colorMap = {
    red:    { bg: 'bg-red-500/10 border-red-500/20',    text: 'text-red-400',    dot: 'bg-red-500' },
    orange: { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
    amber:  { bg: 'bg-amber-500/10 border-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-500' },
  }[color];
  return (
    <div className={`glass-panel overflow-hidden border ${colorMap.bg}`}>
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colorMap.dot}`} />
        <p className={`text-sm font-bold ${colorMap.text}`}>{title}</p>
        <span className="ml-auto text-xs text-zinc-500">{rows.length} items</span>
      </div>
      {!rows.length ? (
        <p className="text-center text-zinc-600 text-xs py-6">No items</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-white/5">
                <th className="px-4 py-2.5 text-left">Product</th>
                <th className="px-4 py-2.5 text-left">Batch#</th>
                <th className="px-4 py-2.5 text-left">Expiry Date</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(r => (
                <tr key={r._id} className="hover:bg-white/2 transition-all">
                  <td className="px-4 py-2.5 text-zinc-200 font-medium">{r.productName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{r.batchNumber}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-400">{fmtDate(r.expiryDate)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">{r.qty}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${colorMap.text}`}>
                    {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d ago` : `${r.daysLeft}d`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — FARMER CREDIT
// ═══════════════════════════════════════════════════════════════════════════════
interface FarmerCreditRow {
  _id: string;
  farmerName: string;
  phone: string;
  location: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  lastSaleDate?: string;
  lastPaymentDate?: string;
}

interface LedgerEntry {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
interface FarmerLedgerResp { entries: LedgerEntry[]; totalBilled: number; totalPaid: number; outstanding: number }

const FarmerCredit: React.FC = () => {
  const [data, setData]       = useState<FarmerCreditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [selected, setSelected] = useState<FarmerCreditRow | null>(null);
  const [ledger, setLedger]   = useState<FarmerLedgerResp | null>(null);
  const [ledgerLoad, setLedgerLoad] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await apiFetch<FarmerCreditRow[]>('/reports/farmer-credit')); }
    catch (e: any) { setError(e.message ?? 'Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openFarmer = async (row: FarmerCreditRow) => {
    setSelected(row); setLedger(null); setLedgerLoad(true);
    try {
      setLedger(await apiFetch<FarmerLedgerResp>(`/reports/farmer-credit/${row._id}/ledger`));
    } catch { setLedger(null); }
    finally { setLedgerLoad(false); }
  };

  const sorted = [...data].sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading && <LoadingState label="Loading farmer credit…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !data.length && <EmptyState label="No farmer credit records" />}
        {!loading && !error && !!data.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Farmer</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-right">Total Billed</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3 text-left">Last Sale</th>
                  <th className="px-4 py-3 text-left">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                    className="hover:bg-white/2 transition-all cursor-pointer"
                    onClick={() => openFarmer(r)}>
                    <td className="px-4 py-3 font-medium text-zinc-100">{r.farmerName}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs flex items-center gap-1"><Phone size={10} />{r.phone}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{r.location || '—'}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{fmtRs(r.totalBilled)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{fmtRs(r.totalPaid)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {fmtRs(r.outstanding)}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(r.lastSaleDate)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(r.lastPaymentDate)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credit History Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900">
                <div>
                  <h3 className="font-display font-bold">{selected.farmerName} — Credit History</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1"><Phone size={10} />{selected.phone}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/4 rounded-xl border border-white/8 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Billed</p>
                    <p className="text-sm font-bold text-zinc-200">{fmtRs(selected.totalBilled)}</p>
                  </div>
                  <div className="p-3 bg-white/4 rounded-xl border border-white/8 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Total Paid</p>
                    <p className="text-sm font-bold text-emerald-400">{fmtRs(selected.totalPaid)}</p>
                  </div>
                  <div className="p-3 bg-white/4 rounded-xl border border-white/8 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Outstanding</p>
                    <p className={`text-sm font-bold ${selected.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmtRs(selected.outstanding)}</p>
                  </div>
                </div>

                {/* Ledger */}
                {ledgerLoad && <LoadingState label="Loading ledger…" />}
                {!ledgerLoad && ledger && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                          <th className="px-3 py-2.5 text-left">Date</th>
                          <th className="px-3 py-2.5 text-left">Description</th>
                          <th className="px-3 py-2.5 text-right">Debit</th>
                          <th className="px-3 py-2.5 text-right">Credit</th>
                          <th className="px-3 py-2.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ledger.entries.map(e => (
                          <tr key={e._id} className="hover:bg-white/2 transition-all">
                            <td className="px-3 py-2.5 text-zinc-500">{fmtDate(e.date)}</td>
                            <td className="px-3 py-2.5 text-zinc-300">{e.description}</td>
                            <td className="px-3 py-2.5 text-right text-red-400">{e.debit > 0 ? fmtRs(e.debit) : '—'}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-400">{e.credit > 0 ? fmtRs(e.credit) : '—'}</td>
                            <td className={`px-3 py-2.5 text-right font-bold ${e.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmtRs(e.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — SUPPLIER LEDGER
// ═══════════════════════════════════════════════════════════════════════════════
interface Supplier { _id: string; name: string; }
interface SupplierLedgerRow {
  _id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}
interface SupplierLedgerResp {
  ledger: SupplierLedgerRow[];
  totalPurchased: number;
  totalPaid: number;
  pendingBalance: number;
}

const SupplierLedger: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppId, setSuppId]       = useState('');
  const [data, setData]           = useState<SupplierLedgerResp | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [suppLoad, setSuppLoad]   = useState(false);

  useEffect(() => {
    setSuppLoad(true);
    apiFetch<Supplier[]>('/suppliers').then(setSuppliers).catch(() => {}).finally(() => setSuppLoad(false));
  }, []);

  const load = useCallback(async () => {
    if (!suppId) return;
    setLoading(true); setError(null);
    try { setData(await apiFetch<SupplierLedgerResp>(`/suppliers/${suppId}/ledger`)); }
    catch (e: any) { setError(e.message ?? 'Failed'); }
    finally { setLoading(false); }
  }, [suppId]);

  useEffect(() => { if (suppId) load(); }, [suppId, load]);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className={lCls}>Select Supplier</label>
          <div className="relative">
            <select value={suppId} onChange={e => setSuppId(e.target.value)} className={iCls + ' w-full pr-8'}>
              <option value="">— Select supplier —</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
        <button onClick={load} disabled={loading || !suppId} className="btn-secondary flex items-center gap-2 text-sm h-[38px]">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Total Purchased" value={fmtRs(data.totalPurchased)} icon={<ShoppingCart size={15} />} />
          <SummaryCard label="Total Paid" value={fmtRs(data.totalPaid)} color="text-emerald-400" icon={<CheckCircle2 size={15} />} />
          <SummaryCard label="Pending Balance" value={fmtRs(data.pendingBalance)} color={data.pendingBalance > 0 ? 'text-red-400' : 'text-emerald-400'} icon={<Clock size={15} />} />
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {!suppId && <EmptyState label="Select a supplier to view their ledger" />}
        {suppId && loading && <LoadingState label="Loading ledger…" />}
        {suppId && !loading && error && <ErrorState message={error} onRetry={load} />}
        {suppId && !loading && !error && data && !data.ledger.length && <EmptyState label="No ledger entries for this supplier" />}
        {suppId && !loading && !error && data && !!data.ledger.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.ledger.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                    className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.description}</td>
                    <td className="px-4 py-3 text-right text-red-400">{r.debit > 0 ? fmtRs(r.debit) : '—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{r.credit > 0 ? fmtRs(r.credit) : '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{fmtRs(r.balance)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{data.ledger.length} entries</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — GST REPORT
// ═══════════════════════════════════════════════════════════════════════════════
interface GSTRow {
  _id: string;
  invoiceNumber: string;
  date: string;
  farmerName: string;
  taxable: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}
interface GSTSummary {
  totalSales: number;
  taxableAmount: number;
  totalGst: number;
  byRate: { rate: number; taxable: number; gst: number }[];
}
interface GSTData { summary: GSTSummary; rows: GSTRow[] }

const GSTReport: React.FC = () => {
  const [from, setFrom]   = useState(monthStart());
  const [to, setTo]       = useState(today());
  const [rate, setRate]   = useState('');
  const [data, setData]   = useState<GSTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ from, to, ...(rate ? { rate } : {}) }).toString();
      setData(await apiFetch<GSTData>(`/reports/gst?${qs}`));
    } catch (e: any) { setError(e.message ?? 'Failed'); }
    finally { setLoading(false); }
  }, [from, to, rate]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[130px]"><label className={lCls}>From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[130px]"><label className={lCls}>To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[130px]">
          <label className={lCls}>GST Rate</label>
          <select value={rate} onChange={e => setRate(e.target.value)} className={iCls + ' w-full'}>
            <option value="">All</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-[38px]">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => downloadCsv(`/reports/gst?from=${from}&to=${to}&format=csv`)} className="btn-primary flex items-center gap-2 text-sm h-[38px]">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard label="Total Sales" value={fmtRs(summary.totalSales)} icon={<IndianRupee size={15} />} />
            <SummaryCard label="Taxable Amount" value={fmtRs(summary.taxableAmount)} color="text-blue-400" icon={<Receipt size={15} />} />
            <SummaryCard label="Total GST Collected" value={fmtRs(summary.totalGst)} color="text-emerald-400" icon={<TrendingUp size={15} />} />
          </div>
          {summary.byRate.length > 0 && (
            <div className="glass-panel p-4">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">GST Breakup by Rate</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {summary.byRate.map(b => (
                  <div key={b.rate} className="p-3 bg-white/4 rounded-xl border border-white/8">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{b.rate}%</p>
                    <p className="text-xs text-zinc-400">Taxable: {fmtRs(b.taxable)}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">GST: {fmtRs(b.gst)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading && <LoadingState label="Loading GST data…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !data?.rows.length && <EmptyState label="No GST records for this period" />}
        {!loading && !error && !!data?.rows.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Invoice#</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Farmer</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST Rate</th>
                  <th className="px-4 py-3 text-right">GST Amount</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.rows.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                    className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-200">{r.invoiceNumber}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.farmerName}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{fmtRs(r.taxable)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/30">{r.gstRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{fmtRs(r.gstAmount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-100">{fmtRs(r.total)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{data.rows.length} records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7 — EXPENSES (Transport & Labour)
// ═══════════════════════════════════════════════════════════════════════════════
interface ExpenseRow {
  _id: string;
  date: string;
  poNumber: string;
  supplierName: string;
  category: string;
  amount: number;
  vehicleDetails?: { vehicleNumber?: string };
  notes?: string;
}
interface ExpenseSummary { [category: string]: number }
interface ExpenseData { rows: ExpenseRow[]; byCategory: ExpenseSummary }

const EXPENSE_CATEGORIES = [
  { value: 'transport',       label: 'Transport' },
  { value: 'own_vehicle_fuel',label: 'Own Vehicle Fuel' },
  { value: 'vehicle_rental',  label: 'Vehicle Rental' },
  { value: 'loading',         label: 'Loading' },
  { value: 'unloading',       label: 'Unloading' },
  { value: 'other',           label: 'Other' },
];

const Expenses: React.FC = () => {
  const [from, setFrom]     = useState(monthStart());
  const [to, setTo]         = useState(today());
  const [category, setCategory] = useState('');
  const [data, setData]     = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ from, to, ...(category ? { category } : {}) }).toString();
      setData(await apiFetch<ExpenseData>(`/reports/purchase-expenses?${qs}`));
    } catch (e: any) { setError(e.message ?? 'Failed'); }
    finally { setLoading(false); }
  }, [from, to, category]);

  useEffect(() => { load(); }, [load]);

  const totalExpense = data ? Object.values(data.byCategory).reduce((s, v) => s + v, 0) : 0;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[130px]"><label className={lCls}>From</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[130px]"><label className={lCls}>To</label><input type="date" value={to} onChange={e => setTo(e.target.value)} className={iCls + ' w-full'} /></div>
        <div className="flex-1 min-w-[160px]">
          <label className={lCls}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className={iCls + ' w-full'}>
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2 text-sm h-[38px]">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Category Summary */}
      {data && Object.keys(data.byCategory).length > 0 && (
        <div className="glass-panel p-4">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Total by Category</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXPENSE_CATEGORIES.filter(c => data.byCategory[c.value] != null).map(c => (
              <div key={c.value} className="p-3 bg-white/4 rounded-xl border border-white/8">
                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1 truncate">{c.label}</p>
                <p className="text-sm font-bold text-amber-400">{fmtRs(data.byCategory[c.value])}</p>
              </div>
            ))}
            <div className="p-3 bg-white/6 rounded-xl border border-white/10">
              <p className="text-[9px] text-zinc-400 uppercase font-bold mb-1">Total</p>
              <p className="text-sm font-bold text-zinc-100">{fmtRs(totalExpense)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        {loading && <LoadingState label="Loading expenses…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && !data?.rows.length && <EmptyState label="No expense records for this period" />}
        {!loading && !error && !!data?.rows.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-zinc-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">PO#</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.rows.map((r, i) => (
                  <motion.tr key={r._id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
                    className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{r.poNumber || '—'}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.supplierName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30 capitalize">
                        {r.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-100">{fmtRs(r.amount)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{r.vehicleDetails?.vehicleNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 max-w-[180px] truncate">{r.notes || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{data.rows.length} records</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type TabId = 'sales' | 'purchases' | 'stock' | 'farmer-credit' | 'supplier-ledger' | 'gst' | 'expenses';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'sales',           label: 'Sales Report',      icon: <BarChart3 size={15} /> },
  { id: 'purchases',       label: 'Purchase Report',   icon: <ShoppingCart size={15} /> },
  { id: 'stock',           label: 'Stock & Inventory', icon: <Package size={15} /> },
  { id: 'farmer-credit',   label: 'Farmer Credit',     icon: <Users size={15} /> },
  { id: 'supplier-ledger', label: 'Supplier Ledger',   icon: <BookOpen size={15} /> },
  { id: 'gst',             label: 'GST Report',        icon: <Receipt size={15} /> },
  { id: 'expenses',        label: 'Expenses',          icon: <Truck size={15} /> },
];

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('sales');

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BarChart3 size={15} className="text-violet-400" />
          </div>
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Shop ERP</span>
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Reports</h1>
        <p className="text-zinc-400 text-sm">
          Comprehensive sales, purchase, stock, credit, GST and expense reports.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-white/4 rounded-2xl border border-white/8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'sales'           && <SalesReport />}
          {activeTab === 'purchases'       && <PurchaseReport />}
          {activeTab === 'stock'           && <StockInventory />}
          {activeTab === 'farmer-credit'   && <FarmerCredit />}
          {activeTab === 'supplier-ledger' && <SupplierLedger />}
          {activeTab === 'gst'             && <GSTReport />}
          {activeTab === 'expenses'        && <Expenses />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportsPage;
