import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/auth';
import MinimalNavbar from '../../components/MinimalNavbar';

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/apply';
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  useEffect(() => {
    // Check if already logged in and has correct role
    authService.getSession().then(async (session) => {
      if (session) {
        const role = await authService.getUserRole();
        if (role === 'applicant') {
          navigate(redirectTo);
        } else if (role) {
          // User has wrong role, sign them out
          await supabase.auth.signOut();
          setError('Access denied. This account is not authorized for applicant access.');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const role = await authService.getUserRole();
        if (role === 'applicant') {
          navigate(redirectTo);
        } else if (role) {
          // User has wrong role, sign them out
          await supabase.auth.signOut();
          setError('Access denied. This account is not authorized for applicant access.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        
        // Check user role after login
        const role = await authService.getUserRole();
        if (role !== 'applicant') {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account is not authorized for applicant access.');
        }
        
        navigate(redirectTo);
      } else if (mode === 'sign_up') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        // Parse full name into first and last name
        const nameParts = formData.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/apply`,
            data: {
              full_name: formData.fullName,
              first_name: firstName,
              last_name: lastName,
            },
          },
        });
        if (error) throw error;
        
        // Check if user is immediately confirmed (email confirmations disabled)
        if (data.user && data.session) {
          // User is immediately signed in, check role and redirect
          const role = await authService.getUserRole();
          if (role === 'applicant') {
            navigate(redirectTo);
          } else {
            setSuccess('Account created successfully! Please sign in.');
          }
        } else {
          setSuccess('Check your email for the confirmation link!');
        }
      } else if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/apply`,
        });
        if (error) throw error;
        setSuccess('Check your email for the password reset link!');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  const getTitle = () => {
    switch (mode) {
      case 'sign_in': return 'Welcome Back';
      case 'sign_up': return 'Create Account';
      case 'forgot_password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'sign_in': return 'Sign in to continue your application';
      case 'sign_up': return 'Get started with your benefits application';
      case 'forgot_password': return "We'll send you a reset link";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-600">
              {getSubtitle()}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name - Sign Up Only */}
                {mode === 'sign_up' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password - Not for Forgot Password */}
                {mode !== 'forgot_password' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password - Sign Up Only */}
                {mode === 'sign_up' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* Forgot Password Link */}
                {mode === 'sign_in' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'sign_in' && 'Sign In'}
                      {mode === 'sign_up' && 'Create Account'}
                      {mode === 'forgot_password' && 'Send Reset Link'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              {mode === 'sign_in' && (
                <p className="text-sm text-center text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('sign_up')}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'sign_up' && (
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('sign_in')}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'forgot_password' && (
                <p className="text-sm text-center text-gray-600">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('sign_in')}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
