import React from 'react';
import type { FormData, HealthcareProvider, MedicalTest, Medication } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { SelectField } from '../SelectField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step10Healthcare: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Healthcare Providers Handlers
  const addProvider = () => {
    const newProvider: HealthcareProvider = {
      name: '',
      address: '',
      phone_number: '',
      patient_id_number: '',
      dates_of_exams_and_treatments: ''
    };
    updateFormData({ healthcare_providers: [...formData.healthcare_providers, newProvider] });
  };

  const removeProvider = (index: number) => {
    const newProviders = [...formData.healthcare_providers];
    newProviders.splice(index, 1);
    updateFormData({ healthcare_providers: newProviders });
  };

  const updateProvider = (index: number, field: keyof HealthcareProvider, value: string) => {
    const newProviders = [...formData.healthcare_providers];
    newProviders[index] = { ...newProviders[index], [field]: value };
    updateFormData({ healthcare_providers: newProviders });
  };

  // Tests Handlers
  const addTest = () => {
    const newTest: MedicalTest = {
      test_name: '',
      test_date: '',
      ordered_by: '',
      results_summary: ''
    };
    updateFormData({ tests: [...formData.tests, newTest] });
  };

  const removeTest = (index: number) => {
    const newTests = [...formData.tests];
    newTests.splice(index, 1);
    updateFormData({ tests: newTests });
  };

  const updateTest = (index: number, field: keyof MedicalTest, value: string) => {
    const newTests = [...formData.tests];
    newTests[index] = { ...newTests[index], [field]: value };
    updateFormData({ tests: newTests });
  };

  // Medications Handlers
  const addMedication = () => {
    const newMed: Medication = {
      medication_name: '',
      type: 'prescription',
      reason: '',
      prescribed_by: ''
    };
    updateFormData({ medications: [...formData.medications, newMed] });
  };

  const removeMedication = (index: number) => {
    const newMeds = [...formData.medications];
    newMeds.splice(index, 1);
    updateFormData({ medications: newMeds });
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const newMeds = [...formData.medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    updateFormData({ medications: newMeds });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Healthcare Providers</h2>

      <DynamicArrayField
        title="Healthcare Providers"
        items={formData.healthcare_providers}
        onAdd={addProvider}
        onRemove={removeProvider}
        addButtonLabel="Add Provider"
        emptyMessage="No healthcare providers listed."
        renderItem={(provider, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Name"
              value={provider.name}
              onChange={(e) => updateProvider(index, 'name', e.target.value)}
            />
            <TextField
              label="Address"
              value={provider.address}
              onChange={(e) => updateProvider(index, 'address', e.target.value)}
            />
            <TextField
              label="Phone Number"
              value={provider.phone_number}
              onChange={(e) => updateProvider(index, 'phone_number', e.target.value)}
            />
            <TextField
              label="Patient ID Number"
              value={provider.patient_id_number}
              onChange={(e) => updateProvider(index, 'patient_id_number', e.target.value)}
            />
            <div className="md:col-span-2">
              <TextField
                label="Dates of Exams and Treatments"
                value={provider.dates_of_exams_and_treatments}
                onChange={(e) => updateProvider(index, 'dates_of_exams_and_treatments', e.target.value)}
                placeholder="e.g., Jan 2023 - Present"
              />
            </div>
          </div>
        )}
      />

      <DynamicArrayField
        title="Tests"
        items={formData.tests}
        onAdd={addTest}
        onRemove={removeTest}
        addButtonLabel="Add Test"
        emptyMessage="No tests listed."
        renderItem={(test, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Test Name"
              value={test.test_name}
              onChange={(e) => updateTest(index, 'test_name', e.target.value)}
            />
            <DatePickerField
              label="Test Date"
              value={test.test_date}
              onChange={(e) => updateTest(index, 'test_date', e.target.value)}
            />
            <TextField
              label="Ordered By"
              value={test.ordered_by}
              onChange={(e) => updateTest(index, 'ordered_by', e.target.value)}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Results Summary
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                value={test.results_summary}
                onChange={(e) => updateTest(index, 'results_summary', e.target.value)}
              />
            </div>
          </div>
        )}
      />

      <DynamicArrayField
        title="Medications"
        items={formData.medications}
        onAdd={addMedication}
        onRemove={removeMedication}
        addButtonLabel="Add Medication"
        emptyMessage="No medications listed."
        renderItem={(med, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Medication Name"
              value={med.medication_name}
              onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
            />
            <SelectField
              label="Type"
              value={med.type}
              onChange={(e) => updateMedication(index, 'type', e.target.value)}
              options={[
                { value: 'prescription', label: 'Prescription' },
                { value: 'non-prescription', label: 'Non-Prescription' }
              ]}
            />
            <TextField
              label="Reason"
              value={med.reason}
              onChange={(e) => updateMedication(index, 'reason', e.target.value)}
            />
            <TextField
              label="Prescribed By"
              value={med.prescribed_by}
              onChange={(e) => updateMedication(index, 'prescribed_by', e.target.value)}
            />
          </div>
        )}
      />
    </div>
  );
};
