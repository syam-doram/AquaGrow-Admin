/**
 * WhatsAppManagement.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Admin page: manage WhatsApp Business integration â€” messages, templates,
 * and alert settings for the AquaGrow Shop.
 *
 * Endpoints:
 *   GET  /api/whatsapp/messages?status=&from=&to=&farmerId=
 *   POST /api/whatsapp/retry/:id
 *   GET  /api/whatsapp/templates
 *   POST /api/whatsapp/templates
 *   GET  /api/whatsapp/alert-settings
 *   PUT  /api/whatsapp/alert-settings
 *   GET  /api/whatsapp/stats
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  X, Plus, Search, ChevronDown, Loader2, Bell, FileText,
  Send, XCircle, RotateCcw, Eye, Settings, ToggleLeft, ToggleRight,
  Smartphone, Calendar, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

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
type MsgStatus = 'pending' | 'sent' | 'delivered' | 'failed';
type TemplateType = 'invoice' | 'expiry_alert' | 'custom';
type ActiveTab = 'messages' | 'templates' | 'alerts';

interface WAMessage {
  _id: string;
  farmerName: string;
  phone: string;
  templateName: string;
  sentAt?: string;
  status: MsgStatus;
  retryCount: number;
  payload?: Record<string, unknown>;
  createdAt: string;
}

interface WATemplate {
  _id: string;
  name: string;
  type: TemplateType;
  body: string;
  language: string;
  lastUsed?: string;
  status: 'active' | 'inactive';
}

interface AlertSettings {
  expiryAlerts: {
    enabled: boolean;
    days: { d30: boolean; d15: boolean; d7: boolean };
    sendTime: string;
  };
  invoiceAlerts: {
    sendOnBillCreation: boolean;
    sendPaymentConfirmation: boolean;
    templateId: string;
  };
  creditReminders: {
    enabled: boolean;
    daysAfterDue: number;
    templateId: string;
  };
}

interface WAStats {
  totalSentThisMonth: number;
  failedMessages: number;
  deliveryRate: number;
}

interface WAConfigure {
  configured: boolean;
  providerName?: string;
  status?: string;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';
const fmtDateTime = (s?: string) =>
  s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'â€”';

// â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MSG_STATUS_META: Record<MsgStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',     icon: <Clock size={10} /> },
  sent:      { label: 'Sent',      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     icon: <Send size={10} /> },
  delivered: { label: 'Delivered', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 size={10} /> },
  failed:    { label: 'Failed',    color: 'bg-red-500/15 text-red-400 border-red-500/30',        icon: <XCircle size={10} /> },
};

const MsgStatusBadge = ({ status }: { status: MsgStatus }) => {
  const m = MSG_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
};

const TMPL_TYPE_META: Record<TemplateType, { label: string; color: string }> = {
  invoice:      { label: 'Invoice',       color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  expiry_alert: { label: 'Expiry Alert',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  custom:       { label: 'Custom',        color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
};

const TmplTypeBadge = ({ type }: { type: TemplateType }) => {
  const m = TMPL_TYPE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${m.color}`}>
      {m.label}
    </span>
  );
};

// â”€â”€â”€ Spinner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Spinner = () => <Loader2 size={15} className="animate-spin" />;

// â”€â”€â”€ Toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`flex items-center gap-1 text-xs font-semibold transition-colors ${value ? 'text-emerald-400' : 'text-zinc-500'}`}
  >
    {value ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} className="text-zinc-500" />}
    {value ? 'On' : 'Off'}
  </button>
);

// â”€â”€â”€ Message Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MessageDetailModal = ({ msg, onClose }: { msg: WAMessage; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <Eye size={16} className="text-blue-400" /> Message Detail
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-zinc-500 text-xs mb-1">Farmer</p>
              <p className="text-zinc-200 font-semibold">{msg.farmerName}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Phone</p>
              <p className="text-zinc-200 font-mono">{msg.phone}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Template</p>
              <p className="text-zinc-200">{msg.templateName}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Status</p>
              <MsgStatusBadge status={msg.status} />
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Sent At</p>
              <p className="text-zinc-300 text-xs">{fmtDateTime(msg.sentAt)}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">Retry Count</p>
              <p className="text-zinc-300">{msg.retryCount}</p>
            </div>
          </div>
          {msg.payload && (
            <div>
              <p className="text-zinc-500 text-xs mb-2">Payload</p>
              <pre className="bg-zinc-800/60 border border-white/8 rounded-xl p-3 text-xs text-zinc-300 overflow-x-auto font-mono whitespace-pre-wrap">
                {JSON.stringify(msg.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// â”€â”€â”€ Add Template Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface TemplateFormState {
  name: string;
  type: TemplateType;
  body: string;
  language: string;
}

const AddTemplateModal = ({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<TemplateFormState>({ name: '', type: 'custom', body: '', language: 'en' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) { setError('Name and body are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/whatsapp/templates', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" /> Add Template
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={12} /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. invoice_reminder"
                className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Type</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as TemplateType }))}
                  className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 appearance-none pr-8"
                >
                  <option value="invoice">Invoice</option>
                  <option value="expiry_alert">Expiry Alert</option>
                  <option value="custom">Custom</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Message Body <span className="text-zinc-600">(use {'{{variable}}'} for placeholders)</span>
              </label>
              <textarea
                rows={5}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Dear {{farmerName}}, your invoice {{invoiceNo}} of â‚¹{{amount}} is ready."
                className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Language</label>
              <div className="relative">
                <select
                  value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  className="w-full bg-zinc-800/60 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 appearance-none pr-8"
                >
                  <option value="en">English</option>
                  <option value="kn">Kannada</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/8">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all disabled:opacity-50"
            >
              {saving ? <Spinner /> : <Plus size={13} />}
              Save Template
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ Tab: Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MessagesTab = () => {
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [viewMsg, setViewMsg] = useState<WAMessage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      if (farmerSearch.trim()) params.set('farmerId', farmerSearch.trim());
      const data = await apiFetch<WAMessage[]>(`/api/whatsapp/messages?${params.toString()}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo, farmerSearch]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryingId(id);
    try {
      await apiFetch(`/api/whatsapp/retry/${id}`, { method: 'POST' });
      load();
    } catch {
      // silent â€” visual feedback via reload
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={farmerSearch}
            onChange={e => setFarmerSearch(e.target.value)}
            placeholder="Farmer name / IDâ€¦"
            className="w-full bg-zinc-800/50 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-800/50 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/40 appearance-none pr-7"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="bg-zinc-800/50 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/40"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="bg-zinc-800/50 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/40"
        />
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-white/8 rounded-xl transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.4fr_1.4fr_1.4fr_1fr_0.6fr_1fr] gap-3 px-4 py-3 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          <span>Farmer Name</span>
          <span>Phone</span>
          <span>Template</span>
          <span>Sent At</span>
          <span>Status</span>
          <span>Retries</span>
          <span>Actions</span>
        </div>

        {loading && (
          <div className="p-10 flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <Spinner /> Loading messagesâ€¦
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 text-sm border border-white/8 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="p-12 text-center">
            <MessageCircle size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">No messages found</p>
            <p className="text-zinc-600 text-sm">Try adjusting your filters.</p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="divide-y divide-white/5">
            {messages.map((msg, i) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="grid md:grid-cols-[2fr_1.4fr_1.4fr_1.4fr_1fr_0.6fr_1fr] gap-3 px-4 py-3 items-center hover:bg-white/2 transition-all cursor-pointer"
                onClick={() => setViewMsg(msg)}
              >
                <span className="text-sm font-semibold text-zinc-200">{msg.farmerName}</span>
                <span className="text-xs text-zinc-400 font-mono">{msg.phone}</span>
                <span className="text-xs text-zinc-400 truncate">{msg.templateName}</span>
                <span className="text-xs text-zinc-500">{fmtDateTime(msg.sentAt)}</span>
                <span><MsgStatusBadge status={msg.status} /></span>
                <span className="text-xs text-zinc-500">{msg.retryCount}</span>
                <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                  {msg.status === 'failed' && (
                    <button
                      onClick={e => handleRetry(msg._id, e)}
                      disabled={retryingId === msg._id}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-all disabled:opacity-50"
                    >
                      {retryingId === msg._id ? <Spinner /> : <RotateCcw size={10} />} Retry
                    </button>
                  )}
                  <button
                    onClick={() => setViewMsg(msg)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <Eye size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-zinc-600">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {viewMsg && <MessageDetailModal msg={viewMsg} onClose={() => setViewMsg(null)} />}
    </div>
  );
};

// â”€â”€â”€ Tab: Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TemplatesTab = () => {
  const [templates, setTemplates] = useState<WATemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<WATemplate[]>('/whatsapp/templates');
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{templates.length} template{templates.length !== 1 ? 's' : ''} configured</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all"
        >
          <Plus size={14} /> Add Template
        </button>
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.2fr_1.4fr_1fr] gap-3 px-4 py-3 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          <span>Template Name</span>
          <span>Type</span>
          <span>Last Used</span>
          <span>Status</span>
        </div>

        {loading && (
          <div className="p-10 flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <Spinner /> Loading templatesâ€¦
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-bold text-sm mb-3">{error}</p>
            <button onClick={load} className="px-4 py-2 text-sm border border-white/8 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && templates.length === 0 && (
          <div className="p-12 text-center">
            <FileText size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-bold mb-1">No templates yet</p>
            <p className="text-zinc-600 text-sm mb-4">Create your first WhatsApp message template.</p>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all mx-auto">
              <Plus size={13} /> Add Template
            </button>
          </div>
        )}

        {!loading && !error && templates.length > 0 && (
          <div className="divide-y divide-white/5">
            {templates.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="grid md:grid-cols-[2fr_1.2fr_1.4fr_1fr] gap-3 px-4 py-3 items-center hover:bg-white/2 transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5 truncate max-w-xs">{t.body}</p>
                </div>
                <TmplTypeBadge type={t.type} />
                <span className="text-xs text-zinc-500">{fmtDate(t.lastUsed)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${
                  t.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                }`}>
                  {t.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTemplateModal
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}
    </div>
  );
};

// â”€â”€â”€ Tab: Alert Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AlertSettingsTab = ({ templates }: { templates: WATemplate[] }) => {
  const defaultSettings: AlertSettings = {
    expiryAlerts: { enabled: false, days: { d30: false, d15: false, d7: false }, sendTime: '09:00' },
    invoiceAlerts: { sendOnBillCreation: false, sendPaymentConfirmation: false, templateId: '' },
    creditReminders: { enabled: false, daysAfterDue: 3, templateId: '' },
  };

  const [settings, setSettings] = useState<AlertSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch<AlertSettings>('/whatsapp/alert-settings');
        setSettings(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiFetch('/whatsapp/alert-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-zinc-500 text-sm">
        <Spinner /> Loading settingsâ€¦
      </div>
    );
  }

  const sectionCls = 'bg-zinc-900/60 backdrop-blur-xl border border-white/8 rounded-2xl p-5 space-y-4';
  const labelCls = 'text-xs text-zinc-400 font-medium';
  const inputCls = 'bg-zinc-800/60 border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50';

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Expiry Alerts */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-400" />
            <h4 className="font-bold text-zinc-200">Expiry Alerts</h4>
          </div>
          <Toggle
            value={settings.expiryAlerts.enabled}
            onChange={v => setSettings(s => ({ ...s, expiryAlerts: { ...s.expiryAlerts, enabled: v } }))}
          />
        </div>

        <div className={`space-y-4 transition-opacity ${settings.expiryAlerts.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div>
            <p className={`${labelCls} mb-2`}>Alert days before expiry</p>
            <div className="flex flex-wrap gap-4">
              {([['d30', '30 days before'], ['d15', '15 days before'], ['d7', '7 days before']] as [keyof AlertSettings['expiryAlerts']['days'], string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.expiryAlerts.days[key]}
                    onChange={e => setSettings(s => ({
                      ...s,
                      expiryAlerts: { ...s.expiryAlerts, days: { ...s.expiryAlerts.days, [key]: e.target.checked } }
                    }))}
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={`${labelCls} block mb-1.5`}>Time of day to send</label>
            <input
              type="time"
              value={settings.expiryAlerts.sendTime}
              onChange={e => setSettings(s => ({ ...s, expiryAlerts: { ...s.expiryAlerts, sendTime: e.target.value } }))}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Invoice Alerts */}
      <div className={sectionCls}>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-blue-400" />
          <h4 className="font-bold text-zinc-200">Invoice Alerts</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Send WhatsApp on bill creation</span>
            <Toggle
              value={settings.invoiceAlerts.sendOnBillCreation}
              onChange={v => setSettings(s => ({ ...s, invoiceAlerts: { ...s.invoiceAlerts, sendOnBillCreation: v } }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Send payment confirmation</span>
            <Toggle
              value={settings.invoiceAlerts.sendPaymentConfirmation}
              onChange={v => setSettings(s => ({ ...s, invoiceAlerts: { ...s.invoiceAlerts, sendPaymentConfirmation: v } }))}
            />
          </div>

          <div>
            <label className={`${labelCls} block mb-1.5`}>Template to use</label>
            <div className="relative">
              <select
                value={settings.invoiceAlerts.templateId}
                onChange={e => setSettings(s => ({ ...s, invoiceAlerts: { ...s.invoiceAlerts, templateId: e.target.value } }))}
                className={`${inputCls} w-full appearance-none pr-8`}
              >
                <option value="">â€” Select template â€”</option>
                {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Credit Reminders */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-purple-400" />
            <h4 className="font-bold text-zinc-200">Credit Reminders</h4>
          </div>
          <Toggle
            value={settings.creditReminders.enabled}
            onChange={v => setSettings(s => ({ ...s, creditReminders: { ...s.creditReminders, enabled: v } }))}
          />
        </div>

        <div className={`space-y-3 transition-opacity ${settings.creditReminders.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div>
            <label className={`${labelCls} block mb-1.5`}>Days after due date to send reminder</label>
            <input
              type="number"
              min={1}
              max={90}
              value={settings.creditReminders.daysAfterDue}
              onChange={e => setSettings(s => ({ ...s, creditReminders: { ...s.creditReminders, daysAfterDue: parseInt(e.target.value) || 1 } }))}
              className={`${inputCls} w-32`}
            />
          </div>

          <div>
            <label className={`${labelCls} block mb-1.5`}>Template to use</label>
            <div className="relative">
              <select
                value={settings.creditReminders.templateId}
                onChange={e => setSettings(s => ({ ...s, creditReminders: { ...s.creditReminders, templateId: e.target.value } }))}
                className={`${inputCls} w-full appearance-none pr-8`}
              >
                <option value="">â€” Select template â€”</option>
                {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? <Spinner /> : <Settings size={14} />}
          Save Settings
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="text-sm text-emerald-400 flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} /> Saved!
          </motion.span>
        )}
      </div>
    </div>
  );
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WhatsAppManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
  const [config, setConfig] = useState<WAConfigure | null>(null);
  const [stats, setStats] = useState<WAStats | null>(null);
  const [templates, setTemplates] = useState<WATemplate[]>([]);

  useEffect(() => {
    // Load config status, stats, and templates in parallel
    const loadAll = async () => {
      try {
        const [cfg, st, tmpl] = await Promise.allSettled([
          apiFetch<WAConfigure>('/whatsapp/config'),
          apiFetch<WAStats>('/whatsapp/stats'),
          apiFetch<WATemplate[]>('/whatsapp/templates'),
        ]);
        if (cfg.status === 'fulfilled') setConfig(cfg.value);
        if (st.status === 'fulfilled') setStats(st.value);
        if (tmpl.status === 'fulfilled') setTemplates(Array.isArray(tmpl.value) ? tmpl.value : []);
      } catch {
        // non-critical
      }
    };
    loadAll();
  }, []);

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'messages',   label: 'Messages',       icon: <MessageCircle size={14} /> },
    { key: 'templates',  label: 'Templates',       icon: <FileText size={14} /> },
    { key: 'alerts',     label: 'Alert Settings',  icon: <Bell size={14} /> },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Smartphone size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100">WhatsApp Management</h1>
            <p className="text-xs text-zinc-500">Messages, templates, and alert configuration</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {config !== null && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm ${
            config.configured
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
          }`}
        >
          {config.configured ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>
                WhatsApp Business API connected via <strong>{config.providerName}</strong>
                {config.status && <> â€” <span className="font-semibold capitalize">{config.status}</span></>}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>WhatsApp Business API not configured. Contact support to set up credentials.</span>
            </>
          )}
        </motion.div>
      )}

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: 'Sent This Month',
              value: stats.totalSentThisMonth.toLocaleString('en-IN'),
              icon: <Send size={16} className="text-blue-400" />,
              color: 'border-blue-500/20 bg-blue-500/5',
            },
            {
              label: 'Failed Messages',
              value: stats.failedMessages.toLocaleString('en-IN'),
              icon: <XCircle size={16} className="text-red-400" />,
              color: 'border-red-500/20 bg-red-500/5',
            },
            {
              label: 'Delivery Rate',
              value: `${stats.deliveryRate.toFixed(1)}%`,
              icon: <TrendingUp size={16} className="text-emerald-400" />,
              color: 'border-emerald-500/20 bg-emerald-500/5',
            },
          ].map(item => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl ${item.color}`}
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-900/60 border border-white/8 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="text-lg font-bold text-zinc-100">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900/60 backdrop-blur-xl border border-white/8 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white/8 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/4'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'messages'  && <MessagesTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'alerts'    && <AlertSettingsTab templates={templates} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WhatsAppManagement;
