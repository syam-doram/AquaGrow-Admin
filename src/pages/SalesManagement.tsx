/**
 * SalesManagement.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Sales & Billing page for AquaGrow Shop ERP admin panel.
 *
 * Tabs: Bills | New Bill | Returns
 *
 * Endpoints:
 *   GET  /api/sales/invoices?from=&to=&farmerId=&status=
 *   POST /api/sales/invoices
 *   POST /api/sales/invoices/:id/payment
 *   POST /api/sales/invoices/:id/cancel
 *   GET  /api/sales/returns
 *   POST /api/sales/returns
 *   GET  /api/farmers
 *   GET  /api/products
 *
 * All amounts plain â‚¹.
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
  X, Loader2, IndianRupee, CalendarDays, User, ChevronDown,
  FileText, XCircle, Wallet, CreditCard, Smartphone, Layers,
  ArrowLeft, Trash2, Package, RotateCcw, Eye, ArrowRight,
  ClipboardList, Banknote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtRs = (n?: number) =>
  n != null ? `â‚¹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'â€”';
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// â”€â”€â”€ API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type InvoiceStatus = 'draft' | 'finalized' | 'paid' | 'cancelled';
type PaymentMethod = 'Cash' | 'UPI' | 'Credit' | 'Mixed';

interface Farmer {
  _id: string;
  name: string;
  phoneNumber?: string;
  village?: string;
  district?: string;
  totalCredit?: number;
}

interface Product {
  _id: string;
  name: string;
  code: string;
  baseStockUnit: string;
  mrp?: number;
  rate?: number;
  gstPercent?: number;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  batchId?: string;
  batch?: string;
  qty: number;
  unit: string;
  mrp?: number;
  rate: number;
  discount: number;
  gstRate: number;
  lineTotal: number;
}

interface PaymentEntry {
  date: string;
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  payments: PaymentEntry[];
  creditBalance?: number;
  notes?: string;
  cultureId?: string;
  createdAt: string;
}

interface SaleReturn {
  _id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  farmerName: string;
  date: string;
  items: { productName: string; qty: number; unit: string; amount: number }[];
  returnAmount: number;
  status: string;
  reason?: string;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  finalized: { label: 'Finalized', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  paid:      { label: 'Paid',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  Cash:   <Banknote size={12} />,
  UPI:    <Smartphone size={12} />,
  Credit: <CreditCard size={12} />,
  Mixed:  <Layers size={12} />,
};

// â”€â”€â”€ Shared sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Spinner = () => <Loader2 size={15} className="animate-spin" />;

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const m = INVOICE_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.label}
    </span>
  );
};

const iCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-600';
const lCls = 'block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider';

// â”€â”€â”€ Farmer Search Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FarmerSearchDropdown = ({
  farmers,
  value,
  onChange,
}: {
  farmers: Farmer[];
  value: Farmer | null;
  onChange: (f: Farmer | null) => void;
}) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = farmers.filter(
    f => !q || f.name.toLowerCase().includes(q.toLowerCase()) ||
      (f.phoneNumber && f.phoneNumber.includes(q))
  );

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center justify-between bg-white/5 border border-emerald-500/40 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-sm font-bold text-zinc-100">{value.name}</p>
            <p className="text-[10px] text-zinc-500">{value.phoneNumber} {value.village ? `Â· ${value.village}` : ''}</p>
          </div>
          <button type="button" onClick={() => { onChange(null); setQ(''); }}
            className="p-1 text-zinc-500 hover:text-red-400 transition">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search farmer by name or phoneâ€¦"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition placeholder:text-zinc-600"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute z-30 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-52 overflow-y-auto">
              {filtered.slice(0, 12).map(f => (
                <button key={f._id} type="button"
                  onClick={() => { onChange(f); setQ(''); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                  <div>
                    <p className="text-white font-medium">{f.name}</p>
                    <p className="text-zinc-500 text-xs">{f.phoneNumber} {f.village ? `Â· ${f.village}` : ''}</p>
                  </div>
                  {(f.totalCredit ?? 0) > 0 && (
                    <span className="text-amber-400 text-xs font-bold shrink-0">Cr {fmtRs(f.totalCredit)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// â”€â”€â”€ Bill Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BillDetailModal = ({
  invoice,
  onClose,
  onRefresh,
  isAdmin,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRefresh: () => void;
  isAdmin?: boolean;
}) => {
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'Cash' as PaymentMethod, ref: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) return setErr('Enter a valid amount');
    setSubmitting(true); setErr(null);
    try {
      await apiFetch(`/api/sales/invoices/${invoice._id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount: amt, method: payForm.method, ref: payForm.ref.trim() || undefined }),
      });
      setPayModal(false);
      setPayForm({ amount: '', method: 'Cash', ref: '' });
      onRefresh();
    } catch (e: any) {
      setErr(e.message ?? 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setSubmitting(true); setErr(null);
    try {
      await apiFetch(`/api/sales/invoices/${invoice._id}/cancel`, { method: 'POST' });
      onRefresh();
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'Cancel failed');
      setSubmitting(false);
    }
  };

  const totalPaid = invoice.payments?.reduce((s, p) => s + p.amount, 0) ?? 0;
  const outstanding = invoice.grandTotal - totalPaid;

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
          <div className="p-5 border-b border-white/5 flex items-start justify-between sticky top-0 bg-zinc-900 z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold text-lg">{invoice.invoiceNumber}</h3>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{invoice.farmerName} Â· {fmtDate(invoice.date)}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 shrink-0"><X size={16} /></button>
          </div>

          <div className="p-5 space-y-5">
            {err && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                <AlertTriangle size={13} className="shrink-0" /> {err}
              </div>
            )}

            {/* Farmer */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Farmer</p>
              <p className="text-sm font-bold text-zinc-100">{invoice.farmerName}</p>
              {invoice.farmerPhone && <p className="text-xs text-zinc-400">{invoice.farmerPhone}</p>}
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-xs text-zinc-500">Method: <span className="text-zinc-300">{invoice.paymentMethod}</span></span>
                {invoice.cultureId && <span className="text-xs text-zinc-500">Culture: <span className="text-zinc-300">{invoice.cultureId}</span></span>}
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Bill Items</p>
              <div className="rounded-xl border border-white/8 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-white/4">
                    <tr>
                      <th className="text-left px-3 py-2 text-zinc-500 font-bold">Product</th>
                      <th className="text-right px-3 py-2 text-zinc-500 font-bold">Qty</th>
                      <th className="text-right px-3 py-2 text-zinc-500 font-bold">Rate</th>
                      <th className="text-right px-3 py-2 text-zinc-500 font-bold">Disc%</th>
                      <th className="text-right px-3 py-2 text-zinc-500 font-bold">GST%</th>
                      <th className="text-right px-3 py-2 text-zinc-500 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-white/2">
                        <td className="px-3 py-2.5">
                          <p className="text-zinc-200 font-medium">{it.productName}</p>
                          {it.batch && <p className="text-zinc-600 text-[10px]">Batch: {it.batch}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-300">{it.qty} {it.unit}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-300">{fmtRs(it.rate)}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-400">{it.discount}%</td>
                        <td className="px-3 py-2.5 text-right text-zinc-400">{it.gstRate}%</td>
                        <td className="px-3 py-2.5 text-right font-bold text-zinc-200">{fmtRs(it.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmtRs(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Discount</span><span className="text-red-400">- {fmtRs(invoice.totalDiscount)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>GST</span><span>{fmtRs(invoice.totalGst)}</span></div>
              <div className="flex justify-between font-bold text-zinc-100 border-t border-white/8 pt-1.5 mt-1">
                <span>Grand Total</span><span>{fmtRs(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* Payment history */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Payment History</p>
              {invoice.payments?.length > 0 ? (
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-white/4">
                      <tr>
                        <th className="text-left px-3 py-2 text-zinc-500 font-bold">Date</th>
                        <th className="text-left px-3 py-2 text-zinc-500 font-bold">Method</th>
                        <th className="text-right px-3 py-2 text-zinc-500 font-bold">Amount</th>
                        <th className="text-left px-3 py-2 text-zinc-500 font-bold">Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoice.payments.map((p, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 text-zinc-300">{fmtDate(p.date)}</td>
                          <td className="px-3 py-2">
                            <span className="flex items-center gap-1 text-zinc-400">
                              {PAYMENT_METHOD_ICONS[p.method]} {p.method}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-400">{fmtRs(p.amount)}</td>
                          <td className="px-3 py-2 text-zinc-500">{p.ref ?? 'â€”'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic">No payments recorded</p>
              )}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs text-zinc-500">Outstanding Balance</span>
                <span className={`text-sm font-bold ${outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {fmtRs(outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-white/5 flex flex-wrap gap-2 justify-end sticky bottom-0 bg-zinc-900">
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <button
                onClick={() => setPayModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition">
                <Wallet size={13} /> Record Payment
              </button>
            )}
            {isAdmin && invoice.status !== 'cancelled' && (
              cancelConfirm ? (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-zinc-400">Confirm cancel?</span>
                  <button onClick={handleCancel} disabled={submitting}
                    className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold transition disabled:opacity-50">
                    {submitting ? <Spinner /> : 'Yes, Cancel'}
                  </button>
                  <button onClick={() => setCancelConfirm(false)}
                    className="px-3 py-2 rounded-xl bg-white/5 text-zinc-400 text-xs font-bold transition">
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setCancelConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-bold transition">
                  <XCircle size={13} /> Cancel Invoice
                </button>
              )
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Record Payment mini-modal */}
      {payModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPayModal(false)}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h4 className="font-bold text-sm">Record Payment</h4>
              <button onClick={() => setPayModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400"><X size={14} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              {err && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  <AlertTriangle size={12} /> {err}
                </div>
              )}
              <div>
                <label className={lCls}>Amount *</label>
                <input type="number" min="0.01" step="0.01" value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00" className={iCls} required />
              </div>
              <div>
                <label className={lCls}>Method</label>
                <select value={payForm.method}
                  onChange={e => setPayForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}
                  className={iCls}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
              {(payForm.method === 'UPI') && (
                <div>
                  <label className={lCls}>UPI Reference</label>
                  <input type="text" value={payForm.ref}
                    onChange={e => setPayForm(f => ({ ...f, ref: e.target.value }))}
                    placeholder="Transaction ID / UTR" className={iCls} />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setPayModal(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Spinner /> : <Wallet size={13} />} Record
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// â”€â”€â”€ Bills Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BillsTab = ({
  farmers,
  onRefreshNeeded,
  refreshKey,
}: {
  farmers: Farmer[];
  onRefreshNeeded: () => void;
  refreshKey: number;
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [payMethodFilter, setPayMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const data = await apiFetch<Invoice[]>(`/api/sales/invoices?${params}`);
      setInvoices(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, statusFilter, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.farmerName.toLowerCase().includes(q);
    const matchMethod = payMethodFilter === 'all' || inv.paymentMethod === payMethodFilter;
    return matchSearch && matchMethod;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/4 border border-white/8 rounded-xl px-3 py-2">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice# or farmerâ€¦"
            className="bg-transparent text-sm text-zinc-100 outline-none flex-1 placeholder:text-zinc-600" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition" />
          <span className="text-zinc-600 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="finalized">Finalized</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={payMethodFilter} onChange={e => setPayMethodFilter(e.target.value as PaymentMethod | 'all')}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500/50 transition">
          <option value="all">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Credit">Credit</option>
          <option value="Mixed">Mixed</option>
        </select>
        <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading invoicesâ€¦</p>
          </div>
        )}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">{invoices.length === 0 ? 'No invoices yet' : 'No invoices match filters'}</p>
            <p className="text-zinc-600 text-sm">
              {invoices.length === 0 ? 'Create a bill in the "New Bill" tab.' : 'Try adjusting your filters.'}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_0.6fr_1fr_0.8fr_0.9fr_auto] gap-2 px-5 py-2.5 border-b border-white/5 bg-white/2">
              {['Invoice#', 'Farmer', 'Date', 'Items', 'Total', 'Method', 'Status', ''].map(h => (
                <p key={h} className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map((inv, i) => (
                <motion.div
                  key={inv._id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                  className="p-4 md:grid md:grid-cols-[1fr_1.5fr_1fr_0.6fr_1fr_0.8fr_0.9fr_auto] md:gap-2 md:items-center hover:bg-white/2 transition cursor-pointer gap-2 flex flex-wrap"
                  onClick={() => setViewInvoice(inv)}
                >
                  <p className="text-sm font-bold text-zinc-100">{inv.invoiceNumber}</p>
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{inv.farmerName}</p>
                    {inv.farmerPhone && <p className="text-[10px] text-zinc-500">{inv.farmerPhone}</p>}
                  </div>
                  <p className="text-xs text-zinc-400">{fmtDate(inv.date)}</p>
                  <p className="text-xs text-zinc-400 text-center">{inv.items.length}</p>
                  <p className="text-sm font-bold text-zinc-200">{fmtRs(inv.grandTotal)}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                    {PAYMENT_METHOD_ICONS[inv.paymentMethod]} {inv.paymentMethod}
                  </span>
                  <StatusBadge status={inv.status} />
                  <Eye size={13} className="text-zinc-600" />
                </motion.div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] text-zinc-600">{filtered.length} of {invoices.length} invoices</p>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {viewInvoice && (
        <BillDetailModal
          invoice={viewInvoice}
          isAdmin
          onClose={() => setViewInvoice(null)}
          onRefresh={() => { load(); onRefreshNeeded(); setViewInvoice(null); }}
        />
      )}
    </div>
  );
};

// â”€â”€â”€ New Bill Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface BillLine {
  productId: string;
  productName: string;
  batchId?: string;
  batch?: string;
  qty: string;
  unit: string;
  mrp: number;
  rate: string;
  gstPercent: number;
  discount: string;
}

type NewBillStep = 1 | 2 | 3;

const NewBillTab = ({
  farmers,
  products,
  onSuccess,
}: {
  farmers: Farmer[];
  products: Product[];
  onSuccess: () => void;
}) => {
  const idempotencyKey = useRef(uuid());
  const [step, setStep] = useState<NewBillStep>(1);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [productQ, setProductQ] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [cashAmt, setCashAmt] = useState('');
  const [upiAmt, setUpiAmt] = useState('');
  const [creditAmt, setCreditAmt] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [cultureId, setCultureId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reset idempotency key on tab open
  useEffect(() => { idempotencyKey.current = uuid(); }, []);

  const filteredProducts = products.filter(p =>
    !productQ ||
    p.name.toLowerCase().includes(productQ.toLowerCase()) ||
    p.code.toLowerCase().includes(productQ.toLowerCase())
  );

  const addProduct = (p: Product) => {
    if (lines.find(l => l.productId === p._id)) { setShowProductDrop(false); setProductQ(''); return; }
    setLines(ls => [...ls, {
      productId: p._id,
      productName: p.name,
      qty: '',
      unit: p.baseStockUnit,
      mrp: p.mrp ?? 0,
      rate: String(p.rate ?? ''),
      gstPercent: p.gstPercent ?? 0,
      discount: '0',
    }]);
    setProductQ(''); setShowProductDrop(false);
  };

  const updateLine = (idx: number, field: keyof BillLine, val: string) =>
    setLines(ls => ls.map((l, i) => i !== idx ? l : { ...l, [field]: val }));

  const removeLine = (idx: number) =>
    setLines(ls => ls.filter((_, i) => i !== idx));

  const lineTotal = (l: BillLine) => {
    const qty = parseFloat(l.qty) || 0;
    const rate = parseFloat(l.rate) || 0;
    const disc = parseFloat(l.discount) || 0;
    const afterDisc = rate * qty * (1 - disc / 100);
    return afterDisc * (1 + (l.gstPercent ?? 0) / 100);
  };

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0), 0);
  const totalDiscount = lines.reduce((s, l) => {
    const base = (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0);
    return s + base * ((parseFloat(l.discount) || 0) / 100);
  }, 0);
  const totalGst = lines.reduce((s, l) => {
    const afterDisc = (parseFloat(l.rate) || 0) * (parseFloat(l.qty) || 0) * (1 - (parseFloat(l.discount) || 0) / 100);
    return s + afterDisc * (l.gstPercent / 100);
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalGst;

  const handleSubmit = async () => {
    setErr(null);
    if (!farmer) return setErr('Select a farmer');
    if (!lines.length) return setErr('Add at least one product');
    for (const l of lines) {
      if (!parseFloat(l.qty) || parseFloat(l.qty) <= 0) return setErr(`Enter quantity for ${l.productName}`);
    }

    let paymentPayload: any;
    if (payMethod === 'Cash') {
      paymentPayload = { method: 'Cash', amount: grandTotal };
    } else if (payMethod === 'UPI') {
      paymentPayload = { method: 'UPI', amount: grandTotal, upiRef: upiRef.trim() || undefined };
    } else if (payMethod === 'Credit') {
      paymentPayload = { method: 'Credit', amount: grandTotal };
    } else {
      const cash = parseFloat(cashAmt) || 0;
      const upi = parseFloat(upiAmt) || 0;
      const credit = parseFloat(creditAmt) || 0;
      paymentPayload = { method: 'Mixed', cashAmount: cash, upiAmount: upi, creditAmount: credit, amount: cash + upi + credit, upiRef: upiRef.trim() || undefined };
    }

    setSubmitting(true);
    try {
      await apiFetch('/sales/invoices', {
        method: 'POST',
        body: JSON.stringify({
          farmerId: farmer._id,
          items: lines.map(l => ({
            productId: l.productId,
            quantity: parseFloat(l.qty),
            discount: parseFloat(l.discount) || 0,
            batchId: l.batchId || undefined,
          })),
          payment: paymentPayload,
          idempotencyKey: idempotencyKey.current,
          cultureId: cultureId.trim() || undefined,
        }),
      });
      onSuccess();
      // Reset
      setStep(1); setFarmer(null); setLines([]); setPayMethod('Cash');
      setCashAmt(''); setUpiAmt(''); setCreditAmt(''); setUpiRef(''); setCultureId('');
      idempotencyKey.current = uuid();
    } catch (e: any) {
      setErr(e.message ?? 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel = ['', 'Select Farmer', 'Add Products', 'Payment'][step];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Step indicator */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center gap-2">
            {([1, 2, 3] as NewBillStep[]).map((s, idx) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  step === s ? 'bg-emerald-500 border-emerald-500 text-white' :
                  step > s ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  'bg-white/5 border-white/10 text-zinc-500'
                }`}>{step > s ? <CheckCircle2 size={13} /> : s}</div>
                {idx < 2 && <div className={`flex-1 h-px w-8 ${step > s ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>
          <span className="text-sm font-bold text-zinc-200 ml-2">Step {step}: {stepLabel}</span>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          <AlertTriangle size={13} className="shrink-0" /> {err}
        </div>
      )}

      {/* Step 1: Farmer */}
      {step === 1 && (
        <div className="glass-panel p-6 space-y-5">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Select Farmer *</p>
            <FarmerSearchDropdown farmers={farmers} value={farmer} onChange={setFarmer} />
          </div>
          <div>
            <label className={lCls}>Culture ID (optional)</label>
            <input type="text" value={cultureId} onChange={e => setCultureId(e.target.value)}
              placeholder="e.g. CULT-2026-001" className={iCls} />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => { if (!farmer) { setErr('Select a farmer first'); return; } setErr(null); setStep(2); }}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              Next: Add Products <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="glass-panel p-6 space-y-4">
          {/* Farmer summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
            <User size={14} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-100">{farmer?.name}</p>
              <p className="text-xs text-zinc-500">{farmer?.phoneNumber}</p>
            </div>
            <button onClick={() => setStep(1)} className="ml-auto text-zinc-500 hover:text-zinc-200 transition">
              <ArrowLeft size={14} />
            </button>
          </div>

          {/* Product search */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Add Products *</p>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={productQ}
                onChange={e => { setProductQ(e.target.value); setShowProductDrop(true); }}
                onFocus={() => setShowProductDrop(true)}
                placeholder="Search product to addâ€¦"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500/60 transition placeholder:text-zinc-600"
              />
              {showProductDrop && filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                  {filteredProducts.slice(0, 12).map(p => (
                    <button key={p._id} type="button" onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/8 text-sm flex justify-between items-center gap-2">
                      <span className="text-white font-medium">{p.name}</span>
                      <span className="text-zinc-500 text-xs shrink-0">{p.code} Â· {p.baseStockUnit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lines.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-5 bg-white/3 rounded-xl border border-white/8">
              Search above to add products
            </p>
          )}

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const lt = lineTotal(line);
              return (
                <div key={line.productId} className="bg-white/4 border border-white/8 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{line.productName}</p>
                      {line.batch && <p className="text-[10px] text-zinc-500">Batch: {line.batch}</p>}
                    </div>
                    <button type="button" onClick={() => removeLine(idx)} className="p-1 text-zinc-600 hover:text-red-400 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Qty ({line.unit}) *</label>
                      <input type="number" min="0.01" step="any" value={line.qty}
                        onChange={e => updateLine(idx, 'qty', e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">MRP</label>
                      <p className="text-sm text-zinc-400 py-1.5">{line.mrp > 0 ? fmtRs(line.mrp) : 'â€”'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Rate (â‚¹) *</label>
                      <input type="number" min="0" step="0.01" value={line.rate}
                        onChange={e => updateLine(idx, 'rate', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">GST% / Disc%</label>
                      <div className="flex gap-1">
                        <p className="text-sm text-zinc-400 py-1.5 w-8">{line.gstPercent}%</p>
                        <input type="number" min="0" max="100" step="0.01" value={line.discount}
                          onChange={e => updateLine(idx, 'discount', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-500/60 transition" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="block text-[10px] text-zinc-500 mb-1">Line Total</label>
                      <p className="text-sm font-bold text-white py-1.5">{lt > 0 ? fmtRs(lt) : 'â€”'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {lines.length > 0 && (
            <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmtRs(subtotal)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Discount</span><span className="text-red-400">- {fmtRs(totalDiscount)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>GST</span><span>{fmtRs(totalGst)}</span></div>
              <div className="flex justify-between font-bold text-zinc-100 border-t border-white/8 pt-1.5">
                <span>Grand Total</span><span>{fmtRs(grandTotal)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-1">
            <button onClick={() => { setErr(null); setStep(1); }}
              className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={() => { if (!lines.length) { setErr('Add at least one product'); return; } setErr(null); setStep(3); }}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              Next: Payment <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="glass-panel p-6 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-1.5 text-sm">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Order Summary</p>
            <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>{fmtRs(subtotal)}</span></div>
            <div className="flex justify-between text-zinc-400"><span>Total Discount</span><span className="text-red-400">- {fmtRs(totalDiscount)}</span></div>
            <div className="flex justify-between text-zinc-400"><span>Total GST</span><span>{fmtRs(totalGst)}</span></div>
            <div className="flex justify-between font-bold text-zinc-100 border-t border-white/8 pt-1.5 text-base">
              <span>Grand Total</span><span className="text-emerald-400">{fmtRs(grandTotal)}</span>
            </div>
          </div>

          {/* Payment method tabs */}
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3">Payment Method</p>
            <div className="flex gap-2 flex-wrap">
              {(['Cash', 'UPI', 'Credit', 'Mixed'] as PaymentMethod[]).map(m => (
                <button key={m} type="button" onClick={() => setPayMethod(m)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    payMethod === m
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}>
                  {PAYMENT_METHOD_ICONS[m]} {m}
                </button>
              ))}
            </div>
          </div>

          {/* Method-specific fields */}
          {payMethod === 'UPI' && (
            <div>
              <label className={lCls}>UPI Reference / UTR</label>
              <input type="text" value={upiRef} onChange={e => setUpiRef(e.target.value)}
                placeholder="Transaction ID" className={iCls} />
            </div>
          )}
          {payMethod === 'Mixed' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={lCls}>Cash Amount</label>
                  <input type="number" min="0" step="0.01" value={cashAmt}
                    onChange={e => setCashAmt(e.target.value)} placeholder="0.00" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>UPI Amount</label>
                  <input type="number" min="0" step="0.01" value={upiAmt}
                    onChange={e => setUpiAmt(e.target.value)} placeholder="0.00" className={iCls} />
                </div>
                <div>
                  <label className={lCls}>Credit Amount</label>
                  <input type="number" min="0" step="0.01" value={creditAmt}
                    onChange={e => setCreditAmt(e.target.value)} placeholder="0.00" className={iCls} />
                </div>
              </div>
              {upiAmt && parseFloat(upiAmt) > 0 && (
                <div>
                  <label className={lCls}>UPI Reference</label>
                  <input type="text" value={upiRef} onChange={e => setUpiRef(e.target.value)}
                    placeholder="Transaction ID" className={iCls} />
                </div>
              )}
              <div className="flex justify-between text-xs text-zinc-400 px-1">
                <span>Sum entered</span>
                <span className={Math.abs((parseFloat(cashAmt)||0)+(parseFloat(upiAmt)||0)+(parseFloat(creditAmt)||0) - grandTotal) < 0.01
                  ? 'text-emerald-400' : 'text-amber-400'}>
                  {fmtRs((parseFloat(cashAmt)||0)+(parseFloat(upiAmt)||0)+(parseFloat(creditAmt)||0))} / {fmtRs(grandTotal)}
                </span>
              </div>
            </div>
          )}
          {payMethod === 'Credit' && farmer && (
            <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-400">
              <p className="font-bold mb-1">Credit outstanding for {farmer.name}</p>
              <p>Current balance: {fmtRs(farmer.totalCredit ?? 0)} Â· Adding: {fmtRs(grandTotal)}</p>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-1">
            <button onClick={() => { setErr(null); setStep(2); }}
              className="btn-secondary text-sm px-4 py-2.5 flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-50">
              {submitting ? <Spinner /> : <Receipt size={14} />} Create Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// â”€â”€â”€ Returns Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ReturnsTab = ({ invoices }: { invoices?: Invoice[] }) => {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [invSearch, setInvSearch] = useState('');
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, { checked: boolean; qty: string }>>({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  // Fetch invoices for return modal
  const [modalInvoices, setModalInvoices] = useState<Invoice[]>([]);
  const [modalInvLoading, setModalInvLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<SaleReturn[]>('/sales/returns');
      setReturns(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadInvoicesForModal = useCallback(async () => {
    setModalInvLoading(true);
    try {
      const data = await apiFetch<Invoice[]>('/sales/invoices?status=paid&status=finalized');
      setModalInvoices(data);
    } catch { /* ignore */ } finally {
      setModalInvLoading(false); }
  }, []);

  const openCreate = () => {
    setShowCreate(true);
    setSelectedInv(null); setInvSearch(''); setCheckedItems({}); setReason(''); setCreateErr(null);
    loadInvoicesForModal();
  };

  const handleReturn = async () => {
    if (!selectedInv) return setCreateErr('Select an invoice');
    const items = selectedInv.items
      .map((it, idx) => ({ it, state: checkedItems[idx] }))
      .filter(x => x.state?.checked)
      .map(x => ({ productId: x.it.productId, qty: parseFloat(x.state.qty) || x.it.qty }));
    if (!items.length) return setCreateErr('Select at least one item to return');
    setSubmitting(true); setCreateErr(null);
    try {
      await apiFetch('/sales/returns', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: selectedInv._id, items, reason: reason.trim() || undefined }),
      });
      setShowCreate(false);
      load();
    } catch (e: any) {
      setCreateErr(e.message ?? 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredModalInv = modalInvoices.filter(inv =>
    !invSearch ||
    inv.invoiceNumber.toLowerCase().includes(invSearch.toLowerCase()) ||
    inv.farmerName.toLowerCase().includes(invSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{returns.length} return{returns.length !== 1 ? 's' : ''} recorded</p>
        <div className="flex gap-3">
          <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2 px-4 py-2">
            <Plus size={14} /> Create Return
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading && (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading returnsâ€¦</p>
          </div>
        )}
        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-secondary text-sm">Try Again</button>
          </div>
        )}
        {!loading && !error && returns.length === 0 && (
          <div className="p-12 text-center">
            <RotateCcw size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">No returns yet</p>
            <p className="text-zinc-600 text-sm">Create a return to record items returned by farmers.</p>
          </div>
        )}
        {!loading && !error && returns.length > 0 && (
          <div className="divide-y divide-white/5">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[0.8fr_1fr_1.5fr_1fr_1fr_1fr_0.8fr] gap-2 px-5 py-2.5 bg-white/2">
              {['Return#', 'Invoice#', 'Farmer', 'Date', 'Items', 'Return Amt', 'Status'].map(h => (
                <p key={h} className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {returns.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                className="p-4 md:grid md:grid-cols-[0.8fr_1fr_1.5fr_1fr_1fr_1fr_0.8fr] md:gap-2 md:items-center hover:bg-white/2 transition gap-2 flex flex-wrap"
              >
                <p className="text-sm font-bold text-zinc-100">{r.returnNumber}</p>
                <p className="text-xs text-zinc-400">{r.invoiceNumber}</p>
                <p className="text-sm text-zinc-200">{r.farmerName}</p>
                <p className="text-xs text-zinc-400">{fmtDate(r.date)}</p>
                <p className="text-xs text-zinc-400">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</p>
                <p className="text-sm font-bold text-amber-400">{fmtRs(r.returnAmount)}</p>
                <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/30">{r.status}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Return Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <RotateCcw size={15} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Create Sale Return</h3>
                    <p className="text-[10px] text-zinc-500">Select invoice and items to return</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"><X size={16} /></button>
              </div>

              <div className="p-5 space-y-4">
                {createErr && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                    <AlertTriangle size={12} /> {createErr}
                  </div>
                )}

                {/* Invoice search */}
                {!selectedInv ? (
                  <div>
                    <label className={lCls}>Search Invoice *</label>
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input value={invSearch} onChange={e => setInvSearch(e.target.value)}
                        placeholder="Invoice# or farmer nameâ€¦"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/60 transition placeholder:text-zinc-600" />
                    </div>
                    {modalInvLoading ? (
                      <div className="flex justify-center py-4"><Spinner /></div>
                    ) : (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                        {filteredModalInv.slice(0, 10).map(inv => (
                          <button key={inv._id} type="button" onClick={() => { setSelectedInv(inv); setCheckedItems({}); }}
                            className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/8 text-sm flex justify-between items-center border border-white/5">
                            <div>
                              <p className="text-white font-bold">{inv.invoiceNumber}</p>
                              <p className="text-zinc-500 text-xs">{inv.farmerName} Â· {fmtDate(inv.date)}</p>
                            </div>
                            <span className="text-zinc-400 font-bold">{fmtRs(inv.grandTotal)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{selectedInv.invoiceNumber}</p>
                        <p className="text-xs text-zinc-500">{selectedInv.farmerName} Â· {fmtDate(selectedInv.date)}</p>
                      </div>
                      <button onClick={() => setSelectedInv(null)} className="text-zinc-500 hover:text-zinc-200 text-xs">Change</button>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Select Items to Return *</p>
                    <div className="space-y-2">
                      {selectedInv.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                          <input type="checkbox"
                            checked={checkedItems[idx]?.checked ?? false}
                            onChange={e => setCheckedItems(c => ({ ...c, [idx]: { ...c[idx], checked: e.target.checked, qty: c[idx]?.qty || String(it.qty) } }))}
                            className="w-4 h-4 rounded accent-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm text-zinc-200 font-medium">{it.productName}</p>
                            <p className="text-[10px] text-zinc-500">Orig qty: {it.qty} {it.unit}</p>
                          </div>
                          {checkedItems[idx]?.checked && (
                            <input type="number" min="0.01" max={it.qty} step="any"
                              value={checkedItems[idx]?.qty ?? ''}
                              onChange={e => setCheckedItems(c => ({ ...c, [idx]: { ...c[idx], qty: e.target.value } }))}
                              placeholder="Return qty"
                              className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500/60" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={lCls}>Reason</label>
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Reason for returnâ€¦" className={iCls} />
                </div>
              </div>

              <div className="p-5 border-t border-white/5 flex justify-end gap-3">
                <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                <button onClick={handleReturn} disabled={submitting || !selectedInv}
                  className="btn-primary text-sm px-5 py-2 flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Spinner /> : <RotateCcw size={13} />} Submit Return
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TabId = 'bills' | 'new-bill' | 'returns';

const SalesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('bills');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapErr, setBootstrapErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [billsRefreshKey, setBillsRefreshKey] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadBootstrap = useCallback(async () => {
    setBootstrapLoading(true); setBootstrapErr(null);
    try {
      const [fs, ps] = await Promise.all([
        apiFetch<Farmer[]>('/farmers'),
        apiFetch<Product[]>('/products'),
      ]);
      setFarmers(fs);
      setProducts(ps);
    } catch (e: any) {
      setBootstrapErr(e.message ?? 'Failed to load');
    } finally {
      setBootstrapLoading(false);
    }
  }, []);

  useEffect(() => { loadBootstrap(); }, [loadBootstrap]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'bills',    label: 'Bills',    icon: <ClipboardList size={15} /> },
    { id: 'new-bill', label: 'New Bill', icon: <Plus size={15} /> },
    { id: 'returns',  label: 'Returns',  icon: <RotateCcw size={15} /> },
  ];

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
              <Receipt size={15} className="text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Shop ERP</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Sales &amp; Billing</h1>
          <p className="text-zinc-400 text-sm">Create invoices, record payments, manage credit, and track returns for shop farmers.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={loadBootstrap} className="btn-secondary flex items-center gap-2 text-sm" disabled={bootstrapLoading}>
            <RefreshCw size={14} className={bootstrapLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setActiveTab('new-bill')} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> New Bill
          </button>
        </div>
      </div>

      {/* Bootstrap error */}
      {bootstrapErr && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle size={18} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Failed to load data</p>
            <p className="text-xs opacity-75">{bootstrapErr}</p>
          </div>
          <button onClick={loadBootstrap} className="btn-secondary text-xs px-3 py-1.5">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/4 rounded-xl border border-white/8 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'bills' && (
            <BillsTab
              farmers={farmers}
              refreshKey={billsRefreshKey}
              onRefreshNeeded={() => setBillsRefreshKey(k => k + 1)}
            />
          )}
          {activeTab === 'new-bill' && !bootstrapLoading && (
            <NewBillTab
              farmers={farmers}
              products={products}
              onSuccess={() => {
                showToast('Invoice created successfully!');
                setActiveTab('bills');
                setBillsRefreshKey(k => k + 1);
              }}
            />
          )}
          {activeTab === 'new-bill' && bootstrapLoading && (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">Loading farmers and productsâ€¦</p>
              </div>
            </div>
          )}
          {activeTab === 'returns' && (
            <ReturnsTab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SalesManagement;
