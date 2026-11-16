/**
 * StockInwardReview.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner view: see all stock receipts, filter by status, view details.
 * Staff-entered receipts appear here with "Rate Pending" until owner costs them.
 *
 * Endpoints (backend field names confirmed from routes/receipts.ts & db.ts):
 *   GET /receipts              → array of Receipt documents (populated items.productId)
 *   GET /receipts/:id          → single receipt detail
 *
 * Receipt shape returned by backend:
 *   _id, supplier, invoiceNumber, receiptDate, createdAt,
 *   purchaseCostPending: boolean,
 *   purchaseCostDetails: { purchaseDiscountPercent, purchaseCost, taxAmount, transportCharges, totalEffectiveCost }
 *   items: [{ productId: { _id, name, code, unit }, quantity, packSize, unit }]
 *   createdBy: string (user ID)
 *   attachmentUrl?: string
 *
 * All amounts are plain ₹ (NOT paise).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, ChevronRight, Eye, X, Loader2,
  ArrowRight, FileText, Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PopulatedProduct {
  _id: string;
  name: string;
  code?: string;
  unit?: string;
}

interface ReceiptItem {
  productId: PopulatedProduct | string;
  batchId?: string;
  quantity: number;
  packSize?: number;
  unit?: string;
}

interface PurchaseCostDetails {
  purchaseDiscountPercent?: number;
  purchaseCost?: number;
  taxAmount?: number;
  transportCharges?: number;
  totalEffectiveCost?: number;
}

interface StockReceipt {
  _id: string;
  supplier: string;
  invoiceNumber?: string;
  receiptDate: string;
  createdAt: string;
  purchaseCostPending: boolean;
  purchaseCostDetails?: PurchaseCostDetails;
  items: ReceiptItem[];
  attachmentUrl?: string;
  createdBy?: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
// Backend amounts are plain ₹
const fmtRs   = (n?: number) => n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

// Get the first item's product name from populated response
function firstProductName(receipt: StockReceipt): string {
  const item = receipt.items?.[0];
  if (!item) return 'Unknown Product';
  if (typeof item.productId === 'object' && item.productId !== null) {
    return item.productId.name ?? 'Unknown Product';
  }
  return 'Unknown Product';
}

// Get summary of items (product names)
function itemsSummary(receipt: StockReceipt): string {
  if (!receipt.items?.length) return '—';
  return receipt.items.map(it => {
    const name = typeof it.productId === 'object' && it.productId !== null
      ? it.productId.name
      : 'Product';
    return `${it.quantity} ${it.unit ?? ''} ${name}`.trim();
  }).join(', ');
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const ReceiptModal = ({ receipt, onClose, onCost }: {
  receipt: StockReceipt;
  onClose: () => void;
  onCost: () => void;
}) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900">
          <div>
            <h3 className="font-display font-bold">Stock Receipt Detail</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{receipt.supplier}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Basic info */}
          {[
            ['Supplier',    receipt.supplier],
            ['Invoice No.', receipt.invoiceNumber ?? '—'],
            ['Receipt Date', fmtDate(receipt.receiptDate)],
            ['Created',     fmtDate(receipt.createdAt)],
            ['Status',      receipt.purchaseCostPending ? 'Rate Pending' : 'Costed'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 text-xs">
              <span className="text-zinc-500 shrink-0 w-32">{label}</span>
              <span className={`text-right font-medium ${
                label === 'Status'
                  ? (receipt.purchaseCostPending ? 'text-amber-400' : 'text-emerald-400')
                  : 'text-zinc-200'
              }`}>{value}</span>
            </div>
          ))}

          {/* Items */}
          <div className="pt-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Items</p>
            <div className="space-y-2">
              {receipt.items.map((it, idx) => {
                const prod = typeof it.productId === 'object' && it.productId !== null ? it.productId : null;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-white/3 border border-white/5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-100">{prod?.name ?? '—'}</span>
                      {prod?.code && <span className="text-zinc-600">{prod.code}</span>}
                    </div>
                    <p className="text-zinc-500 mt-1">{it.quantity} {it.unit ?? prod?.unit ?? 'units'}{it.packSize ? ` · pack: ${it.packSize}` : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purchase cost details if costed */}
          {!receipt.purchaseCostPending && receipt.purchaseCostDetails && (
            <div className="pt-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Cost Details</p>
              <div className="space-y-2">
                {[
                  ['Purchase Cost',     fmtRs(receipt.purchaseCostDetails.purchaseCost)],
                  ['Discount %',        `${receipt.purchaseCostDetails.purchaseDiscountPercent ?? 0}%`],
                  ['Tax Amount',        fmtRs(receipt.purchaseCostDetails.taxAmount)],
                  ['Transport',         fmtRs(receipt.purchaseCostDetails.transportCharges)],
                  ['Total Effective',   fmtRs(receipt.purchaseCostDetails.totalEffectiveCost)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-xs">
                    <span className="text-zinc-500 shrink-0 w-32">{label}</span>
                    <span className="text-zinc-200 text-right font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {receipt.purchaseCostPending && (
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

  // Auto-refresh when user returns to this tab (e.g. after completing costing in another tab)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const filtered = receipts.filter(r => {
    const name = firstProductName(r).toLowerCase();
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      (r.supplier ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'pending' &&  r.purchaseCostPending) ||
      (filter === 'costed'  && !r.purchaseCostPending);
    return matchSearch && matchFilter;
  });

  const stats = {
    total:   receipts.length,
    pending: receipts.filter(r =>  r.purchaseCostPending).length,
    costed:  receipts.filter(r => !r.purchaseCostPending).length,
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
              placeholder="Search product, supplier, invoice…"
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
            {filtered.map((r, i) => {
              const costed = !r.purchaseCostPending;
              return (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    costed
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    <Package size={14} className={costed ? 'text-emerald-400' : 'text-amber-400'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-zinc-100">{firstProductName(r)}</p>
                      {r.items.length > 1 && (
                        <span className="text-[9px] text-zinc-500">+{r.items.length - 1} more</span>
                      )}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        costed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {costed ? 'Costed' : 'Rate Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500">{r.supplier}</span>
                      {r.invoiceNumber && <span className="text-[10px] text-zinc-600">Inv: {r.invoiceNumber}</span>}
                      <span className="text-[10px] text-zinc-600">{fmtDate(r.receiptDate)}</span>
                    </div>
                  </div>

                  <div className="hidden md:block text-right shrink-0">
                    <p className="text-xs font-bold text-zinc-200">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</p>
                    {costed && r.purchaseCostDetails?.totalEffectiveCost != null && (
                      <p className="text-[10px] text-emerald-400">{fmtRs(r.purchaseCostDetails.totalEffectiveCost)}</p>
                    )}
                  </div>

                  <Eye size={13} className="text-zinc-600 shrink-0" />
                </motion.div>
              );
            })}
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
