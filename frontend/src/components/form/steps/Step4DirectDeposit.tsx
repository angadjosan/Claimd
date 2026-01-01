import React, { useState } from 'react';
import type { FormData, DirectDeposit } from '../../../types/form';
import { TextField } from '../TextField';
import { SelectField } from '../SelectField';
import { Eye, EyeOff } from 'lucide-react';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step4DirectDeposit: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showRoutingNumber, setShowRoutingNumber] = useState(false);

  // Mask function - replace digits with bullets
  const maskValue = (value: string) => {
    return value.replace(/\d/g, '•');
  };

  // Handle masked field change
  const handleMaskedDomesticChange = (field: string, currentValue: string, input: string) => {
    const currentDigits = (currentValue || '').replace(/\D/g, '');
    const inputWithoutBullets = input.replace(/•/g, '');
    const newDigits = inputWithoutBullets.replace(/\D/g, '');
    
    let newValue: string;
    if (input.length < maskValue(currentValue || '').length) {
      // User is deleting
      newValue = currentDigits.slice(0, -1);
    } else {
      // User is adding
      const addedDigit = newDigits.slice(-1);
      newValue = currentDigits + addedDigit;
    }
    
    updateFormData({
      direct_deposit: {
        ...formData.direct_deposit,
        domestic: {
          ...formData.direct_deposit.domestic,
          [field]: newValue
        } as any
      }
    });
  };

  const updateDirectDeposit = (field: keyof DirectDeposit, value: any) => {
    updateFormData({
      direct_deposit: {
        ...formData.direct_deposit,
        [field]: value
      }
    });
  };

  const updateDomestic = (field: string, value: string) => {
    updateFormData({
      direct_deposit: {
        ...formData.direct_deposit,
        domestic: {
          ...formData.direct_deposit.domestic,
          [field]: value
        } as any
      }
    });
  };

  const updateInternational = (field: string, value: string) => {
    updateFormData({
      direct_deposit: {
        ...formData.direct_deposit,
        international: {
          ...formData.direct_deposit.international,
          [field]: value
        } as any
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Direct Deposit</h2>
      <p className="text-sm text-gray-500">
        Where would you like your benefits to be deposited?
      </p>

      <SelectField
        label="Deposit Type"
        value={formData.direct_deposit.type}
        onChange={(e) => updateDirectDeposit('type', e.target.value)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'domestic', label: 'Domestic (US)' },
          { value: 'international', label: 'International' }
        ]}
        required
      />

      {formData.direct_deposit.type === 'domestic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <SelectField
            label="Account Type"
            value={formData.direct_deposit.domestic?.account_type || ''}
            onChange={(e) => updateDomestic('account_type', e.target.value)}
            options={[
              { value: 'checking', label: 'Checking' },
              { value: 'savings', label: 'Savings' }
            ]}
            required
          />
          <div className="relative">
            <TextField
              label="Account Number"
              value={showAccountNumber ? (formData.direct_deposit.domestic?.account_number || '') : maskValue(formData.direct_deposit.domestic?.account_number || '')}
              onChange={(e) => handleMaskedDomesticChange('account_number', formData.direct_deposit.domestic?.account_number || '', e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
            >
              {showAccountNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="relative">
            <TextField
              label="Routing Number"
              value={showRoutingNumber ? (formData.direct_deposit.domestic?.bank_routing_transit_number || '') : maskValue(formData.direct_deposit.domestic?.bank_routing_transit_number || '')}
              onChange={(e) => handleMaskedDomesticChange('bank_routing_transit_number', formData.direct_deposit.domestic?.bank_routing_transit_number || '', e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowRoutingNumber(!showRoutingNumber)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
            >
              {showRoutingNumber ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {formData.direct_deposit.type === 'international' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <TextField
            label="Country"
            value={formData.direct_deposit.international?.country || ''}
            onChange={(e) => updateInternational('country', e.target.value)}
            required
          />
          <TextField
            label="Bank Name"
            value={formData.direct_deposit.international?.bank_name || ''}
            onChange={(e) => updateInternational('bank_name', e.target.value)}
            required
          />
          <TextField
            label="Bank Code"
            value={formData.direct_deposit.international?.bank_code || ''}
            onChange={(e) => updateInternational('bank_code', e.target.value)}
            required
          />
          <TextField
            label="Currency"
            value={formData.direct_deposit.international?.currency || ''}
            onChange={(e) => updateInternational('currency', e.target.value)}
            required
          />
          <TextField
            label="Account Type"
            value={formData.direct_deposit.international?.account_type || ''}
            onChange={(e) => updateInternational('account_type', e.target.value)}
            required
          />
          <TextField
            label="Account Number"
            value={formData.direct_deposit.international?.account_number || ''}
            onChange={(e) => updateInternational('account_number', e.target.value)}
            required
          />
          <TextField
            label="Branch/Transit Number (Optional)"
            value={formData.direct_deposit.international?.branch_or_transit_number || ''}
            onChange={(e) => updateInternational('branch_or_transit_number', e.target.value)}
            required
          />
        </div>
      )}
    </div>
  );
};
