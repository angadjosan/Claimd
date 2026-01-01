import React from 'react';
import type { FormData } from '../../../types/form';
import { TextField } from '../TextField';
import { SelectField } from '../SelectField';
import { FileUploadField } from '../FileUploadField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step12Documents: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // W2 Forms Handlers
  const addW2 = () => {
    updateFormData({ w2_forms: [...formData.w2_forms, { year: '', file: null }] });
  };

  const removeW2 = (index: number) => {
    const newW2s = [...formData.w2_forms];
    newW2s.splice(index, 1);
    updateFormData({ w2_forms: newW2s });
  };

  const updateW2 = (index: number, field: 'year' | 'file', value: any) => {
    const newW2s = [...formData.w2_forms];
    newW2s[index] = { ...newW2s[index], [field]: value };
    updateFormData({ w2_forms: newW2s });
  };

  // Self Employment Tax Returns Handlers
  const addTaxReturn = () => {
    updateFormData({ self_employment_tax_returns: [...formData.self_employment_tax_returns, { year: '', file: null }] });
  };

  const removeTaxReturn = (index: number) => {
    const newReturns = [...formData.self_employment_tax_returns];
    newReturns.splice(index, 1);
    updateFormData({ self_employment_tax_returns: newReturns });
  };

  const updateTaxReturn = (index: number, field: 'year' | 'file', value: any) => {
    const newReturns = [...formData.self_employment_tax_returns];
    newReturns[index] = { ...newReturns[index], [field]: value };
    updateFormData({ self_employment_tax_returns: newReturns });
  };

  // Workers Comp Proof Handlers
  const addWorkersComp = () => {
    updateFormData({ workers_comp_proof: [...formData.workers_comp_proof, { type: 'other', description: '', file: null }] });
  };

  const removeWorkersComp = (index: number) => {
    const newProof = [...formData.workers_comp_proof];
    newProof.splice(index, 1);
    updateFormData({ workers_comp_proof: newProof });
  };

  const updateWorkersComp = (index: number, field: 'type' | 'description' | 'file', value: any) => {
    const newProof = [...formData.workers_comp_proof];
    newProof[index] = { ...newProof[index], [field]: value };
    updateFormData({ workers_comp_proof: newProof });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Document Uploads</h2>
      <p className="text-sm text-gray-500">Please upload the required documents.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadField
          label="Social Security Statement"
          value={formData.social_security_statement}
          onChange={(file) => updateFormData({ social_security_statement: file })}
          required
        />
        <FileUploadField
          label="Birth Certificate"
          value={formData.birth_certificate}
          onChange={(file) => updateFormData({ birth_certificate: file })}
          required
        />
        <FileUploadField
          label="Citizenship Proof (if not US born)"
          value={formData.citizenship_proof}
          onChange={(file) => updateFormData({ citizenship_proof: file })}
        />
        <FileUploadField
          label="Military Discharge Papers (if served before 1968)"
          value={formData.military_discharge_papers}
          onChange={(file) => updateFormData({ military_discharge_papers: file })}
        />
      </div>

      <DynamicArrayField
        title="W2 Forms"
        items={formData.w2_forms}
        onAdd={addW2}
        onRemove={removeW2}
        addButtonLabel="Add W2 Form"
        emptyMessage="No W2 forms uploaded."
        renderItem={(w2, index) => (
          <div className="space-y-4">
            <TextField
              label="Year"
              value={w2.year}
              onChange={(e) => updateW2(index, 'year', e.target.value)}
              placeholder="e.g., 2024"
              required
            />
            <FileUploadField
              label="Upload W2"
              value={w2.file}
              onChange={(file) => updateW2(index, 'file', file)}
              required
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Self-Employment Tax Returns"
        items={formData.self_employment_tax_returns}
        onAdd={addTaxReturn}
        onRemove={removeTaxReturn}
        addButtonLabel="Add Tax Return"
        emptyMessage="No tax returns uploaded."
        renderItem={(tax, index) => (
          <div className="space-y-4">
            <TextField
              label="Year"
              value={tax.year}
              onChange={(e) => updateTaxReturn(index, 'year', e.target.value)}
              placeholder="e.g., 2024"
              required
            />
            <FileUploadField
              label="Upload Tax Return"
              value={tax.file}
              onChange={(file) => updateTaxReturn(index, 'file', file)}
              required
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Workers Comp Proof"
        items={formData.workers_comp_proof}
        onAdd={addWorkersComp}
        onRemove={removeWorkersComp}
        addButtonLabel="Add Proof"
        emptyMessage="No workers comp proof uploaded."
        renderItem={(proof, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Type"
                value={proof.type || ''}
                onChange={(e) => updateWorkersComp(index, 'type', e.target.value)}
                options={[
                  { value: 'award_letter', label: 'Award Letter' },
                  { value: 'pay_stub', label: 'Pay Stub' },
                  { value: 'settlement_agreement', label: 'Settlement Agreement' },
                  { value: 'other', label: 'Other' }
                ]}
                placeholder="Select type"
                required
              />
              <TextField
                label="Description"
                value={proof.description}
                onChange={(e) => updateWorkersComp(index, 'description', e.target.value)}
                required
              />
            </div>
            <FileUploadField
              label="Upload Proof"
              value={proof.file}
              onChange={(file) => updateWorkersComp(index, 'file', file)}
              required
            />
          </div>
        )}
      />
    </div>
  );
};
