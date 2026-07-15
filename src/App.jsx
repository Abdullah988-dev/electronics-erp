import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LedgerProvider } from './context/LedgerContext';

import CollapsibleSidebar from './components/Layout/CollapsibleSidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ShopIn from './pages/ShopIn';
import ShopOut from './pages/ShopOut';
import Suppliers from './pages/Suppliers';
import Complaints from './pages/Complaints';

function ProtectedLayout({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-50 overflow-hidden">
      <CollapsibleSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
        <Route path="/shop-in" element={<ProtectedLayout><ShopIn /></ProtectedLayout>} />
        <Route path="/shop-out" element={<ProtectedLayout><ShopOut /></ProtectedLayout>} />
        <Route path="/suppliers" element={<ProtectedLayout><Suppliers /></ProtectedLayout>} />
        <Route path="/complaints" element={<ProtectedLayout><Complaints /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LedgerProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </LedgerProvider>
    </AuthProvider>
  );
}