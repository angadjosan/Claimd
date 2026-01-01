import React from 'react';
import type { FormData, EvidenceDocument, OtherRecordSource } from '../../../types/form';
import { TextField } from '../TextField';
import { SelectField } from '../SelectField';
import { FileUploadField } from '../FileUploadField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step11MedicalEvidence: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Evidence Documents Handlers
  const addDocument = () => {
    const newDoc: EvidenceDocument = {
      document_type: '' as any,
      description: '',
      file: null
    };
    updateFormData({ evidence_documents: [...formData.evidence_documents, newDoc] });
  };

  const removeDocument = (index: number) => {
    const newDocs = [...formData.evidence_documents];
    newDocs.splice(index, 1);
    updateFormData({ evidence_documents: newDocs });
  };

  const updateDocument = (index: number, field: keyof EvidenceDocument, value: any) => {
    const newDocs = [...formData.evidence_documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    updateFormData({ evidence_documents: newDocs });
  };

  // Other Record Sources Handlers
  const addSource = () => {
    const newSource: OtherRecordSource = {
      type: '',
      name_or_description: ''
    };
    updateFormData({ other_record_sources: [...formData.other_record_sources, newSource] });
  };

  const removeSource = (index: number) => {
    const newSources = [...formData.other_record_sources];
    newSources.splice(index, 1);
    updateFormData({ other_record_sources: newSources });
  };

  const updateSource = (index: number, field: keyof OtherRecordSource, value: string) => {
    const newSources = [...formData.other_record_sources];
    newSources[index] = { ...newSources[index], [field]: value };
    updateFormData({ other_record_sources: newSources });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Medical Evidence</h2>

      <DynamicArrayField
        title="Evidence Documents"
        items={formData.evidence_documents}
        onAdd={addDocument}
        onRemove={removeDocument}
        addButtonLabel="Add Document"
        emptyMessage="No evidence documents uploaded."
        renderItem={(doc, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Document Type"
                value={doc.document_type || ''}
                onChange={(e) => updateDocument(index, 'document_type', e.target.value)}
                options={[
                  { value: 'medical_records', label: 'Medical Records' },
                  { value: 'doctors_report', label: "Doctor's Report" },
                  { value: 'test_results', label: 'Test Results' },
                  { value: 'other', label: 'Other' }
                ]}
                placeholder="Select document type"
                required
              />
              <TextField
                label="Description"
                value={doc.description}
                onChange={(e) => updateDocument(index, 'description', e.target.value)}
                required
              />
            </div>
            <FileUploadField
              label="Upload File"
              value={doc.file}
              onChange={(file) => updateDocument(index, 'file', file)}
              required
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Other Record Sources"
        items={formData.other_record_sources}
        onAdd={addSource}
        onRemove={removeSource}
        addButtonLabel="Add Source"
        emptyMessage="No other record sources listed."
        renderItem={(source, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Type"
              value={source.type}
              onChange={(e) => updateSource(index, 'type', e.target.value)}
              placeholder="e.g., School Records, Social Services"
              required
            />
            <TextField
              label="Name or Description"
              value={source.name_or_description}
              onChange={(e) => updateSource(index, 'name_or_description', e.target.value)}
              required
            />
            <div className="md:col-span-2">
              <TextField
                label="Contact Info (Optional)"
                value={source.contact_info || ''}
                onChange={(e) => updateSource(index, 'contact_info', e.target.value)}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};
