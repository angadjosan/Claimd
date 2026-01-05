import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import type { ReactElement } from 'react';
import type { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [hasCorrectRole, setHasCorrectRole] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    // Check initial session and role
    const checkAuth = async () => {
      const currentSession = await authService.getSession();
      if (!isMounted) return;

      if (!currentSession) {
        setSession(null);
        setHasCorrectRole(false);
        setIsLoading(false);
        return;
      }

      setSession(currentSession);
      
      // Check role
      const role = await authService.getUserRole();
      if (!isMounted) return;

      if (role === 'applicant') {
        setHasCorrectRole(true);
      } else {
        setHasCorrectRole(false);
        // Sign out user with wrong role
        await authService.logout().catch(() => {});
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      if (!newSession) {
        setSession(null);
        setHasCorrectRole(false);
        setIsLoading(false);
        return;
      }

      setSession(newSession);
      
      // Check role
      const role = await authService.getUserRole();
      if (!isMounted) return;

      if (role === 'applicant') {
        setHasCorrectRole(true);
      } else {
        setHasCorrectRole(false);
        // Sign out user with wrong role
        await authService.logout().catch(() => {});
      }
      
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

  if (!session || hasCorrectRole === false) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  return children;
}
