import React from 'react';
import type { FormData } from '../../../types/form';
import { Edit2 } from 'lucide-react';

interface StepProps {
  formData: FormData;
  goToStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const Step13Review: React.FC<StepProps> = ({ formData, goToStep, onSubmit, isSubmitting }) => {
  const sections = [
    { id: 1, title: 'Personal Information', summary: `${formData.birthdate}, ${formData.birthplace}` },
    { id: 2, title: 'Marital Status', summary: `${formData.spouses.length} spouse(s) listed` },
    { id: 3, title: 'Children', summary: `${formData.children.length} child(ren) listed` },
    { id: 4, title: 'Direct Deposit', summary: `Type: ${formData.direct_deposit.type}` },
    { id: 5, title: 'Emergency Contact', summary: formData.contact_who_knows_your_condition.contact_name },
    { id: 6, title: 'Employment History', summary: `${formData.non_self_employment.length} job(s), ${formData.self_employment.length} self-employment record(s)` },
    { id: 7, title: 'Military & Education', summary: `Military: ${formData.served_in_us_military ? 'Yes' : 'No'}, Education: ${formData.education.length} record(s)` },
    { id: 8, title: 'Earnings & Benefits', summary: `${formData.earnings_history.length} earnings record(s), ${formData.disability_benefits.length} benefit(s)` },
    { id: 9, title: 'Medical Conditions', summary: `${formData.conditions.length} condition(s) listed` },
    { id: 10, title: 'Healthcare Providers', summary: `${formData.healthcare_providers.length} provider(s), ${formData.medications.length} medication(s)` },
    { id: 11, title: 'Medical Evidence', summary: `${formData.evidence_documents.length} document(s) uploaded` },
    { id: 12, title: 'Document Uploads', summary: 'Required documents uploaded' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
      <p className="text-sm text-gray-500">Please review your information before submitting.</p>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{section.title}</h3>
              <p className="text-xs text-gray-500">{section.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => goToStep(section.id)}
              className="text-blue-600 hover:text-blue-800 p-2"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-start mb-6">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="font-medium text-gray-700">
              I certify that the information provided is true and correct.
            </label>
            <p className="text-gray-500">
              I understand that providing false information may result in penalties.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
};
