import React, { useState } from 'react';
import type { FormData, Spouse } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { DynamicArrayField } from '../DynamicArrayField';
import { Eye, EyeOff } from 'lucide-react';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step2Marital: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [showSpouseSSN, setShowSpouseSSN] = useState<Record<number, boolean>>({});

  const toggleSpouseSSN = (index: number) => {
    setShowSpouseSSN(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addSpouse = () => {
    const newSpouse: Spouse = {
      spouse_name: '',
      spouse_ssn: '',
      spouse_birthdate: '',
      marriage_start_date: '',
      marriage_place_city: '',
      marriage_place_state_or_country: ''
    };
    updateFormData({ spouses: [...formData.spouses, newSpouse] });
  };

  const removeSpouse = (index: number) => {
    const newSpouses = [...formData.spouses];
    newSpouses.splice(index, 1);
    updateFormData({ spouses: newSpouses });
  };

  const updateSpouse = (index: number, field: keyof Spouse, value: string) => {
    const newSpouses = [...formData.spouses];
    newSpouses[index] = { ...newSpouses[index], [field]: value };
    updateFormData({ spouses: newSpouses });
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const maskSSN = (value: string) => {
    return value.replace(/\d/g, '•');
  };

  const handleSpouseSSNChange = (index: number, inputValue: string) => {
    const currentSSN = formData.spouses[index]?.spouse_ssn || '';
    const currentDigits = currentSSN.replace(/\D/g, '');
    const inputWithoutBullets = inputValue.replace(/•/g, '');
    const newDigits = inputWithoutBullets.replace(/\D/g, '');
    
    if (inputValue.length < maskSSN(currentSSN).length) {
      const formatted = formatSSN(currentDigits.slice(0, -1));
      updateSpouse(index, 'spouse_ssn', formatted);
    } else {
      const addedDigit = newDigits.slice(-1);
      const formatted = formatSSN(currentDigits + addedDigit);
      updateSpouse(index, 'spouse_ssn', formatted);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Marital Status</h2>
      <p className="text-sm text-gray-500">
        Please list your current spouse. Also list prior spouses if the marriage lasted more than 10 years or ended in death.
      </p>

      <DynamicArrayField
        title="Spouses"
        items={formData.spouses}
        onAdd={addSpouse}
        onRemove={removeSpouse}
        addButtonLabel="Add Spouse"
        emptyMessage="No spouses listed."
        renderItem={(spouse, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Spouse Name"
              value={spouse.spouse_name}
              onChange={(e) => updateSpouse(index, 'spouse_name', e.target.value)}
              required
            />
            <div className="relative">
              <TextField
                label="Spouse SSN"
                placeholder="•••-••-••••"
                value={showSpouseSSN[index] ? (spouse.spouse_ssn || '') : maskSSN(spouse.spouse_ssn || '')}
                onChange={(e) => handleSpouseSSNChange(index, e.target.value)}
                maxLength={11}
                required
              />
              <button
                type="button"
                onClick={() => toggleSpouseSSN(index)}
                className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
              >
                {showSpouseSSN[index] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <DatePickerField
              label="Marriage Start Date"
              value={spouse.marriage_start_date}
              onChange={(e) => updateSpouse(index, 'marriage_start_date', e.target.value)}
              required
            />
            <DatePickerField
              label="Marriage End Date (if applicable)"
              value={spouse.marriage_end_date || ''}
              onChange={(e) => updateSpouse(index, 'marriage_end_date', e.target.value)}
            />
            <TextField
              label="Marriage City"
              value={spouse.marriage_place_city}
              onChange={(e) => updateSpouse(index, 'marriage_place_city', e.target.value)}
              required
            />
            <TextField
              label="Marriage State/Country"
              value={spouse.marriage_place_state_or_country}
              onChange={(e) => updateSpouse(index, 'marriage_place_state_or_country', e.target.value)}
              required
            />
            <DatePickerField
              label="Spouse Birthdate"
              value={spouse.spouse_birthdate}
              onChange={(e) => updateSpouse(index, 'spouse_birthdate', e.target.value)}
              required
            />
          </div>
        )}
      />
    </div>
  );
};
