import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  // Only redirect if not authenticated and not already on login page
  // This prevents redirect loops and multiple redirects
  // Check location.pathname to avoid redirecting if already on login page
  if (!isAuthenticated && location.pathname !== '/admin/login') {
    // Use replace to avoid adding to history stack (reduces redirect overhead)
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If not authenticated but already on login page, don't render children
  // This prevents ProtectedRoute from rendering anything on login page
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated, render children
  return children;
};

export default ProtectedRoute;
