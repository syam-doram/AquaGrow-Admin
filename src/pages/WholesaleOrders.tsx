/**
 * WholesaleOrders.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner page: create and manage purchase orders to wholesale suppliers.
 *
 * Flow: Draft → Sent → Received | Cancelled
 *
 * Endpoints:
 *   GET    /api/purchase-orders          → list all POs
 *   POST   /api/purchase-orders          → create new PO
 *   PUT    /api/purchase-orders/:id      → update / change status
 *   DELETE /api/purchase-orders/:id      → cancel PO
 *
 * All amounts plain ₹.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, X, Edit2, Trash2, ChevronDown, Package, Loader2, Send,
  Truck, XCircle, Eye, IndianRupee, CalendarDays, Phone, MapPin,
  FileText, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────
type POStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';

interface Product {
  _id: string;
  name: string;
  code: string;
  baseStockUnit: string;
  packSize?: number;
  category?: string;
}

interface POItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  packSize?: number;
  expectedRate?: number;
  receivedQty?: number;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: string;
  supplierPhone?: string;
  supplierAddress?: string;
  status: POStatus;
  items: POItem[];
  expectedDeliveryDate?: string;
  notes?: string;
  totalExpectedAmount: number;
  createdAt: string;
  sentAt?: string;
  receivedAt?: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<POStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft:              { label: 'Draft',              color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',   icon: <FileText size={10} /> },
  sent:               { label: 'Sent',               color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   icon: <Send size={10} /> },
  partially_received: { label: 'Partial Receipt',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: <Truck size={10} /> },
  received:           { label: 'Received',           color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 size={10} /> },
  cancelled:          { label: 'Cancelled',          color: 'bg-red-500/15 text-red-400 border-red-500/30',      icon: <XCircle size={10} /> },
};

const fmtRs   = (n?: number) => n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: POStatus }) => {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
};

// ─── Inline Spinner ───────────────────────────────────────────────────────────
const Spinner = () => <Loader2 size={15} className="animate-spin" />;

// ─── Create / Edit PO Modal ───────────────────────────────────────────────────
interface POFormState {
  supplier: string;
  supplierPhone: string;
  supplierAddress: string;
  expectedDeliveryDate: string;
  notes: string;
  items: {
    productId: string;
    productName: string;
    unit: string;
    packSize: number;
    quantity: string;
    expectedRate: string;
  }[];
}

const POModal = ({
  mode,
  po,
  products,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit';
  po: PurchaseOrder | null;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<POFormState>({
    supplier:             po?.supplier ?? '',
    supplierPhone:        po?.supplierPhone ?? '',
    supplierAddress:      po?.supplierAddress ?? '',
    expectedDeliveryDate: po?.expectedDeliveryDate ? po.expectedDeliveryDate.slice(0, 10) : '',
    notes:                po?.notes ?? '',
    items: po?.items.map(it => ({
      productId:   it.productId,
      productName: it.productName,
      unit:        it.unit,
      packSize:    it.packSize ?? 0,
      quantity:    String(it.quantity),
      expectedRate: String(it.expectedRate ?? ''),
    })) ?? [],
  });

  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProds = products.filter(p =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProduct = (p: Product) => {
    if (form.items.find(i => i.productId === p._id)) {
      setShowProductDrop(false); setProductSearch(''); return;
    }
    setForm(f => ({
      ...f,
      items: [...f.items, {
        productId:   p._id,
        productName: p.name,
        unit:        p.baseStockUnit,
        packSize:    p.packSize ?? 0,
        quantity:    '',
        expectedRate: '',
      }],
    }));
    setProductSearch('');
    setShowProductDrop(false);
  };

  const updateItem = (idx: number, field: 'quantity' | 'expectedRate', val: string) =>
    setForm(f => ({ ...f, items: f.items.map((it, i) => i !== idx ? it : { ...it, [field]: val }) }));

  const removeItem = (idx: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const totalExpected = form.items.reduce(
    (s, it) => s + (parseFloat(it.expectedRate) || 0) * (parseFloat(it.quantity) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier.trim()) return setError('Supplier name is required');
    if (!form.items.length)   return setError('Add at least one product');
    for (const it of form.items) {
      if (!parseFloat(it.quantity) || parseFloat(it.quantity) <= 0)
        return setError(`Enter quantity for ${it.productName}`);
    }
    setError(null);
    setLoading(true);
    try {
      const payload = {
        supplier:             form.supplier.trim(),
        supplierPhone:        form.supplierPhone.trim(),
        supplierAddress:      form.supplierAddress.trim(),
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes:                form.notes.trim(),
        items: form.items.map(it => ({
          productId:   it.productId,
          productName: it.productName,
          unit:        it.unit,
          packSize:    it.packSize || undefined,
          quantity:    parseFloat(it.quantity),
          expectedRate: parseFloat(it.expectedRate) || undefined,
        })),
      };
      if (isEdit && po) {
        await apiFetch(`/purchase-orders/${po._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const iCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
  const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

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
          <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <ShoppingBag size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Order products from wholesale supplier</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}

            {/* Supplier info */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Supplier Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={lCls}>Supplier / Wholesaler Name *</label>
                  <input type="text" value={form.supplier}
                    onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    placeholder="e.g. CP Foods Distributors" className={iCls} required />
                </div>
                <div>
                  <label className={lCls}>Supplier Phone</label>
                  <input type="tel" value={form.supplierPhone}
                    onChange={e => setForm(f => ({ ...f, supplierPhone: e.target.value }))}
                    placeholder="10-digit number" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Expected Delivery Date</label>
                  <input type="date" value={form.expectedDeliveryDate}
                    onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                    className={iCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={lCls}>Supplier Address</label>
                  <input type="text" value={form.supplierAddress}
                    onChange={e => setForm(f => ({ ...f, supplierAddress: e.target.value }))}
                    placeholder="City / area (optional)" className={iCls} />
                </div>
              </div>
            </div>

            {/* Products to order */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Products to Order *</p>

              {/* Product search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
                  onFocus={() => setShowProductDrop(true)}
                  placeholder="Search product to add…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500/60 transition placeholder:text-zinc-600"
                />
                {showProductDrop && filteredProds.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredProds.slice(0, 15).map(p => (
                      <button key={p._id} type="button" onClick={() => addProduct(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-zinc-500 text-xs shrink-0">{p.code} · {p.baseStockUnit}{p.packSize ? ` · ${p.packSize}${p.baseStockUnit}/bag` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items list */}
              {form.items.length === 0 && (
                <p className="text-center text-zinc-600 text-sm py-4 bg-white/3 rounded-xl border border-white/8">
                  Search above to add products to order
                </p>
              )}
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={item.productId} className="bg-white/4 border border-white/8 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.productName}</p>
                        <p className="text-[10px] text-zinc-500">{item.unit}{item.packSize > 0 ? ` · ${item.packSize}${item.unit}/bag` : ''}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">
                          Qty ({item.packSize > 0 ? 'bags' : item.unit}) *
                        </label>
                        <input type="number" min="0.01" step={item.packSize > 0 ? '1' : 'any'}
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                        {item.packSize > 0 && parseFloat(item.quantity) > 0 && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">{(parseFloat(item.quantity) * item.packSize).toLocaleString('en-IN')} {item.unit} total</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">
                          Expected Rate (₹/{item.unit})
                        </label>
                        <input type="number" min="0" step="0.01"
                          value={item.expectedRate}
                          onChange={e => updateItem(idx, 'expectedRate', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="block text-[10px] text-zinc-500 mb-1">Line Total</label>
                        <p className="text-sm font-bold text-white py-1.5">
                          {parseFloat(item.expectedRate) > 0 && parseFloat(item.quantity) > 0
                            ? fmtRs((parseFloat(item.expectedRate)) * (
                                item.packSize > 0
                                  ? parseFloat(item.quantity) * item.packSize
                                  : parseFloat(item.quantity)
                              ))
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              {form.items.length > 0 && (
                <div className="flex justify-between items-center px-1 pt-2 border-t border-white/8 mt-2">
                  <span className="text-sm text-zinc-400">Expected Total</span>
                  <span className="text-base font-bold text-white">{fmtRs(totalExpected)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className={lCls}>Notes / Remarks</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any special instructions or notes…" className={iCls} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : (isEdit ? <Edit2 size={14} /> : <Plus size={14} />)}
                {isEdit ? 'Save Changes' : 'Create Order'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Detail / View Modal ──────────────────────────────────────────────────────
const PODetailModal = ({
  po,
  onClose,
  onStatusChange,
  onEdit,
  onCancel,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: POStatus) => Promise<void>;
  onEdit: () => void;
  onCancel: (id: string) => Promise<void>;
}) => {
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status: POStatus) => {
    setUpdating(true);
    try { await onStatusChange(po._id, status); onClose(); }
    finally { setUpdating(false); }
  };

  const cancelOrder = async () => {
    if (!confirm(`Cancel order ${po.orderNumber}? This cannot be undone.`)) return;
    setUpdating(true);
    try { await onCancel(po._id); onClose(); }
    finally { setUpdating(false); }
  };

  return (
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
              <h3 className="font-display font-bold">{po.orderNumber}</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={po.status} />
                <span className="text-xs text-zinc-500">{fmtDate(po.createdAt)}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>

          <div className="p-5 space-y-4">
            {/* Supplier */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Supplier</p>
              <p className="text-sm font-bold text-zinc-100">{po.supplier}</p>
              {po.supplierPhone && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Phone size={11} /> {po.supplierPhone}</p>
              )}
              {po.supplierAddress && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5"><MapPin size={11} /> {po.supplierAddress}</p>
              )}
              {po.expectedDeliveryDate && (
                <p className="text-xs text-zinc-400 flex items-center gap-1.5"><CalendarDays size={11} /> Expected: {fmtDate(po.expectedDeliveryDate)}</p>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Items Ordered</p>
              <div className="space-y-2">
                {po.items.map((it, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/3 border border-white/5 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-zinc-100">{it.productName}</p>
                        <p className="text-zinc-500 mt-0.5">
                          {it.quantity} {it.packSize && it.packSize > 0 ? `bags (${it.quantity * it.packSize} ${it.unit})` : it.unit}
                          {it.expectedRate ? ` · ${fmtRs(it.expectedRate)}/${it.unit}` : ''}
                        </p>
                      </div>
                      {it.expectedRate && (
                        <p className="font-bold text-zinc-200">
                          {fmtRs(it.expectedRate * (it.packSize && it.packSize > 0 ? it.quantity * it.packSize : it.quantity))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {po.totalExpectedAmount > 0 && (
                <div className="flex justify-between items-center px-1 pt-2 border-t border-white/8 mt-2">
                  <span className="text-xs text-zinc-500">Expected Total</span>
                  <span className="text-sm font-bold text-white">{fmtRs(po.totalExpectedAmount)}</span>
                </div>
              )}
            </div>

            {po.notes && (
              <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-xs text-zinc-400">
                <span className="text-zinc-500 font-bold">Notes: </span>{po.notes}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {po.status !== 'cancelled' && po.status !== 'received' && (
            <div className="p-5 border-t border-white/5 space-y-2">
              {po.status === 'draft' && (
                <button onClick={() => changeStatus('sent')} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-bold transition disabled:opacity-50">
                  {updating ? <Spinner /> : <Send size={14} />} Mark as Sent to Supplier
                </button>
              )}
              {(po.status === 'sent' || po.status === 'partially_received') && (
                <button onClick={() => changeStatus('received')} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold transition disabled:opacity-50">
                  {updating ? <Spinner /> : <CheckCircle2 size={14} />} Mark as Received
                </button>
              )}
              {po.status === 'draft' && (
                <button onClick={onEdit} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition">
                  <Edit2 size={13} /> Edit Order
                </button>
              )}
              <button onClick={cancelOrder} disabled={updating}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-bold transition disabled:opacity-50">
                {updating ? <Spinner /> : <XCircle size={13} />} Cancel Order
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const WholesaleOrders: React.FC = () => {
  const [orders, setOrders]       = useState<PurchaseOrder[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editPO, setEditPO]       = useState<PurchaseOrder | null>(null);
  const [viewPO, setViewPO]       = useState<PurchaseOrder | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ords, prods] = await Promise.all([
        apiFetch<PurchaseOrder[]>('/purchase-orders'),
        apiFetch<Product[]>('/products'),
      ]);
      setOrders(ords);
      setProducts(prods);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: POStatus) => {
    await apiFetch(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    showToast(`Order marked as ${STATUS_META[status].label}`);
    await load();
  };

  const handleCancel = async (id: string) => {
    await apiFetch(`/purchase-orders/${id}`, { method: 'DELETE' });
    showToast('Order cancelled');
    await load();
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    orders.length,
    draft:    orders.filter(o => o.status === 'draft').length,
    sent:     orders.filter(o => o.status === 'sent').length,
    received: orders.filter(o => o.status === 'received').length,
  };

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
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShoppingBag size={15} className="text-blue-400" />
            </div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Wholesale Orders</h1>
          <p className="text-zinc-400 text-sm">Create and track purchase orders to wholesale suppliers. Orders can be marked sent, received, or cancelled.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => { setEditPO(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total,    color: 'text-zinc-100',    icon: <ShoppingBag size={16} /> },
          { label: 'Draft',        value: stats.draft,    color: 'text-zinc-400',    icon: <FileText size={16} /> },
          { label: 'Sent',         value: stats.sent,     color: 'text-blue-400',    icon: <Send size={16} /> },
          { label: 'Received',     value: stats.received, color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
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
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order number or supplier…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8 flex-wrap">
            {(['all', 'draft', 'sent', 'partially_received', 'received', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  statusFilter === f ? 'bg-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}>
                {f === 'all' ? 'All' : f === 'partially_received' ? 'Partial' : STATUS_META[f as POStatus].label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading orders…</p>
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
            <ShoppingBag size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {orders.length === 0 ? 'No purchase orders yet' : 'No orders match filters'}
            </p>
            <p className="text-zinc-600 text-sm mb-4">
              {orders.length === 0 ? 'Create your first wholesale order to track supplier purchases.' : 'Try adjusting your search or filter.'}
            </p>
            {orders.length === 0 && (
              <button onClick={() => { setEditPO(null); setShowModal(true); }} className="btn-primary text-sm">
                Create First Order
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && !error && filtered.length > 0 && (
          <div className="divide-y divide-white/5">
            {filtered.map((o, i) => (
              <motion.div
                key={o._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="p-4 flex items-center gap-4 hover:bg-white/2 transition-all cursor-pointer"
                onClick={() => setViewPO(o)}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  o.status === 'received'  ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  o.status === 'sent'      ? 'bg-blue-500/10 border border-blue-500/20' :
                  o.status === 'cancelled' ? 'bg-red-500/10 border border-red-500/20' :
                  'bg-zinc-500/10 border border-zinc-500/20'
                }`}>
                  <ShoppingBag size={14} className={
                    o.status === 'received'  ? 'text-emerald-400' :
                    o.status === 'sent'      ? 'text-blue-400' :
                    o.status === 'cancelled' ? 'text-red-400' :
                    'text-zinc-400'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-100">{o.orderNumber}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500">{o.supplier}</span>
                    <span className="text-[10px] text-zinc-600">{o.items.length} product{o.items.length !== 1 ? 's' : ''}</span>
                    {o.expectedDeliveryDate && (
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <CalendarDays size={9} /> {fmtDate(o.expectedDeliveryDate)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden md:block text-right shrink-0">
                  {o.totalExpectedAmount > 0 && (
                    <p className="text-sm font-bold text-zinc-200">{fmtRs(o.totalExpectedAmount)}</p>
                  )}
                  <p className="text-[10px] text-zinc-600">{fmtDate(o.createdAt)}</p>
                </div>

                <Eye size={13} className="text-zinc-600 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-zinc-600">{filtered.length} of {orders.length} orders</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <POModal
          mode={editPO ? 'edit' : 'create'}
          po={editPO}
          products={products}
          onClose={() => { setShowModal(false); setEditPO(null); }}
          onSaved={() => { load(); showToast(editPO ? 'Order updated' : 'Purchase order created'); }}
        />
      )}
      {viewPO && (
        <PODetailModal
          po={viewPO}
          onClose={() => setViewPO(null)}
          onStatusChange={handleStatusChange}
          onEdit={() => { setEditPO(viewPO); setViewPO(null); setShowModal(true); }}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default WholesaleOrders;
