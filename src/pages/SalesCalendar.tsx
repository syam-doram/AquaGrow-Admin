/**
 * SalesCalendar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Monthly calendar view of sales performance.
 *
 * API:
 *   GET /api/sales/calendar?year=&month=  → { days: { [date]: { cash, upi, credit, total, collections, billsCount, returns, netSales } } }
 *   GET /api/sales/calendar/:date         → { summary:{...}, bills:[...] }
 *   GET /api/reports/sales?from=&to=      → CSV download
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays, IndianRupee, Loader2,
  AlertTriangle, RefreshCw, X, TrendingUp, Banknote, CreditCard,
  Smartphone, ArrowDownCircle, FileText, ChevronDown, ChevronUp,
  Download, BarChart2, List, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_URL, getAdminToken } from '../services/aquagrowApi';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'range';
type FilterPreset = 'today' | 'week' | 'month' | 'custom';

interface DaySummary {
  cash: number;
  upi: number;
  credit: number;
  total: number;
  collections: number;
  billsCount: number;
  returns: number;
  netSales: number;
}

interface CalendarData {
  days: Record<string, DaySummary>;
}

interface BillItem {
  productName: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Bill {
  _id: string;
  invoiceNumber: string;
  farmerName: string;
  farmerPhone?: string;
  items: BillItem[];
  total: number;
  paymentMethod: 'cash' | 'upi' | 'credit' | 'mixed';
  status: 'paid' | 'partial' | 'credit' | 'cancelled';
  createdAt: string;
}

interface DayDetail {
  summary: DaySummary;
  bills: Bill[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtRs = (n?: number) =>
  n != null ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

const fmtRsCompact = (n?: number) => {
  if (n == null) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}
const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 min-w-[140px]"
  >
    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-zinc-400 leading-none mb-1">{label}</p>
      <p className="text-lg font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

// ─── Bill Items Expandable ────────────────────────────────────────────────────

const BillRow: React.FC<{ bill: Bill }> = ({ bill }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    paid: 'text-emerald-400 bg-emerald-500/10',
    partial: 'text-amber-400 bg-amber-500/10',
    credit: 'text-blue-400 bg-blue-500/10',
    cancelled: 'text-red-400 bg-red-500/10',
  };
  const methodColors: Record<string, string> = {
    cash: 'text-emerald-300',
    upi: 'text-purple-300',
    credit: 'text-amber-300',
    mixed: 'text-blue-300',
  };

  return (
    <>
      <tr
        className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-3 py-2 text-xs font-mono text-zinc-300">{bill.invoiceNumber}</td>
        <td className="px-3 py-2">
          <p className="text-sm text-white">{bill.farmerName}</p>
          {bill.farmerPhone && <p className="text-xs text-zinc-500">{bill.farmerPhone}</p>}
        </td>
        <td className="px-3 py-2 text-xs text-zinc-400 text-center">{bill.items.length} items</td>
        <td className="px-3 py-2 text-sm font-semibold text-white text-right">{fmtRs(bill.total)}</td>
        <td className="px-3 py-2 text-center">
          <span className={`text-xs font-medium capitalize ${methodColors[bill.paymentMethod] ?? 'text-zinc-400'}`}>
            {bill.paymentMethod}
          </span>
        </td>
        <td className="px-3 py-2 text-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[bill.status] ?? 'text-zinc-400 bg-zinc-500/10'}`}>
            {bill.status}
          </span>
        </td>
        <td className="px-3 py-2 text-center text-zinc-500">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={7} className="px-6 pb-3 bg-black/20">
              <table className="w-full text-xs mt-1">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="text-left pb-1">Product</th>
                    <th className="text-right pb-1">Qty</th>
                    <th className="text-right pb-1">Rate</th>
                    <th className="text-right pb-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1 text-zinc-300">{item.productName}</td>
                      <td className="py-1 text-right text-zinc-400">{item.qty} {item.unit}</td>
                      <td className="py-1 text-right text-zinc-400">₹{item.rate.toFixed(2)}</td>
                      <td className="py-1 text-right text-white font-medium">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

interface DayDetailModalProps {
  date: string;
  onClose: () => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, onClose }) => {
  const [data, setData] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<DayDetail>(`/sales/calendar/${date}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{displayDate}</h2>
            {data && (
              <p className="text-sm text-zinc-400 mt-0.5">
                Net Sales: <span className="text-emerald-400 font-semibold">{fmtRs(data.summary.netSales)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-emerald-400" size={32} />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
              <AlertTriangle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {data && (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {[
                  { label: 'Cash', value: data.summary.cash, color: 'text-emerald-400' },
                  { label: 'UPI', value: data.summary.upi, color: 'text-purple-400' },
                  { label: 'Credit', value: data.summary.credit, color: 'text-amber-400' },
                  { label: 'Collections', value: data.summary.collections, color: 'text-blue-400' },
                  { label: 'Returns', value: data.summary.returns, color: 'text-red-400' },
                  { label: 'Net Sales', value: data.summary.netSales, color: 'text-white font-bold' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-xs text-zinc-500 mb-1">{label}</p>
                    <p className={`text-sm font-semibold ${color}`}>{fmtRs(value)}</p>
                  </div>
                ))}
              </div>

              {/* Bills table */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-zinc-400" />
                  Bills ({data.summary.billsCount})
                </h3>
                {data.bills.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">No bills found for this day.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="bg-white/5 text-xs text-zinc-500 uppercase tracking-wide">
                          <th className="px-3 py-2 text-left">Invoice#</th>
                          <th className="px-3 py-2 text-left">Farmer</th>
                          <th className="px-3 py-2 text-center">Items</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-center">Method</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.bills.map(bill => (
                          <BillRow key={bill._id} bill={bill} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Monthly Calendar Grid ────────────────────────────────────────────────────

interface MonthGridProps {
  year: number;
  month: number; // 0-based
  days: Record<string, DaySummary>;
  onDayClick: (date: string) => void;
  today: string;
}

const MonthGrid: React.FC<MonthGridProps> = ({ year, month, days, onDayClick, today }) => {
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // getDay(): 0=Sun..6=Sat; we want Mon=0..Sun=6
    let startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ date: dateStr, day: d });
    }
    // pad to full weeks
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [year, month]);

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-center text-xs font-semibold text-zinc-500 py-2">
            {h}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="rounded-xl min-h-[80px]" />;
          }
          const data = days[cell.date];
          const isToday = cell.date === today;
          const hasData = !!data && data.total > 0;

          return (
            <motion.button
              key={cell.date}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDayClick(cell.date)}
              className={`
                relative rounded-xl p-2 text-left transition-all min-h-[80px] flex flex-col
                ${isToday
                  ? 'border-2 border-emerald-400 bg-emerald-500/5'
                  : 'border border-white/5 hover:border-white/20 hover:bg-white/5'}
                ${!hasData ? 'opacity-50' : ''}
              `}
            >
              {/* Date number */}
              <span className={`text-xs font-bold mb-1 ${isToday ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {cell.day}
              </span>

              {hasData ? (
                <div className="flex flex-col gap-0.5 w-full">
                  {/* Total */}
                  <span className="text-xs font-semibold text-emerald-400 leading-none">
                    {fmtRsCompact(data.total)}
                  </span>
                  {/* Bills badge */}
                  <span className="text-[10px] text-zinc-400">
                    {data.billsCount} bill{data.billsCount !== 1 ? 's' : ''}
                  </span>
                  {/* Credit */}
                  {data.credit > 0 && (
                    <span className="text-[10px] text-amber-400 leading-none">
                      Cr {fmtRsCompact(data.credit)}
                    </span>
                  )}
                  {/* Collections */}
                  {data.collections > 0 && (
                    <span className="text-[10px] text-blue-400 leading-none">
                      Col {fmtRsCompact(data.collections)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-zinc-600 mt-auto">—</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Weekly View ─────────────────────────────────────────────────────────────

interface WeeklyViewProps {
  days: Record<string, DaySummary>;
  baseDate: Date;
  onDayClick: (date: string) => void;
  today: string;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ days, baseDate, onDayClick, today }) => {
  // Build 4 weeks from baseDate (Mon-aligned)
  const weeks = useMemo(() => {
    const start = new Date(baseDate);
    // Go back to Monday of that week
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const result: string[][] = [];
    for (let w = 0; w < 4; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        week.push(toISO(cur));
      }
      result.push(week);
    }
    return result;
  }, [baseDate]);

  const maxTotal = useMemo(() => {
    let m = 0;
    Object.values(days).forEach(d => { if (d.total > m) m = d.total; });
    return m || 1;
  }, [days]);

  return (
    <div className="space-y-4">
      {weeks.map((week, wi) => (
        <div key={wi} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-3">
            {new Date(week[0] + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            {' — '}
            {new Date(week[6] + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {week.map(date => {
              const d = days[date];
              const isToday = date === today;
              const pct = d ? (d.total / maxTotal) * 100 : 0;
              const cashPct = d && d.total > 0 ? (d.cash / d.total) * 100 : 0;
              const creditPct = d && d.total > 0 ? (d.credit / d.total) * 100 : 0;
              const colPct = d && d.total > 0 ? (d.collections / d.total) * 100 : 0;

              return (
                <button
                  key={date}
                  onClick={() => onDayClick(date)}
                  className={`flex flex-col items-center gap-1 group ${!d ? 'opacity-30' : ''}`}
                >
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className={`text-[10px] ${isToday ? 'text-emerald-300' : 'text-zinc-500'}`}>
                    {new Date(date + 'T00:00:00').getDate()}
                  </span>
                  {/* Stacked bar */}
                  <div className="relative w-full h-20 bg-white/5 rounded-lg overflow-hidden flex flex-col-reverse">
                    <div className="w-full bg-emerald-500/70 transition-all" style={{ height: `${cashPct * pct / 100}%` }} />
                    <div className="w-full bg-amber-500/70 transition-all" style={{ height: `${creditPct * pct / 100}%` }} />
                    <div className="w-full bg-blue-500/70 transition-all" style={{ height: `${colPct * pct / 100}%` }} />
                  </div>
                  {d ? (
                    <span className="text-[10px] text-zinc-300 font-medium">{fmtRsCompact(d.total)}</span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-end">
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/70 inline-block" />Cash
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span className="w-2 h-2 rounded-sm bg-amber-500/70 inline-block" />Credit
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span className="w-2 h-2 rounded-sm bg-blue-500/70 inline-block" />Collections
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Range List View ──────────────────────────────────────────────────────────

interface RangeViewProps {
  days: Record<string, DaySummary>;
  onDayClick: (date: string) => void;
  fromDate: string;
  toDate: string;
}

const RangeView: React.FC<RangeViewProps> = ({ days, onDayClick, fromDate, toDate }) => {
  const rows = useMemo(() => {
    const result: Array<{ date: string; data: DaySummary }> = [];
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T00:00:00');
    const cur = new Date(start);
    while (cur <= end) {
      const dateStr = toISO(cur);
      if (days[dateStr]) result.push({ date: dateStr, data: days[dateStr] });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [days, fromDate, toDate]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        No sales data found for the selected range.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="bg-white/5 text-xs text-zinc-500 uppercase tracking-wide">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-right">Cash</th>
            <th className="px-4 py-2 text-right">UPI</th>
            <th className="px-4 py-2 text-right">Credit</th>
            <th className="px-4 py-2 text-right">Collections</th>
            <th className="px-4 py-2 text-right">Returns</th>
            <th className="px-4 py-2 text-right">Net Sales</th>
            <th className="px-4 py-2 text-center">Bills</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ date, data }) => (
            <tr
              key={date}
              className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => onDayClick(date)}
            >
              <td className="px-4 py-2 text-sm text-white">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                })}
              </td>
              <td className="px-4 py-2 text-sm text-emerald-400 text-right">{fmtRs(data.cash)}</td>
              <td className="px-4 py-2 text-sm text-purple-400 text-right">{fmtRs(data.upi)}</td>
              <td className="px-4 py-2 text-sm text-amber-400 text-right">{data.credit > 0 ? fmtRs(data.credit) : <span className="text-zinc-600">—</span>}</td>
              <td className="px-4 py-2 text-sm text-blue-400 text-right">{data.collections > 0 ? fmtRs(data.collections) : <span className="text-zinc-600">—</span>}</td>
              <td className="px-4 py-2 text-sm text-red-400 text-right">{data.returns > 0 ? fmtRs(data.returns) : <span className="text-zinc-600">—</span>}</td>
              <td className="px-4 py-2 text-sm font-semibold text-white text-right">{fmtRs(data.netSales)}</td>
              <td className="px-4 py-2 text-sm text-zinc-300 text-center">{data.billsCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesCalendar: React.FC = () => {
  const todayDate = useMemo(() => toISO(new Date()), []);
  const todayObj = useMemo(() => new Date(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterPreset, setFilterPreset] = useState<FilterPreset>('month');

  // Month/Year navigation
  const [navYear, setNavYear] = useState(todayObj.getFullYear());
  const [navMonth, setNavMonth] = useState(todayObj.getMonth()); // 0-based

  // Custom range
  const [fromDate, setFromDate] = useState(toISO(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1)));
  const [toDate, setToDate] = useState(todayDate);

  // Data
  const [calData, setCalData] = useState<Record<string, DaySummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);

  // ── Totals derived from loaded data ──
  const totals = useMemo(() => {
    let totalSales = 0, cash = 0, upi = 0, credit = 0, collections = 0, bills = 0;
    Object.values(calData).forEach(d => {
      totalSales += d.total;
      cash += d.cash;
      upi += d.upi;
      credit += d.credit;
      collections += d.collections;
      bills += d.billsCount;
    });
    return { totalSales, cash, upi, credit, collections, bills };
  }, [calData]);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'range') {
        const res = await apiFetch<CalendarData>(
          `/sales/calendar?from=${fromDate}&to=${toDate}`
        );
        setCalData(res.days ?? {});
      } else {
        const year = navYear;
        const month = navMonth + 1;
        const res = await apiFetch<CalendarData>(
          `/sales/calendar?year=${year}&month=${month}`
        );
        setCalData(res.days ?? {});
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [viewMode, navYear, navMonth, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter preset handlers ──
  const applyPreset = useCallback((preset: FilterPreset) => {
    setFilterPreset(preset);
    const now = new Date();
    if (preset === 'today') {
      setFromDate(todayDate);
      setToDate(todayDate);
      setViewMode('range');
    } else if (preset === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      setFromDate(toISO(start));
      setToDate(todayDate);
      setViewMode('week');
      setNavYear(now.getFullYear());
      setNavMonth(now.getMonth());
    } else if (preset === 'month') {
      setNavYear(now.getFullYear());
      setNavMonth(now.getMonth());
      setViewMode('month');
    } else {
      setViewMode('range');
    }
  }, [todayDate]);

  // ── Month navigation ──
  const prevMonth = () => {
    if (navMonth === 0) { setNavYear(y => y - 1); setNavMonth(11); }
    else setNavMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (navMonth === 11) { setNavYear(y => y + 1); setNavMonth(0); }
    else setNavMonth(m => m + 1);
  };

  // ── Export CSV ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = getAdminToken();
      const params = viewMode === 'range'
        ? `from=${fromDate}&to=${toDate}`
        : `from=${navYear}-${String(navMonth + 1).padStart(2, '0')}-01&to=${toISO(new Date(navYear, navMonth + 1, 0))}`;
      const url = `${BASE_URL}/reports/sales?${params}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sales-${fromDate}-to-${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 space-y-6">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/15 rounded-xl">
            <CalendarDays className="text-emerald-400" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sales Calendar</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Monthly performance overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* ── Top Controls ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4"
      >
        {/* Row 1: Nav + filter preset + view toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-white min-w-[130px] text-center">
              {MONTH_NAMES[navMonth]} {navYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 hidden sm:block" />

          {/* Preset filters */}
          <div className="flex gap-1">
            {(['today', 'week', 'month', 'custom'] as FilterPreset[]).map(preset => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filterPreset === preset
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset === 'custom' ? 'Custom Range' : preset.charAt(0).toUpperCase() + preset.slice(1)}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 hidden sm:block" />

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            {([
              { mode: 'month' as ViewMode, icon: <Calendar size={14} />, label: 'Month' },
              { mode: 'week' as ViewMode, icon: <BarChart2 size={14} />, label: 'Week' },
              { mode: 'range' as ViewMode, icon: <List size={14} />, label: 'List' },
            ]).map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Custom date inputs (only when range/custom) */}
        <AnimatePresence>
          {(viewMode === 'range' || filterPreset === 'custom') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => { setViewMode('range'); fetchData(); }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Summary Cards ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <SummaryCard
          label="Total Sales"
          value={fmtRs(totals.totalSales)}
          icon={<TrendingUp size={16} className="text-emerald-400" />}
          color="bg-emerald-500/10"
        />
        <SummaryCard
          label="Cash"
          value={fmtRs(totals.cash)}
          icon={<Banknote size={16} className="text-green-400" />}
          color="bg-green-500/10"
        />
        <SummaryCard
          label="UPI"
          value={fmtRs(totals.upi)}
          icon={<Smartphone size={16} className="text-purple-400" />}
          color="bg-purple-500/10"
        />
        <SummaryCard
          label="Credit"
          value={fmtRs(totals.credit)}
          icon={<CreditCard size={16} className="text-amber-400" />}
          color="bg-amber-500/10"
        />
        <SummaryCard
          label="Collections"
          value={fmtRs(totals.collections)}
          icon={<ArrowDownCircle size={16} className="text-blue-400" />}
          color="bg-blue-500/10"
        />
        <SummaryCard
          label="Total Bills"
          value={String(totals.bills)}
          icon={<FileText size={16} className="text-zinc-400" />}
          color="bg-zinc-500/10"
          sub="invoices"
        />
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400"
          >
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-400" size={36} />
        </div>
      )}

      {/* ── Calendar Views ── */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <AnimatePresence mode="wait">
            {viewMode === 'month' && (
              <motion.div
                key="month"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MonthGrid
                  year={navYear}
                  month={navMonth}
                  days={calData}
                  onDayClick={setSelectedDate}
                  today={todayDate}
                />
              </motion.div>
            )}

            {viewMode === 'week' && (
              <motion.div
                key="week"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WeeklyView
                  days={calData}
                  baseDate={new Date(navYear, navMonth, 1)}
                  onDayClick={setSelectedDate}
                  today={todayDate}
                />
              </motion.div>
            )}

            {viewMode === 'range' && (
              <motion.div
                key="range"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RangeView
                  days={calData}
                  onDayClick={setSelectedDate}
                  fromDate={fromDate}
                  toDate={toDate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Day Detail Modal ── */}
      <AnimatePresence>
        {selectedDate && (
          <DayDetailModal
            key={selectedDate}
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesCalendar;
