import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Users, TrendingUp, Settings, Bell,
  Search, LogOut, Menu, X, MessageSquare, ShieldCheck, DollarSign,
  BarChart3, ChevronRight, Waves, Map, Cpu, Wallet, Megaphone,
  Building2, Truck, Activity, LifeBuoy, Package, Award, Wifi,
  CreditCard, BookOpen, ClipboardList, FileText, Key, Database
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }: { icon: any; label: string; path: string; active: boolean; collapsed: boolean }) => (
  <Link to={path} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative", active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white")}>
    <Icon size={18} className={cn("shrink-0", active ? "text-white" : "group-hover:text-emerald-400")} />
    {!collapsed && <span className="font-medium truncate text-sm">{label}</span>}
    {collapsed && (<div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">{label}</div>)}
  </Link>
);

const SectionLabel = ({ label, collapsed }: { label: string; collapsed: boolean }) => (
  collapsed ? <div className="my-2 border-t border-white/5" /> : (<p className="px-4 pt-5 pb-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</p>)
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin, user, logout } = useAuth();

  const menuSections = [
    {
      label: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Database, label: 'Farm Intelligence (Live DB)', path: '/farm-intelligence' },
      ],
    },
    {
      label: 'Farmers',
      items: [
        { icon: Package, label: 'Harvest Management', path: '/harvests' },
        { icon: Award, label: 'Certifications', path: '/certifications' },
      ],
    },
    {
      label: 'Providers & Field Ops',
      items: [
        { icon: ShieldCheck, label: 'Provider Registry', path: '/providers' },
        { icon: Users, label: 'Staff & Field Ops', path: '/employees' },
        { icon: Wifi, label: 'IoT Devices', path: '/iot-devices' },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { icon: ShoppingBag, label: 'Order Control', path: '/orders' },
        { icon: ClipboardList, label: 'Order Management', path: '/order-management' },
        { icon: Package, label: 'Products & Sales', path: '/products' },
        { icon: DollarSign, label: 'Price Control', path: '/price-control' },
        { icon: Building2, label: 'Buyer Management', path: '/buyers' },
        { icon: Truck, label: 'Supply Chain', path: '/supply-chain' },
        { icon: Wallet, label: 'Finance & Payments', path: '/finance' },
        { icon: TrendingUp, label: 'Revenue Management', path: '/revenue' },
        { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
      ],

    },
    {
      label: 'Growth & Comms',
      items: [
        { icon: Megaphone, label: 'Marketing', path: '/marketing' },
        { icon: BookOpen, label: 'Content', path: '/content' },
        { icon: Bell, label: 'Alerts System', path: '/alerts' },
      ],
    },
    {
      label: 'System',
      items: [
        { icon: LifeBuoy, label: 'Support Tickets', path: '/support' },
        { icon: Cpu, label: 'AI Control', path: '/ai-control' },
        { icon: Activity, label: 'Operations', path: '/operations' },
        ...(isSuperAdmin ? [{ icon: Key, label: 'Roles & Access (RBAC)', path: '/rbac' }] : []),
        { icon: Settings, label: 'Settings', path: '/settings' },
      ],
    },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const renderNav = (collapse: boolean) => (
    <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
      {menuSections.map(section => (
        <div key={section.label}>
          <SectionLabel label={section.label} collapsed={collapse} />
          <div className="space-y-0.5">
            {section.items.map(item => (
              <SidebarItem key={item.path} {...item} active={location.pathname === item.path} collapsed={collapse} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sidebar – Desktop */}
      <motion.aside initial={false} animate={{ width: collapsed ? 72 : 272 }} className="hidden lg:flex flex-col border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl z-30 flex-shrink-0">
        <div className="p-5 flex items-center justify-between">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div className="w-8 h-8 emerald-gradient rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-white" /></div>
              <span className="font-display font-bold text-xl tracking-tight">AquaGrow</span>
            </motion.div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors ml-auto">
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {renderNav(collapsed)}
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className={cn("flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all", collapsed && "justify-center")}>
            <LogOut size={18} />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />)}
      </AnimatePresence>

      {/* Sidebar – Mobile */}
      <motion.aside initial={{ x: -300 }} animate={{ x: mobileMenuOpen ? 0 : -300 }} className="fixed inset-y-0 left-0 w-72 bg-zinc-900 z-50 lg:hidden flex flex-col">
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2"><div className="w-8 h-8 emerald-gradient rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-white" /></div><span className="font-display font-bold text-xl tracking-tight">AquaGrow</span></div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
        </div>
        {renderNav(false)}
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-18 min-h-[4.5rem] border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg"><Menu size={22} /></button>
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-80">
              <Search size={16} className="text-zinc-500" />
              <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-zinc-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-5">
            <button className="p-2.5 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950" />
            </button>
            <div className="h-7 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-zinc-500 capitalize">{user?.role ? ROLE_LABELS[user.role] : 'Administrator'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl emerald-gradient p-0.5">
                <div className="w-full h-full rounded-[10px] bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                  {user?.avatar ?? 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
