/**
 * AquaGrow Live API Service
 * ─────────────────────────
 * Single source of truth for ALL admin-panel API calls.
 * Both the mobile app and this admin panel share the SAME backend.
 * 
 * Auth: POST /api/auth/login → returns accessToken (JWT)
 * All admin routes require: Authorization: Bearer <token> with role=admin
 */

// In dev, VITE_API_BASE_URL points to local Express (port 3005) via Vite proxy.
// In production (Render), falls back to the live backend URL below.
export const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? 'https://aquagrow-admin.onrender.com/api';

// ═══════════════════════════════════════════════════════════════
//  TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const TOKEN_KEY    = 'aquagrow_admin_token';
const USERDATA_KEY = 'aquagrow_admin_user';

export const getAdminToken  = (): string | null  => sessionStorage.getItem(TOKEN_KEY);
export const setAdminToken  = (t: string)        => sessionStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken= ()                  => { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USERDATA_KEY); };

export const getCachedUser  = (): any | null => {
  try { return JSON.parse(sessionStorage.getItem(USERDATA_KEY) || 'null'); } catch { return null; }
};
export const setCachedUser  = (u: any)       => sessionStorage.setItem(USERDATA_KEY, JSON.stringify(u));

// ═══════════════════════════════════════════════════════════════
//  CORE FETCH WRAPPER
// ═══════════════════════════════════════════════════════════════
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(res.status, (err as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
export interface BackendUser {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  // `role` now carries the full admin variant directly from the backend
  role: 'admin' | 'super_admin' | 'finance_admin' | 'operations_admin' | 'sales_admin'
      | 'support_admin' | 'inventory_admin' | 'technical_admin' | 'hr_admin'
      | 'farmer' | 'provider';
  adminRole?: string | null;  // @deprecated — kept for backwards compat reads
  location?: string;
  subscriptionStatus?: string;
  createdAt?: string;
}

// Backend returns { access_token, user, subscription } — we normalise to { accessToken, user }
interface RawLoginResponse {
  access_token: string;
  user: BackendUser;
}

export interface LoginResponse {
  accessToken: string;
  user: BackendUser;
}

const ADMIN_ROLES = new Set([
  'admin', 'super_admin', 'finance_admin', 'operations_admin',
  'sales_admin', 'support_admin', 'inventory_admin', 'technical_admin', 'hr_admin',
]);

/** Login via AquaGrow backend. Only users with an admin-variant role can access admin panel. */
export async function adminLogin(phoneNumber: string, password: string): Promise<LoginResponse> {
  // Backend reads `mobile` + `role: 'admin'` — passes for any admin-variant role in DB
  const raw = await apiFetch<RawLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobile: phoneNumber, password, role: 'admin' }),
  });
  // Normalise snake_case → camelCase
  const data: LoginResponse = { accessToken: raw.access_token, user: raw.user };
  if (!data.accessToken) throw new ApiError(401, 'No access token received');
  if (!ADMIN_ROLES.has(data.user?.role))
    throw new ApiError(403, 'Access denied: This account does not have admin privileges. Contact your Super Admin.');
  setAdminToken(data.accessToken);
  setCachedUser(data.user);
  return data;
}

/** Get current admin's own profile (from adminusers collection) */
export async function fetchAdminMe(): Promise<BackendUser> {
  return apiFetch<BackendUser>('/admin/me');
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN STAFF MANAGEMENT (super_admin only for write ops)
// ═══════════════════════════════════════════════════════════════
export interface AdminStaffMember {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: string;
  isActive: boolean;
  location?: string;
  lastLogin?: string;
  createdBy?: string;
  createdAt?: string;
}

export const fetchAdminStaff   = ()                                         => apiFetch<AdminStaffMember[]>('/admin/staff');
export const createAdminStaff  = (data: { name: string; phoneNumber: string; password: string; role: string; email?: string; location?: string }) =>
  apiFetch<AdminStaffMember>('/admin/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateAdminStaff  = (id: string, data: Partial<Pick<AdminStaffMember, 'role' | 'isActive' | 'name' | 'email' | 'location'>>) =>
  apiFetch<AdminStaffMember>(`/admin/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAdminStaff  = (id: string)                               => apiFetch(`/admin/staff/${id}`, { method: 'DELETE' });
export const resetAdminPassword= (id: string, newPassword: string)          =>
  apiFetch(`/admin/staff/${id}/password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) });

// ═══════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════
export interface HealthStatus { status: string; farmerDb: number; providerDb: number; }
export const checkApiHealth = () => apiFetch<HealthStatus>('/health');


// ═══════════════════════════════════════════════════════════════
//  INTELLIGENCE DASHBOARD (aggregated)
// ═══════════════════════════════════════════════════════════════
export interface IntelligenceSummary {
  totalFarmers: number;
  activePonds: number;
  harvestedPonds: number;
  totalPonds: number;
  harvestReadyCount: number;
  criticalRiskCount: number;
  pendingHarvestRequests: number;
  pendingShopOrders: number;
  totalFeedKgLast7Days: number;
  totalRevenue: number;
  totalProfit: number;
  avgROI: number;
  totalHarvestBiomassKg: number;
}

export interface SystemAlert {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  pondId?: string;
  farmerId?: string;
}

