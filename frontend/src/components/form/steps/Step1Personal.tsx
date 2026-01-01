import React from 'react';
import type { FormData } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { FileUploadField } from '../FileUploadField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step1Personal: React.FC<StepProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
      <p className="text-sm text-gray-500">Please provide your basic identity details.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DatePickerField
          label="Date of Birth"
          value={formData.birthdate}
          onChange={(e) => updateFormData({ birthdate: e.target.value })}
          required
        />
        
        <TextField
          label="Place of Birth"
          placeholder="City, State/Country"
          value={formData.birthplace}
          onChange={(e) => updateFormData({ birthplace: e.target.value })}
          required
        />
        
        <TextField
          label="Social Security Number"
          placeholder="XXX-XX-XXXX"
          value={formData.ssn}
          onChange={(e) => updateFormData({ ssn: e.target.value })}
          required
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Permanent Resident Card</h3>
        <p className="text-xs text-gray-500 mb-3">Upload only if you are not a US resident.</p>
        <FileUploadField
          label="Upload Card Image/PDF"
          value={formData.permanent_resident_card}
          onChange={(file) => updateFormData({ permanent_resident_card: file })}
        />
      </div>
    </div>
  );
};
