import React from 'react';
import type { FormData, EmergencyContact } from '../../../types/form';
import { TextField } from '../TextField';
import { SelectField } from '../SelectField';

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

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const countryOptions = [
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

  const stateOptions = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' },
  ];

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
          onChange={(e) => updateContact('phone_number', formatPhoneNumber(e.target.value))}
          required
        />
        <SelectField
          label="Country"
          options={countryOptions}
          value={formData.contact_who_knows_your_condition.address.country || ''}
          onChange={(e) => updateAddress('country', e.target.value)}
          required
        />
        {formData.contact_who_knows_your_condition.address.country === 'US' ? (
          <SelectField
            label="State/Region"
            options={stateOptions}
            value={formData.contact_who_knows_your_condition.address.state}
            onChange={(e) => updateAddress('state', e.target.value)}
            required
          />
        ) : (
          <TextField
            label="State/Region"
            value={formData.contact_who_knows_your_condition.address.state}
            onChange={(e) => updateAddress('state', e.target.value)}
            required
          />
        )}
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
          label="Zip Code"
          value={formData.contact_who_knows_your_condition.address.zip}
          onChange={(e) => updateAddress('zip', e.target.value.replace(/\D/g, ''))}
          required
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