export interface IntelligenceData {
  summary: IntelligenceSummary;
  stageDistribution: Record<string, number>;
  subscriptionBreakdown: Record<string, number>;
  systemAlerts: SystemAlert[];
  harvestReady: any[];
  criticalRiskPonds: any[];
  pendingHarvestRequests: any[];
  topFeedConsumers: { farmerId: string; feedKg: number }[];
  recentROI: any[];
}

export const fetchIntelligence = () => apiFetch<IntelligenceData>('/admin/intelligence');

// ═══════════════════════════════════════════════════════════════
//  FARMERS
// ═══════════════════════════════════════════════════════════════
export interface LiveFarmer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  subscriptionStatus: string;
  role: string;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    endDate?: string;
    features?: string[];
  } | null;
}

export const fetchFarmers     = ()                   => apiFetch<LiveFarmer[]>('/admin/farmers');
export const fetchAllUsers    = ()                   => apiFetch<BackendUser[]>('/admin/users');
export const updateUserRole   = (id: string, adminRole: string) =>
  apiFetch(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ adminRole }) });

// ═══════════════════════════════════════════════════════════════
//  PONDS
// ═══════════════════════════════════════════════════════════════
export interface LivePond {
  _id: string;
  name: string;
  userId: string;
  size?: number;
  species?: string;
  stockingDate?: string;
  seedCount?: number;
  status: 'active' | 'harvested' | 'archive' | 'planned' | 'harvest_pending';
  doc: number;
  stage: string;
  alerts: string[];
  feedLast7Days: number;
  feedLogCount: number;
  lastWaterLog?: {
    ph?: number;
    do?: number;
    temp?: number;
    ammonia?: number;
    mortality?: number;
    date?: string;
  } | null;
  farmer?: { name: string; phoneNumber: string; location?: string } | null;
  aerators?: { count: number; hp: number };
}

export const fetchPonds = () => apiFetch<LivePond[]>('/admin/ponds');

// ═══════════════════════════════════════════════════════════════
//  WATER ALERTS
// ═══════════════════════════════════════════════════════════════
export const fetchWaterAlerts = () => apiFetch<any[]>('/admin/water-alerts');

// ═══════════════════════════════════════════════════════════════
//  HARVEST REQUESTS
// ═══════════════════════════════════════════════════════════════
export interface LiveHarvestRequest {
  _id: string;
  userId: string;
  pondId: string;
  biomass: number;
  avgWeight: number;
  status: string;
  finalWeight?: number;
  finalTotal?: number;
  price?: number;
  createdAt: string;
  updatedAt?: string;
}

export const fetchHarvestRequests    = ()                     => apiFetch<LiveHarvestRequest[]>('/harvest-requests');
export const updateHarvestRequest    = (id: string, data: Partial<LiveHarvestRequest>) =>
  apiFetch(`/harvest-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const approveHarvestRequest   = (id: string, price: number, finalWeight: number) =>
  apiFetch(`/harvest-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'accepted', price, finalWeight }) });
export const completeHarvestRequest  = (id: string, finalTotal: number) =>
  apiFetch(`/harvest-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed', finalTotal }) });

// ═══════════════════════════════════════════════════════════════
//  SHOP ORDERS + PROVIDER ORDERS (UNIFIED — single DB)
// ═══════════════════════════════════════════════════════════════
export interface ShopOrderItem {
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  category?: string;
}

export interface LiveShopOrder {
  _id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  providerId?: string;
  providerName?: string;
  items: ShopOrderItem[];
  totalAmount: number;
  status: 'assigned' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  address?: string;
  /** 'shop' = placed via AquaShop, 'provider' = placed directly to a provider */
  _source?: 'shop' | 'provider';
  createdAt: string;
  updatedAt?: string;
}

/** Fetch all ShopOrders (farmer → AquaShop) from the unified DB */
export const fetchShopOrders       = ()                             => apiFetch<LiveShopOrder[]>('/admin/shop-orders');
/** Fetch ALL orders across both AquaShop + ProviderOrders — unified single-DB view */
export const fetchAllOrders        = ()                             => apiFetch<LiveShopOrder[]>('/admin/all-orders');
export const updateShopOrderStatus = (id: string, status: string)  =>
  apiFetch(`/shop/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ═══════════════════════════════════════════════════════════════
//  ROI / REVENUE
// ═══════════════════════════════════════════════════════════════
export const fetchROI = () => apiFetch<any[]>('/admin/roi');

// ═══════════════════════════════════════════════════════════════
//  PROVIDERS (from provider DB)
// ═══════════════════════════════════════════════════════════════
export interface LiveProvider {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  role: string;
  specializations?: string[];
  rating?: number;
  isVerified?: boolean;
  assignedZone?: string;
  createdAt?: string;
}

// All providers now live in the SHARED aquagrow DB — fetched via admin endpoint
export const fetchProviders = () => apiFetch<LiveProvider[]>('/admin/providers');

// ═══════════════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════
export interface LiveSubscription {
  _id: string;
  userId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string;
  features: string[];
}

export const fetchSubscriptions = () => apiFetch<LiveSubscription[]>('/admin/subscriptions');

// ═══════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
export const sendAdminNotification = (userId: string, title: string, body: string) =>
  apiFetch('/admin/notify', { method: 'POST', body: JSON.stringify({ userId, title, body }) });
