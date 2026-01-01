import React from 'react';
import type { FormData, EarningsRecord, DisabilityBenefit } from '../../../types/form';
import { TextField } from '../TextField';
import { SelectField } from '../SelectField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step8EarningsBenefits: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Earnings History Handlers
  const addEarnings = () => {
    const newEarning: EarningsRecord = { year: '', total_earnings: '' };
    updateFormData({ earnings_history: [...formData.earnings_history, newEarning] });
  };

  const removeEarnings = (index: number) => {
    const newEarnings = [...formData.earnings_history];
    newEarnings.splice(index, 1);
    updateFormData({ earnings_history: newEarnings });
  };

  const updateEarnings = (index: number, field: keyof EarningsRecord, value: string) => {
    const newEarnings = [...formData.earnings_history];
    newEarnings[index] = { ...newEarnings[index], [field]: value };
    updateFormData({ earnings_history: newEarnings });
  };

  // Disability Benefits Handlers
  const addBenefit = () => {
    const newBenefit: DisabilityBenefit = {
      type: '',
      status: '' as any,
      payment_type: '' as any,
      payer: ''
    };
    updateFormData({ disability_benefits: [...formData.disability_benefits, newBenefit] });
  };

  const removeBenefit = (index: number) => {
    const newBenefits = [...formData.disability_benefits];
    newBenefits.splice(index, 1);
    updateFormData({ disability_benefits: newBenefits });
  };

  const updateBenefit = (index: number, field: keyof DisabilityBenefit, value: any) => {
    const newBenefits = [...formData.disability_benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    updateFormData({ disability_benefits: newBenefits });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Earnings & Benefits</h2>

      <DynamicArrayField
        title="Earnings History"
        items={formData.earnings_history}
        onAdd={addEarnings}
        onRemove={removeEarnings}
        addButtonLabel="Add Earnings Record"
        emptyMessage="No earnings history listed."
        renderItem={(earning, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Year"
              value={earning.year}
              onChange={(e) => updateEarnings(index, 'year', e.target.value)}
              placeholder="e.g., 2024"
              required
            />
            <TextField
              label="Total Earnings"
              value={earning.total_earnings}
              onChange={(e) => updateEarnings(index, 'total_earnings', e.target.value)}
              placeholder="e.g., $50,000"
              required
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Disability Benefits Filed/Received"
        items={formData.disability_benefits}
        onAdd={addBenefit}
        onRemove={removeBenefit}
        addButtonLabel="Add Benefit"
        emptyMessage="No disability benefits listed."
        renderItem={(benefit, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Type"
              value={benefit.type}
              onChange={(e) => updateBenefit(index, 'type', e.target.value)}
              placeholder="e.g., Workers Comp, VA Disability"
              required
            />
            <SelectField
              label="Status"
              value={benefit.status || ''}
              onChange={(e) => updateBenefit(index, 'status', e.target.value)}
              options={[
                { value: 'filed', label: 'Filed' },
                { value: 'received', label: 'Received' },
                { value: 'intend_to_file', label: 'Intend to File' }
              ]}
              placeholder="Select status"
              required
            />
            <SelectField
              label="Payment Type"
              value={benefit.payment_type || ''}
              onChange={(e) => updateBenefit(index, 'payment_type', e.target.value)}
              options={[
                { value: 'temporary', label: 'Temporary' },
                { value: 'permanent', label: 'Permanent' },
                { value: 'annuity', label: 'Annuity' },
                { value: 'lump_sum', label: 'Lump Sum' }
              ]}
              placeholder="Select payment type"
              required
            />
            <TextField
              label="Payer"
              value={benefit.payer}
              onChange={(e) => updateBenefit(index, 'payer', e.target.value)}
              placeholder="e.g., State of California"
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                value={benefit.details || ''}
                onChange={(e) => updateBenefit(index, 'details', e.target.value)}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};
