import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Demo Form Wrapper Component (uses demo context)
 */
const DemoFormContent: React.FC = () => {
  const { demoSessionId, getDemoHeaders } = useDemoContext();

  // Custom submit handler for demo mode
  const handleDemoSubmit = async (formData: any) => {
    if (!demoSessionId) {
      throw new Error('Demo session not initialized. Please refresh the page.');
    }
    return await demoApi.submitApplication(formData, getDemoHeaders);
  };

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
