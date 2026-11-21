/**
 * SupplierManagement.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Manage shop suppliers: create/edit suppliers, view purchase history,
 * supplier ledger and payments.
 *
 * Endpoints:
 *   GET    /api/suppliers                     → list all suppliers
 *   POST   /api/suppliers                     → create supplier
 *   PUT    /api/suppliers/:id                 → update supplier
 *   GET    /api/purchase-orders?supplierId=:id → purchase history
 *   GET    /api/suppliers/:id/ledger          → supplier ledger
 *   GET    /api/suppliers/:id/payments        → supplier payments
 *   POST   /api/suppliers/:id/payments        → record payment
 *
 * All amounts plain ₹.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  X, Edit2, Phone, MapPin, Mail, Loader2, Eye, IndianRupee,
  CalendarDays, FileText, CreditCard, Landmark, User, Hash,
  ToggleLeft, ToggleRight, ChevronRight, Wallet, ShoppingBag,
  BookOpen, Receipt, ArrowUpRight, ArrowDownLeft, BadgeCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRs   = (n?: number) => n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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

// ─── Types ───────────────────────────────────────────────────────────────────
interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  notes?: string;
  isActive: boolean;
  totalPurchases?: number;
  pendingBalance?: number;
  lastOrderDate?: string;
  totalOrders?: number;
  createdAt: string;
}

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  items: { productName?: string }[];
  totalExpectedAmount: number;
  receivedDate?: string;
}

interface LedgerRow {
  date: string;
  description: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface SupplierPayment {
  _id: string;
  amount: number;
  paymentDate: string;
  method: 'Cash' | 'NEFT' | 'UPI' | 'Cheque';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

type DetailTab = 'overview' | 'purchases' | 'ledger' | 'payments';

// ─── Shared styles ────────────────────────────────────────────────────────────
const iCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 15 }: { size?: number }) => <Loader2 size={size} className="animate-spin" />;

// ─── Status badge ─────────────────────────────────────────────────────────────
const ActiveBadge = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
    active
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30'
  }`}>
    {active ? <BadgeCheck size={9} /> : <X size={9} />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ─── SupplierModal (Create / Edit) ────────────────────────────────────────────
interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  notes: string;
  isActive: boolean;
}

const EMPTY_FORM: SupplierFormState = {
  name: '', contactPerson: '', phone: '', alternatePhone: '', email: '',
  address: '', city: '', state: '', gstNumber: '', panNumber: '',
  bankName: '', accountNumber: '', ifscCode: '', notes: '', isActive: true,
};

const SupplierModal = ({
  mode, supplier, onClose, onSaved,
}: {
  mode: 'create' | 'edit';
  supplier: Supplier | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState<SupplierFormState>(
    supplier ? {
      name:          supplier.name,
      contactPerson: supplier.contactPerson ?? '',
      phone:         supplier.phone,
      alternatePhone: supplier.alternatePhone ?? '',
      email:         supplier.email ?? '',
      address:       supplier.address ?? '',
      city:          supplier.city ?? '',
      state:         supplier.state ?? '',
      gstNumber:     supplier.gstNumber ?? '',
      panNumber:     supplier.panNumber ?? '',
      bankName:      supplier.bankName ?? '',
      accountNumber: supplier.accountNumber ?? '',
      ifscCode:      supplier.ifscCode ?? '',
      notes:         supplier.notes ?? '',
      isActive:      supplier.isActive,
    } : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof SupplierFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Company name is required');
    if (!form.phone.trim()) return setError('Phone number is required');
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name:          form.name.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone:         form.phone.trim(),
        alternatePhone: form.alternatePhone.trim() || undefined,
        email:         form.email.trim() || undefined,
        address:       form.address.trim() || undefined,
        city:          form.city.trim() || undefined,
        state:         form.state.trim() || undefined,
        gstNumber:     form.gstNumber.trim() || undefined,
        panNumber:     form.panNumber.trim() || undefined,
        bankName:      form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifscCode:      form.ifscCode.trim() || undefined,
        notes:         form.notes.trim() || undefined,
        isActive:      form.isActive,
      };
      if (isEdit && supplier) {
        await apiFetch(`/suppliers/${supplier._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save supplier');
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
                <Building2 size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display font-bold">{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isEdit ? 'Update supplier details' : 'Register a new supplier for purchases'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Company Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className={lCls}>Company Name *</label>
                  <input type="text" value={form.name} onChange={set('name')}
                    placeholder="e.g. Sri Venkateshwara Feeds Pvt Ltd" className={iCls} required />
                </div>
                <div>
                  <label className={lCls}>Contact Person Name</label>
                  <input type="text" value={form.contactPerson} onChange={set('contactPerson')}
                    placeholder="Primary contact" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Phone *</label>
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="10-digit mobile" className={iCls} required />
                </div>
                <div>
                  <label className={lCls}>Alternate Phone</label>
                  <input type="tel" value={form.alternatePhone} onChange={set('alternatePhone')}
                    placeholder="Optional" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Email</label>
                  <input type="email" value={form.email} onChange={set('email')}
                    placeholder="supplier@example.com" className={iCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={lCls}>Address</label>
                  <textarea value={form.address} onChange={set('address')}
                    rows={2} placeholder="Street address, landmark…"
                    className={`${iCls} resize-none`} />
                </div>
                <div>
                  <label className={lCls}>City</label>
                  <input type="text" value={form.city} onChange={set('city')}
                    placeholder="City" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>State</label>
                  <input type="text" value={form.state} onChange={set('state')}
                    placeholder="State" className={iCls} />
                </div>
              </div>
            </div>

            {/* Tax & Registration */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Tax & Registration</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={lCls}>GST Number</label>
                  <input type="text" value={form.gstNumber} onChange={set('gstNumber')}
                    placeholder="22AAAAA0000A1Z5" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>PAN Number</label>
                  <input type="text" value={form.panNumber} onChange={set('panNumber')}
                    placeholder="AAAAA0000A" className={iCls} />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Bank Details</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={lCls}>Bank Name</label>
                  <input type="text" value={form.bankName} onChange={set('bankName')}
                    placeholder="SBI / HDFC / ICICI…" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Account Number</label>
                  <input type="text" value={form.accountNumber} onChange={set('accountNumber')}
                    placeholder="Account number" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>IFSC Code</label>
                  <input type="text" value={form.ifscCode} onChange={set('ifscCode')}
                    placeholder="SBIN0001234" className={iCls} />
                </div>
              </div>
            </div>

            {/* Notes & Status */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Notes & Status</p>
              <div className="space-y-3">
                <div>
                  <label className={lCls}>Notes</label>
                  <textarea value={form.notes} onChange={set('notes')}
                    rows={2} placeholder="Any additional notes…"
                    className={`${iCls} resize-none`} />
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 w-full hover:bg-white/5 transition"
                >
                  {form.isActive
                    ? <ToggleRight size={22} className="text-emerald-400 shrink-0" />
                    : <ToggleLeft size={22} className="text-zinc-500 shrink-0" />}
                  <div className="text-left">
                    <p className="text-sm font-bold text-zinc-200">
                      {form.isActive ? 'Active Supplier' : 'Inactive Supplier'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {form.isActive
                        ? 'Supplier is available for new purchase orders'
                        : 'Supplier will be hidden from new order creation'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : (isEdit ? <Edit2 size={14} /> : <Plus size={14} />)}
                {isEdit ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ['Cash', 'NEFT', 'UPI', 'Cheque'] as const;
type PaymentMethod = typeof PAYMENT_METHODS[number];

const RecordPaymentModal = ({
  supplierId, onClose, onSaved,
}: {
  supplierId: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    method: 'Cash' as PaymentMethod,
    referenceNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/suppliers/${supplierId}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          paymentDate: form.paymentDate,
          method: form.method,
          referenceNumber: form.referenceNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to record payment');
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
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Wallet size={15} className="text-blue-400" />
              </div>
              <h3 className="font-display font-bold text-sm">Record Payment</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-400">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}
            <div>
              <label className={lCls}>Amount (₹) *</label>
              <input type="number" min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" className={iCls} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lCls}>Payment Date</label>
                <input type="date" value={form.paymentDate}
                  onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className={iCls} />
              </div>
              <div>
                <label className={lCls}>Method</label>
                <select value={form.method}
                  onChange={e => setForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}
                  className={iCls}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lCls}>Reference / UTR Number</label>
              <input type="text" value={form.referenceNumber}
                onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))}
                placeholder="Cheque no. / UTR / UPI ref" className={iCls} />
            </div>
            <div>
              <label className={lCls}>Notes</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional remarks" className={iCls} />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={loading}
                className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Spinner /> : <Wallet size={14} />} Record Payment
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Supplier Detail Panel (slide-in) ────────────────────────────────────────
const SupplierDetailPanel = ({
  supplier, onClose, onEdit,
}: {
  supplier: Supplier;
  onClose: () => void;
  onEdit: () => void;
}) => {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadTab = useCallback(async (t: DetailTab) => {
    setLoading(true);
    try {
      if (t === 'purchases') {
        const data = await apiFetch<PurchaseOrder[]>(`/purchase-orders?supplierId=${supplier._id}`);
        setPurchases(data);
      } else if (t === 'ledger') {
        const data = await apiFetch<{ ledger: LedgerRow[] }>(`/suppliers/${supplier._id}/ledger`);
        setLedger(data.ledger ?? []);
      } else if (t === 'payments') {
        const data = await apiFetch<SupplierPayment[]>(`/suppliers/${supplier._id}/payments`);
        setPayments(data);
      }
    } catch {
      // silent — tab will show empty state
    } finally {
      setLoading(false);
    }
  }, [supplier._id]);

  useEffect(() => {
    if (tab !== 'overview') loadTab(tab);
  }, [tab, loadTab]);

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',  label: 'Overview',         icon: <Eye size={13} /> },
    { key: 'purchases', label: 'Purchase History',  icon: <ShoppingBag size={13} /> },
    { key: 'ledger',    label: 'Ledger',            icon: <BookOpen size={13} /> },
    { key: 'payments',  label: 'Payments',          icon: <Wallet size={13} /> },
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-zinc-900 border-l border-white/10 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-white/5 flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-lg truncate">{supplier.name}</h2>
                <ActiveBadge active={supplier.isActive} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-zinc-400 flex items-center gap-1"><Phone size={10} /> {supplier.phone}</span>
                {supplier.city && <span className="text-xs text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {supplier.city}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition">
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/5 bg-zinc-900/80 shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === t.key
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Orders',      value: String(supplier.totalOrders ?? '—'),       color: 'text-zinc-100',    icon: <ShoppingBag size={14} /> },
                  { label: 'Total Purchased',   value: fmtRs(supplier.totalPurchases),             color: 'text-blue-400',    icon: <IndianRupee size={14} /> },
                  { label: 'Pending Balance',   value: fmtRs(supplier.pendingBalance),             color: 'text-amber-400',   icon: <Receipt size={14} /> },
                  { label: 'Last Order',        value: fmtDate(supplier.lastOrderDate),            color: 'text-zinc-400',    icon: <CalendarDays size={14} /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className="glass-panel p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
                      <span className={color}>{icon}</span>
                    </div>
                    <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Contact Details */}
              <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2.5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Contact Details</p>
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <User size={13} className="text-zinc-500 shrink-0" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Phone size={13} className="text-zinc-500 shrink-0" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.alternatePhone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Phone size={13} className="text-zinc-600 shrink-0" />
                    <span>{supplier.alternatePhone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Mail size={13} className="text-zinc-500 shrink-0" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {(supplier.address || supplier.city) && (
                  <div className="flex items-start gap-2 text-sm text-zinc-300">
                    <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span>{[supplier.address, supplier.city, supplier.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Tax & Registration */}
              {(supplier.gstNumber || supplier.panNumber) && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Tax & Registration</p>
                  {supplier.gstNumber && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Hash size={13} className="text-zinc-500 shrink-0" />
                      <span className="text-zinc-500 text-xs mr-1">GST:</span> {supplier.gstNumber}
                    </div>
                  )}
                  {supplier.panNumber && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <FileText size={13} className="text-zinc-500 shrink-0" />
                      <span className="text-zinc-500 text-xs mr-1">PAN:</span> {supplier.panNumber}
                    </div>
                  )}
                </div>
              )}

              {/* Bank Details */}
              {(supplier.bankName || supplier.accountNumber) && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Bank Details</p>
                  {supplier.bankName && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Landmark size={13} className="text-zinc-500 shrink-0" />
                      {supplier.bankName}
                    </div>
                  )}
                  {supplier.accountNumber && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <CreditCard size={13} className="text-zinc-500 shrink-0" />
                      {supplier.accountNumber}
                      {supplier.ifscCode && <span className="text-zinc-500 text-xs ml-2">IFSC: {supplier.ifscCode}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {supplier.notes && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-zinc-300">{supplier.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Purchase History ── */}
          {tab === 'purchases' && (
            <div>
              {loading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm">Loading purchase history…</p>
                </div>
              )}
              {!loading && purchases.length === 0 && (
                <div className="text-center py-16">
                  <ShoppingBag size={36} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold">No purchase orders found</p>
                  <p className="text-zinc-600 text-sm mt-1">Purchase orders with this supplier will appear here.</p>
                </div>
              )}
              {!loading && purchases.length > 0 && (
                <div className="divide-y divide-white/5 rounded-xl border border-white/8 overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-white/3">
                    {['PO #', 'Date', 'Items', 'Status', 'Total ₹'].map(h => (
                      <p key={h} className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{h}</p>
                    ))}
                  </div>
                  {purchases.map(po => (
                    <div key={po._id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-3 hover:bg-white/2 transition text-xs">
                      <p className="font-bold text-zinc-200 truncate">{po.poNumber}</p>
                      <p className="text-zinc-500 whitespace-nowrap">{fmtDate(po.orderDate)}</p>
                      <p className="text-zinc-400 text-center">{po.items?.length ?? 0}</p>
                      <span className={`inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        po.status === 'received'           ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        po.status === 'partially_received' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                        po.status === 'cancelled'          ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                        po.status === 'sent'               ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                        'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                      }`}>{po.status}</span>
                      <p className="font-bold text-zinc-200 text-right whitespace-nowrap">{fmtRs(po.totalExpectedAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Ledger ── */}
          {tab === 'ledger' && (
            <div>
              {loading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm">Loading ledger…</p>
                </div>
              )}
              {!loading && ledger.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen size={36} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold">No ledger entries yet</p>
                  <p className="text-zinc-600 text-sm mt-1">Transactions will appear here.</p>
                </div>
              )}
              {!loading && ledger.length > 0 && (
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-4 py-2.5 bg-white/3">
                    {['Date', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                      <p key={h} className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{h}</p>
                    ))}
                  </div>
                  <div className="divide-y divide-white/5">
                    {ledger.map((row, i) => (
                      <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center px-4 py-3 hover:bg-white/2 transition text-xs">
                        <p className="text-zinc-500 whitespace-nowrap">{fmtDate(row.date)}</p>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {row.debit > 0
                            ? <ArrowUpRight size={11} className="text-red-400 shrink-0" />
                            : <ArrowDownLeft size={11} className="text-emerald-400 shrink-0" />}
                          <p className="text-zinc-200 truncate">{row.description}</p>
                        </div>
                        <p className="font-bold text-red-400 text-right whitespace-nowrap">
                          {row.debit > 0 ? fmtRs(row.debit) : '—'}
                        </p>
                        <p className="font-bold text-emerald-400 text-right whitespace-nowrap">
                          {row.credit > 0 ? fmtRs(row.credit) : '—'}
                        </p>
                        <p className={`font-bold text-right whitespace-nowrap ${
                          row.balance > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{fmtRs(row.balance)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Payments ── */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition">
                  <Plus size={14} /> Record Payment
                </button>
              </div>
              {loading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm">Loading payments…</p>
                </div>
              )}
              {!loading && payments.length === 0 && (
                <div className="text-center py-14">
                  <Wallet size={36} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-bold">No payments recorded</p>
                  <p className="text-zinc-600 text-sm mt-1">Record a payment to this supplier above.</p>
                </div>
              )}
              {!loading && payments.length > 0 && (
                <div className="divide-y divide-white/5 rounded-xl border border-white/8 overflow-hidden">
                  {payments.map(p => (
                    <div key={p._id} className="p-4 hover:bg-white/2 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-emerald-400">{fmtRs(p.amount)}</p>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              {p.method}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">{fmtDate(p.paymentDate)}</p>
                          {p.referenceNumber && (
                            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                              <Hash size={10} /> {p.referenceNumber}
                            </p>
                          )}
                          {p.notes && <p className="text-xs text-zinc-600 mt-0.5">{p.notes}</p>}
                        </div>
                        <Wallet size={14} className="text-zinc-600 shrink-0 mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showPaymentModal && (
                <RecordPaymentModal
                  supplierId={supplier._id}
                  onClose={() => setShowPaymentModal(false)}
                  onSaved={() => { setShowPaymentModal(false); loadTab('payments'); }}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal]       = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Supplier[]>('/suppliers');
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.gstNumber ?? '').toLowerCase().includes(q) ||
      (s.contactPerson ?? '').toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.isActive) ||
      (statusFilter === 'inactive' && !s.isActive);
    return matchSearch && matchStatus;
  });

  const stats = {
    total:         suppliers.length,
    active:        suppliers.filter(s => s.isActive).length,
    totalBusiness: suppliers.reduce((sum, s) => sum + (s.totalPurchases ?? 0), 0),
    pendingTotal:  suppliers.reduce((sum, s) => sum + (s.pendingBalance ?? 0), 0),
  };

  const openCreate = () => { setEditSupplier(null); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditSupplier(s); setShowModal(true); setViewSupplier(null); };

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
              <Building2 size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Supplier Management</h1>
          <p className="text-zinc-400 text-sm">Manage your suppliers, track purchases, monitor balances and record payments.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers',   value: String(stats.total),          color: 'text-zinc-100',    icon: <Building2 size={16} /> },
          { label: 'Active',            value: String(stats.active),         color: 'text-emerald-400', icon: <CheckCircle2 size={16} /> },
          { label: 'Total Business',    value: fmtRs(stats.totalBusiness),   color: 'text-blue-400',    icon: <IndianRupee size={16} /> },
          { label: 'Total Pending',     value: fmtRs(stats.pendingTotal),    color: 'text-amber-400',   icon: <Receipt size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{label}</p>
              <span className={color}>{icon}</span>
            </div>
            <p className={`text-2xl font-display font-bold ${color} truncate`}>{value}</p>
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
              placeholder="Search by name, phone or GST…"
              className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/4 rounded-xl border border-white/8">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                  statusFilter === f ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading suppliers…</p>
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
            <Building2 size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">
              {suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match your search'}
            </p>
            <p className="text-zinc-600 text-sm mb-4">
              {suppliers.length === 0
                ? 'Add your first supplier to start tracking purchases.'
                : 'Try adjusting your search or filter.'}
            </p>
            {suppliers.length === 0 && (
              <button onClick={openCreate} className="btn-primary text-sm">Add First Supplier</button>
            )}
          </div>
        )}

        {/* Table Header */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="hidden md:grid grid-cols-[2fr_1.2fr_1fr_1.2fr_1.2fr_auto_auto] gap-3 px-5 py-2.5 bg-white/2 border-b border-white/5">
              {['Company', 'Contact / Phone', 'City', 'Total Purchases', 'Pending Balance', 'Status', ''].map(h => (
                <p key={h} className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{h}</p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {filtered.map((s, i) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="p-4 md:grid md:grid-cols-[2fr_1.2fr_1fr_1.2fr_1.2fr_auto_auto] md:gap-3 flex flex-col gap-2 items-start md:items-center hover:bg-white/2 transition-all cursor-pointer group"
                  onClick={() => setViewSupplier(s)}
                >
                  {/* Company */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center shrink-0">
                      <Building2 size={15} className="text-emerald-500/80" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{s.name}</p>
                      {s.gstNumber && (
                        <p className="text-[10px] text-zinc-600 truncate">GST: {s.gstNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    {s.contactPerson && <p className="text-xs text-zinc-400">{s.contactPerson}</p>}
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Phone size={9} /> {s.phone}
                    </p>
                  </div>

                  {/* City */}
                  <p className="text-xs text-zinc-500">
                    {s.city ? <span className="flex items-center gap-1"><MapPin size={9} />{s.city}</span> : '—'}
                  </p>

                  {/* Total Purchases */}
                  <p className="text-sm font-bold text-zinc-200">{fmtRs(s.totalPurchases)}</p>

                  {/* Pending Balance */}
                  <p className={`text-sm font-bold ${(s.pendingBalance ?? 0) > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {fmtRs(s.pendingBalance)}
                  </p>

                  {/* Status */}
                  <ActiveBadge active={s.isActive} />

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(s); }}
                      className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-zinc-200 transition"
                      title="Edit supplier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <ChevronRight size={13} className="text-zinc-600" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{filtered.length} of {suppliers.length} suppliers</p>
            </div>
          </>
        )}
      </div>

      {/* Supplier Modal */}
      {showModal && (
        <SupplierModal
          mode={editSupplier ? 'edit' : 'create'}
          supplier={editSupplier}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            showToast(editSupplier ? 'Supplier updated' : 'Supplier added');
            load();
          }}
        />
      )}

      {/* Detail Panel */}
      {viewSupplier && (
        <SupplierDetailPanel
          supplier={viewSupplier}
          onClose={() => setViewSupplier(null)}
          onEdit={() => openEdit(viewSupplier)}
        />
      )}
    </div>
  );
};

export default SupplierManagement;
