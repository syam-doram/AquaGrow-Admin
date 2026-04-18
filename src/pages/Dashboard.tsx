import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Search, 
  Globe, 
  Sparkles,
  Waves,
  Bell,
  Megaphone,
  Building2,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { getChatbotResponse, getMarketInsights } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const marketData = [
  { crop: 'Shrimp (Count 30)', price: 485.00, change: 4.2, trend: 'up' },
  { crop: 'Shrimp (Count 40)', price: 450.00, change: 1.5, trend: 'up' },
  { crop: 'Shrimp (Count 60)', price: 380.00, change: -0.5, trend: 'down' },
  { crop: 'Shrimp (Count 80)', price: 320.00, change: 0.0, trend: 'stable' },
];

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const Dashboard = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm AquaGrow AI. How can I assist you with your AgTech operations today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [marketQuery, setMarketQuery] = useState('');
  const [marketInsight, setMarketInsight] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    const response = await getChatbotResponse(userMsg);
    setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsTyping(false);
  };

  const handleMarketSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketQuery.trim()) return;

    setIsSearching(true);
    const result = await getMarketInsights(marketQuery);
    setMarketInsight(result);
    setIsSearching(false);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">The Radiant Harvest</h1>
          <p className="text-zinc-400 max-w-2xl">Welcome back, Syam. Your agricultural ecosystem is performing with <span className="text-emerald-400 font-medium">Illuminated Precision</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Clock size={18} />
            History
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => window.location.href='/support'}>
            <AlertTriangle size={18} />
            File Complaint
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Sparkles size={18} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -4 }} className="data-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <DollarSign size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg text-emerald-400 bg-emerald-400/10">
              <ArrowUpRight size={14} />
              +12.5%
            </div>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Total Revenue</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">$542,830</h3>
          <p className="text-[10px] text-zinc-500 mt-2">Profit: <span className="text-emerald-400">₹20/kg avg</span></p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="data-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-radiant-sun/10 text-radiant-sun group-hover:bg-radiant-sun group-hover:text-white transition-all duration-300">
              <Waves size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg text-radiant-sun bg-radiant-sun/10">
              4 Alerts
            </div>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Total Production</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">85,420 kg</h3>
          <p className="text-[10px] text-zinc-500 mt-2">Stocking: <span className="text-radiant-sun">12 Ponds Active</span></p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="data-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <Megaphone size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg text-blue-400 bg-blue-400/10">
              <ArrowUpRight size={14} />
              +8%
            </div>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Marketing Reach</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">12.4K</h3>
          <p className="text-[10px] text-zinc-500 mt-2">Active: <span className="text-blue-400">4 Campaigns</span></p>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="data-card group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-radiant-sun/10 text-radiant-sun group-hover:bg-radiant-sun group-hover:text-white transition-all duration-300">
              <Building2 size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg text-radiant-sun bg-radiant-sun/10">
              High
            </div>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Buyer Demand</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">42.5T</h3>
          <p className="text-[10px] text-zinc-500 mt-2">Active Buyers: <span className="text-radiant-sun">24 Companies</span></p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-display font-bold">Growth Intelligence</h3>
                <p className="text-sm text-zinc-400">Monthly production volume and revenue growth</p>
              </div>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none">
                <option>Last 7 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderColor: '#ffffff10', 
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market & Alerts Console */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold flex items-center gap-2">
                  <Globe size={20} className="text-emerald-400" />
                  Market Console
                </h3>
                <button className="text-xs text-emerald-400 hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {marketData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs">
                        {item.crop.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{item.crop}</p>
                        <p className="text-xs text-zinc-500">Global Index</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${item.price.toFixed(2)}</p>
                      <p className={cn(
                        "text-xs font-medium",
                        item.trend === 'up' ? "text-emerald-400" : item.trend === 'down' ? "text-red-400" : "text-zinc-400"
                      )}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold flex items-center gap-2">
                  <AlertTriangle size={20} className="text-radiant-sun" />
                  Operational Alerts
                </h3>
                <span className="bg-radiant-sun/10 text-radiant-sun text-[10px] uppercase font-bold px-2 py-0.5 rounded">3 New</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Disease Outbreak Alert</p>
                    <p className="text-xs text-zinc-500 mt-1">White Spot Syndrome detected in Zone A ponds.</p>
                    <p className="text-[10px] text-zinc-600 mt-2">2 mins ago • Region: Coastal Valley</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-radiant-sun/5 border border-radiant-sun/10">
                  <Waves size={18} className="text-radiant-sun shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Water Quality Warning</p>
                    <p className="text-xs text-zinc-500 mt-1">Low dissolved oxygen levels in 3 ponds at Green Valley.</p>
                    <p className="text-[10px] text-zinc-600 mt-2">45 mins ago • Region: Central Plains</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <ShoppingBag size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Harvest Ready Alert</p>
                    <p className="text-xs text-zinc-500 mt-1">Farmer John Doe's Pond #4 is ready for harvest.</p>
                    <p className="text-[10px] text-zinc-600 mt-2">1 day ago • Region: Zone A</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-8">
          {/* Chatbot Widget */}
          <div className="glass-panel flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-emerald-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg emerald-gradient flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">AquaGrow AI</h4>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Online & Ready
                  </p>
                </div>
              </div>
              <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm",
                    msg.role === 'user' ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white/5 border border-white/10 rounded-tl-none"
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {msg.role === 'user' ? 'You' : 'AquaGrow AI'} • Just now
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5 bg-zinc-900/50">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AquaGrow AI..." 
                  className="flex-1 bg-transparent border-none outline-none text-sm px-3"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>

          {/* Market Search Widget */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="font-display font-bold flex items-center gap-2">
              <Search size={18} className="text-emerald-400" />
              Market Intelligence
            </h4>
            <p className="text-xs text-zinc-400">Search real-time global agricultural data and trends.</p>
            
            <form onSubmit={handleMarketSearch} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  value={marketQuery}
                  onChange={(e) => setMarketQuery(e.target.value)}
                  placeholder="e.g. Wheat prices in India..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={!marketQuery.trim() || isSearching}
                className="w-full btn-secondary text-sm flex items-center justify-center gap-2 py-2"
              >
                <Globe size={16} />
                Search Grounding
              </button>
            </form>

            <AnimatePresence>
              {marketInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3"
                >
                  <div className="text-xs text-zinc-300 leading-relaxed">
                    <ReactMarkdown>{marketInsight.text}</ReactMarkdown>
                  </div>
                  {marketInsight.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {marketInsight.sources.map((chunk: any, i: number) => (
                          chunk.web && (
                            <a 
                              key={i} 
                              href={chunk.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Globe size={10} />
                              {chunk.web.title || 'Source'}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
