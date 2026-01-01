import React from 'react';
import type { FormData, EmergencyContact } from '../../../types/form';
import { TextField } from '../TextField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step5EmergencyContact: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const updateContact = (field: keyof EmergencyContact, value: any) => {
    updateFormData({
      contact_who_knows_your_condition: {
        ...formData.contact_who_knows_your_condition,
        [field]: value
      }
    });
  };

  const updateAddress = (field: string, value: string) => {
    updateFormData({
      contact_who_knows_your_condition: {
        ...formData.contact_who_knows_your_condition,
        address: {
          ...formData.contact_who_knows_your_condition.address,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Emergency Contact</h2>
      <p className="text-sm text-gray-500">
        Please provide details of someone who knows about your medical condition.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Contact Name"
          value={formData.contact_who_knows_your_condition.contact_name}
          onChange={(e) => updateContact('contact_name', e.target.value)}
          required
        />
        <TextField
          label="Relationship (Optional)"
          value={formData.contact_who_knows_your_condition.relationship || ''}
          onChange={(e) => updateContact('relationship', e.target.value)}
        />
        <TextField
          label="Phone Number"
          value={formData.contact_who_knows_your_condition.phone_number}
          onChange={(e) => updateContact('phone_number', e.target.value)}
          required
        />
        <TextField
          label="Street"
          value={formData.contact_who_knows_your_condition.address.street}
          onChange={(e) => updateAddress('street', e.target.value)}
          required
        />
        <TextField
          label="City"
          value={formData.contact_who_knows_your_condition.address.city}
          onChange={(e) => updateAddress('city', e.target.value)}
          required
        />
        <TextField
          label="State"
          value={formData.contact_who_knows_your_condition.address.state}
          onChange={(e) => updateAddress('state', e.target.value)}
          required
        />
        <TextField
          label="Zip Code"
          value={formData.contact_who_knows_your_condition.address.zip}
          onChange={(e) => updateAddress('zip', e.target.value)}
          required
        />
        <TextField
          label="Country (Optional)"
          value={formData.contact_who_knows_your_condition.address.country || ''}
          onChange={(e) => updateAddress('country', e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={formData.contact_who_knows_your_condition.notes || ''}
          onChange={(e) => updateContact('notes', e.target.value)}
        />
      </div>
    </div>
  );
};
