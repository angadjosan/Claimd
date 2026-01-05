import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import ProtectedRoute from './ProtectedRoute';
import { lazy } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));

/**
 * This component ensures Supabase is initialized by calling getSession()
 * before rendering ProtectedRoute. This fixes the issue where direct navigation
 * to protected routes hangs because Supabase isn't initialized yet.
 */
export default function InitAndRedirect() {
  const [isInitializing, setIsInitializing] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Initialize Supabase by calling getSession()
    // This restores the session from localStorage and makes Supabase ready
    authService.getSession().finally(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600 font-light">Loading...</span>
        </div>
      </div>
    );
  }

  // Now that Supabase is initialized, render the protected route
  // Determine which component to render based on the path
  if (location.pathname === '/dashboard') {
    return (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );
  }

  // Fallback: redirect to root
  return <Navigate to="/" replace />;
}

