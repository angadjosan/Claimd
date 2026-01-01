import React from 'react';
import type { FormData, ServiceRecord, Education, SpecialEducation, JobTraining } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { CheckboxField } from '../CheckboxField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step7MilitaryEducation: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Military Service Handlers
  const addServiceRecord = () => {
    const newRecord: ServiceRecord = {
      branch: '',
      type_of_duty: '',
      service_start_date: '',
      service_end_date: ''
    };
    updateFormData({ service_records: [...formData.service_records, newRecord] });
  };

  const removeServiceRecord = (index: number) => {
    const newRecords = [...formData.service_records];
    newRecords.splice(index, 1);
    updateFormData({ service_records: newRecords });
  };

  const updateServiceRecord = (index: number, field: keyof ServiceRecord, value: string) => {
    const newRecords = [...formData.service_records];
    newRecords[index] = { ...newRecords[index], [field]: value };
    updateFormData({ service_records: newRecords });
  };

  // Education Handlers
  const addEducation = () => {
    const newEdu: Education = { level: '', date_completed: '' };
    updateFormData({ education: [...formData.education, newEdu] });
  };

  const removeEducation = (index: number) => {
    const newEdu = [...formData.education];
    newEdu.splice(index, 1);
    updateFormData({ education: newEdu });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    updateFormData({ education: newEdu });
  };

  // Special Education Handlers
  const addSpecialEducation = () => {
    const newSpec: SpecialEducation = { school_name: '', city: '', state: '' };
    updateFormData({ special_education: [...formData.special_education, newSpec] });
  };

  const removeSpecialEducation = (index: number) => {
    const newSpec = [...formData.special_education];
    newSpec.splice(index, 1);
    updateFormData({ special_education: newSpec });
  };

  const updateSpecialEducation = (index: number, field: keyof SpecialEducation, value: string) => {
    const newSpec = [...formData.special_education];
    newSpec[index] = { ...newSpec[index], [field]: value };
    updateFormData({ special_education: newSpec });
  };

  // Job Training Handlers
  const addJobTraining = () => {
    const newTrain: JobTraining = { program_name: '', date_completed: '' };
    updateFormData({ job_training: [...formData.job_training, newTrain] });
  };

  const removeJobTraining = (index: number) => {
    const newTrain = [...formData.job_training];
    newTrain.splice(index, 1);
    updateFormData({ job_training: newTrain });
  };

  const updateJobTraining = (index: number, field: keyof JobTraining, value: string) => {
    const newTrain = [...formData.job_training];
    newTrain[index] = { ...newTrain[index], [field]: value };
    updateFormData({ job_training: newTrain });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Military & Education</h2>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <CheckboxField
          label="Served in US Military?"
          checked={formData.served_in_us_military}
          onChange={(e) => updateFormData({ served_in_us_military: e.target.checked })}
        />

        {formData.served_in_us_military && (
          <DynamicArrayField
            title="Service Records"
            items={formData.service_records}
            onAdd={addServiceRecord}
            onRemove={removeServiceRecord}
            addButtonLabel="Add Service Record"
            emptyMessage="No service records listed."
            renderItem={(record, index) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Branch"
                  value={record.branch}
                  onChange={(e) => updateServiceRecord(index, 'branch', e.target.value)}
                />
                <TextField
                  label="Type of Duty"
                  value={record.type_of_duty}
                  onChange={(e) => updateServiceRecord(index, 'type_of_duty', e.target.value)}
                />
                <DatePickerField
                  label="Start Date"
                  value={record.service_start_date}
                  onChange={(e) => updateServiceRecord(index, 'service_start_date', e.target.value)}
                />
                <DatePickerField
                  label="End Date"
                  value={record.service_end_date}
                  onChange={(e) => updateServiceRecord(index, 'service_end_date', e.target.value)}
                />
              </div>
            )}
          />
        )}
      </div>

      <DynamicArrayField
        title="Education"
        items={formData.education}
        onAdd={addEducation}
        onRemove={removeEducation}
        addButtonLabel="Add Education"
        emptyMessage="No education listed."
        renderItem={(edu, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Level"
              value={edu.level}
              onChange={(e) => updateEducation(index, 'level', e.target.value)}
            />
            <DatePickerField
              label="Date Completed"
              value={edu.date_completed}
              onChange={(e) => updateEducation(index, 'date_completed', e.target.value)}
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Special Education"
        items={formData.special_education}
        onAdd={addSpecialEducation}
        onRemove={removeSpecialEducation}
        addButtonLabel="Add Special Education"
        emptyMessage="No special education listed."
        renderItem={(spec, index) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="School Name"
              value={spec.school_name}
              onChange={(e) => updateSpecialEducation(index, 'school_name', e.target.value)}
            />
            <TextField
              label="City"
              value={spec.city}
              onChange={(e) => updateSpecialEducation(index, 'city', e.target.value)}
            />
            <TextField
              label="State"
              value={spec.state}
              onChange={(e) => updateSpecialEducation(index, 'state', e.target.value)}
            />
          </div>
        )}
      />

      <DynamicArrayField
        title="Job Training"
        items={formData.job_training}
        onAdd={addJobTraining}
        onRemove={removeJobTraining}
        addButtonLabel="Add Job Training"
        emptyMessage="No job training listed."
        renderItem={(train, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Program Name"
              value={train.program_name}
              onChange={(e) => updateJobTraining(index, 'program_name', e.target.value)}
            />
            <DatePickerField
              label="Date Completed"
              value={train.date_completed}
              onChange={(e) => updateJobTraining(index, 'date_completed', e.target.value)}
            />
          </div>
        )}
      />
    </div>
  );
};
