import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, CheckCircle2, XCircle, Edit3, 
  Truck, DollarSign, ArrowUpRight, Clock, AlertCircle, 
  ChevronRight, MoreVertical, X, TrendingUp, Users, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, BuyerCompany } from '../types';
import { storageService } from '../services/storageService';

const StatusBadge = ({ status }: { status: Order['status'] }) => {
  const styles: Record<Order['status'], string> = {
    PENDING_PROVIDER: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    SENT_TO_COMPANY:  'bg-radiant-sun/10 text-radiant-sun border-radiant-sun/20',
    ADMIN_APPROVED:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    REJECTED:         'bg-red-500/10 text-red-400 border-red-500/20',
    COMPLETED:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyers, setBuyers] = useState<BuyerCompany[]>([]);

  // Approve modal
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approveFinalPrice, setApproveFinalPrice] = useState(0);
  const [approveQuantity, setApproveQuantity] = useState(0);
  const [approveBuyerId, setApproveBuyerId] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  // Reject modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setOrders(storageService.getOrders());
    setBuyers(storageService.getBuyers());
  };

  const stats = {
    pending: orders.filter(o => o.status === 'SENT_TO_COMPANY').length,
    approved: orders.filter(o => o.status === 'ADMIN_APPROVED').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    totalProfit: orders
      .filter(o => o.status === 'ADMIN_APPROVED' || o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.companyPrice - o.farmerPrice) * o.items[0].quantity, 0),
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.providerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openApproveModal = (order: Order) => {
    setSelectedOrder(order);
    setApproveFinalPrice(order.companyPrice);
    setApproveQuantity(order.items[0].quantity);
    setApproveBuyerId('');
    setApproveNotes('');
    setIsApproveOpen(true);
  };

  const openRejectModal = (order: Order) => {
    setSelectedOrder(order);
    setRejectNotes('');
    setIsRejectOpen(true);
  };

  const handleApprove = () => {
    if (!selectedOrder || !approveBuyerId) return;
    const buyer = buyers.find(b => b.id === approveBuyerId);
    storageService.approveOrder(selectedOrder.id, approveFinalPrice, approveBuyerId, buyer?.name || '', approveNotes);
    setIsApproveOpen(false);
    loadData();
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    storageService.rejectOrder(selectedOrder.id, rejectNotes);
    setIsRejectOpen(false);
    loadData();
  };

  const handleComplete = (order: Order) => {
    if (window.confirm(`Mark order ${order.id} as COMPLETED?`)) {
      storageService.completeOrder(order.id);
      loadData();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Order Control</h1>
          <p className="text-zinc-400">Final authority for order approvals, price overrides, and buyer assignments.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Awaiting Approval</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-display font-bold text-radiant-sun">{stats.pending}</h3>
            <div className="p-2.5 rounded-xl bg-radiant-sun/10 text-radiant-sun"><Clock size={18} /></div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Admin Approved</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-display font-bold text-emerald-400">{stats.approved}</h3>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={18} /></div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Completed</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-display font-bold text-blue-400">{stats.completed}</h3>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400"><Package size={18} /></div>
          </div>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Total Profit</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-display font-bold text-emerald-400">₹{stats.totalProfit.toLocaleString()}</h3>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={18} /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by Order ID, Farmer, or Provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-12"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 w-full md:w-auto">
          <Filter size={18} className="text-zinc-500" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent outline-none text-sm font-medium">
            <option value="all">All Status</option>
            <option value="PENDING_PROVIDER">Pending Provider</option>
            <option value="SENT_TO_COMPANY">Sent to Company</option>
            <option value="ADMIN_APPROVED">Admin Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Farmer / Provider</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Profit</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-emerald-400/80 bg-emerald-400/5 px-2 py-0.5 rounded">{order.id}</span>
                    <p className="text-[10px] text-zinc-600 mt-1">{order.createdAt}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-100">{order.farmerName}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1"><Truck size={10} /> {order.providerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm font-medium">{item.quantity} {item.unit} <span className="text-zinc-400">{item.type}</span></p>
                    ))}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p className="text-zinc-400">Farmer: <span className="text-zinc-100 font-mono">₹{order.farmerPrice}</span></p>
                      <p className="text-zinc-400">Company: <span className="text-emerald-400 font-bold font-mono">₹{order.companyPrice}</span></p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono font-bold text-emerald-400">₹{((order.companyPrice - order.farmerPrice) * order.items[0].quantity).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.buyerName ? (
                      <span className="text-xs text-blue-400 bg-blue-400/5 border border-blue-400/10 px-2 py-1 rounded-lg">{order.buyerName}</span>
                    ) : (
                      <span className="text-xs text-zinc-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === 'SENT_TO_COMPANY' && (<>
                        <button onClick={() => openApproveModal(order)} className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Approve">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => openRejectModal(order)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Reject">
                          <XCircle size={16} />
                        </button>
                      </>)}
                      {order.status === 'ADMIN_APPROVED' && (
                        <button onClick={() => handleComplete(order)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Mark Completed">
                          <Package size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center">
            <ShoppingBag size={40} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No orders match your current filters.</p>
          </div>
        )}
      </div>

      {/* ── Approve Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isApproveOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsApproveOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold">Approve Order</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-1">{selectedOrder.id} — {selectedOrder.farmerName}</p>
                </div>
                <button onClick={() => setIsApproveOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>

              <div className="space-y-5">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Qty</p>
                    <p className="font-bold text-zinc-100">{selectedOrder.items[0].quantity} kg</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Farmer Pays</p>
                    <p className="font-bold text-zinc-100">₹{selectedOrder.farmerPrice}/kg</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Est. Profit</p>
                    <p className="font-bold text-emerald-400">₹{((approveFinalPrice - selectedOrder.farmerPrice) * selectedOrder.items[0].quantity).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Final Price (₹/kg)</label>
                    <input type="number" value={approveFinalPrice} onChange={(e) => setApproveFinalPrice(Number(e.target.value))} className="input-field w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Assign Buyer *</label>
                    <select value={approveBuyerId} onChange={(e) => setApproveBuyerId(e.target.value)} className="input-field w-full bg-zinc-900">
                      <option value="">Select Buyer</option>
                      {buyers.filter(b => b.status === 'active').map(b => (
                        <option key={b.id} value={b.id}>{b.name} — ₹{b.baseRate}/kg</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Admin Notes (Optional)</label>
                  <textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} placeholder="Any special instructions..." rows={2} className="input-field w-full resize-none" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsApproveOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleApprove} disabled={!approveBuyerId} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <CheckCircle2 size={16} /> Approve Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reject Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isRejectOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsRejectOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 shadow-2xl border border-red-500/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-red-400">Reject Order</h2>
                <button onClick={() => setIsRejectOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={22} /></button>
              </div>
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Rejecting</p>
                  <p className="font-bold text-zinc-100">{selectedOrder.id} — {selectedOrder.farmerName}</p>
                  <p className="text-sm text-zinc-400">{selectedOrder.items[0].quantity} kg via {selectedOrder.providerName}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Rejection Reason *</label>
                  <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} placeholder="Provide a reason for rejection..." rows={3} className="input-field w-full resize-none" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => setIsRejectOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleReject} disabled={!rejectNotes.trim()} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <XCircle size={16} /> Confirm Rejection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
