/**
 * FarmerOrders.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Farmer purchase orders — when a farmer places an order for products that
 * will be delivered later and billed on delivery.
 *
 * NOTE: Orders do NOT create sales or deduct stock. They are fulfilled when
 * the farmer's bill is created from the delivery.
 *
 * Endpoints:
 *   GET    /api/shop-orders              → list all shop orders
 *   POST   /api/shop-orders              → create new order
 *   PUT    /api/shop-orders/:id          → update status
 *   POST   /api/shop-orders/:id/deliver  → record delivery
 *   POST   /api/shop-orders/:id/payment  → add advance payment
 *   GET    /api/farmers                  → farmer search
 *   GET    /api/products                 → product search
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, X, Truck, XCircle, Eye, IndianRupee, CalendarDays, Phone,
  FileText, Package, Loader2, ChevronDown, User, Banknote, ClipboardList,
  ArrowRight, CheckCheck, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtRs = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Inline apiFetch ──────────────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'confirmed' | 'partially_delivered' | 'delivered' | 'cancelled';

interface Farmer {
  _id: string;
  name: string;
  phoneNumber: string;
  village?: string;
  district?: string;
}

interface Product {
  _id: string;
  name: string;
  code: string;
  baseStockUnit: string;
  packSize?: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  orderedQty: number;
  deliveredQty?: number;
  expectedRate?: number;
}

interface DeliveryRecord {
  _id: string;
  deliveryNumber: string;
  deliveryDate: string;
  items: { productId: string; productName: string; deliveredQty: number; unit: string }[];
  receivedBy?: string;
  notes?: string;
}

interface PaymentRecord {
  _id: string;
  amount: number;
  method: string;
  reference?: string;
  date: string;
}

interface ShopOrder {
  _id: string;
  orderNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalOrderedAmount: number;
  totalAdvance: number;
  balance: number;
  deliveries?: DeliveryRecord[];
  payments?: PaymentRecord[];
  notes?: string;
  createdAt: string;
}

// ─── Status Meta ──────────────────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:             { label: 'Pending',            color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',     icon: <Clock size={10} /> },
  confirmed:           { label: 'Confirmed',          color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     icon: <CheckCircle2 size={10} /> },
  partially_delivered: { label: 'Partial Delivery',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: <Truck size={10} /> },
  delivered:           { label: 'Delivered',          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCheck size={10} /> },
  cancelled:           { label: 'Cancelled',          color: 'bg-red-500/15 text-red-400 border-red-500/30',        icon: <XCircle size={10} /> },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
};

const Spinner = () => <Loader2 size={15} className="animate-spin" />;

const iCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

// ─── CreateOrderModal ─────────────────────────────────────────────────────────
interface CreateOrderForm {
  farmerId: string;
  farmerName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string;
  advanceAmount: string;
  advanceMethod: 'Cash' | 'UPI';
  items: {
    productId: string;
    productName: string;
    unit: string;
    qty: string;
    expectedRate: string;
  }[];
}

const CreateOrderModal = ({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<CreateOrderForm>({
    farmerId: '',
    farmerName: '',
    orderDate: todayISO(),
    expectedDeliveryDate: '',
    notes: '',
    advanceAmount: '',
    advanceMethod: 'Cash',
    items: [],
  });

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [showFarmerDrop, setShowFarmerDrop] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const farmerRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  // Load farmers on mount and when search changes
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch<Farmer[]>(`/shop/farmers${farmerSearch ? '?q=' + encodeURIComponent(farmerSearch) : ''}`);
        setFarmers(res);
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(t);
  }, [farmerSearch]);

  // Load products once
  useEffect(() => {
    apiFetch<Product[]>('/products').then(setProducts).catch(() => {});
  }, []);

  // Click outside farmer dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (farmerRef.current && !farmerRef.current.contains(e.target as Node)) setShowFarmerDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Click outside product dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(e.target as Node)) setShowProductDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredProducts = products.filter(p =>
    !productSearch ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectFarmer = (f: Farmer) => {
    setForm(prev => ({ ...prev, farmerId: f._id, farmerName: f.name }));
    setFarmerSearch(f.name);
    setShowFarmerDrop(false);
  };

  const addProduct = (p: Product) => {
    if (form.items.find(i => i.productId === p._id)) {
      setShowProductDrop(false);
      setProductSearch('');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: p._id,
        productName: p.name,
        unit: p.baseStockUnit,
        qty: '',
        expectedRate: '',
      }],
    }));
    setProductSearch('');
    setShowProductDrop(false);
  };

  const updateItem = (idx: number, field: 'qty' | 'expectedRate' | 'unit', val: string) =>
    setForm(prev => ({ ...prev, items: prev.items.map((it, i) => i !== idx ? it : { ...it, [field]: val }) }));

  const removeItem = (idx: number) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const totalExpected = form.items.reduce(
    (s, it) => s + (parseFloat(it.expectedRate) || 0) * (parseFloat(it.qty) || 0), 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farmerId) return setError('Select a farmer');
    if (!form.items.length) return setError('Add at least one product');
    for (const it of form.items) {
      if (!parseFloat(it.qty) || parseFloat(it.qty) <= 0)
        return setError(`Enter quantity for ${it.productName}`);
    }
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        farmerId: form.farmerId,
        farmerName: form.farmerName,
        orderDate: form.orderDate,
        expectedDeliveryDate: form.expectedDeliveryDate || undefined,
        notes: form.notes.trim() || undefined,
        items: form.items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          unit: it.unit,
          orderedQty: parseFloat(it.qty),
          expectedRate: parseFloat(it.expectedRate) || undefined,
        })),
      };
      if (form.advanceAmount && parseFloat(form.advanceAmount) > 0) {
        payload.advance = {
          amount: parseFloat(form.advanceAmount),
          method: form.advanceMethod,
        };
      }
      await apiFetch('/shop-orders', { method: 'POST', body: JSON.stringify(payload) });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to create order');
    } finally {
      setLoading(false);
    }
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
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShoppingCart size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">New Farmer Order</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Order products for farmer — bill created on delivery</p>
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

            {/* Farmer Selection */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Farmer Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2 relative" ref={farmerRef}>
                  <label className={lCls}>Select Farmer *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={farmerSearch}
                      onChange={e => { setFarmerSearch(e.target.value); setForm(f => ({ ...f, farmerId: '', farmerName: '' })); setShowFarmerDrop(true); }}
                      onFocus={() => setShowFarmerDrop(true)}
                      placeholder="Search farmer by name or phone…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition placeholder:text-zinc-600"
                    />
                  </div>
                  {showFarmerDrop && farmers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {farmers.slice(0, 15).map(f => (
                        <button key={f._id} type="button" onClick={() => selectFarmer(f)}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                          <span className="text-white font-medium">{f.name}</span>
                          <span className="text-zinc-500 text-xs shrink-0">{f.phoneNumber}{f.village ? ` · ${f.village}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={lCls}>Order Date</label>
                  <input type="date" value={form.orderDate}
                    onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))}
                    className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Expected Delivery Date</label>
                  <input type="date" value={form.expectedDeliveryDate}
                    onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                    className={iCls} />
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Products *</p>
              <div className="relative mb-3" ref={productRef}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDrop(true); }}
                  onFocus={() => setShowProductDrop(true)}
                  placeholder="Search product to add…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition placeholder:text-zinc-600"
                />
                {showProductDrop && filteredProducts.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredProducts.slice(0, 15).map(p => (
                      <button key={p._id} type="button" onClick={() => addProduct(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-zinc-500 text-xs shrink-0">{p.code} · {p.baseStockUnit}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {form.items.length === 0 && (
                <p className="text-center text-zinc-600 text-sm py-4 bg-white/3 rounded-xl border border-white/8">
                  Search above to add products
                </p>
              )}
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={item.productId} className="bg-white/4 border border-white/8 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.productName}</p>
                        <p className="text-[10px] text-zinc-500">{item.unit}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">Qty ({item.unit}) *</label>
                        <input type="number" min="0.01" step="any"
                          value={item.qty}
                          onChange={e => updateItem(idx, 'qty', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-1">Expected Rate (₹/{item.unit})</label>
                        <input type="number" min="0" step="0.01"
                          value={item.expectedRate}
                          onChange={e => updateItem(idx, 'expectedRate', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="block text-[10px] text-zinc-500 mb-1">Line Total</label>
                        <p className="text-sm font-bold text-white py-1.5">
                          {parseFloat(item.expectedRate) > 0 && parseFloat(item.qty) > 0
                            ? fmtRs(parseFloat(item.expectedRate) * parseFloat(item.qty))
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {form.items.length > 0 && (
                <div className="flex justify-between items-center px-1 pt-2 border-t border-white/8 mt-2">
                  <span className="text-sm text-zinc-400">Expected Total</span>
                  <span className="text-base font-bold text-white">{fmtRs(totalExpected)}</span>
                </div>
              )}
            </div>

            {/* Advance Payment */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Advance Payment (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>Amount (₹)</label>
                  <input type="number" min="0" step="0.01"
                    value={form.advanceAmount}
                    onChange={e => setForm(f => ({ ...f, advanceAmount: e.target.value }))}
                    placeholder="0.00" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Method</label>
                  <div className="relative">
                    <select value={form.advanceMethod}
                      onChange={e => setForm(f => ({ ...f, advanceMethod: e.target.value as 'Cash' | 'UPI' }))}
                      className={`${iCls} appearance-none pr-8`}>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>
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
                {loading ? <Spinner /> : <Plus size={14} />}
                Create Order
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── DeliveryModal ────────────────────────────────────────────────────────────
const DeliveryModal = ({
  order,
  onClose,
  onSaved,
}: {
  order: ShopOrder;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const remaining = order.items.map(it => ({
    productId: it.productId,
    productName: it.productName,
    unit: it.unit,
    remaining: it.orderedQty - (it.deliveredQty ?? 0),
    qty: '',
  }));

  const [items, setItems] = useState(remaining);
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQty = (idx: number, val: string) =>
    setItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, qty: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deliveredItems = items.filter(it => parseFloat(it.qty) > 0);
    if (!deliveredItems.length) return setError('Enter at least one delivery quantity');
    for (const it of deliveredItems) {
      if (parseFloat(it.qty) > it.remaining)
        return setError(`${it.productName}: delivered qty exceeds remaining (${it.remaining} ${it.unit})`);
    }
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/shop-orders/${order._id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          deliveryDate,
          notes: notes.trim() || undefined,
          items: deliveredItems.map(it => ({
            productId: it.productId,
            productName: it.productName,
            deliveredQty: parseFloat(it.qty),
            unit: it.unit,
          })),
        }),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to record delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Truck size={15} className="text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Record Delivery</h4>
                <p className="text-[10px] text-zinc-500">{order.orderNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className={lCls}>Delivery Date</label>
              <input type="date" value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className={iCls} required />
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Items to Deliver</p>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={it.productId} className="bg-white/4 border border-white/8 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{it.productName}</p>
                        <p className="text-[10px] text-zinc-500">Remaining: {it.remaining} {it.unit}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Delivered Qty ({it.unit})</label>
                      <input type="number" min="0" step="any" max={it.remaining}
                        value={it.qty}
                        onChange={e => updateQty(idx, e.target.value)}
                        placeholder={`0 – ${it.remaining}`}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/60 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={lCls}>Notes</label>
              <input type="text" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes…" className={iCls} />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <Truck size={14} />}
                Record Delivery
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── AddPaymentModal ──────────────────────────────────────────────────────────
const AddPaymentModal = ({
  order,
  onClose,
  onSaved,
}: {
  order: ShopOrder;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount');
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/shop-orders/${order._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          reference: reference.trim() || undefined,
          date,
        }),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <IndianRupee size={14} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Add Advance Payment</h4>
                <p className="text-[10px] text-zinc-500">{order.orderNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className={lCls}>Amount (₹) *</label>
              <input type="number" min="1" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" className={iCls} required />
            </div>
            <div>
              <label className={lCls}>Method</label>
              <div className="relative">
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className={`${iCls} appearance-none pr-8`}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={lCls}>Reference / Remark</label>
              <input type="text" value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="UPI ref, receipt no…" className={iCls} />
            </div>
            <div>
              <label className={lCls}>Date</label>
              <input type="date" value={date}
                onChange={e => setDate(e.target.value)}
                className={iCls} />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <IndianRupee size={14} />}
                Add Payment
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── OrderDetailModal ─────────────────────────────────────────────────────────
const OrderDetailModal = ({
  order,
  onClose,
  onRefresh,
}: {
  order: ShopOrder;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const [tab, setTab] = useState<'details' | 'deliveries' | 'payments'>('details');
  const [updating, setUpdating] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localOrder, setLocalOrder] = useState(order);

  // Reload order detail after mutations
  const reloadOrder = useCallback(async () => {
    try {
      const updated = await apiFetch<ShopOrder>(`/shop-orders/${order._id}`);
      setLocalOrder(updated);
      onRefresh();
    } catch { /* silent */ }
  }, [order._id, onRefresh]);

  const changeStatus = async (status: OrderStatus) => {
    if (status === 'cancelled' && !confirm(`Cancel order ${localOrder.orderNumber}? This cannot be undone.`)) return;
    setUpdating(true);
    try {
      await apiFetch(`/shop-orders/${localOrder._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await reloadOrder();
    } finally {
      setUpdating(false);
    }
  };

  const tabBtn = (t: typeof tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
        tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {icon} {label}
    </button>
  );

  const o = localOrder;

  return (
    <>
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
            <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <div>
                <h3 className="font-display font-bold">{o.orderNumber}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-zinc-500">{fmtDate(o.createdAt)}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400"><X size={16} /></button>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4 pb-0 flex gap-1 border-b border-white/5 pb-3">
              {tabBtn('details',    'Details',    <FileText size={12} />)}
              {tabBtn('deliveries', 'Deliveries', <Truck size={12} />)}
              {tabBtn('payments',   'Payments',   <IndianRupee size={12} />)}
            </div>

            <div className="p-5 space-y-4">
              {/* ── Details tab ── */}
              {tab === 'details' && (
                <>
                  {/* Farmer info */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Farmer</p>
                    <p className="text-sm font-bold text-zinc-100">{o.farmerName}</p>
                    {o.farmerPhone && (
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5"><Phone size={11} /> {o.farmerPhone}</p>
                    )}
                    <div className="flex gap-4 flex-wrap pt-1">
                      <div>
                        <p className="text-[10px] text-zinc-600">Order Date</p>
                        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1"><CalendarDays size={10} /> {fmtDate(o.orderDate)}</p>
                      </div>
                      {o.expectedDeliveryDate && (
                        <div>
                          <p className="text-[10px] text-zinc-600">Expected Delivery</p>
                          <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1"><CalendarDays size={10} /> {fmtDate(o.expectedDeliveryDate)}</p>
                        </div>
                      )}
                    </div>
                    {o.notes && (
                      <p className="text-xs text-zinc-500 pt-1"><span className="font-bold text-zinc-600">Notes: </span>{o.notes}</p>
                    )}
                  </div>

                  {/* Items table */}
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Order Items</p>
                    <div className="rounded-xl border border-white/8 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/3 text-zinc-500">
                            <th className="text-left px-3 py-2 font-bold">Product</th>
                            <th className="text-right px-3 py-2 font-bold">Ordered</th>
                            <th className="text-right px-3 py-2 font-bold">Delivered</th>
                            <th className="text-right px-3 py-2 font-bold">Remaining</th>
                            <th className="text-right px-3 py-2 font-bold">Rate</th>
                            <th className="text-right px-3 py-2 font-bold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {o.items.map((it, idx) => {
                            const delivered = it.deliveredQty ?? 0;
                            const remaining = it.orderedQty - delivered;
                            return (
                              <tr key={idx} className="hover:bg-white/2 transition-colors">
                                <td className="px-3 py-2.5 font-semibold text-zinc-200">{it.productName}</td>
                                <td className="px-3 py-2.5 text-right text-zinc-400">{it.orderedQty} {it.unit}</td>
                                <td className="px-3 py-2.5 text-right text-emerald-400">{delivered} {it.unit}</td>
                                <td className="px-3 py-2.5 text-right text-amber-400">{remaining} {it.unit}</td>
                                <td className="px-3 py-2.5 text-right text-zinc-400">{it.expectedRate ? fmtRs(it.expectedRate) : '—'}</td>
                                <td className="px-3 py-2.5 text-right font-bold text-zinc-200">
                                  {it.expectedRate ? fmtRs(it.expectedRate * it.orderedQty) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {o.totalOrderedAmount > 0 && (
                      <div className="flex justify-between items-center px-1 pt-2 border-t border-white/8 mt-2">
                        <span className="text-xs text-zinc-500">Order Total</span>
                        <span className="text-sm font-bold text-white">{fmtRs(o.totalOrderedAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount summary */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Ordered', value: fmtRs(o.totalOrderedAmount), color: 'text-zinc-200' },
                      { label: 'Advance Paid', value: fmtRs(o.totalAdvance), color: 'text-emerald-400' },
                      { label: 'Balance', value: fmtRs(o.balance), color: 'text-amber-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-3 rounded-xl bg-white/3 border border-white/8 text-center">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{label}</p>
                        <p className={`text-sm font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── Deliveries tab ── */}
              {tab === 'deliveries' && (
                <div className="space-y-3">
                  {o.status !== 'cancelled' && o.status !== 'delivered' && (
                    <button
                      onClick={() => setShowDeliveryModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-bold transition border border-amber-500/20"
                    >
                      <Truck size={14} /> Record Delivery
                    </button>
                  )}

                  {(!o.deliveries || o.deliveries.length === 0) ? (
                    <div className="py-8 text-center">
                      <Truck size={30} className="text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No deliveries recorded yet</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/8 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white/3 text-zinc-500">
                            <th className="text-left px-3 py-2 font-bold">Delivery #</th>
                            <th className="text-left px-3 py-2 font-bold">Date</th>
                            <th className="text-left px-3 py-2 font-bold">Items</th>
                            <th className="text-left px-3 py-2 font-bold">Received By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {o.deliveries.map(d => (
                            <tr key={d._id} className="hover:bg-white/2 transition-colors">
                              <td className="px-3 py-2.5 font-mono font-bold text-zinc-200">{d.deliveryNumber}</td>
                              <td className="px-3 py-2.5 text-zinc-400">{fmtDate(d.deliveryDate)}</td>
                              <td className="px-3 py-2.5 text-zinc-400">
                                {d.items.map(it => `${it.deliveredQty} ${it.unit} ${it.productName}`).join(', ')}
                              </td>
                              <td className="px-3 py-2.5 text-zinc-500">{d.receivedBy ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Payments tab ── */}
              {tab === 'payments' && (
                <div className="space-y-3">
                  {o.status !== 'cancelled' && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold transition border border-emerald-500/20"
                    >
                      <IndianRupee size={14} /> Add Payment
                    </button>
                  )}

                  {(!o.payments || o.payments.length === 0) ? (
                    <div className="py-8 text-center">
                      <Banknote size={30} className="text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No advance payments recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {o.payments.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{fmtRs(p.amount)}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {p.method} · {fmtDate(p.date)}{p.reference ? ` · ${p.reference}` : ''}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                            Paid
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-1 pt-2 border-t border-white/8">
                        <span className="text-xs text-zinc-500">Total Advance</span>
                        <span className="text-sm font-bold text-emerald-400">{fmtRs(o.totalAdvance)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Actions */}
            {o.status !== 'cancelled' && o.status !== 'delivered' && (
              <div className="p-5 border-t border-white/5 space-y-2">
                {o.status === 'pending' && (
                  <button onClick={() => changeStatus('confirmed')} disabled={updating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-bold transition disabled:opacity-50">
                    {updating ? <Spinner /> : <CheckCircle2 size={14} />} Confirm Order
                  </button>
                )}
                <button onClick={() => changeStatus('cancelled')} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-bold transition disabled:opacity-50">
                  {updating ? <Spinner /> : <XCircle size={13} />} Cancel Order
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {showDeliveryModal && (
        <DeliveryModal
          order={localOrder}
          onClose={() => setShowDeliveryModal(false)}
          onSaved={reloadOrder}
        />
      )}
      {showPaymentModal && (
        <AddPaymentModal
          order={localOrder}
          onClose={() => setShowPaymentModal(false)}
          onSaved={reloadOrder}
        />
      )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FarmerOrders: React.FC = () => {
  const [orders, setOrders]           = useState<ShopOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [showCreate, setShowCreate]   = useState(false);
  const [viewOrder, setViewOrder]     = useState<ShopOrder | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (dateFrom) qs.set('from', dateFrom);
      if (dateTo) qs.set('to', dateTo);
      const res = await apiFetch<ShopOrder[]>(`/shop-orders${qs.toString() ? '?' + qs.toString() : ''}`);
      setOrders(res);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.farmerName.toLowerCase().includes(q) ||
      (o.farmerPhone ?? '').includes(q)
    );
  });

  const stats = {
    pending:             orders.filter(o => o.status === 'pending').length,
    confirmed:           orders.filter(o => o.status === 'confirmed').length,
    partially_delivered: orders.filter(o => o.status === 'partially_delivered').length,
    delivered:           orders.filter(o => o.status === 'delivered').length,
  };

  const statusColor = (s: OrderStatus) => ({
    pending:             'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
    confirmed:           'bg-blue-500/10 border-blue-500/20 text-blue-400',
    partially_delivered: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    delivered:           'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    cancelled:           'bg-red-500/10 border-red-500/20 text-red-400',
  }[s]);

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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ClipboardList size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Farmer Orders</h1>
          <p className="text-zinc-400 text-sm">Manage farmer purchase orders. Orders are fulfilled when bills are created on delivery.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Create Order
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending',           value: stats.pending,             color: 'text-zinc-400',    icon: <Clock size={16} /> },
          { label: 'Confirmed',         value: stats.confirmed,           color: 'text-blue-400',    icon: <CheckCircle2 size={16} /> },
          { label: 'Partial Delivery',  value: stats.partially_delivered, color: 'text-amber-400',   icon: <Truck size={16} /> },
          { label: 'Fully Delivered',   value: stats.delivered,           color: 'text-emerald-400', icon: <CheckCheck size={16} /> },
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

      {/* Table Panel */}
      <div className="glass-panel overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
            <Search size={13} className="text-zinc-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order #, farmer name or phone…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600" />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8 flex-wrap">
            {(['all', 'pending', 'confirmed', 'partially_delivered', 'delivered', 'cancelled'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  statusFilter === f ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}>
                {f === 'all' ? 'All' : f === 'partially_delivered' ? 'Partial' : STATUS_META[f as OrderStatus].label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 transition" />
            <ArrowRight size={12} className="text-zinc-600 shrink-0" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 transition" />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
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
            <ClipboardList size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {orders.length === 0 ? 'No farmer orders yet' : 'No orders match filters'}
            </p>
            <p className="text-zinc-600 text-sm mb-4">
              {orders.length === 0
                ? 'Create your first farmer order to track purchases.'
                : 'Try adjusting your search or filter.'}
            </p>
            {orders.length === 0 && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                Create First Order
              </button>
            )}
          </div>
        )}

        {/* Order Rows */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_0.6fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2 border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
              <span>Order #</span>
              <span>Farmer</span>
              <span>Phone</span>
              <span>Date</span>
              <span>Exp. Delivery</span>
              <span>Products</span>
              <span className="text-right">Ordered ₹</span>
              <span className="text-right">Advance ₹</span>
              <span className="text-right">Balance ₹</span>
              <span>Status</span>
              <span></span>
            </div>

            <div className="divide-y divide-white/5">
              {filtered.map((o, i) => (
                <motion.div
                  key={o._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 hover:bg-white/2 transition-all cursor-pointer"
                  onClick={() => setViewOrder(o)}
                >
                  {/* Mobile layout */}
                  <div className="lg:hidden flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${statusColor(o.status)}`}>
                      <ClipboardList size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-zinc-100">{o.orderNumber}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{o.farmerName}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {o.farmerPhone && <span className="text-[10px] text-zinc-500 flex items-center gap-0.5"><Phone size={9} /> {o.farmerPhone}</span>}
                        <span className="text-[10px] text-zinc-600">{o.items.length} product{o.items.length !== 1 ? 's' : ''}</span>
                        <span className="text-[10px] text-zinc-600">{fmtDate(o.orderDate)}</span>
                        {o.totalOrderedAmount > 0 && <span className="text-[10px] font-bold text-zinc-200">{fmtRs(o.totalOrderedAmount)}</span>}
                      </div>
                    </div>
                    <Eye size={13} className="text-zinc-600 shrink-0 mt-1" />
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_1fr_0.6fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                    <span className="text-sm font-bold font-mono text-zinc-100">{o.orderNumber}</span>
                    <span className="text-sm text-zinc-300 truncate">{o.farmerName}</span>
                    <span className="text-xs text-zinc-500">{o.farmerPhone ?? '—'}</span>
                    <span className="text-xs text-zinc-500">{fmtDate(o.orderDate)}</span>
                    <span className="text-xs text-zinc-500">{fmtDate(o.expectedDeliveryDate)}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1"><Package size={10} /> {o.items.length}</span>
                    <span className="text-xs font-semibold text-zinc-200 text-right">{fmtRs(o.totalOrderedAmount)}</span>
                    <span className="text-xs font-semibold text-emerald-400 text-right">{fmtRs(o.totalAdvance)}</span>
                    <span className="text-xs font-semibold text-amber-400 text-right">{fmtRs(o.balance)}</span>
                    <StatusBadge status={o.status} />
                    <Eye size={13} className="text-zinc-600" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{filtered.length} of {orders.length} orders</p>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { showToast('Order created successfully'); load(); }}
        />
      )}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onRefresh={() => { load(); setViewOrder(null); }}
        />
      )}
    </div>
  );
};

export default FarmerOrders;
