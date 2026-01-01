import React from 'react';
import type { FormData, MedicalCondition, FunctionalLimitations } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { CheckboxField } from '../CheckboxField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step9MedicalConditions: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const addCondition = () => {
    const newCondition: MedicalCondition = {
      condition_name: '',
      date_began: '',
      how_it_limits_activities: '',
      treatment_received: ''
    };
    updateFormData({ conditions: [...formData.conditions, newCondition] });
  };

  const removeCondition = (index: number) => {
    const newConditions = [...formData.conditions];
    newConditions.splice(index, 1);
    updateFormData({ conditions: newConditions });
  };

  const updateCondition = (index: number, field: keyof MedicalCondition, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    updateFormData({ conditions: newConditions });
  };

  const updateLimitation = (field: keyof FunctionalLimitations, value: boolean) => {
    updateFormData({
      functional_limitations: {
        ...formData.functional_limitations,
        [field]: value
      }
    });
  };

  const updateOtherLimitation = (value: string) => {
    updateFormData({
      functional_limitations: {
        ...formData.functional_limitations,
        other: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Medical Conditions</h2>

      <DynamicArrayField
        title="Conditions"
        items={formData.conditions}
        onAdd={addCondition}
        onRemove={removeCondition}
        addButtonLabel="Add Condition"
        emptyMessage="No medical conditions listed."
        renderItem={(condition, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Condition Name"
                value={condition.condition_name}
                onChange={(e) => updateCondition(index, 'condition_name', e.target.value)}
                required
              />
              <DatePickerField
                label="Date Began"
                value={condition.date_began}
                onChange={(e) => updateCondition(index, 'date_began', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How it limits activities <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={condition.how_it_limits_activities}
                onChange={(e) => updateCondition(index, 'how_it_limits_activities', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Received <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={condition.treatment_received}
                onChange={(e) => updateCondition(index, 'treatment_received', e.target.value)}
                required
              />
            </div>
          </div>
        )}
      />

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Functional Limitations</h3>
        <p className="text-sm text-gray-500 mb-4">Check all that apply.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CheckboxField
            label="Walking"
            checked={formData.functional_limitations.walking}
            onChange={(e) => updateLimitation('walking', e.target.checked)}
          />
          <CheckboxField
            label="Sitting"
            checked={formData.functional_limitations.sitting}
            onChange={(e) => updateLimitation('sitting', e.target.checked)}
          />
          <CheckboxField
            label="Standing"
            checked={formData.functional_limitations.standing}
            onChange={(e) => updateLimitation('standing', e.target.checked)}
          />
          <CheckboxField
            label="Lifting"
            checked={formData.functional_limitations.lifting}
            onChange={(e) => updateLimitation('lifting', e.target.checked)}
          />
          <CheckboxField
            label="Carrying"
            checked={formData.functional_limitations.carrying}
            onChange={(e) => updateLimitation('carrying', e.target.checked)}
          />
          <CheckboxField
            label="Understanding Instructions"
            checked={formData.functional_limitations.understanding_instructions}
            onChange={(e) => updateLimitation('understanding_instructions', e.target.checked)}
          />
          <CheckboxField
            label="Remembering Instructions"
            checked={formData.functional_limitations.remembering_instructions}
            onChange={(e) => updateLimitation('remembering_instructions', e.target.checked)}
          />
        </div>
        
        <div className="mt-4">
          <TextField
            label="Other Limitations"
            value={formData.functional_limitations.other || ''}
            onChange={(e) => updateOtherLimitation(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
