import React, { useState } from 'react';
import {
  Cpu, Brain, Activity, TrendingUp, AlertTriangle, CheckCircle2,
  Upload, Eye, Zap, BarChart3, Sparkles, Camera, Search,
  Shield, RefreshCw, Play, Pause, ChevronRight, Clock,
  Wifi, Server, Layers, Target, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/* ── data ──────────────────────────────────────────────────────────────────── */
const MODELS = [
  { id: 'mdl-1', name: 'White Spot Syndrome', version: 'v2.4', accuracy: 98, status: 'active', scans: 1240, color: 'emerald' },
  { id: 'mdl-2', name: 'Early Mortality Syndrome', version: 'v1.8', accuracy: 85, status: 'active', scans: 880, color: 'amber' },
  { id: 'mdl-3', name: 'Vibriosis Detection', version: 'v1.2', accuracy: 79, status: 'training', scans: 340, color: 'blue' },
  { id: 'mdl-4', name: 'Growth Rate Predictor', version: 'v3.0', accuracy: 92, status: 'active', scans: 2100, color: 'purple' },
];

const LIVE_SCANS = [
  { pond: 'POND-001', farmer: 'John Doe', result: 'Optimal Growth', confidence: 98, time: '2m ago', status: 'ok' },
  { pond: 'POND-002', farmer: 'Jane Smith', result: 'Low Oxygen Risk', confidence: 85, time: '7m ago', status: 'warning' },
  { pond: 'POND-003', farmer: 'Rajan K.', result: 'White Spot Suspected', confidence: 72, time: '15m ago', status: 'danger' },
  { pond: 'POND-004', farmer: 'Priya M.', result: 'Optimal Growth', confidence: 96, time: '22m ago', status: 'ok' },
];

const STATS = [
  { label: 'Prediction Accuracy', value: '94.2%', sub: '+1.8% vs last week', icon: Target, color: 'emerald' },
  { label: 'Daily AI Scans', value: '1,420', sub: '18 ponds monitored', icon: Activity, color: 'blue' },
  { label: 'Active Models', value: '8', sub: '3 in training queue', icon: Sparkles, color: 'violet' },
  { label: 'Disease Prevented', value: '12', sub: 'This month via early alert', icon: Shield, color: 'amber' },
  { label: 'Alerts Triggered', value: '34', sub: '3 critical this week', icon: AlertTriangle, color: 'red' },
  { label: 'Model Uptime', value: '99.9%', sub: 'Last 30 days', icon: Server, color: 'teal' },
];

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400',
  blue:    'bg-blue-500/10 text-blue-400',
  violet:  'bg-violet-500/10 text-violet-400',
  amber:   'bg-amber-500/10 text-amber-400',
  red:     'bg-red-500/10 text-red-400',
  teal:    'bg-teal-500/10 text-teal-400',
  purple:  'bg-purple-500/10 text-purple-400',
};

const AIControl = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain size={16} className="text-purple-400" />
            </div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Engine</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">AI System Control</h1>
          <p className="text-[var(--text-secondary)]">Monitor predictions, manage ML models, and control disease detection pipelines.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            All Systems Online
          </div>
          <button
            onClick={() => setIsTraining(t => !t)}
            className="btn-primary flex items-center gap-2"
          >
            {isTraining ? <Pause size={16} /> : <Play size={16} />}
            {isTraining ? 'Pause Training' : 'Train New Model'}
          </button>
        </div>
      </div>

      {/* ── 6-stat grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color }) => (
          <motion.div key={label} whileHover={{ y: -3 }} className="glass-panel p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
              <Icon size={18} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Models */}
        <div className="lg:col-span-2 glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Layers size={16} className="text-purple-400" /> AI Model Registry
            </h3>
            <span className="text-xs text-[var(--text-muted)]">{MODELS.length} models</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {MODELS.map(m => (
              <motion.div
                key={m.id}
                onClick={() => setActiveModel(activeModel === m.id ? null : m.id)}
                className="px-6 py-4 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[m.color]}`}>
                      <Brain size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{m.version} • {m.scans.toLocaleString()} scans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      m.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>{m.status.toUpperCase()}</span>
                    <ChevronRight size={14} className={`text-[var(--text-muted)] transition-transform ${activeModel === m.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Accuracy bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color === 'emerald' ? 'bg-emerald-500' : m.color === 'blue' ? 'bg-blue-500' : m.color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'}`}
                      style={{ width: `${m.accuracy}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-secondary)] w-10 text-right">{m.accuracy}%</span>
                </div>

                <AnimatePresence>
                  {activeModel === m.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex gap-2">
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)] hover:border-emerald-500/40 text-[var(--text-secondary)] transition-all">
                          View Report
                        </button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                          Retrain Model
                        </button>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                          Disable
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">

          {/* Attack prediction */}
          <div className="glass-panel p-5 border border-red-500/15">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertTriangle size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">High Risk Detected</span>
            </div>
            <p className="text-sm font-semibold leading-snug">
              75% chance of disease spread in <span className="text-red-400">Coastal Valley</span> within 48 hours.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Model confidence: 91% • Based on 6 pond indicators</p>
            <button className="mt-4 w-full btn-primary py-2 text-xs">Broadcast Warning</button>
          </div>

          {/* Growth forecast */}
          <div className="glass-panel p-5">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-3">Growth Forecast</p>
            {[
              { label: 'Central Plains', pct: 85, value: '+12%' },
              { label: 'Zone A', pct: 62, value: '+8%' },
              { label: 'Coastal Valley', pct: 38, value: '+3%' },
            ].map(r => (
              <div key={r.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)] font-medium">{r.label}</span>
                  <span className="text-emerald-400 font-bold">{r.value}</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Market forecast */}
          <div className="glass-panel p-5">
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mb-3">Market Price Forecast</p>
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm">L. Vannamei</p>
              <span className="text-emerald-400 font-bold">₹485/kg</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">AI expects +5% due to global supply shortage</p>
            <div className="mt-3 flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <ArrowUpRight size={12} /> Rising trend confirmed
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Scan Feed ── */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Wifi size={16} className="text-emerald-400" />
            Live Scan Feed
          </h3>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <Clock size={12} /> Auto-refreshing every 60s
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pond</th>
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">AI Result</th>
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {LIVE_SCANS.map((s, i) => (
                <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-[var(--text-secondary)]">{s.pond}</td>
                  <td className="px-6 py-3 text-sm font-semibold">{s.farmer}</td>
                  <td className="px-6 py-3 text-sm">{s.result}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.status === 'ok' ? 'bg-emerald-500' : s.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${s.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{s.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs text-[var(--text-muted)]">{s.time}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      s.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {s.status === 'ok' ? <CheckCircle2 size={9} /> : <AlertTriangle size={9} />}
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Upload Training Section ── */}
      <div className="glass-panel p-8">
        <h3 className="text-xl font-display font-bold mb-2 flex items-center gap-2">
          <Camera size={20} className="text-emerald-400" /> Training Data Upload
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Upload labeled shrimp images or video footage to improve model accuracy</p>
        <div className="border-2 border-dashed border-[var(--border-default)] rounded-2xl p-12 text-center hover:border-emerald-500/50 transition-all cursor-pointer group">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all">
            <Upload size={28} className="text-[var(--text-muted)] group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="font-semibold text-[var(--text-secondary)] mb-1">Drop files here or click to browse</p>
          <p className="text-xs text-[var(--text-muted)]">Supports JPG, PNG, MP4 • Max 500 MB per batch</p>
          <button className="mt-6 btn-secondary text-sm px-6">Choose Files</button>
        </div>
      </div>

    </div>
  );
};

export default AIControl;
