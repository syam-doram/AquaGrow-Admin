/**
 * StockCostingPricing.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner-only: Review pending stock receipts and complete purchase costing.
 * Also manages approved selling prices per product.
 *
 * Endpoints used (backend at aquagrow.onrender.com/api):
 *   GET  /receipts                    → list all stock receipts
 *   GET  /receipts/pending-costing    → receipts where costingComplete=false
 *   PUT  /receipts/:id/costing        → {purchaseRatePaise, companyDiscountPct,
 *                                        taxPct, allocatedChargesPaise,
 *                                        approvedSellingRatePaise, maxDiscountPct}
 *   GET  /products                    → list products
 *   PUT  /products/:id/selling-price  → {approvedSellingRatePaise, maxDiscountPct}
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Package, ChevronDown, Search, AlertTriangle,
  CheckCircle2, Clock, Edit3, X, RefreshCw, Loader2,
  IndianRupee, Percent, TrendingUp, FileText, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface StockReceipt {
  _id: string;
  supplierName?: string;
  invoiceNumber?: string;
  receiptDate: string;
  productName?: string;
  productId?: string;
  batchNumber?: string;
  enteredQty: number;
  unit: string;
  quantityBase: number;
  baseUnit: string;
  status: 'pending_costing' | 'costed' | 'rate_pending';
  costingComplete: boolean;
  // Costing fields (populated after owner completes)
  purchaseRatePaise?: number;
  companyDiscountPct?: number;
  taxPct?: number;
  allocatedChargesPaise?: number;
  approvedSellingRatePaise?: number;
  maxDiscountPct?: number;
  // Computed display
  createdByName?: string;
  shopId?: string;
}

interface Product {
  _id: string;
  name: string;
  category?: string;
  unit?: string;
  approvedSellingRatePaise?: number;
  maxDiscountPct?: number;
  lastCostPaise?: number;
}

interface CostingForm {
  purchaseRatePaise: string;      // per base unit, in ₹ (we convert to paise)
  companyDiscountPct: string;
  taxPct: string;
  allocatedChargesRs: string;     // ₹
  approvedSellingRateRs: string;  // ₹
  maxDiscountPct: string;
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

const fetchPendingReceipts = () =>
  apiFetch<StockReceipt[]>('/receipts/pending-costing').catch(() =>
    apiFetch<StockReceipt[]>('/receipts').then(all =>
      all.filter(r => !r.costingComplete)
    )
  );

const fetchAllReceipts = () => apiFetch<StockReceipt[]>('/receipts');
const fetchProducts    = () => apiFetch<Product[]>('/products');

const submitCosting = (id: string, body: object) =>
  apiFetch(`/receipts/${id}/costing`, { method: 'PUT', body: JSON.stringify(body) });

const updateSellingPrice = (productId: string, body: object) =>
  apiFetch(`/products/${productId}/selling-price`, { method: 'PUT', body: JSON.stringify(body) });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toPaise  = (rs: string) => Math.round(parseFloat(rs || '0') * 100);
const fromPaise = (p?: number) => p != null ? (p / 100).toFixed(2) : '—';

const fmtRs = (p?: number) => p != null ? `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const Spinner = () => <Loader2 size={15} className="animate-spin" />;

const BLANK_COSTING: CostingForm = {
  purchaseRatePaise: '',
  companyDiscountPct: '',
  taxPct: '',
  allocatedChargesRs: '',
  approvedSellingRateRs: '',
  maxDiscountPct: '',
};

// ─── Costing Modal ────────────────────────────────────────────────────────────
const CostingModal = ({
  receipt,
  onClose,
  onSaved,
}: {
  receipt: StockReceipt;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<CostingForm>({
    purchaseRatePaise:    fromPaise(receipt.purchaseRatePaise),
    companyDiscountPct:   String(receipt.companyDiscountPct ?? ''),
    taxPct:               String(receipt.taxPct ?? ''),
    allocatedChargesRs:   fromPaise(receipt.allocatedChargesPaise),
    approvedSellingRateRs: fromPaise(receipt.approvedSellingRatePaise),
    maxDiscountPct:        String(receipt.maxDiscountPct ?? ''),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: keyof CostingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Derived effective cost calculation
  const purchaseRs    = parseFloat(form.purchaseRatePaise || '0');
  const discPct       = parseFloat(form.companyDiscountPct || '0');
  const taxPct        = parseFloat(form.taxPct || '0');
  const allocChargesRs = parseFloat(form.allocatedChargesRs || '0');
  const totalQtyBase  = receipt.quantityBase || 0;

  const afterDiscount = purchaseRs * (1 - discPct / 100);
  const afterTax      = afterDiscount * (1 + taxPct / 100);
  const perUnitCharges = totalQtyBase > 0 ? allocChargesRs / totalQtyBase : 0;
  const effectiveCostPerUnit = afterTax + perUnitCharges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.purchaseRatePaise) return setError('Purchase rate is required');
    if (!form.approvedSellingRateRs) return setError('Approved selling rate is required');
    setError(null);
    setLoading(true);
    try {
      await submitCosting(receipt._id, {
        purchaseRatePaise:       toPaise(form.purchaseRatePaise),
        companyDiscountPct:      parseFloat(form.companyDiscountPct || '0'),
        taxPct:                  parseFloat(form.taxPct || '0'),
        allocatedChargesPaise:   toPaise(form.allocatedChargesRs),
        approvedSellingRatePaise: toPaise(form.approvedSellingRateRs),
        maxDiscountPct:          parseFloat(form.maxDiscountPct || '0'),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save costing');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
  const lbl = (text: string, sub?: string) => (
    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider">
      {text} {sub && <span className="text-zinc-700 normal-case">{sub}</span>}
    </label>
  );

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
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                <Calculator size={15} className="text-lime-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">Complete Purchase Costing</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {receipt.productName ?? 'Unknown Product'} · {receipt.supplierName ?? '—'} · {fmtDate(receipt.receiptDate)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            {/* Receipt summary */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold">Quantity Received</p>
                <p className="text-zinc-200 font-bold mt-0.5">{receipt.enteredQty} {receipt.unit}</p>
                <p className="text-zinc-600 text-[10px]">{receipt.quantityBase} {receipt.baseUnit} base</p>
              </div>
              <div>
                <p className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold">Batch / Invoice</p>
                <p className="text-zinc-200 font-bold mt-0.5">{receipt.batchNumber ?? '—'}</p>
                <p className="text-zinc-600 text-[10px]">{receipt.invoiceNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold">Shop</p>
                <p className="text-zinc-200 font-bold mt-0.5">{receipt.shopId ?? '—'}</p>
                <p className="text-zinc-600 text-[10px]">by {receipt.createdByName ?? '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase rate */}
              <div>
                {lbl('Invoice Purchase Rate *', '(₹ per base unit)')}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
                  <input type="number" step="0.01" min="0" value={form.purchaseRatePaise} onChange={set('purchaseRatePaise')}
                    placeholder="0.00" className={`${inputCls} pl-7`} required />
                </div>
              </div>

              {/* Company discount */}
              <div>
                {lbl('Company Purchase Discount', '(%)')}
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={form.companyDiscountPct} onChange={set('companyDiscountPct')}
                    placeholder="0.00" className={`${inputCls} pr-7`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                </div>
              </div>

              {/* Tax */}
              <div>
                {lbl('Tax / GST', '(%)')}
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={form.taxPct} onChange={set('taxPct')}
                    placeholder="0.00" className={`${inputCls} pr-7`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                </div>
              </div>

              {/* Allocated charges */}
              <div>
                {lbl('Allocated Purchase Charges', '(₹ total — split across qty)')}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
                  <input type="number" step="0.01" min="0" value={form.allocatedChargesRs} onChange={set('allocatedChargesRs')}
                    placeholder="0.00" className={`${inputCls} pl-7`} />
                </div>
              </div>

              {/* Approved selling rate */}
              <div>
                {lbl('Approved Selling Rate *', '(₹ per base unit)')}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
                  <input type="number" step="0.01" min="0" value={form.approvedSellingRateRs} onChange={set('approvedSellingRateRs')}
                    placeholder="0.00" className={`${inputCls} pl-7`} required />
                </div>
              </div>

              {/* Max discount */}
              <div>
                {lbl('Max Authorized Discount', '(%)')}
                <div className="relative">
                  <input type="number" step="0.01" min="0" max="100" value={form.maxDiscountPct} onChange={set('maxDiscountPct')}
                    placeholder="0.00" className={`${inputCls} pr-7`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Live cost preview */}
            {purchaseRs > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
                  <Calculator size={10} /> Cost Calculation Preview
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Invoice Rate',       value: `₹${purchaseRs.toFixed(2)}` },
                    { label: 'After Company Disc', value: `₹${afterDiscount.toFixed(2)}` },
                    { label: 'After Tax',           value: `₹${afterTax.toFixed(2)}` },
                    { label: 'Effective Cost/Unit', value: `₹${effectiveCostPerUnit.toFixed(2)}`, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`p-2.5 rounded-lg ${highlight ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/3'}`}>
                      <p className="text-zinc-500 text-[9px] uppercase tracking-wider">{label}</p>
                      <p className={`font-bold mt-0.5 ${highlight ? 'text-emerald-400' : 'text-zinc-200'}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {form.approvedSellingRateRs && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-6 text-xs">
                    <span className="text-zinc-500">Margin: <span className="text-emerald-400 font-bold">
                      {effectiveCostPerUnit > 0
                        ? `${(((parseFloat(form.approvedSellingRateRs) - effectiveCostPerUnit) / effectiveCostPerUnit) * 100).toFixed(1)}%`
                        : '—'}
                    </span></span>
                    <span className="text-zinc-500">Total stock value: <span className="text-zinc-200 font-bold">
                      ₹{(effectiveCostPerUnit * totalQtyBase).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span></span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <CheckCircle2 size={14} />}
                Complete Costing
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Selling Price Edit Modal ─────────────────────────────────────────────────
const SellingPriceModal = ({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [rateRs, setRateRs]   = useState(fromPaise(product.approvedSellingRatePaise));
  const [discPct, setDiscPct] = useState(String(product.maxDiscountPct ?? ''));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateRs || parseFloat(rateRs) <= 0) return setError('Valid selling rate is required');
    setError(null);
    setLoading(true);
    try {
      await updateSellingPrice(product._id, {
        approvedSellingRatePaise: toPaise(rateRs),
        maxDiscountPct:           parseFloat(discPct || '0'),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <IndianRupee size={15} className="text-lime-400" />
              <h3 className="font-display font-bold text-sm">Update Selling Price</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-500"><X size={15} /></button>
          </div>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <p className="text-xs text-zinc-400">{product.name} · {product.category ?? '—'}</p>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle size={12} /> {error}
              </div>
            )}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider">
                Approved Selling Rate (₹ / {product.unit ?? 'unit'}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
                <input type="number" step="0.01" min="0" value={rateRs} onChange={e => setRateRs(e.target.value)}
                  placeholder="0.00" className={`${inputCls} pl-7`} required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider">Max Authorized Discount (%)</label>
              <div className="relative">
                <input type="number" step="0.01" min="0" max="100" value={discPct} onChange={e => setDiscPct(e.target.value)}
                  placeholder="0.00" className={`${inputCls} pr-7`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {loading ? <Spinner /> : <CheckCircle2 size={12} />}
                Save Price
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StockCostingPricing: React.FC = () => {
  const [tab, setTab]           = useState<'pending' | 'products'>('pending');
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [costingTarget, setCostingTarget] = useState<StockReceipt | null>(null);
  const [priceTarget, setPriceTarget]     = useState<Product | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, p] = await Promise.all([fetchPendingReceipts(), fetchProducts()]);
      setReceipts(r);
      setProducts(p);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredReceipts = receipts.filter(r =>
    (r.productName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.supplierName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.invoiceNumber ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-xl ${
              toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <Calculator size={15} className="text-lime-400" />
            </div>
            <span className="text-xs font-bold text-lime-400 uppercase tracking-widest">Owner Access</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Stock Costing & Pricing</h1>
          <p className="text-zinc-400 text-sm">Complete purchase costing for receipts and manage approved selling prices.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm shrink-0" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Costing', value: receipts.length, color: 'text-amber-400', icon: <Clock size={16} /> },
          { label: 'Products',        value: products.length,  color: 'text-blue-400',  icon: <Package size={16} /> },
          { label: 'Priced Products', value: products.filter(p => p.approvedSellingRatePaise).length, color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/8">
        {([
          { id: 'pending' as const, label: 'Pending Costing', icon: <Clock size={13} />, count: receipts.length },
          { id: 'products' as const, label: 'Product Selling Prices', icon: <IndianRupee size={13} /> },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.icon} {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-amber-500 text-zinc-900'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'pending' ? 'Search by product, supplier, invoice…' : 'Search products…'}
            className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-1">Failed to load data</p>
            <p className="text-zinc-500 text-xs mb-4">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}

        {/* Pending Costing Tab */}
        {!loading && !error && tab === 'pending' && (
          <>
            {filteredReceipts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-emerald-400 font-bold mb-1">All receipts costed!</p>
                <p className="text-zinc-500 text-sm">No pending costing entries.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredReceipts.map((r, i) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="p-5 flex items-center gap-4 hover:bg-white/2 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Package size={15} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100">{r.productName ?? 'Unknown Product'}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-zinc-500">{r.supplierName ?? '—'}</span>
                        <span className="text-[10px] text-zinc-600">Inv: {r.invoiceNumber ?? '—'}</span>
                        <span className="text-[10px] text-zinc-600">{r.enteredQty} {r.unit}</span>
                        <span className="text-[10px] text-zinc-600">{fmtDate(r.receiptDate)}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      Rate Pending
                    </span>
                    <button
                      onClick={() => setCostingTarget(r)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 text-xs font-bold transition-colors shrink-0"
                    >
                      <Calculator size={13} />
                      Complete Costing
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Products Tab */}
        {!loading && !error && tab === 'products' && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={36} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 font-bold">No products found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredProducts.map((p, i) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="p-5 flex items-center gap-4 hover:bg-white/2 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Package size={15} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{p.category ?? '—'} · per {p.unit ?? 'unit'}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-xs">
                      <div className="text-right">
                        <p className="text-zinc-600 text-[9px] uppercase tracking-wider">Selling Rate</p>
                        <p className={`font-bold mt-0.5 ${p.approvedSellingRatePaise ? 'text-emerald-400' : 'text-zinc-600'}`}>
                          {p.approvedSellingRatePaise ? fmtRs(p.approvedSellingRatePaise) : 'Not Set'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-600 text-[9px] uppercase tracking-wider">Max Discount</p>
                        <p className="text-zinc-300 font-bold mt-0.5">{p.maxDiscountPct != null ? `${p.maxDiscountPct}%` : '—'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPriceTarget(p)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors shrink-0"
                    >
                      <Edit3 size={12} />
                      {p.approvedSellingRatePaise ? 'Update Price' : 'Set Price'}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {costingTarget && (
        <CostingModal
          receipt={costingTarget}
          onClose={() => setCostingTarget(null)}
          onSaved={() => { load(); showToast('Costing completed and selling price set'); }}
        />
      )}
      {priceTarget && (
        <SellingPriceModal
          product={priceTarget}
          onClose={() => setPriceTarget(null)}
          onSaved={() => { load(); showToast('Selling price updated'); }}
        />
      )}
    </div>
  );
};

export default StockCostingPricing;
