/**
 * StockInwardReview.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner view: see all stock receipts, filter by status, view details.
 * Staff-entered receipts appear here with "Rate Pending" until owner costs them.
 *
 * Endpoints:
 *   GET /receipts              → all stock receipts
 *   GET /receipts/:id          → single receipt detail
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Calendar, ChevronRight, Eye, X, Loader2,
  ArrowRight, FileText, Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────
interface StockReceipt {
  _id: string;
  supplierName?: string;
  invoiceNumber?: string;
  receiptDate: string;
  productId?: string;
  productName?: string;
  batchNumber?: string;
  expiryDate?: string;
  enteredQty: number;
  unit: string;
  quantityBase: number;
  baseUnit: string;
  packSize?: number;
  costingComplete: boolean;
  purchaseRatePaise?: number;
  approvedSellingRatePaise?: number;
  createdByName?: string;
  shopId?: string;
  createdAt: string;
  attachmentUrl?: string;
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

const fetchReceipts = () => apiFetch<StockReceipt[]>('/receipts');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtRs   = (p?: number) => p != null ? `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const Spinner = () => <Loader2 size={15} className="animate-spin" />;

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const ReceiptModal = ({ receipt, onClose, onCost }: { receipt: StockReceipt; onClose: () => void; onCost: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold">Stock Receipt Detail</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{receipt.productName ?? 'Unknown Product'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            ['Product',    receipt.productName ?? '—'],
            ['Supplier',   receipt.supplierName ?? '—'],
            ['Invoice No.', receipt.invoiceNumber ?? '—'],
            ['Receipt Date', fmtDate(receipt.receiptDate)],
            ['Batch No.',  receipt.batchNumber ?? '—'],
            ['Expiry',     fmtDate(receipt.expiryDate)],
            ['Quantity Entered', `${receipt.enteredQty} ${receipt.unit}`],
            ['Base Quantity',    `${receipt.quantityBase} ${receipt.baseUnit}`],
            ['Pack Size',  receipt.packSize ? `${receipt.packSize} ${receipt.baseUnit}` : '—'],
            ['Recorded By', receipt.createdByName ?? '—'],
            ['Shop',       receipt.shopId ?? '—'],
            ['Costed At',  receipt.costingComplete ? (receipt.purchaseRatePaise ? fmtRs(receipt.purchaseRatePaise) + '/unit' : 'Yes') : '—'],
            ['Selling Rate', fmtRs(receipt.approvedSellingRatePaise)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 text-xs">
              <span className="text-zinc-500 shrink-0 w-32">{label}</span>
              <span className="text-zinc-200 text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
        {!receipt.costingComplete && (
          <div className="p-5 border-t border-white/5">
            <button
              onClick={() => { onClose(); onCost(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 text-sm font-bold transition-colors"
            >
              <ArrowRight size={14} />
              Go to Costing & Pricing
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const StockInwardReview: React.FC = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'pending' | 'costed'>('all');
  const [selected, setSelected] = useState<StockReceipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReceipts(await fetchReceipts());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = receipts.filter(r => {
    const matchSearch =
      (r.productName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.supplierName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.batchNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' && !r.costingComplete) ||
      (filter === 'costed'  && r.costingComplete);
    return matchSearch && matchFilter;
  });

  const stats = {
    total:   receipts.length,
    pending: receipts.filter(r => !r.costingComplete).length,
    costed:  receipts.filter(r =>  r.costingComplete).length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Boxes size={15} className="text-orange-400" />
            </div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Stock Management</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Stock Inward Review</h1>
          <p className="text-zinc-400 text-sm">All stock receipts entered by staff. Complete costing for Rate Pending entries.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/costing-pricing')}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <ArrowRight size={14} />
            Go to Costing
          </button>
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Receipts', value: stats.total,   color: 'text-zinc-100',    icon: <Package size={16} /> },
          { label: 'Rate Pending',   value: stats.pending, color: 'text-amber-400',   icon: <Clock size={16} /> },
          { label: 'Costed',         value: stats.costed,  color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
              <span className={color}>{icon}</span>
            </div>
            <p className={`text-3xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search product, supplier, invoice, batch…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
            {(['all', 'pending', 'costed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  filter === f ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {f === 'pending' ? 'Rate Pending' : f === 'costed' ? 'Costed' : 'All'}
                {f === 'pending' && stats.pending > 0 && (
                  <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded-full font-bold ${
                    filter === f ? 'bg-white/20 text-white' : 'bg-amber-500 text-zinc-900'
                  }`}>{stats.pending}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading stock receipts…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Package size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {receipts.length === 0 ? 'No stock receipts yet' : 'No receipts match filters'}
            </p>
            <p className="text-zinc-600 text-sm">Staff can enter stock receipts from the Staff Portal.</p>
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                onClick={() => setSelected(r)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  r.costingComplete
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                  <Package size={14} className={r.costingComplete ? 'text-emerald-400' : 'text-amber-400'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-100">{r.productName ?? 'Unknown Product'}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      r.costingComplete
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {r.costingComplete ? 'Costed' : 'Rate Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500">{r.supplierName ?? '—'}</span>
                    {r.invoiceNumber && <span className="text-[10px] text-zinc-600">Inv: {r.invoiceNumber}</span>}
                    {r.batchNumber   && <span className="text-[10px] text-zinc-600">Batch: {r.batchNumber}</span>}
                    <span className="text-[10px] text-zinc-600">{fmtDate(r.receiptDate)}</span>
                  </div>
                </div>

                <div className="hidden md:block text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-200">{r.enteredQty} {r.unit}</p>
                  <p className="text-[10px] text-zinc-600">{r.quantityBase} {r.baseUnit} base</p>
                </div>

                <div className="hidden lg:block text-right shrink-0">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Selling Rate</p>
                  <p className={`text-xs font-bold mt-0.5 ${r.approvedSellingRatePaise ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {fmtRs(r.approvedSellingRatePaise)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-zinc-600">By</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{r.createdByName ?? '—'}</p>
                </div>

                <Eye size={13} className="text-zinc-600 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-zinc-600">{filtered.length} of {receipts.length} receipts</p>
          </div>
        )}
      </div>

      {selected && (
        <ReceiptModal
          receipt={selected}
          onClose={() => setSelected(null)}
          onCost={() => navigate('/costing-pricing')}
        />
      )}
    </div>
  );
};

export default StockInwardReview;
