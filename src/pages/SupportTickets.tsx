import React, { useState, useEffect, useRef } from 'react';
import {
  LifeBuoy, Search, Filter, Plus, MessageSquare, Clock,
  CheckCircle2, AlertCircle, MoreVertical, Tag, Send,
  X, AlertTriangle, Activity, Trash2, RefreshCw, User,
  Users, Bot, Shield, ExternalLink, Paperclip, ChevronRight,
  History, Settings, BookOpen, BarChart3, Bell, ArrowUpRight,
  Reply, UserCheck, ShieldAlert, Download, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketCategory, TicketMessage, TicketHistoryItem, FAQItem } from '../types';
import { storageService } from '../services/storageService';

const PriorityBadge = ({ p }: { p: Ticket['priority'] }) => {
  const styles = {
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    LOW: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${styles[p]}`}>
      <span className={`w-1 h-1 rounded-full ${p === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-current'}`} />
      {p}
    </span>
  );
};

const StatusBadge = ({ s }: { s: Ticket['status'] }) => {
  const styles: Record<Ticket['status'], string> = {
    OPEN: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    WAITING_FOR_USER: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    RESOLVED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    CLOSED: 'bg-zinc-900 text-zinc-600 border-white/5',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[s]}`}>{s.replace(/_/g, ' ')}</span>;
};

const SupportTickets = () => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'categories' | 'kb' | 'reports'>('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedTicket) { scrollToBottom(); } }, [selectedTicket?.messages]);

  const loadData = () => {
    setTickets(storageService.getTickets());
    setCategories(storageService.getTicketCategories());
    setFaqs(storageService.getFAQ());
  };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    breached: tickets.filter(t => t.sla?.isBreached && t.status !== 'CLOSED').length,
    resolvedToday: tickets.filter(t => t.status === 'RESOLVED' && t.updatedAt.startsWith(new Date().toISOString().split('T')[0])).length,
  };

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedTicket) return;
    storageService.addTicketMessage(selectedTicket.id, {
      senderId: 'ADMIN-1',
      senderName: 'Super Admin',
      senderRole: 'ADMIN',
      content: chatMessage,
    });
    setChatMessage('');
    loadData();
    const updated = storageService.getTickets().find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const handleStatusUpdate = (status: Ticket['status']) => {
    if (!selectedTicket) return;
    storageService.updateTicketStatus(selectedTicket.id, status);
    loadData();
    const updated = storageService.getTickets().find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const handleAssign = (role: Ticket['assignedTo']['role']) => {
    if (!selectedTicket) return;
    storageService.assignTicket(selectedTicket.id, {
      id: 'AGENT-X',
      name: role === 'SUPPORT' ? 'Support John' : 'Tech Sarah',
      role
    });
    loadData();
    const updated = storageService.getTickets().find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const [newTicket, setNewTicket] = useState({
    userId: '', userName: '', userRole: 'FARMER' as Ticket['userRole'],
    category: '', subject: '', description: '', priority: 'MEDIUM' as Ticket['priority']
  });

  const handleCreateTicket = () => {
    const cat = categories.find(c => c.name === newTicket.category);
    const firstDue = new Date();
    firstDue.setHours(firstDue.getHours() + (cat?.slaFirstResponseHours || 4));
    const resDue = new Date();
    resDue.setHours(resDue.getHours() + (cat?.slaResolutionHours || 48));

    const ticket: Ticket = {
      id: `TKT-${Date.now()}`,
      userId: newTicket.userId || 'F-101',
      userName: newTicket.userName || 'System Auto',
      userRole: newTicket.userRole,
      category: newTicket.category,
      type: 'OTHER',
      subject: newTicket.subject,
      description: newTicket.description,
      status: 'OPEN',
      priority: newTicket.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: `MSG-${Date.now()}`,
        senderId: newTicket.userId || 'SYSTEM',
        senderName: newTicket.userName || 'System',
        senderRole: 'USER',
        content: newTicket.description,
        timestamp: new Date().toISOString()
      }],
      history: [{
        id: `HST-${Date.now()}`,
        action: 'CREATED',
        performedBy: newTicket.userName || 'System',
        timestamp: new Date().toISOString()
      }],
      sla: {
        firstResponseDue: firstDue.toISOString(),
        resolutionDue: resDue.toISOString(),
        isBreached: false
      },
      escalationLevel: 0
    };
    storageService.saveTicket(ticket);
    setIsNewTicketModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <LifeBuoy size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Support Center</span>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Support Tickets</h1>
          <p className="text-zinc-400 max-w-xl">Centralized helpdesk for farmers, providers, and automated system alerts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsNewTicketModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        {[
          { id: 'tickets', label: 'All Tickets', icon: MessageSquare },
          { id: 'categories', label: 'Categories', icon: Tag },
          { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
          { id: 'reports', label: 'Analytics', icon: BarChart3 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tickets' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tickets', val: stats.total, icon: Users, color: 'zinc' },
              { label: 'Pending Action', val: stats.open + stats.inProgress, icon: Clock, color: 'emerald' },
              { label: 'SLA Breached', val: stats.breached, icon: ShieldAlert, color: 'red' },
              { label: 'Resolved Today', val: stats.resolvedToday, icon: CheckCircle2, color: 'blue' },
            ].map((s, i) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                key={s.label} className="glass-panel p-5 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${s.color}-500`} />
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
                    <h3 className="text-3xl font-display font-bold text-zinc-100">{s.val}</h3>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 group-hover:text-zinc-100 transition-colors`}>
                    <s.icon size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Ticket List */}
            <div className={`xl:col-span-4 space-y-4 ${selectedTicket ? 'hidden xl:block' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search tickets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all" />
                </div>
                <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-emerald-500 transition-colors">
                  <Filter size={18} />
                </button>
              </div>

              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map((ticket) => (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative ${selectedTicket?.id === ticket.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                    {ticket.sla?.isBreached && ticket.status !== 'CLOSED' && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20">
                          {(ticket.userName || 'Unknown User').split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-100">{ticket.userName || 'Unknown User'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{ticket.id}</p>
                        </div>
                      </div>
                      <PriorityBadge p={ticket.priority} />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200 mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors">{ticket.subject}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{ticket.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{ticket.category}</span>
                      </div>
                      <StatusBadge s={ticket.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Detail */}
            <div className={`xl:col-span-8 ${!selectedTicket ? 'hidden xl:flex items-center justify-center' : 'block'}`}>
              <AnimatePresence mode="wait">
                {selectedTicket ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    key={selectedTicket.id} className="h-full flex flex-col glass-panel overflow-hidden border-white/10">
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedTicket(null)} className="xl:hidden p-2 hover:bg-white/5 rounded-lg text-zinc-400"><X size={20} /></button>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Bot size={12} /> Live Support Loop
                          </p>
                          <h2 className="text-xl font-bold text-zinc-100">{selectedTicket.subject}</h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                          <Clock size={12} />
                          Updated {new Date(selectedTicket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <button className="p-2 hover:bg-white/5 border border-white/5 rounded-lg text-zinc-400"><MoreVertical size={18} /></button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row min-h-0">
                      {/* Chat Section */}
                      <div className="flex-1 flex flex-col min-h-0 border-r border-white/5">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                          {selectedTicket.messages.map((msg, i) => (
                            <div key={msg.id} className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] ${msg.senderRole === 'ADMIN' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                                <div className="flex items-center gap-2 px-1">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{msg.senderName || 'Anonymous'}</span>
                                  <span className="text-[9px] text-zinc-600 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.senderRole === 'ADMIN' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 rounded-tr-none' : 'bg-white/5 text-zinc-200 border border-white/5 rounded-tl-none'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                          <div className="relative flex items-end gap-3 p-2 bg-zinc-900/50 border border-white/10 rounded-2xl focus-within:border-emerald-500/50 transition-all">
                            <button className="p-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"><Paperclip size={20} /></button>
                            <textarea placeholder="Type your response..." rows={1} value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                              className="flex-1 p-2 bg-transparent border-none outline-none text-sm text-zinc-100 resize-none max-h-32" />
                            <button onClick={handleSendMessage} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                              <Send size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Info Sidebar */}
                      <div className="w-full md:w-80 p-6 space-y-8 bg-white/[0.01] overflow-y-auto custom-scrollbar">
                        {/* Status Controls */}
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Ticket Status</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED'] as const).map(s => (
                              <button key={s} onClick={() => handleStatusUpdate(s)}
                                className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${selectedTicket.status === s ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                                {s.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </section>

                        {/* SLA Status */}
                        <section className={`p-4 rounded-2xl border ${selectedTicket.sla?.isBreached ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">SLA Tracker</span>
                            {selectedTicket.sla?.isBreached ? <ShieldAlert size={14} className="text-red-500" /> : <Shield size={14} className="text-emerald-500" />}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] text-zinc-500 uppercase mb-1">Resolution Due</p>
                              <p className={`text-sm font-bold ${selectedTicket.sla?.isBreached ? 'text-red-400' : 'text-zinc-200'}`}>
                                {selectedTicket.sla ? (
                                  <>
                                    {new Date(selectedTicket.sla.resolutionDue).toLocaleDateString()} {new Date(selectedTicket.sla.resolutionDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </>
                                ) : 'N/A'}
                              </p>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${selectedTicket.sla?.isBreached ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: selectedTicket.sla?.isBreached ? '100%' : '65%' }} />
                            </div>
                          </div>
                        </section>

                        {/* User Profile */}
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Requester</h4>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10">
                                <User size={20} className="text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-zinc-100">{selectedTicket.userName || 'Unknown User'}</p>
                                <p className="text-[10px] text-zinc-500">{selectedTicket.userRole || 'USER'}</p>
                              </div>
                              <ExternalLink size={14} className="ml-auto text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full bg-emerald-500" />
                              <div className="flex-1 h-1 rounded-full bg-emerald-500" />
                              <div className="flex-1 h-1 rounded-full bg-zinc-700" />
                              <span className="text-[9px] font-bold text-emerald-500 uppercase ml-1">Lvl 2 Trust</span>
                            </div>
                          </div>
                        </section>

                        {/* Linked Module */}
                        {selectedTicket.linkedData && (
                          <section>
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Linked Context</h4>
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between group cursor-pointer hover:bg-blue-500/10 transition-all">
                              <div className="flex items-center gap-3 text-blue-400">
                                <BarChart3 size={18} />
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{selectedTicket.linkedData.type} Details</p>
                                  <p className="text-sm font-bold">{selectedTicket.linkedData.id}</p>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </section>
                        )}

                        {/* Assignment */}
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Assign To Team</h4>
                          <div className="space-y-3">
                            {/* Support Team */}
                            <div>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">📞 Customer Support</p>
                              <div className="space-y-1.5">
                                {[
                                  { name: 'Divya Sri',      role: 'Support Executive',  desc: 'Product & billing queries',  agentId: 'AGT-D1', agentRole: 'SUPPORT' as const },
                                  { name: 'Priya Lakshmi', role: 'Support Associate',   desc: 'Returns & order complaints', agentId: 'AGT-P1', agentRole: 'SUPPORT' as const },
                                ].map(a => (
                                  <button key={a.name} onClick={() => { storageService.assignTicket(selectedTicket.id, { id: a.agentId, name: a.name, role: a.agentRole }); loadData(); const updated = storageService.getTickets().find(t => t.id === selectedTicket.id); if (updated) setSelectedTicket(updated); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTicket.assignedTo?.name === a.name ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                                    <UserCheck size={14} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate">{a.name}</p>
                                      <p className="text-[9px] text-zinc-500">{a.role} · {a.desc}</p>
                                    </div>
                                    {selectedTicket.assignedTo?.name === a.name && <CheckCircle2 size={12} className="text-green-400 shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Tech Team */}
                            <div>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">🔬 Tech / Aquaculture</p>
                              <div className="space-y-1.5">
                                {[
                                  { name: 'Dr. Gopi Raju', role: 'Aquaculture Expert', desc: 'Pond disease, water quality', agentId: 'AGT-G1', agentRole: 'TECH' as const },
                                  { name: 'Arjun Naik',    role: 'IoT Engineer',       desc: 'Sensor & device issues',     agentId: 'AGT-A1', agentRole: 'TECH' as const },
                                ].map(a => (
                                  <button key={a.name} onClick={() => { storageService.assignTicket(selectedTicket.id, { id: a.agentId, name: a.name, role: a.agentRole }); loadData(); const updated = storageService.getTickets().find(t => t.id === selectedTicket.id); if (updated) setSelectedTicket(updated); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTicket.assignedTo?.name === a.name ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                                    <UserCheck size={14} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate">{a.name}</p>
                                      <p className="text-[9px] text-zinc-500">{a.role} · {a.desc}</p>
                                    </div>
                                    {selectedTicket.assignedTo?.name === a.name && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Operations / Escalation */}
                            <div>
                              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 px-1">🧠 Operations (Escalation)</p>
                              <div className="space-y-1.5">
                                {[
                                  { name: 'Kiran Reddy', role: 'Ops Manager', desc: 'Order disputes & escalations', agentId: 'AGT-K1', agentRole: 'SUPPORT' as const },
                                ].map(a => (
                                  <button key={a.name} onClick={() => { storageService.assignTicket(selectedTicket.id, { id: a.agentId, name: a.name, role: a.agentRole }); loadData(); const updated = storageService.getTickets().find(t => t.id === selectedTicket.id); if (updated) setSelectedTicket(updated); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTicket.assignedTo?.name === a.name ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                                    <UserCheck size={14} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate">{a.name}</p>
                                      <p className="text-[9px] text-zinc-500">{a.role} · {a.desc}</p>
                                    </div>
                                    {selectedTicket.assignedTo?.name === a.name && <CheckCircle2 size={12} className="text-red-400 shrink-0" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Escalation Matrix */}
                        <section>
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Escalation Path</h4>
                          <div className="space-y-2">
                            {[
                              { level: 'L1', name: 'Divya Sri', role: 'Support Executive', color: 'border-green-500/20 bg-green-500/5 text-green-400', desc: 'First response — product & usage queries' },
                              { level: 'L2', name: 'Kiran Reddy', role: 'Ops Manager', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400', desc: 'Order disputes, delays, escalations' },
                              { level: 'L3', name: 'Founder (You)', role: 'AquaGrow Admin', color: 'border-red-500/20 bg-red-500/5 text-red-400', desc: 'Critical issues only — unresolved complaints' },
                            ].map(e => (
                              <div key={e.level} className={`flex items-start gap-3 p-2.5 rounded-xl border ${e.color}`}>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${e.color} border shrink-0 mt-0.5`}>{e.level}</span>
                                <div>
                                  <p className="text-[10px] font-bold">{e.name}</p>
                                  <p className="text-[9px] text-zinc-500">{e.role} · {e.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* History */}
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">History</h4>
                            <button className="text-[10px] font-bold text-emerald-500 hover:underline">View All</button>
                          </div>
                          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                            {selectedTicket.history.slice(0, 3).map(h => (
                                <div key={h.id} className="relative pl-6">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-tighter">{h.action}</p>
                                    <p className="text-[9px] text-zinc-500 mb-0.5">{h.performedBy} • {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    {h.details && <p className="text-[9px] text-zinc-600 italic">"{h.details}"</p>}
                                </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-12">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 animate-bounce-slow">
                      <LifeBuoy size={40} />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-zinc-100 mb-2">No Ticket Selected</h3>
                    <p className="text-zinc-500 max-w-sm mb-8">Select a ticket from the left panel to view the conversation and manage its status.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-2xl font-bold text-emerald-500">{stats.open}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Requests</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-2xl font-bold text-red-500">{stats.breached}</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SLA Breaches</p>
                        </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-1">Ticket Categories</h3>
                    <p className="text-xs text-zinc-500 tracking-tight">Define SLAs and default priority for different issue types.</p>
                </div>
                <button onClick={() => setIsNewCatModalOpen(true)} className="btn-secondary flex items-center gap-2 group">
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Category
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map(cat => (
                    <div key={cat.id} className="glass-panel p-6 border-white/10 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                                <Tag size={20} />
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-600 transition-colors"><Settings size={14} /></button>
                                <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <h4 className="text-lg font-bold text-zinc-100 mb-1">{cat.name}</h4>
                        <div className="flex items-center gap-2 mb-4">
                            <PriorityBadge p={cat.priority} />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">{cat.defaultAssigneeRole}</span>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-zinc-500">First Response</span>
                                <span className="text-emerald-500 font-mono">{cat.slaFirstResponseHours} Hours</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-zinc-500">Resolution SLA</span>
                                <span className="text-blue-500 font-mono">{cat.slaResolutionHours} Hours</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
      )}

      {activeTab === 'kb' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-zinc-100 mb-1">Knowledge Base</h3>
                    <p className="text-xs text-zinc-500 tracking-tight">Reduce tickets by providing automated solutions to common problems.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                         <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                         <input type="text" placeholder="Search articles..." className="w-full bg-white/5 border border-white/10 py-2 pl-10 pr-4 rounded-xl text-sm focus:border-blue-500/50 outline-none transition-all" />
                    </div>
                    <button className="btn-primary flex items-center gap-2"><Plus size={16} /> New Article</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 space-y-2">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">Filters</h4>
                    {['All Articles', 'Payments', 'IoT Devices', 'Harvesting', 'Account'].map(cat => (
                        <button key={cat} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-all text-zinc-400 hover:text-zinc-200">
                            {cat}
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
                <div className="lg:col-span-9 space-y-4">
                    {faqs.map(faq => (
                        <motion.div layout key={faq.id} className="glass-panel p-6 border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="text-lg font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">{faq.question}</h4>
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">{faq.category}</span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">{faq.answer}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Updated {faq.lastUpdated}</span>
                                    <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
                                        <Heart size={12} fill="currentColor" /> Useful (24)
                                    </div>
                                </div>
                                <button className="text-zinc-500 hover:text-blue-400 transition-colors"><Settings size={16} /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'reports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                     <h3 className="text-2xl font-bold text-zinc-100 mb-1">Support Dashboard</h3>
                     <p className="text-xs text-zinc-500 tracking-tight">Performance metrics and issue trends.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-all">
                    <Download size={14} /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * 0.12} className="text-emerald-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">88%</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">CSAT</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-bold mb-1">Customer Satisfaction</h4>
                    <p className="text-xs text-zinc-500">Based on user feedback ratings</p>
                </div>

                <div className="md:col-span-2 glass-panel p-8">
                    <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" />
                        Resolution Time Trend
                    </h4>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {[40, 65, 30, 85, 45, 70, 55, 90, 60, 75, 50, 80].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }}
                                    className={`w-full rounded-t-lg transition-all ${h > 70 ? 'bg-red-500/50 group-hover:bg-red-500' : 'bg-blue-500/50 group-hover:bg-blue-500'}`} />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                    {h}h
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Apr 01</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Apr 18</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Issue Distribution</h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Payments', count: 42, color: 'bg-emerald-500' },
                            { label: 'IoT Devices', count: 28, color: 'bg-blue-500' },
                            { label: 'Harvesting', count: 18, color: 'bg-orange-500' },
                            { label: 'Others', count: 12, color: 'bg-zinc-500' },
                        ].map(item => (
                            <div key={item.label} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-zinc-200">{item.label}</span>
                                    <span className="text-zinc-500">{item.count}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${item.count}%` }} className={`h-full ${item.color}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-6">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Top Support Agents</h4>
                    <div className="space-y-4">
                        {[
                            { name: 'John Admin', solved: 156, rating: 4.8 },
                            { name: 'Sarah Tech', solved: 132, rating: 4.9 },
                            { name: 'Mike Support', solved: 98, rating: 4.5 },
                        ].map((agent, i) => (
                            <div key={agent.name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs">{i+1}</div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-100">{agent.name}</p>
                                        <p className="text-[10px] text-zinc-500">{agent.solved} Tickets Resolved</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                        <Heart size={10} fill="currentColor" /> {agent.rating}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
      )}

      {/* New Ticket Modal */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsNewTicketModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass-panel p-8 shadow-2xl border-emerald-500/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><Plus size={24} /></div>
                    <div>
                        <h2 className="text-2xl font-display font-bold">New Support Ticket</h2>
                        <p className="text-xs text-zinc-500 font-medium">Manually create a ticket for a user</p>
                    </div>
                </div>
                <button onClick={() => setIsNewTicketModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User ID</label>
                    <input type="text" placeholder="e.g. F-101" value={newTicket.userId}
                      onChange={e => setNewTicket({...newTicket, userId: e.target.value})} className="input-field w-full group-hover:border-emerald-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">User Category</label>
                    <select value={newTicket.userRole} onChange={e => setNewTicket({...newTicket, userRole: e.target.value as any})} className="input-field w-full bg-zinc-900">
                        <option value="FARMER">Farmer</option>
                        <option value="PROVIDER">Provider</option>
                        <option value="BUYER">Buyer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                      <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} className="input-field w-full bg-zinc-900 border-white/10">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Priority</label>
                      <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value as any})} className="input-field w-full bg-zinc-900 border-white/10">
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subject</label>
                  <input type="text" placeholder="Brief summary of the issue" value={newTicket.subject}
                    onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="input-field w-full" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Issue Description</label>
                  <textarea placeholder="Provide detailed information..." rows={4} value={newTicket.description}
                    onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="input-field w-full resize-none" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
                  <button onClick={() => setIsNewTicketModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-zinc-100 transition-colors">Cancel</button>
                  <button onClick={handleCreateTicket} disabled={!newTicket.subject || !newTicket.category}
                    className="btn-primary px-8">Create Ticket</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewCatModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsNewCatModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg glass-panel p-8 shadow-2xl border-white/10">
                    <h2 className="text-2xl font-bold mb-6">Add New Category</h2>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category Name</label>
                            <input type="text" placeholder="e.g. IoT Connectivity" className="input-field w-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Default Priority</label>
                                <select className="input-field w-full bg-zinc-900">
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assignee Role</label>
                                <select className="input-field w-full bg-zinc-900">
                                    <option value="SUPPORT">Support Team</option>
                                    <option value="TECH">Technical Squad</option>
                                    <option value="PROVIDER">Field Provider</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Response SLA (Hrs)</label>
                                <input type="number" defaultValue={2} className="input-field w-full" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resolution SLA (Hrs)</label>
                                <input type="number" defaultValue={24} className="input-field w-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-6">
                            <button onClick={() => setIsNewCatModalOpen(false)} className="text-sm font-bold text-zinc-500 hover:text-zinc-100 px-4">Cancel</button>
                            <button onClick={() => setIsNewCatModalOpen(false)} className="btn-primary">Save Category</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportTickets;
;
