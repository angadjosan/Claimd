import React from 'react';
import type { FormData } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { FileUploadField } from '../FileUploadField';
import { SelectField } from '../SelectField';

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CL', label: 'Chile' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK', label: 'Denmark' },
  { value: 'DO', label: 'Dominican Republic' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'GR', label: 'Greece' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HT', label: 'Haiti' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JP', label: 'Japan' },
  { value: 'JO', label: 'Jordan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KR', label: 'South Korea' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MX', label: 'Mexico' },
  { value: 'MA', label: 'Morocco' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'NO', label: 'Norway' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PA', label: 'Panama' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'RO', label: 'Romania' },
  { value: 'RU', label: 'Russia' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'SG', label: 'Singapore' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'ES', label: 'Spain' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SY', label: 'Syria' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TR', label: 'Turkey' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VN', label: 'Vietnam' },
];

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step1Personal: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const maskSSN = (value: string) => {
    // Replace digits with bullets, keep dashes
    return value.replace(/\d/g, '•');
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Count bullets in current display to know cursor position
    const currentDigits = (formData.ssn || '').replace(/\D/g, '');
    const inputWithoutBullets = input.replace(/•/g, '');
    const newDigits = inputWithoutBullets.replace(/\D/g, '');
    
    // If user is deleting (input is shorter), remove from the end
    if (input.length < maskSSN(formData.ssn || '').length) {
      const formatted = formatSSN(currentDigits.slice(0, -1));
      updateFormData({ ssn: formatted });
    } else {
      // User is adding - get the new digit(s) from input
      const addedDigit = newDigits.slice(-1);
      const formatted = formatSSN(currentDigits + addedDigit);
      updateFormData({ ssn: formatted });
    }
  };

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
        
        <SelectField
          label="Country of Birth"
          options={COUNTRIES}
          value={formData.birthplace}
          onChange={(e) => updateFormData({ birthplace: e.target.value })}
          placeholder="Select your country"
          required
        />
        
        <TextField
          label="Social Security Number"
          placeholder="•••-••-••••"
          value={maskSSN(formData.ssn || '')}
          onChange={handleSSNChange}
          maxLength={11}
          required
        />
      </div>

      {formData.birthplace != 'united states' && formData.birthplace !== '' && formData.birthplace !== 'US' && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Permanent Resident Card</h3>
          <p className="text-xs text-gray-500 mb-3">Required for non-US born applicants.</p>
          <FileUploadField
            label="Upload Card Image/PDF"
            value={formData.permanent_resident_card}
            onChange={(file) => updateFormData({ permanent_resident_card: file })}
            required
          />
        </div>
      )}
    </div>
  );
};
