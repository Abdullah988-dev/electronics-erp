import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Search, Bell, Sun, Moon, Package, Boxes, Wallet, TrendingUp,
  TrendingDown, ShoppingCart, ArrowDownCircle, Receipt, AlertTriangle,
  Ban, Users, Truck, Plus, ArrowRight, Sparkles, DollarSign
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function getLastSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('default', { month: 'short' }) });
  }
  return months;
}

export default function Dashboard() {
  const { state } = useLedger();
  const { admin } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const now = new Date();

  // ---------- Core Derived Metrics ----------
  const metrics = useMemo(() => {
    const totalProducts = state.inventory.length;
    const availableStock = state.inventory.reduce((s, i) => s + i.qty, 0);
    const inventoryValue = state.inventory.reduce((s, i) => s + i.qty * (i.purchasePrice || 0), 0);
    const lowStockCount = state.inventory.filter((i) => i.qty > 0 && i.qty <= 5).length;
    const outOfStockCount = state.inventory.filter((i) => i.qty === 0).length;

    const todayStr = now.toDateString();
    const todaysSales = state.shopOutRecords
      .filter((r) => new Date(r.date).toDateString() === todayStr)
      .reduce((s, r) => s + r.totalBill, 0);

    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthlySales = state.shopOutRecords
      .filter((r) => { const d = new Date(r.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s, r) => s + r.totalBill, 0);
    const monthlyPurchase = state.shopInRecords
      .filter((r) => { const d = new Date(r.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s, r) => s + r.totalBill, 0);

    const profit = monthlySales - monthlyPurchase;

    const pendingReceivables = state.customers.reduce((s, c) => s + (c.totalDue || 0), 0);
    const pendingPayables = state.suppliers.reduce((s, s2) => s + (s2.totalPayable || 0), 0);

    const cashIn = state.shopOutRecords.reduce((s, r) => s + (r.paid || 0), 0);
    const cashOut = state.shopInRecords.reduce((s, r) => s + (r.paid || 0), 0);
    const cashBalance = cashIn - cashOut;

    return {
      totalProducts, availableStock, inventoryValue, lowStockCount, outOfStockCount,
      todaysSales, monthlySales, monthlyPurchase, profit,
      pendingReceivables, pendingPayables, cashBalance,
    };
  }, [state]);

  // ---------- Monthly chart data (last 6 months) ----------
  const monthlyChartData = useMemo(() => {
    const months = getLastSixMonths();
    return months.map(({ key, label }) => {
      const [y, m] = key.split('-').map(Number);
      const sales = state.shopOutRecords
        .filter((r) => { const d = new Date(r.date); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, r) => s + r.totalBill, 0);
      const purchase = state.shopInRecords
        .filter((r) => { const d = new Date(r.date); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, r) => s + r.totalBill, 0);
      const qtyIn = state.shopInRecords
        .filter((r) => { const d = new Date(r.date); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, r) => s + (r.items?.reduce((a, i) => a + i.qty, 0) || 0), 0);
      const qtyOut = state.shopOutRecords
        .filter((r) => { const d = new Date(r.date); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, r) => s + (r.items?.reduce((a, i) => a + i.qty, 0) || 0), 0);
      return { month: label, sales, purchase, profit: sales - purchase, qtyIn, qtyOut };
    });
  }, [state.shopInRecords, state.shopOutRecords]);

  // ---------- Category distribution ----------
  const categoryData = useMemo(() => {
    const map = {};
    state.inventory.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [state.inventory]);

  const categoryValueData = useMemo(() => {
    const map = {};
    state.inventory.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + i.qty * (i.purchasePrice || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [state.inventory]);

  // ---------- Business Insights ----------
  const insights = useMemo(() => {
    const list = [];
    const prevMonthData = monthlyChartData[monthlyChartData.length - 2];
    const currMonthData = monthlyChartData[monthlyChartData.length - 1];

    if (prevMonthData && prevMonthData.sales > 0) {
      const change = ((currMonthData.sales - prevMonthData.sales) / prevMonthData.sales) * 100;
      list.push({
        icon: change >= 0 ? TrendingUp : TrendingDown,
        text: `Sales ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(0)}% compared to last month`,
        positive: change >= 0,
      });
    }

    if (metrics.lowStockCount > 0) {
      list.push({ icon: AlertTriangle, text: `${metrics.lowStockCount} product(s) are running low on stock`, positive: false });
    }

    if (categoryData.length > 0) {
      const top = [...categoryData].sort((a, b) => b.value - a.value)[0];
      list.push({ icon: Sparkles, text: `"${top.name}" is your top product category (${top.value} items)`, positive: true });
    }

    if (metrics.pendingPayables > 0) {
      list.push({ icon: Truck, text: `PKR ${metrics.pendingPayables.toLocaleString()} pending in supplier payments`, positive: false });
    }

    list.push({
      icon: metrics.profit >= 0 ? TrendingUp : TrendingDown,
      text: `Monthly profit is currently PKR ${metrics.profit.toLocaleString()} (estimated)`,
      positive: metrics.profit >= 0,
    });

    return list;
  }, [monthlyChartData, metrics, categoryData]);

  const recentShopIn = [...state.shopInRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentShopOut = [...state.shopOutRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentTransactions = [...state.shopInRecords.map(r => ({ ...r, type: 'in' })), ...state.shopOutRecords.map(r => ({ ...r, type: 'out' }))]
    .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const lowStockItems = state.inventory.filter((i) => i.qty <= 5).sort((a, b) => a.qty - b.qty).slice(0, 6);
  const topSuppliers = [...state.suppliers].sort((a, b) => (b.totalPayable || 0) - (a.totalPayable || 0)).slice(0, 5);
  const topCustomers = [...state.customers].sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0)).slice(0, 5);

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
  };

  const kpiCards = [
    { label: 'Total Products', value: metrics.totalProducts.toLocaleString(), icon: Package, color: 'bg-indigo-500' },
    { label: 'Available Stock', value: metrics.availableStock.toLocaleString(), icon: Boxes, color: 'bg-emerald-500' },
    { label: 'Inventory Value', value: `PKR ${metrics.inventoryValue.toLocaleString()}`, icon: Wallet, color: 'bg-cyan-500' },
    { label: "Today's Sales", value: `PKR ${metrics.todaysSales.toLocaleString()}`, icon: DollarSign, color: 'bg-violet-500' },
    { label: 'Monthly Sales', value: `PKR ${metrics.monthlySales.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-500' },
    { label: 'Monthly Purchase', value: `PKR ${metrics.monthlyPurchase.toLocaleString()}`, icon: ArrowDownCircle, color: 'bg-orange-500' },
    { label: 'Profit (Est.)', value: `PKR ${metrics.profit.toLocaleString()}`, icon: metrics.profit >= 0 ? TrendingUp : TrendingDown, color: metrics.profit >= 0 ? 'bg-emerald-600' : 'bg-rose-600' },
    { label: 'Expenses', value: 'Not tracked', icon: Receipt, color: 'bg-slate-400', muted: true },
    { label: 'Pending Receivables', value: `PKR ${metrics.pendingReceivables.toLocaleString()}`, icon: Users, color: 'bg-rose-500' },
    { label: 'Cash Balance (Est.)', value: `PKR ${metrics.cashBalance.toLocaleString()}`, icon: Wallet, color: 'bg-teal-500' },
    { label: 'Low Stock', value: `${metrics.lowStockCount} items`, icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'Out of Stock', value: `${metrics.outOfStockCount} items`, icon: Ban, color: 'bg-slate-700' },
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>

      {/* ---------- Top Header ---------- */}
      <div className={`sticky top-0 z-10 backdrop-blur-md border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
        <div>
          <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {greeting}, {admin?.email?.split('@')[0] || 'Admin'} 👋
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
            Electronics ERP · {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {now.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-4 py-2 rounded-xl text-sm border outline-none focus:ring-4 focus:ring-indigo-100 w-56 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
            />
          </div>
          <button className={`p-2.5 rounded-xl border relative ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-xl border ${isDark ? 'border-slate-800 text-amber-400 hover:bg-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
            {admin?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ---------- KPI Cards ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${card.muted ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{card.label}</span>
                    <h3 className={`text-lg font-bold mt-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{card.value}</h3>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.color} text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ---------- Charts Row 1 ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className={`xl:col-span-2 rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Monthly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Product Categories</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- Charts Row 2 ---------- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Purchase vs Sales</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="purchase" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Purchase" />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Profit Trend (Est.)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <Tooltip />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b98133" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Stock Movement (Qty)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#64748b' : '#94a3b8'} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="qtyIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Stock In" />
                <Bar dataKey="qtyOut" fill="#ef4444" radius={[4, 4, 0, 0]} name="Stock Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- Quick Actions ---------- */}
        <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Add Incoming', to: '/shop-in', icon: ArrowDownCircle, color: 'bg-emerald-500' },
              { label: 'Record Outgoing', to: '/shop-out', icon: ShoppingCart, color: 'bg-rose-500' },
              { label: 'Add Product', to: '/inventory', icon: Plus, color: 'bg-indigo-500' },
              { label: 'New Complaint', to: '/complaints', icon: Receipt, color: 'bg-amber-500' },
              { label: 'View Suppliers', to: '/suppliers', icon: Truck, color: 'bg-cyan-500' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white ${action.color} hover:opacity-90 transition-all active:scale-95`}
                >
                  <Icon className="w-4 h-4" /> {action.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ---------- Business Insights ---------- */}
        <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Sparkles className="w-4 h-4 text-indigo-500" /> Business Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className={`p-2 rounded-lg ${insight.positive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{insight.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- Recent Activity Sections ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Shop In</h3>
              <Link to="/shop-in" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-3">
              {recentShopIn.length > 0 ? recentShopIn.map((r) => {
                const item = state.inventory.find((i) => i.id === r.items?.[0]?.inventoryId);
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item?.name || 'Product'}</span>
                    <span className="font-mono font-semibold text-emerald-600">PKR {r.totalBill.toLocaleString()}</span>
                  </div>
                );
              }) : <p className="text-xs text-slate-400 text-center py-4">No records yet</p>}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Shop Out</h3>
              <Link to="/shop-out" className="text-xs text-indigo-500 font-semibold flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-3">
              {recentShopOut.length > 0 ? recentShopOut.map((r) => {
                const item = state.inventory.find((i) => i.id === r.items?.[0]?.inventoryId);
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item?.name || 'Product'}</span>
                    <span className="font-mono font-semibold text-rose-500">PKR {r.totalBill.toLocaleString()}</span>
                  </div>
                );
              }) : <p className="text-xs text-slate-400 text-center py-4">No records yet</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Low Stock Alerts */}
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
            </h3>
            <div className="space-y-2.5">
              {lowStockItems.length > 0 ? lowStockItems.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{i.name}</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${i.qty === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{i.qty}</span>
                </div>
              )) : <p className="text-xs text-slate-400 text-center py-4">Stock levels are healthy</p>}
            </div>
          </div>

          {/* Supplier Overview */}
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Truck className="w-4 h-4 text-indigo-500" /> Supplier Overview
            </h3>
            <div className="space-y-2.5">
              {topSuppliers.length > 0 ? topSuppliers.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{s.name}</span>
                  <span className="font-mono font-semibold text-slate-500">PKR {(s.totalPayable || 0).toLocaleString()}</span>
                </div>
              )) : <p className="text-xs text-slate-400 text-center py-4">No suppliers yet</p>}
            </div>
          </div>

          {/* Customer Overview */}
          <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Users className="w-4 h-4 text-rose-500" /> Customer Overview
            </h3>
            <div className="space-y-2.5">
              {topCustomers.length > 0 ? topCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{c.name}</span>
                  <span className="font-mono font-semibold text-slate-500">PKR {(c.totalDue || 0).toLocaleString()}</span>
                </div>
              )) : <p className="text-xs text-slate-400 text-center py-4">No customers yet</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}