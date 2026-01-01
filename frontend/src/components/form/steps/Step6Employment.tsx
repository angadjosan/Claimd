import React from 'react';
import type { FormData, Job, SelfEmployment } from '../../../types/form';
import { TextField } from '../TextField';
import { DatePickerField } from '../DatePickerField';
import { DynamicArrayField } from '../DynamicArrayField';

interface StepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

export const Step6Employment: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Non-Self Employment Handlers
  const addJob = () => {
    const newJob: Job = {
      job_title: '',
      employer_name: '',
      employment_start_date: '',
      total_earnings: '',
      job_duties_summary: '',
      employer_address: ''
    };
    updateFormData({ non_self_employment: [...formData.non_self_employment, newJob] });
  };

  const removeJob = (index: number) => {
    const newJobs = [...formData.non_self_employment];
    newJobs.splice(index, 1);
    updateFormData({ non_self_employment: newJobs });
  };

  const updateJob = (index: number, field: keyof Job, value: string) => {
    const newJobs = [...formData.non_self_employment];
    newJobs[index] = { ...newJobs[index], [field]: value };
    updateFormData({ non_self_employment: newJobs });
  };

  // Self Employment Handlers
  const addSelfEmployment = () => {
    const newSelf: SelfEmployment = {
      business_type: '',
      net_income_total: '',
      tax_year: ''
    };
    updateFormData({ self_employment: [...formData.self_employment, newSelf] });
  };

  const removeSelfEmployment = (index: number) => {
    const newSelf = [...formData.self_employment];
    newSelf.splice(index, 1);
    updateFormData({ self_employment: newSelf });
  };

  const updateSelfEmployment = (index: number, field: keyof SelfEmployment, value: string) => {
    const newSelf = [...formData.self_employment];
    newSelf[index] = { ...newSelf[index], [field]: value };
    updateFormData({ self_employment: newSelf });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Employment History</h2>
      
      <DatePickerField
        label="Date condition began affecting work ability"
        value={formData.date_condition_began_affecting_work_ability}
        onChange={(e) => updateFormData({ date_condition_began_affecting_work_ability: e.target.value })}
        required
      />

      <DynamicArrayField
        title="Non-Self Employment"
        items={formData.non_self_employment}
        onAdd={addJob}
        onRemove={removeJob}
        addButtonLabel="Add Job"
        emptyMessage="No jobs listed."
        renderItem={(job, index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Job Title"
              value={job.job_title}
              onChange={(e) => updateJob(index, 'job_title', e.target.value)}
              required
            />
            <TextField
              label="Employer Name"
              value={job.employer_name}
              onChange={(e) => updateJob(index, 'employer_name', e.target.value)}
              required
            />
            <DatePickerField
              label="Start Date"
              value={job.employment_start_date}
              onChange={(e) => updateJob(index, 'employment_start_date', e.target.value)}
              required
            />
            <DatePickerField
              label="End Date (Optional)"
              value={job.employment_end_date || ''}
              onChange={(e) => updateJob(index, 'employment_end_date', e.target.value)}
            />
            <TextField
              label="Total Earnings"
              value={job.total_earnings}
              onChange={(e) => updateJob(index, 'total_earnings', e.target.value)}
              required
            />
            <TextField
              label="Employer Address"
              value={job.employer_address}
              onChange={(e) => updateJob(index, 'employer_address', e.target.value)}
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Duties Summary
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                value={job.job_duties_summary}
                onChange={(e) => updateJob(index, 'job_duties_summary', e.target.value)}
                required
              />
            </div>
          </div>
        )}
      />

      <DynamicArrayField
        title="Self Employment"
        items={formData.self_employment}
        onAdd={addSelfEmployment}
        onRemove={removeSelfEmployment}
        addButtonLabel="Add Self Employment"
        emptyMessage="No self-employment listed."
        renderItem={(self, index) => (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Business Type"
              value={self.business_type}
              onChange={(e) => updateSelfEmployment(index, 'business_type', e.target.value)}
              required
            />
            <TextField
              label="Net Income Total"
              value={self.net_income_total}
              onChange={(e) => updateSelfEmployment(index, 'net_income_total', e.target.value)}
              required
            />
            <TextField
              label="Tax Year"
              value={self.tax_year}
              onChange={(e) => updateSelfEmployment(index, 'tax_year', e.target.value)}
              required
            />
          </div>
        )}
      />
    </div>
  );
};
