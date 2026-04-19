import React, { useState } from 'react';
import {
  Settings, Building2, Palette, Bell, Shield, Database,
  Globe, Users, Cpu, Save, RefreshCw, Eye, EyeOff,
  ChevronRight, CheckCircle2, Info, AlertTriangle,
  Smartphone, Mail, CreditCard, ToggleLeft, ToggleRight,
  Download, Trash2, Plus, X, Key, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'general' | 'appearance' | 'notifications' | 'security' | 'integrations' | 'admin' | 'data';

// ─── Toggle Component ─────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${value ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-[26px]' : 'left-1'}`} />
  </button>
);

// ─── SettingRow ───────────────────────────────────────────────────────────────
const SettingRow = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
    <div className="flex-1 mr-4">
      <p className="font-medium text-sm">{label}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

// ─── Section ─────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }: { title: string; icon: React.FC<any>; children: React.ReactNode }) => (
  <div className="glass-panel overflow-hidden">
    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
      <Icon size={16} className="text-emerald-400" />
      <h3 className="font-bold">{title}</h3>
    </div>
    <div className="px-6">{children}</div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const [tab, setTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  // General settings state
  const [platformName, setPlatformName] = useState('AquaGrow');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [lang, setLang] = useState('en');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  const { isDark, toggleTheme } = useTheme();

  // Appearance
  const [accentColor, setAccentColor] = useState('#10b981');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [tableRowDensity, setTableRowDensity] = useState('comfortable');

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [digestFreq, setDigestFreq] = useState('daily');
  const [critOnlyOverride, setCritOnlyOverride] = useState(false);

  // Security
  const [twoFA, setTwoFA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [auditLog, setAuditLog] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Integrations
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_••••••••••••••••');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smsGateway, setSmsGateway] = useState('Twilio');
  const [mapsApi, setMapsApi] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Admin users
  const [admins] = useState([
    { id: 'ADM-001', name: 'Syam K. Doram', email: 'syam@aquagrow.in', role: 'Super Admin', lastLogin: '2026-04-18 09:05', status: 'active' },
    { id: 'ADM-002', name: 'Priya Sharma', email: 'priya@aquagrow.in', role: 'Finance Admin', lastLogin: '2026-04-17 16:30', status: 'active' },
    { id: 'ADM-003', name: 'Arjun Nair', email: 'arjun@aquagrow.in', role: 'Operations', lastLogin: '2026-04-15 11:00', status: 'active' },
  ]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'general',       label: 'General',      icon: Globe },
    { id: 'appearance',    label: 'Appearance',   icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security',      label: 'Security',     icon: Shield },
    { id: 'integrations',  label: 'Integrations', icon: Cpu },
    { id: 'admin',         label: 'Admin Users',  icon: Users },
    { id: 'data',          label: 'Data',         icon: Database },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-zinc-400">Configure platform behaviour, security, integrations, and admin access.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 text-sm font-bold rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={15} />Settings saved
            </motion.div>
          )}
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={16} />Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="glass-panel p-3">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                <t.icon size={16} className={tab === t.id ? 'text-white' : 'text-zinc-500'} />
                {t.label}
                {tab === t.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* ── GENERAL ──────────────────────────────────────────────────────── */}
          {tab === 'general' && (
            <>
              <Section title="Platform Identity" icon={Building2}>
                <SettingRow label="Platform Name" sub="Displayed in header and mobile app">
                  <input value={platformName} onChange={e => setPlatformName(e.target.value)} className="input-field w-52 text-sm" />
                </SettingRow>
                <SettingRow label="Language" sub="Interface display language">
                  <select value={lang} onChange={e => setLang(e.target.value)} className="input-field w-40 bg-zinc-900 text-sm">
                    <option value="en">English</option>
                    <option value="te">Telugu</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                  </select>
                </SettingRow>
                <SettingRow label="Default Currency" sub="Used across all financial displays">
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field w-40 bg-zinc-900 text-sm">
                    <option value="INR">₹ INR — Indian Rupee</option>
                    <option value="USD">$ USD — US Dollar</option>
                    <option value="EUR">€ EUR — Euro</option>
                  </select>
                </SettingRow>
                <SettingRow label="Timezone" sub="All timestamps and scheduling">
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-field w-52 bg-zinc-900 text-sm">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC +0:00</option>
                    <option value="Asia/Dubai">Asia/Dubai (+4:00)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Date Format" sub="Used in exports and reports">
                  <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="input-field w-40 bg-zinc-900 text-sm">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </SettingRow>
              </Section>

              <Section title="Business Parameters" icon={Settings}>
                <SettingRow label="Default Commission Rate" sub="Applied to new providers unless overridden">
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={5} className="input-field w-20 text-sm text-center" min={0} max={30} />
                    <span className="text-zinc-500 text-sm">%</span>
                  </div>
                </SettingRow>
                <SettingRow label="Minimum Withdrawal" sub="Minimum wallet balance for payout">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">₹</span>
                    <input type="number" defaultValue={500} className="input-field w-28 text-sm" />
                  </div>
                </SettingRow>
                <SettingRow label="Auto-approve Orders Below" sub="Orders under this value skip manual approval">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">₹</span>
                    <input type="number" defaultValue={10000} className="input-field w-32 text-sm" />
                  </div>
                </SettingRow>
                <SettingRow label="Harvest Advance Payment %" sub="Default advance paid on harvest confirmation">
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue={20} className="input-field w-20 text-sm text-center" />
                    <span className="text-zinc-500 text-sm">%</span>
                  </div>
                </SettingRow>
              </Section>
            </>
          )}

          {/* ── APPEARANCE ────────────────────────────────────────────────────── */}
          {tab === 'appearance' && (
            <>
              <Section title="Theme & Colors" icon={Palette}>
                <SettingRow label="Dark Mode" sub="Toggle between dark and light theme">
                  <Toggle value={isDark} onChange={toggleTheme} />
                </SettingRow>
                <SettingRow label="Accent Color" sub="Primary brand color used throughout the platform">
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
                    <input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="input-field w-28 text-sm font-mono" />
                  </div>
                </SettingRow>
                <SettingRow label="Color Presets">
                  <div className="flex gap-2">
                    {['#10b981','#6366f1','#f59e0b','#3b82f6','#ec4899','#14b8a6'].map(c => (
                      <button key={c} onClick={() => setAccentColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${accentColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </SettingRow>
              </Section>

              <Section title="Layout & Density" icon={Settings}>
                <SettingRow label="Compact Mode" sub="Reduces padding and font sizes for more data-dense views">
                  <Toggle value={compactMode} onChange={setCompactMode} />
                </SettingRow>
                <SettingRow label="Animations" sub="Disable for better performance on slower devices">
                  <Toggle value={animations} onChange={setAnimations} />
                </SettingRow>
                <SettingRow label="Table Row Density" sub="Affects how much data is visible per screen">
                  <div className="flex rounded-xl bg-white/5 overflow-hidden border border-white/10">
                    {['compact','comfortable','spacious'].map(d => (
                      <button key={d} onClick={() => setTableRowDensity(d)}
                        className={`px-3 py-1.5 text-xs font-bold transition-all capitalize ${tableRowDensity === d ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </Section>
            </>
          )}

          {/* ── NOTIFICATIONS ─────────────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <>
              <Section title="Delivery Channels" icon={Bell}>
                <SettingRow label="Email Alerts" sub="Receive priority alerts via email">
                  <Toggle value={emailAlerts} onChange={setEmailAlerts} />
                </SettingRow>
                <SettingRow label="SMS Alerts" sub="Critical-only alerts via text message">
                  <Toggle value={smsAlerts} onChange={setSmsAlerts} />
                </SettingRow>
                <SettingRow label="Push Notifications" sub="Real-time browser push notifications">
                  <Toggle value={pushAlerts} onChange={setPushAlerts} />
                </SettingRow>
                <SettingRow label="WhatsApp Notifications" sub="Business account integration for farmer-facing updates">
                  <Toggle value={true} onChange={() => {}} />
                </SettingRow>
              </Section>

              <Section title="Alert Behaviour" icon={Bell}>
                <SettingRow label="Critical Alerts Only" sub="Suppress low/medium alerts — receive critical and high only">
                  <Toggle value={critOnlyOverride} onChange={setCritOnlyOverride} />
                </SettingRow>
                <SettingRow label="Daily Digest Frequency" sub="Summarized report of all alerts for the period">
                  <select value={digestFreq} onChange={e => setDigestFreq(e.target.value)} className="input-field w-36 bg-zinc-900 text-sm">
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="never">Never</option>
                  </select>
                </SettingRow>
                <SettingRow label="Alert Email" sub="Primary email for admin notifications">
                  <input type="email" defaultValue="admin@aquagrow.in" className="input-field w-60 text-sm" />
                </SettingRow>
              </Section>
            </>
          )}

          {/* ── SECURITY ──────────────────────────────────────────────────────── */}
          {tab === 'security' && (
            <>
              <Section title="Access Control" icon={Shield}>
                <SettingRow label="Two-Factor Authentication" sub="Require 2FA for all admin logins">
                  <Toggle value={twoFA} onChange={setTwoFA} />
                </SettingRow>
                <SettingRow label="Session Timeout" sub="Automatically log out after inactivity">
                  <div className="flex items-center gap-2">
                    <select value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="input-field w-36 bg-zinc-900 text-sm">
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="0">Never</option>
                    </select>
                  </div>
                </SettingRow>
                <SettingRow label="Audit Log" sub="Record all admin actions for compliance">
                  <Toggle value={auditLog} onChange={setAuditLog} />
                </SettingRow>
                <SettingRow label="IP Whitelist" sub="Restrict admin access to specific IP addresses (comma-separated)">
                  <input value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} placeholder="e.g. 192.168.1.0/24, 10.0.0.1" className="input-field w-64 text-sm font-mono" />
                </SettingRow>
              </Section>

              <Section title="Change Password" icon={Lock}>
                <SettingRow label="Current Password" sub="">
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="input-field w-56 text-sm pr-10" placeholder="••••••••" />
                    <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </SettingRow>
                <SettingRow label="New Password" sub="">
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input-field w-56 text-sm" placeholder="Min 8 characters" />
                </SettingRow>
                <SettingRow label="Confirm Password" sub="">
                  <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="input-field w-56 text-sm" placeholder="Repeat new password" />
                </SettingRow>
                <div className="py-4 flex justify-end gap-3">
                  {newPwd && confirmPwd && newPwd !== confirmPwd && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-1"><AlertTriangle size={12} />Passwords do not match</p>
                  )}
                  <button disabled={!currentPwd || !newPwd || newPwd !== confirmPwd}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-40">
                    <Key size={14} />Update Password
                  </button>
                </div>
              </Section>

              {/* Active Sessions */}
              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2"><Smartphone size={14} className="text-blue-400" />Active Sessions</h3>
                  <button className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"><X size={12} />End All Others</button>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { device: 'Chrome — Windows 11', ip: '45.120.45.12', location: 'Nellore, AP', lastActive: 'Now (current)', current: true },
                    { device: 'Safari — iPhone 15', ip: '45.120.45.99', location: 'Hyderabad, TS', lastActive: '2h ago', current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div>
                          <p className="text-sm font-bold">{s.device} {s.current && <span className="text-[9px] font-bold ml-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">CURRENT</span>}</p>
                          <p className="text-xs text-zinc-500">{s.ip} · {s.location} · {s.lastActive}</p>
                        </div>
                      </div>
                      {!s.current && <button className="text-xs text-red-400 hover:text-red-300">Revoke</button>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'integrations' && (
            <>
              <Section title="Payment Gateway" icon={CreditCard}>
                <SettingRow label="Gateway" sub="Active payment processor">
                  <select className="input-field w-40 text-sm">
                    <option>Razorpay</option>
                    <option>Stripe</option>
                    <option>PayU</option>
                  </select>
                </SettingRow>
                <SettingRow label="API Key" sub="Live API key for transaction processing">
                  <div className="flex items-center gap-2">
                    <input type="password" value={razorpayKey} onChange={e => setRazorpayKey(e.target.value)} className="input-field w-56 text-sm font-mono" />
                    <button className="text-xs text-emerald-400 hover:text-white font-bold">Test</button>
                  </div>
                </SettingRow>
                <SettingRow label="Webhook URL" sub="Receive real-time payment status updates">
                  <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.aquagrow.in/webhook" className="input-field w-72 text-sm font-mono" />
                </SettingRow>
              </Section>

              <Section title="Communications" icon={Mail}>
                <SettingRow label="WhatsApp Business" sub="Used for farmer alerts, harvest, and payment notifications">
                  <Toggle value={whatsappEnabled} onChange={setWhatsappEnabled} />
                </SettingRow>
                <SettingRow label="SMS Gateway" sub="Provider for OTP and critical SMS alerts">
                  <select value={smsGateway} onChange={e => setSmsGateway(e.target.value)} className="input-field w-40 text-sm">
                    <option>Twilio</option>
                    <option>MSG91</option>
                    <option>Fast2SMS</option>
                  </select>
                </SettingRow>
                <SettingRow label="SMTP Host" sub="Email server for admin alerts and reports">
                  <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="input-field w-52 text-sm font-mono" />
                </SettingRow>
              </Section>

              <Section title="Maps & IoT" icon={Globe}>
                <SettingRow label="Google Maps API Key" sub="Used in supply chain logistics tracking and farm locations">
                  <input value={mapsApi} onChange={e => setMapsApi(e.target.value)} placeholder="AIza••••••••••••••••••••••••••••" className="input-field w-72 text-sm font-mono" />
                </SettingRow>
                <SettingRow label="IoT Data Refresh Rate" sub="How often IoT dashboards pull new telemetry">
                  <select className="input-field w-36 text-sm">
                    <option value="5">Every 5s</option>
                    <option value="10">Every 10s</option>
                    <option value="30">Every 30s</option>
                    <option value="60">Every 60s</option>
                  </select>
                </SettingRow>
              </Section>
            </>
          )}

          {/* ── ADMIN USERS ───────────────────────────────────────────────────── */}
          {tab === 'admin' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">{admins.length} admin accounts</p>
                <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} />Invite Admin</button>
              </div>

              <div className="glass-panel divide-y divide-white/5">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-xl emerald-gradient p-0.5 shrink-0">
                      <div className="w-full h-full rounded-[10px] bg-zinc-900 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.name}`} alt={a.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{a.name}</p>
                      <p className="text-xs text-zinc-500">{a.email} · Last login: {a.lastLogin}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{a.role}</span>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2.5 py-1.5 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">Edit</button>
                      {a.role !== 'Super Admin' && <button className="text-xs px-2.5 py-1.5 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Revoke</button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-panel p-5 border border-amber-500/10 flex items-start gap-3">
                <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400"><span className="font-bold text-amber-400">Role permissions</span> are defined per module. Super Admin has full access. Finance Admin is restricted to Finance & Revenue modules. Operations has read-only access to Farmers, Ponds, and Orders.</p>
              </div>
            </>
          )}

          {/* ── DATA ──────────────────────────────────────────────────────────── */}
          {tab === 'data' && (
            <>
              <Section title="Data Export" icon={Database}>
                <SettingRow label="Export Farmers" sub="Download all farmer profiles as CSV">
                  <button className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} />Export CSV</button>
                </SettingRow>
                <SettingRow label="Export Transactions" sub="Finance ledger — all payments and commissions">
                  <button className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} />Export CSV</button>
                </SettingRow>
                <SettingRow label="Export Orders" sub="All harvest and shop orders">
                  <button className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} />Export CSV</button>
                </SettingRow>
                <SettingRow label="Full Data Backup" sub="Complete platform backup as JSON">
                  <button className="btn-secondary flex items-center gap-2 text-sm"><Database size={14} />Backup Now</button>
                </SettingRow>
              </Section>

              <Section title="Storage Health" icon={Database}>
                <SettingRow label="LocalStorage Usage" sub="Seed data and user-created records">
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">~128 KB used</p>
                    <p className="text-[10px] text-zinc-600">Up to 5MB available</p>
                  </div>
                </SettingRow>
                <SettingRow label="Clear Cache" sub="Remove browser-cached data (resets all seeded records)">
                  <button
                    onClick={() => { if (window.confirm('This will clear all localStorage data and reset to seed data. Continue?')) { localStorage.clear(); window.location.reload(); } }}
                    className="flex items-center gap-2 text-sm font-bold px-3 py-2 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/10 transition-all">
                    <Trash2 size={13} />Clear Data
                  </button>
                </SettingRow>
              </Section>

              <div className="glass-panel p-5 border border-red-500/10 flex items-start gap-3">
                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-400 text-sm">Data Management Notice</p>
                  <p className="text-xs text-zinc-400 mt-1">Currently using browser localStorage for persistence. Migration to a secured backend database is planned for Phase 2. All data is ephemeral across browsers and devices.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
