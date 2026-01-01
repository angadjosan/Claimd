import React from 'react';
import type { FormData, Child } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step3Children: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const addChild = () => {
    const newChild: Child = {
      child_name: '',
      child_date_of_birth: '',
      child_status: {
        disabled_before_22: false,
        under_18_unmarried: false,
        age_18_to_19_in_secondary_school_full_time: false
      }
    };
    updateFormData({ children: [...formData.children, newChild] });
  };

  const removeChild = (index: number) => {
    const newChildren = [...formData.children];
    newChildren.splice(index, 1);
    updateFormData({ children: newChildren });
  };

  const updateChild = (index: number, field: keyof Child, value: any) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    updateFormData({ children: newChildren });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Children</h2>
      <p className="text-sm text-gray-500">
        Please list your dependent children.
      </p>

      <DynamicArrayField
        title="Children"
        items={formData.children}
        onAdd={addChild}
        onRemove={removeChild}
        addButtonLabel="Add Child"
        emptyMessage="No children listed."
        renderItem={(child, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Child Name"
                value={child.child_name}
                onChange={(e) => updateChild(index, 'child_name', e.target.value)}
                required
              />
              <DatePickerField
                label="Date of Birth"
                value={child.child_date_of_birth}
                onChange={(e) => updateChild(index, 'child_date_of_birth', e.target.value)}
                required
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};
