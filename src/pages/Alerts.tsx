import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, AlertTriangle, Zap, Droplets, Wind, Activity, Shield,
  CheckCircle2, X, Filter, Search, Send, Plus, Eye, Trash2,
  Clock, Radio, Cpu, FileText, Users, MapPin, RefreshCw,
  Volume2, VolumeX, ChevronRight, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alert } from '../types';
import { storageService } from '../services/storageService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'feed' | 'broadcast' | 'disease' | 'iot' | 'logs' | 'rules';

// ─── Seed broadcast messages ──────────────────────────────────────────────────
const BROADCASTS = [
  { id: 'BC-001', title: 'Monsoon Prep Alert', body: 'Farmers: Begin pond fortification. Stocks of feed and medicine should be prepared.', target: 'all' as const, sentAt: '2026-04-12 09:00', channel: 'SMS', reach: 148 },
  { id: 'BC-002', title: 'WSSV Disease Warning – Zone B', body: 'White Spot Syndrome detected in Zone B sector. Apply biosecurity protocols immediately.', target: 'farmers' as const, sentAt: '2026-04-14 14:30', channel: 'Push + SMS', reach: 62 },
  { id: 'BC-003', title: 'Premium Price Window', body: 'Count-30 Vannamei at ₹510/kg this week. Contact your provider to verify harvest eligibility.', target: 'farmers' as const, sentAt: '2026-04-16 08:00', channel: 'WhatsApp', reach: 87 },
];

// ─── SLA Breach Alerts ────────────────────────────────────────────────────────
const SLA_BREACHES = [
  { id: 'SLA-001', ticket: 'TKT-002', farmer: 'Jane Smith', type: 'Disease Report', breachedBy: '6h 20m', severity: 'CRITICAL' as const },
  { id: 'SLA-002', ticket: 'TKT-005', farmer: 'Anjali Devi', type: 'Payment Issue', breachedBy: '2h 10m', severity: 'HIGH' as const },
];

