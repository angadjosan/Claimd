import React, { useState } from 'react';
import MinimalNavbar from '../../components/MinimalNavbar';
import MultiStepForm from '../../components/MultiStepForm';
import { DemoProvider, useDemoContext } from '../../context/DemoContext';
import { useFormContext } from '../../context/FormContext';
import { useToast } from '../../components/Toast';
import { demoApi } from '../../services/demoApi';
import { loadDemoData } from '../../utils/demoAutoFill';
import { Sparkles } from 'lucide-react';

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
 * Auto-fill Button Component
 */
const AutoFillButton: React.FC = () => {
  const { updateFormData } = useFormContext();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoFill = async () => {
    setIsLoading(true);
    try {
      const { formData } = await loadDemoData();
      
      // Update form data (files are already attached in the formData structure)
      updateFormData(formData as any);
      
      showToast('Demo data loaded successfully! ✨', 'success');
    } catch (error) {
      console.error('Auto-fill error:', error);
      showToast('Failed to load demo data. Please fill the form manually.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <button
        onClick={handleAutoFill}
        disabled={isLoading}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isLoading ? 'Loading...' : '✨ Auto-fill with Sample Data'}</span>
      </button>
    </div>
  );
};

/**
 * Email Collection Component
 */
const EmailCollectionForm: React.FC<{ onEmailSubmitted: () => void }> = ({ onEmailSubmitted }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getDemoHeaders } = useDemoContext();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await demoApi.saveEmail(email, getDemoHeaders);
      // Store in localStorage to remember for this session
      localStorage.setItem('demo_email_collected', 'true');
      localStorage.setItem('demo_email', email);
      showToast('Email saved successfully!', 'success');
      onEmailSubmitted();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save email';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Try the Demo
          </h1>
          <p className="text-gray-600">
            Enter your email to get started with the demo
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
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Continue to Demo'}
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * Demo Form Wrapper Component (uses demo context)
 */
const DemoFormContent: React.FC = () => {
  const { demoSessionId, getDemoHeaders } = useDemoContext();
  const [emailCollected, setEmailCollected] = useState(() => {
    // Check if email was already collected in this session
    return localStorage.getItem('demo_email_collected') === 'true';
  });

  // Custom submit handler for demo mode
  const handleDemoSubmit = async (formData: any) => {
    if (!demoSessionId) {
      throw new Error('Demo session not initialized. Please refresh the page.');
    }
    return await demoApi.submitApplication(formData, getDemoHeaders);
  };

  // Show email collection form first if email hasn't been collected
  if (!emailCollected) {
    return <EmailCollectionForm onEmailSubmitted={() => setEmailCollected(true)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <MinimalNavbar />
      <DemoBanner />
      <main className="py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <AutoFillButton />
          <MultiStepForm 
            onSubmit={handleDemoSubmit}
            onSuccessNavigate="/demo/dashboard"
            successMessage="Application submitted successfully! Your application is being processed."
          />
        </div>
      </main>
    </div>
  );
};

/**
 * Demo Form Page (wraps with DemoProvider)
 */
const DemoForm: React.FC = () => {
  return (
    <DemoProvider>
      <DemoFormContent />
    </DemoProvider>
  );
};

export default DemoForm;
