import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Landmark,
  BarChart3,
  Settings,
  MessageSquareWarning
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Inventory', icon: Package, path: '/inventory' },
  { name: 'Shop In', icon: ArrowLeftRight, path: '/shop-in' },
  { name: 'Shop Out', icon: ShoppingCart, path: '/shop-out' },
  { name: 'Suppliers', icon: Users, path: '/suppliers' },
  { name: 'Complaints', icon: MessageSquareWarning, path: '/complaints' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

  return (
    <div
      className={`h-screen bg-slate-950 text-slate-400 flex flex-col justify-between border-r border-slate-800/50 transition-all duration-300 ease-in-out select-none relative z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800/40 min-h-[70px]">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/20">
                E
              </div>
              <span className="font-bold text-sm tracking-wider text-white uppercase">
                Elec ERP
              </span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-all active:scale-95 ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 mt-4 overflow-y-auto max-h-[calc(100vh-160px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.name} className="relative group flex items-center">
                <Link
                  to={item.path}
                  className={`w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                      : 'hover:bg-slate-900/60 hover:text-slate-200'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>

                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap border border-slate-800 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800/40">
        <div className="relative group flex items-center">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-4 py-3 px-3.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />

            {!isCollapsed && <span>Logout Account</span>}
          </button>

          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-red-950 text-red-200 text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible translate-x-2 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap border border-red-900/50 pointer-events-none">
              Logout Account
            </div>
          )}
        </div>
      </div>
    </div>
  );
}