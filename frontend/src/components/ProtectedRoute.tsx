import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';
import type { ReactElement } from 'react';

interface ProtectedRouteProps {
  children: ReactElement;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userInfo = await authService.verifyToken();
      
      if (userInfo) {
        setIsAuthenticated(true);
        setIsAdmin(userInfo.is_admin);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-gray-600 font-light">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated at all - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but trying to access admin route without admin privileges
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated and authorized - render the protected component
  return children;
}
