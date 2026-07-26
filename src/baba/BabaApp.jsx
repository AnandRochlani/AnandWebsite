import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BabaAuthProvider, useBabaAuth } from '@/baba/BabaAuthContext';
import { ToastProvider } from '@/baba/components/ui';
import { Layout } from '@/baba/components/Layout';

const Login = lazy(() => import('@/baba/pages/Login'));
const Dashboard = lazy(() => import('@/baba/pages/Dashboard'));
const Customers = lazy(() => import('@/baba/pages/Customers'));
const Measurements = lazy(() => import('@/baba/pages/Measurements'));
const Quotations = lazy(() => import('@/baba/pages/Quotations'));
const Stock = lazy(() => import('@/baba/pages/Stock'));
const Orders = lazy(() => import('@/baba/pages/Orders'));
const Billing = lazy(() => import('@/baba/pages/Billing'));
const Reports = lazy(() => import('@/baba/pages/Reports'));

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
  </div>
);

// Layout route: guards auth, renders the app chrome, and hosts child routes.
function ProtectedLayout() {
  const { isAuthenticated, loading } = useBabaAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/baba/login" state={{ from: location }} replace />;
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

export default function BabaApp() {
  return (
    <BabaAuthProvider>
      <ToastProvider>
        <Suspense fallback={<Loading />}>
          {/* Paths are relative to the /baba/* mount in App.jsx */}
          <Routes>
            <Route path="login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="measurements" element={<Measurements />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="stock" element={<Stock />} />
              <Route path="orders" element={<Orders />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/baba" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </BabaAuthProvider>
  );
}
