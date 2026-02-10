import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MinimalNavbar from '../../components/MinimalNavbar';
import { config } from '../../config/env';
import { useToast } from '../../components/Toast';

/**
 * Demo Banner Component
 */
const DemoBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-yellow-800">
        <span className="font-semibold">✨ Demo Mode</span>
        <span>•</span>
        <span>This is a demonstration. No real data will be submitted.</span>
      </div>
    </div>
  );
};

/**
 * Demo Page - Collects email and redirects to hardcoded application
 */
export default function Demo() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Hardcoded demo application ID (will be provided by user)
  const DEMO_APPLICATION_ID = import.meta.env.VITE_DEMO_APPLICATION_ID || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save email
      const response = await fetch(`${config.apiUrl}/api/demo/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save email');
      }

      // Redirect to hardcoded application
      if (DEMO_APPLICATION_ID) {
        navigate(`/demo/applications/${DEMO_APPLICATION_ID}`);
      } else {
        showToast('Demo application ID not configured', 'error');
        setError('Demo application ID not configured. Please contact support.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalNavbar />
      <DemoBanner />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Try Claimd Demo
              </h1>
              <p className="text-gray-600">
                Enter your email to explore our caseworker dashboard with a sample SSDI application.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Start Demo'}
              </button>
            </form>

            <p className="mt-6 text-xs text-gray-500 text-center">
              By continuing, you agree to our demo terms. Your email will only be used for demo purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
