import React from 'react';

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={`flex items-center mb-4 ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        {...props}
      />
      <label className="ml-2 block text-sm text-gray-900">
        {label}
      </label>
    </div>
  );
};
