import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import type { AdminRole } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Operations from './pages/Operations';
import ProviderRegistry from './pages/ProviderRegistry';
import Finance from './pages/Finance';
import AIControl from './pages/AIControl';
import Marketing from './pages/Marketing';
import PriceControl from './pages/PriceControl';
import BuyerManagement from './pages/BuyerManagement';
import SupplyChain from './pages/SupplyChain';
import SupportTickets from './pages/SupportTickets';
import Login from './pages/Login';
import HarvestManagement from './pages/HarvestManagement';
import Certifications from './pages/Certifications';
import IoTDevices from './pages/IoTDevices';
import Subscriptions from './pages/Subscriptions';
import ContentManagement from './pages/ContentManagement';
import ProductsManagement from './pages/ProductsManagement';
import RevenueManagement from './pages/RevenueManagement';
import OrderManagement from './pages/OrderManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import Alerts from './pages/Alerts';
import SettingsPage from './pages/Settings';
import RBACManagement from './pages/RBACManagement';
import FarmIntelligence from './pages/FarmIntelligence';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

/**
 * RoleRoute — gates a page by allowed roles.
 * super_admin always passes. All other roles must be explicitly listed.
 */
const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: AdminRole[] }) => {
  const { user, isSuperAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <>{children}</>;
  if (roles.includes(user.role)) return <>{children}</>;
  return <Navigate to="/" replace />;
};

// Placeholder for future pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="space-y-8">
    <h1 className="text-4xl font-display font-bold tracking-tight">{title}</h1>
    <div className="glass-panel p-20 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
        <TrendingUp size={40} className="text-zinc-600" />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">Module Under Development</h3>
      <p className="text-zinc-400">The <span className="text-emerald-400">{title}</span> module is being built.</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ── Core: all authenticated roles ───────────────────── */}
        <Route path="/"
          element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/farm-intelligence"
          element={<ProtectedRoute><Layout><FarmIntelligence /></Layout></ProtectedRoute>} />
        <Route path="/alerts"
          element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
        <Route path="/settings"
          element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />

        {/* ── Farmers: operations + hr ─────────────────────────── */}
        <Route path="/harvests"
          element={<RoleRoute roles={['operations_admin','hr_admin']}><Layout><HarvestManagement /></Layout></RoleRoute>} />
        <Route path="/certifications"
          element={<RoleRoute roles={['operations_admin','hr_admin']}><Layout><Certifications /></Layout></RoleRoute>} />

        {/* ── Operations ──────────────────────────────────────── */}
        <Route path="/providers"
          element={<RoleRoute roles={['operations_admin','inventory_admin']}><Layout><ProviderRegistry /></Layout></RoleRoute>} />
        <Route path="/employees"
          element={<RoleRoute roles={['hr_admin','operations_admin']}><Layout><EmployeeManagement /></Layout></RoleRoute>} />
        <Route path="/iot-devices"
          element={<RoleRoute roles={['technical_admin','inventory_admin','operations_admin']}><Layout><IoTDevices /></Layout></RoleRoute>} />

        {/* ── Commerce ────────────────────────────────────────── */}
        <Route path="/order-management"
          element={<RoleRoute roles={['operations_admin','inventory_admin']}><Layout><OrderManagement /></Layout></RoleRoute>} />
        <Route path="/products"
          element={<RoleRoute roles={['inventory_admin','sales_admin','operations_admin']}><Layout><ProductsManagement /></Layout></RoleRoute>} />
        <Route path="/price-control"
          element={<RoleRoute roles={['inventory_admin','sales_admin','finance_admin']}><Layout><PriceControl /></Layout></RoleRoute>} />
        <Route path="/buyers"
          element={<RoleRoute roles={['sales_admin','operations_admin']}><Layout><BuyerManagement /></Layout></RoleRoute>} />
        <Route path="/supply-chain"
          element={<RoleRoute roles={['operations_admin','inventory_admin']}><Layout><SupplyChain /></Layout></RoleRoute>} />
        <Route path="/finance"
          element={<RoleRoute roles={['finance_admin','operations_admin']}><Layout><Finance /></Layout></RoleRoute>} />
        <Route path="/subscriptions"
          element={<RoleRoute roles={['finance_admin','operations_admin','sales_admin']}><Layout><Subscriptions /></Layout></RoleRoute>} />
        <Route path="/revenue"
          element={<RoleRoute roles={['finance_admin','operations_admin']}><Layout><RevenueManagement /></Layout></RoleRoute>} />

        {/* ── Growth & Comms ───────────────────────────────────── */}
        <Route path="/marketing"
          element={<RoleRoute roles={['sales_admin']}><Layout><Marketing /></Layout></RoleRoute>} />
        <Route path="/content"
          element={<RoleRoute roles={['sales_admin','operations_admin']}><Layout><ContentManagement /></Layout></RoleRoute>} />

        {/* ── System ──────────────────────────────────────────── */}
        <Route path="/support"
          element={<RoleRoute roles={['support_admin','operations_admin']}><Layout><SupportTickets /></Layout></RoleRoute>} />
        <Route path="/ai-control"
          element={<RoleRoute roles={['technical_admin']}><Layout><AIControl /></Layout></RoleRoute>} />
        <Route path="/operations"
          element={<RoleRoute roles={['operations_admin']}><Layout><Operations /></Layout></RoleRoute>} />
        <Route path="/rbac"
          element={<SuperAdminRoute><Layout><RBACManagement /></Layout></SuperAdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
