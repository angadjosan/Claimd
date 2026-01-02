import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormContext } from '../context/FormContext';
import { stepSchemas } from '../schemas/formSchema';
import { useToast } from './Toast';
import { api } from '../services/api';

// Import Steps
import { Step1Personal } from './form/steps/Step1Personal';
import { Step2Marital } from './form/steps/Step2Marital';
import { Step3Children } from './form/steps/Step3Children';
import { Step4DirectDeposit } from './form/steps/Step4DirectDeposit';
import { Step5EmergencyContact } from './form/steps/Step5EmergencyContact';
import { Step6Employment } from './form/steps/Step6Employment';
import { Step7MilitaryEducation } from './form/steps/Step7MilitaryEducation';
import { Step8EarningsBenefits } from './form/steps/Step8EarningsBenefits';
import { Step9MedicalConditions } from './form/steps/Step9MedicalConditions';
import { Step10Healthcare } from './form/steps/Step10Healthcare';
import { Step11MedicalEvidence } from './form/steps/Step11MedicalEvidence';
import { Step12Documents } from './form/steps/Step12Documents';
import { Step13Review } from './form/steps/Step13Review';

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Marital Status' },
  { id: 3, title: 'Children' },
  { id: 4, title: 'Direct Deposit' },
  { id: 5, title: 'Emergency Contact' },
  { id: 6, title: 'Employment' },
  { id: 7, title: 'Military & Education' },
  { id: 8, title: 'Earnings & Benefits' },
  { id: 9, title: 'Medical Conditions' },
  { id: 10, title: 'Healthcare' },
  { id: 11, title: 'Medical Evidence' },
  { id: 12, title: 'Documents' },
  { id: 13, title: 'Review' },
];

export default function MultiStepForm() {
  const {
    formData,
    updateFormData,
    saveToLocalStorage,
    clearFormData,
    isLoaded,
    currentStep,
    setCurrentStep,
    markStepCompleted,
  } = useFormContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const nextStep = () => {
    const schema = stepSchemas[currentStep];
    if (schema) {
      const result = schema.safeParse(formData);
      if (!result.success) {
        const errorMessages = result.error.issues.map((e: any) => {
          // Format the error message to be more user friendly
          const field = e.path[e.path.length - 1];
          return `${field}: ${e.message}`;
        }).join('\n');
        showToast(`Please fix the following errors:\n${errorMessages}`, 'error');
        return;
      }
    }

    // Mark current step as completed and save
    markStepCompleted(currentStep);
    saveToLocalStorage();

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    // Save before going back
    saveToLocalStorage();
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    // Save before navigating
    saveToLocalStorage();
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Submit the application (creates and submits in one call)
      await api.submitApplication(formData);
      
      showToast('Application submitted successfully! You will receive a confirmation email shortly.', 'success');
      
      // Clear form data after successful submission
      clearFormData();
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Submission failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Submission failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Personal formData={formData} updateFormData={updateFormData} />;
      case 2: return <Step2Marital formData={formData} updateFormData={updateFormData} />;
      case 3: return <Step3Children formData={formData} updateFormData={updateFormData} />;
      case 4: return <Step4DirectDeposit formData={formData} updateFormData={updateFormData} />;
      case 5: return <Step5EmergencyContact formData={formData} updateFormData={updateFormData} />;
      case 6: return <Step6Employment formData={formData} updateFormData={updateFormData} />;
      case 7: return <Step7MilitaryEducation formData={formData} updateFormData={updateFormData} />;
      case 8: return <Step8EarningsBenefits formData={formData} updateFormData={updateFormData} />;
      case 9: return <Step9MedicalConditions formData={formData} updateFormData={updateFormData} />;
      case 10: return <Step10Healthcare formData={formData} updateFormData={updateFormData} />;
      case 11: return <Step11MedicalEvidence formData={formData} updateFormData={updateFormData} />;
      case 12: return <Step12Documents formData={formData} updateFormData={updateFormData} />;
      case 13: return <Step13Review formData={formData} goToStep={goToStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
      default: return null;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / STEPS.length) * 100)}% Completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 13 && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
