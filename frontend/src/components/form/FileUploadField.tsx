import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  onChange: (file: File | null) => void;
  value: File | null;
  accept?: string;
  error?: string;
  className?: string;
  required?: boolean;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({ 
  label, 
  onChange, 
  value, 
  accept = ".pdf,.jpg,.jpeg,.png", 
  error,
  className = '',
  required
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValidFile = value instanceof File && value.size > 0;

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {!isValidFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${error ? 'border-red-500' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">Upload a file</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{value.name || 'Uploaded file'}</p>
              <p className="text-xs text-gray-500">{value.size ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