// ─── Notification Rules ───────────────────────────────────────────────────────
const DEFAULT_RULES = [
  { id: 'R-001', label: 'Disease alert in any pond', channel: 'Push + SMS', enabled: true, severity: 'critical' },
  { id: 'R-002', label: 'DO sensor reading < 4 mg/L', channel: 'Push', enabled: true, severity: 'high' },
  { id: 'R-003', label: 'Daily log missing for 2+ days', channel: 'SMS', enabled: true, severity: 'medium' },
  { id: 'R-004', label: 'New harvest request submitted', channel: 'Push', enabled: true, severity: 'medium' },
  { id: 'R-005', label: 'SLA breach on any support ticket', channel: 'Push + Email', enabled: true, severity: 'high' },
  { id: 'R-006', label: 'Subscription expiring in 7 days', channel: 'SMS', enabled: true, severity: 'low' },
  { id: 'R-007', label: 'Payment failure or refund request', channel: 'Push + Email', enabled: true, severity: 'high' },
  { id: 'R-008', label: 'IoT device goes offline', channel: 'Push', enabled: false, severity: 'medium' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SevColor = (s: Alert['severity']) =>
  s === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20'
  : s === 'high'   ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  : s === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  :                  'bg-zinc-700/10 text-zinc-500 border-zinc-700/20';

const SevDot = (s: Alert['severity']) =>
  s === 'critical' ? 'bg-red-500' : s === 'high' ? 'bg-orange-500' : s === 'medium' ? 'bg-amber-500' : 'bg-zinc-600';

const TypeIcon = ({ t }: { t: Alert['type'] }) => {
  const map: Record<string, React.ReactNode> = {
    disease:       <Activity size={14} />,
    water_quality: <Droplets size={14} />,
    iot:           <Cpu size={14} />,
    order:         <CheckCircle2 size={14} />,
    log_missing:   <FileText size={14} />,
    weather:       <Wind size={14} />,
    market:        <Zap size={14} />,
    government:    <Shield size={14} />,
    system:        <AlertTriangle size={14} />,
  };
  return <>{map[t] ?? <Bell size={14} />}</>;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<Tab>('feed');
  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [rules, setRules] = useState(DEFAULT_RULES);

  // Broadcast composer state
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');
  const [bTarget, setBTarget] = useState<'all' | 'farmers' | 'providers'>('all');
  const [bChannel, setBChannel] = useState('Push');
  const [bSent, setBSent] = useState(false);

  useEffect(() => {
    // Merge real alerts from storage with generated ones
    const stored = storageService.getLogs()
      .filter(l => l.isAbnormal)
      .map(l => ({
        id: `ALT-LOG-${l.id}`, type: 'log_missing' as Alert['type'],
        title: `Abnormal log — ${l.farmerName}`, message: l.abnormalReason ?? 'Flagged log',
        timestamp: l.submittedAt ?? l.date, severity: 'high' as Alert['severity'],
        farmerId: l.farmerId, pondId: l.pondId, region: 'Zone A', isRead: false,
      }));

    const iotAlerts = storageService.getIoTDevices()
      .filter(d => d.status === 'FAULT' || d.status === 'OFFLINE')
      .map(d => ({
        id: `ALT-IOT-${d.id}`, type: 'iot' as Alert['type'],
        title: `IoT Alert — ${d.name}`, message: `Device ${d.status.toLowerCase()}. Last seen: ${d.lastSeen}`,
        timestamp: d.lastSeen, severity: (d.status === 'FAULT' ? 'critical' : 'high') as Alert['severity'],
        farmerId: d.farmerId, pondId: d.pondId, region: 'Zone A', isRead: false,
      }));

    const pondAlerts = storageService.getPonds()
      .filter(p => p.status === 'DISEASE_DETECTED' || p.status === 'ALERT')
      .map(p => ({
        id: `ALT-PND-${p.id}`, type: (p.status === 'DISEASE_DETECTED' ? 'disease' : 'water_quality') as Alert['type'],
        title: `Pond Alert — ${p.name}`, message: p.status === 'DISEASE_DETECTED' ? 'Disease detected in pond. Immediate action required.' : 'Water quality parameters outside normal range.',
        timestamp: new Date().toISOString(), severity: (p.status === 'DISEASE_DETECTED' ? 'critical' : 'high') as Alert['severity'],
        farmerId: p.farmerId, pondId: p.id, region: p.region ?? 'Unknown', isRead: false,
      }));

    setAlerts([...pondAlerts, ...iotAlerts, ...stored]);
  }, []);

  const filtered = useMemo(() => alerts.filter(a => {
    const ms = a.title.toLowerCase().includes(search.toLowerCase()) || a.message.toLowerCase().includes(search.toLowerCase());
    const msev = filterSev === 'all' || a.severity === filterSev;
    const mtype = filterType === 'all' || a.type === filterType;
    return ms && msev && mtype;
  }), [alerts, search, filterSev, filterType]);

  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high:     alerts.filter(a => a.severity === 'high').length,
    unread:   alerts.filter(a => !a.isRead).length,
    disease:  alerts.filter(a => a.type === 'disease').length,
    iot:      alerts.filter(a => a.type === 'iot').length,
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: 'feed',      label: 'Alert Feed',   icon: Bell,      badge: stats.unread },
    { id: 'broadcast', label: 'Broadcast',    icon: Radio },
    { id: 'disease',   label: 'Disease',      icon: Activity,  badge: stats.disease },
    { id: 'iot',       label: 'IoT Triggers', icon: Cpu,       badge: stats.iot },
    { id: 'logs',      label: 'Log Alerts',   icon: FileText },
    { id: 'rules',     label: 'Rules',        icon: Shield },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Alerts & Notifications</h1>
          <p className="text-zinc-400">Monitor critical events, broadcast messages, and manage notification rules.</p>
        </div>
        <button onClick={() => setTab('broadcast')} className="btn-primary flex items-center gap-2">
          <Send size={18} />Broadcast Alert
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Critical',  value: stats.critical, color: 'text-red-400',     bg: 'bg-red-500/10',    icon: AlertTriangle },
          { label: 'High',      value: stats.high,     color: 'text-orange-400',  bg: 'bg-orange-500/10', icon: Bell },
          { label: 'Unread',    value: stats.unread,   color: 'text-amber-400',   bg: 'bg-amber-500/10',  icon: Eye },
          { label: 'Disease',   value: stats.disease,  color: 'text-purple-400',  bg: 'bg-purple-500/10', icon: Activity },
          { label: 'IoT Faults',value: stats.iot,      color: 'text-blue-400',    bg: 'bg-blue-500/10',   icon: Cpu },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="glass-panel p-4 text-center">
            <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center mx-auto mb-2`}><Icon size={14} /></div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold mb-0.5">{label}</p>
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white/5 rounded-2xl overflow-x-auto w-fit max-w-full">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={13} />{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ ALERT FEED ═══════════════════════════════════════════════════════ */}
      {tab === 'feed' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input type="text" placeholder="Search alerts..." className="input-field w-full pl-11" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Filter size={14} className="text-zinc-500" />
              <select value={filterSev} onChange={e => setFilterSev(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Severity</option>
                {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Activity size={14} className="text-zinc-500" />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent outline-none text-sm">
                <option value="all">All Types</option>
                {['disease','water_quality','iot','log_missing','order','weather','market','government','system'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {alerts.some(a => !a.isRead) && (
              <button onClick={() => setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))} className="btn-secondary text-xs flex items-center gap-2">
                <CheckCircle2 size={13} />Mark All Read
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="glass-panel py-20 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No active alerts</p>
              <p className="text-zinc-600 text-sm mt-1">All systems are operating normally.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map(alert => (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                    className={`glass-panel p-5 flex items-start gap-4 ${!alert.isRead ? 'border-l-2 border-red-500/60' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${SevColor(alert.severity)}`}>
                      <TypeIcon t={alert.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm">{alert.title}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${SevColor(alert.severity)}`}>{alert.severity.toUpperCase()}</span>
                        {!alert.isRead && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-zinc-400">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-1"><Clock size={9} />{alert.timestamp}</span>
                        {alert.region && <span className="flex items-center gap-1"><MapPin size={9} />{alert.region}</span>}
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 capitalize">{alert.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!alert.isRead && (
                        <button onClick={() => markRead(alert.id)} className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Mark Read">
                          <Eye size={14} />
                        </button>
                      )}
                      <button onClick={() => dismiss(alert.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Dismiss">
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ═══ BROADCAST ════════════════════════════════════════════════════════ */}
      {tab === 'broadcast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Composer */}
            <div className="glass-panel p-6 space-y-5">
              <h3 className="text-lg font-display font-bold flex items-center gap-2"><Radio size={16} className="text-emerald-400" />Compose Broadcast</h3>

              {bSent ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="py-12 text-center">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                  <p className="font-bold text-lg text-emerald-400">Broadcast Sent!</p>
                  <p className="text-zinc-400 text-sm mt-1">Your message has been queued for delivery.</p>
                  <button onClick={() => { setBSent(false); setBTitle(''); setBBody(''); }} className="btn-secondary mt-5 text-sm">Compose New</button>
                </motion.div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                    <input type="text" placeholder="Alert title..." value={bTitle} onChange={e => setBTitle(e.target.value)} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Message</label>
                    <textarea placeholder="Write your broadcast message..." value={bBody} onChange={e => setBBody(e.target.value)} rows={4} className="input-field w-full resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target</label>
                      <select value={bTarget} onChange={e => setBTarget(e.target.value as typeof bTarget)} className="input-field w-full bg-zinc-900">
                        <option value="all">All Users</option>
                        <option value="farmers">Farmers Only</option>
                        <option value="providers">Providers Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Channel</label>
                      <select value={bChannel} onChange={e => setBChannel(e.target.value)} className="input-field w-full bg-zinc-900">
                        <option>Push</option>
                        <option>SMS</option>
                        <option>WhatsApp</option>
                        <option>Push + SMS</option>
                        <option>All Channels</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400">
                    <span className="text-emerald-400 font-bold">Preview: </span>{bTitle || 'Your title'} — {bBody || 'Your message here...'}
                  </div>
                  <button
                    onClick={() => { if (!bTitle || !bBody) return; setBSent(true); }}
                    disabled={!bTitle || !bBody}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    <Send size={16} />Send Broadcast
                  </button>
                </>
              )}
            </div>

            {/* History */}
            <div className="glass-panel overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-bold flex items-center gap-2"><Clock size={14} className="text-blue-400" />Broadcast History</h3>
              </div>
              <div className="divide-y divide-white/5">
                {BROADCASTS.map(b => (
                  <div key={b.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-sm">{b.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SENT</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2 line-clamp-1">{b.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1"><Users size={9} />{b.reach} recipients</span>
                      <span className="flex items-center gap-1"><Send size={9} />{b.channel}</span>
                      <span className="flex items-center gap-1"><Clock size={9} />{b.sentAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DISEASE ALERTS ════════════════════════════════════════════════════ */}
      {tab === 'disease' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-red-500/10 flex items-start gap-3">
            <Activity size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 text-sm">Disease Monitoring Active</p>
              <p className="text-xs text-zinc-400 mt-1">AI analyzes daily logs and water quality data to detect early disease patterns. Alert triggers automatically when anomaly is detected.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {alerts.filter(a => a.type === 'disease' || a.type === 'water_quality').length === 0 ? (
              <div className="col-span-2 glass-panel py-16 text-center">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-zinc-400">No active disease alerts</p>
              </div>
            ) : alerts.filter(a => a.type === 'disease' || a.type === 'water_quality').map(a => (
              <div key={a.id} className="glass-panel p-6 border border-red-500/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="font-bold">{a.title}</p>
                      <p className="text-xs text-zinc-500">{a.timestamp}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${SevColor(a.severity)}`}>{a.severity.toUpperCase()}</span>
                </div>
                <p className="text-sm text-zinc-300 mb-4">{a.message}</p>
                <div className="flex gap-2">
                  <button className="text-xs font-bold px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center gap-1"><Send size={11} />Notify Provider</button>
                  <button className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center gap-1"><Eye size={11} />View Pond</button>
                  <button onClick={() => dismiss(a.id)} className="text-xs font-bold px-3 py-1.5 bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all">Dismiss</button>
                </div>
              </div>
            ))}
          </div>

          {/* Disease Protocol */}
          <div className="glass-panel p-6">
            <h3 className="font-bold mb-5 flex items-center gap-2"><Shield size={14} className="text-emerald-400" />Biosecurity Response Protocol</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', label: 'Detect', desc: 'AI flags abnormal DO / mortality in daily logs', color: 'bg-blue-500/10 text-blue-400' },
                { step: '2', label: 'Alert', desc: 'Push + SMS sent to farmer and assigned provider', color: 'bg-amber-500/10 text-amber-400' },
                { step: '3', label: 'Respond', desc: 'Provider dispatched for on-site water testing', color: 'bg-orange-500/10 text-orange-400' },
                { step: '4', label: 'Resolve', desc: 'Treatment applied. Ticket closed and logged.', color: 'bg-emerald-500/10 text-emerald-400' },
              ].map(({ step, label, desc, color }) => (
                <div key={step} className={`p-4 rounded-xl border ${color.replace('text-','border-').replace('-400','-500/20').split(' ')[0]} ${color.replace('text-','bg-').split(' ')[0]}`}>
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center font-display font-bold text-lg mb-3`}>{step}</div>
                  <p className="font-bold text-sm mb-1">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ IoT TRIGGERS ═════════════════════════════════════════════════════ */}
      {tab === 'iot' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-blue-500/10 flex items-start gap-3">
            <Cpu size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400"><span className="font-bold text-blue-400">IoT Alert Engine:</span> Devices send real-time telemetry. Alerts fire automatically based on threshold rules — DO below 4 mg/L, aerator failure, sensor offline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {storageService.getIoTDevices().map(d => (
              <div key={d.id} className={`glass-panel p-5 ${d.status === 'FAULT' ? 'border border-red-500/20' : d.status === 'OFFLINE' ? 'border border-zinc-500/20' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : d.status === 'FAULT' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                      <Cpu size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{d.name}</p>
                      <p className="text-[10px] text-zinc-500">{d.type.replace(/_/g, ' ')} · {d.pondName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${d.status === 'ONLINE' ? 'bg-emerald-400' : d.status === 'FAULT' ? 'bg-red-400' : 'bg-zinc-600'}`} />
                    <span className="text-[10px] font-bold text-zinc-400">{d.status}</span>
                  </div>
                </div>
                {d.status !== 'ONLINE' && (
                  <div className={`p-3 rounded-lg mb-3 text-xs font-medium ${d.status === 'FAULT' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                    {d.status === 'FAULT' ? '⚠ Device fault detected — requires technician inspection' : '⚡ Device offline — check connection and power supply'}
                  </div>
                )}
                <div className="flex gap-1.5">
                  {(d.status === 'FAULT' || d.status === 'OFFLINE') && (
                    <button className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all flex items-center gap-1"><Send size={10} />Notify</button>
                  )}
                  <button className="text-xs font-bold px-2.5 py-1 bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all flex items-center gap-1"><RefreshCw size={10} />Ping</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LOG ALERTS ═══════════════════════════════════════════════════════ */}
      {tab === 'logs' && (
        <div className="space-y-5">
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><FileText size={14} className="text-amber-400" />Flagged Daily Logs</h3>
              <span className="text-xs text-zinc-500">{storageService.getLogs().filter(l => l.status === 'flagged' || l.status === 'missing').length} issues</span>
            </div>
            <div className="divide-y divide-white/5">
              {storageService.getLogs().filter(l => l.status === 'flagged' || l.status === 'missing').map(l => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${l.status === 'flagged' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <FileText size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{l.farmerName} — {l.pondName}</p>
                    <p className="text-xs text-zinc-500">{l.abnormalReason ?? 'Log missing'} · {l.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${l.status === 'flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{l.status.toUpperCase()}</span>
                  <button className="text-xs font-bold px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">Remind</button>
                </div>
              ))}
              {storageService.getLogs().filter(l => l.status === 'flagged' || l.status === 'missing').length === 0 && (
                <p className="p-8 text-center text-zinc-600 text-sm">No flagged or missing logs.</p>
              )}
            </div>
          </div>

          {/* SLA Breaches */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-bold flex items-center gap-2"><AlertTriangle size={14} className="text-red-400" />SLA Breach Alerts</h3>
            </div>
            <div className="divide-y divide-white/5">
              {SLA_BREACHES.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{s.farmer}</p>
                    <p className="text-xs text-zinc-500">{s.ticket} · {s.type} · Breached by {s.breachedBy}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{s.severity}</span>
                  <button className="text-xs font-bold px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Escalate</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ RULES ════════════════════════════════════════════════════════════ */}
      {tab === 'rules' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border border-emerald-500/10 flex items-start gap-3">
            <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-400 text-sm">Notification Rules Engine</p>
              <p className="text-xs text-zinc-400 mt-1">These rules define when alerts are triggered and how they're delivered. Toggling rules takes effect immediately — no redeployment needed.</p>
            </div>
          </div>

          <div className="glass-panel divide-y divide-white/5">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rule.enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                  <div>
                    <p className="font-bold text-sm">{rule.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{rule.channel}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${SevColor(rule.severity as Alert['severity'])}`}>{rule.severity}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                  className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${rule.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${rule.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-bold mb-4">Add Custom Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Trigger condition..." className="input-field" />
              <select className="input-field bg-zinc-900">
                <option>Push</option>
                <option>SMS</option>
                <option>Push + SMS</option>
                <option>All Channels</option>
              </select>
              <button className="btn-primary flex items-center justify-center gap-2"><Plus size={16} />Add Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
