import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Phone, Lock, Eye, EyeOff, ArrowRight,
  ShieldCheck, Globe, Zap, AlertTriangle, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiOnline, setApiOnline]   = useState<boolean | null>(null);
  const navigate                    = useNavigate();
  const { login, loading, error }   = useAuth();

  // Check API connectivity
  React.useEffect(() => {
    fetch('https://aquagrow.onrender.com/api/health')
      .then(r => r.ok ? setApiOnline(true) : setApiOnline(false))
      .catch(() => setApiOnline(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(phone.trim(), password);
      navigate('/');
    } catch {
      // error is already set in context
    }
  };

  const fillCredential = (p: string, pw: string) => {
    setPhone(p);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 emerald-gradient opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 emerald-gradient rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp size={24} className="text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">AquaGrow Admin</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-6xl font-display font-bold tracking-tight mb-6 leading-[1.1]">
            Centralized <br /><span className="text-emerald-500">Command</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-xl text-zinc-400 leading-relaxed">
            One backend. One database. Mobile app and admin panel working in{' '}
            <span className="text-emerald-400 font-medium">real-time sync</span>.
          </motion.p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, label: 'Role-Based Access', sub: 'Strict RBAC per admin' },
            { icon: Globe,       label: 'Live Backend',       sub: 'MongoDB on Render' },
            { icon: Zap,         label: 'Real-Time Sync',     sub: 'App ↔ Admin panel' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-white/5 border border-white/10 text-emerald-400">
                <Icon size={20} />
              </div>
              <p className="text-sm font-bold">{label}</p>
              <p className="text-xs text-zinc-500">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-zinc-900/50 backdrop-blur-xl">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 emerald-gradient rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight">AquaGrow</span>
            </div>
            <h2 className="text-3xl font-display font-bold tracking-tight mb-2">Admin Console</h2>
            <p className="text-zinc-400">Sign in with your AquaGrow admin credentials.</p>
          </div>

          {/* API status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold w-fit ${
            apiOnline === true  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            apiOnline === false ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
          }`}>
            {apiOnline === true  ? <Wifi size={12} />             :
             apiOnline === false ? <WifiOff size={12} />          :
                                   <RefreshCw size={12} className="animate-spin" />}
            {apiOnline === true  ? 'AquaGrow API Online ✓'     :
             apiOnline === false ? 'API Offline — check server' :
                                   'Checking connection...'}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading || apiOnline === false}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg font-bold shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In to Console <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          {/* Info box */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-2">
              <ShieldCheck size={13} /> Admin Account Required
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Only users with <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">role: admin</code> 
              {' '}in the AquaGrow database can access this console. 
              Ask your Super Admin to create your account via the mobile backend.
            </p>
          </div>

          {/* How to create admin account */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
            <p className="text-amber-400 text-xs font-bold">⚡ Creating Admin Accounts</p>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Use MongoDB Atlas or run in the server console:
            </p>
            <code className="block text-[10px] bg-black/40 text-emerald-300 p-2 rounded-lg overflow-x-auto whitespace-pre">
              {`// In MongoDB Atlas or mongosh:\ndb.users.insertOne({\n  name: "Super Admin",\n  phoneNumber: "9876543210",\n  password: "<bcrypt_hash>",\n  role: "admin",\n  adminRole: "super_admin"\n})`}
            </code>
          </div>

          <div className="text-center">
            <p className="text-zinc-600 text-xs">
              AquaGrow Admin Panel · Connected to{' '}
              <span className="text-emerald-600 font-mono">aquagrow.onrender.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
