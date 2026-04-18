/**
 * roleConstants.ts
 * ─────────────────────────────────────────────────────────────
 * Plain (non-component) exports for admin role metadata.
 * Kept in a separate file so AuthContext.tsx only exports
 * React components/hooks, satisfying Vite's Fast Refresh rules.
 */

import type { AdminRole } from './AuthContext';

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:       'Super Admin',
  finance_admin:     'Finance Admin',
  operations_admin:  'Operations Admin',
  sales_admin:       'Sales Admin',
  support_admin:     'Support Admin',
  inventory_admin:   'Inventory Admin',
  technical_admin:   'Technical Admin',
  hr_admin:          'HR Admin',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
  finance_admin:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  operations_admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sales_admin:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  support_admin:    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  inventory_admin:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  technical_admin:  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  hr_admin:         'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};
