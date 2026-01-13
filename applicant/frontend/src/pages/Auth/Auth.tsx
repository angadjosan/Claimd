import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/auth';
import MinimalNavbar from '../../components/MinimalNavbar';

type AuthMode = 'sign_in' | 'forgot_password';

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
  });

  useEffect(() => {
    authService.getSession().then(async (session) => {
      if (session) {
        const role = await authService.getUserRole();
        if (role === 'applicant') {
          navigate(redirectTo);
        } else if (role) {
          await supabase.auth.signOut();
          setError('Access denied. This account is not authorized for applicant access.');
        }
      }
    });

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const role = await authService.getUserRole();
        if (role === 'applicant') {
          navigate(redirectTo);
        } else if (role) {
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

        const role = await authService.getUserRole();
        if (role !== 'applicant') {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account is not authorized for applicant access.');
        }

        navigate(redirectTo);
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
      case 'forgot_password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'sign_in': return 'Continue your disability benefits application';
      case 'forgot_password': return "We'll send you a reset link to your email";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MinimalNavbar />

      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Form Section */}
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              {/* Header */}
              <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  {getTitle()}
                </h1>
                <p className="text-lg text-foreground/60">
                  {getSubtitle()}
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-card border border-border rounded-2xl p-8">
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                    <p className="text-sm text-success">{success}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  {mode !== 'forgot_password' && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
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
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'sign_in' && 'Sign In'}
                        {mode === 'forgot_password' && 'Send Reset Link'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back Link */}
                {mode === 'forgot_password' && (
                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => switchMode('sign_in')}
                      className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Image/Graphic Section */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full max-w-md">
                {/* Gradient Illustration */}
                <div className="relative h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      Secure & Fast
                    </h3>
                    <p className="text-foreground/60 leading-relaxed">
                      Your application is processed with enterprise-grade security and AI-powered speed.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-foreground/70">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Encrypted end-to-end</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground/70">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span>AI-powered processing</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground/70">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>Results in under 48 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
