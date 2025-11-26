import { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Upload, FileText, User, Heart, DollarSign, Shield, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import { config } from '../config/env';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  socialSecurityNumber: string;
  
  // Medical Information
  doctorNames: string;
  doctorPhoneNumbers: string;
  hospitalNames: string;
  hospitalPhoneNumbers: string;
  medicalRecordsPermission: boolean;
  medicalRecordsFile: File | null;
  
  // Financial Information
  incomeDocumentsFile: File | null;
}

interface FieldValidation {
  isValid: boolean;
  message: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  socialSecurityNumber: '',
  doctorNames: '',
  doctorPhoneNumbers: '',
  hospitalNames: '',
  hospitalPhoneNumbers: '',
  medicalRecordsPermission: false,
  medicalRecordsFile: null,
  incomeDocumentsFile: null,
};

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showInterlude, setShowInterlude] = useState(false);
  const [ssnFocused, setSsnFocused] = useState(false);
  const [ssnDisplayValue, setSsnDisplayValue] = useState('');

  const steps = [
    { id: 1, title: 'Personal Information', icon: User, description: 'Basic details about yourself' },
    { id: 2, title: 'Medical Information', icon: Heart, description: 'Doctor contacts and medical records' },
    { id: 3, title: 'Financial Information', icon: DollarSign, description: 'Income documentation' },
    { id: 4, title: 'Review & Submit', icon: Shield, description: 'Review your application' },
  ];

  // Validation functions
  const validateField = (field: keyof FormData, value: string): FieldValidation => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return { isValid: false, message: 'This field is required' };
        if (value.trim().length < 2) return { isValid: false, message: 'Must be at least 2 characters' };
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return { isValid: false, message: 'Only letters, spaces, hyphens, and apostrophes allowed' };
        return { isValid: true, message: 'Valid' };
      
      case 'dateOfBirth':
        if (!value) return { isValid: false, message: 'Date of birth is required' };
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0) return { isValid: false, message: 'Date cannot be in the future' };
        if (age > 120) return { isValid: false, message: 'Please enter a valid date' };
        return { isValid: true, message: 'Valid' };
      
      case 'address':
        if (!value.trim()) return { isValid: false, message: 'Address is required' };
        if (value.trim().length < 5) return { isValid: false, message: 'Please enter a complete address' };
        return { isValid: true, message: 'Valid' };
      
      case 'city':
        if (!value.trim()) return { isValid: false, message: 'City is required' };
        if (value.trim().length < 2) return { isValid: false, message: 'Please enter a valid city name' };
        return { isValid: true, message: 'Valid' };
      
      case 'state':
        if (!value.trim()) return { isValid: false, message: 'State is required' };
        if (value.trim().length < 2) return { isValid: false, message: 'Please enter a valid state' };
        return { isValid: true, message: 'Valid' };
      
      case 'zipCode':
        if (!value.trim()) return { isValid: false, message: 'ZIP code is required' };
        if (!/^\d{5}(-\d{4})?$/.test(value.trim())) return { isValid: false, message: 'Please enter a valid ZIP code (12345 or 12345-6789)' };
        return { isValid: true, message: 'Valid' };
      
      case 'socialSecurityNumber':
        if (!value) return { isValid: false, message: 'Social Security Number is required' };
        const ssnDigits = value.replace(/-/g, '');
        if (ssnDigits.length !== 9) return { isValid: false, message: 'SSN must be 9 digits' };
        if (!/^\d{9}$/.test(ssnDigits)) return { isValid: false, message: 'SSN must contain only numbers' };
        // Check for invalid SSNs
        if (ssnDigits.startsWith('000') || ssnDigits.startsWith('666') || ssnDigits.substring(0, 3) === '900') {
          return { isValid: false, message: 'Please enter a valid Social Security Number' };
        }
        return { isValid: true, message: 'Valid' };
      
      default:
        return { isValid: true, message: 'Valid' };
    }
  };

  const formatSSN = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 9 digits
    const limitedDigits = digits.substring(0, 9);
    
    // Add dashes at appropriate positions
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 5) {
      return `${limitedDigits.substring(0, 3)}-${limitedDigits.substring(3)}`;
    } else {
      return `${limitedDigits.substring(0, 3)}-${limitedDigits.substring(3, 5)}-${limitedDigits.substring(5)}`;
    }
  };


  const updateFormData = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = (field: 'medicalRecordsFile' | 'incomeDocumentsFile', file: File | null) => {
    updateFormData(field, file);
  };

  const handleSubmit = async () => {
    // Show interlude screen immediately
    setIsSubmitted(true);
    setShowInterlude(true);
    
    // Store user data in cookie for automatic login
    const userData = {
      name: `${formData.firstName} ${formData.lastName}`,
      ssn: formData.socialSecurityNumber
    };
    Cookies.set('userData', JSON.stringify(userData), { expires: 7 });
    
    // Send data to backend in the background (fire and forget)
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        submitData.append(key, value);
      } else {
        submitData.append(key, String(value));
      }
    });
    
    fetch(`${config.apiUrl}/api/benefit-application`, {
      method: 'POST',
      body: submitData,
    }).catch(error => {
      console.error('Error submitting form to backend:', error);
    });
  };

  const handleGoToDashboard = () => {
    window.location.href = '/user';
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.firstName?.trim() && 
          formData.lastName?.trim() && 
          formData.dateOfBirth?.trim() && 
          formData.address?.trim() && 
          formData.city?.trim() && 
          formData.state?.trim() && 
          formData.zipCode?.trim() && 
          formData.socialSecurityNumber?.trim()
        );
      case 2:
        return formData.medicalRecordsPermission === true;
      case 3:
        return !!(formData.incomeDocumentsFile);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.firstName ? (validateField('firstName', formData.firstName).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                  />
                  {formData.firstName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateField('firstName', formData.firstName).isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.firstName && !validateField('firstName', formData.firstName).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validateField('firstName', formData.firstName).message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.lastName ? (validateField('lastName', formData.lastName).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                  />
                  {formData.lastName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateField('lastName', formData.lastName).isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.lastName && !validateField('lastName', formData.lastName).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validateField('lastName', formData.lastName).message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.dateOfBirth ? (validateField('dateOfBirth', formData.dateOfBirth).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                  }`}
                />
                {formData.dateOfBirth && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validateField('dateOfBirth', formData.dateOfBirth).isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.dateOfBirth && !validateField('dateOfBirth', formData.dateOfBirth).isValid && (
                <p className="text-red-500 text-sm mt-1">{validateField('dateOfBirth', formData.dateOfBirth).message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.address ? (validateField('address', formData.address).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                  }`}
                  placeholder="Enter your street address"
                />
                {formData.address && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validateField('address', formData.address).isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.address && !validateField('address', formData.address).isValid && (
                <p className="text-red-500 text-sm mt-1">{validateField('address', formData.address).message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.city ? (validateField('city', formData.city).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="Enter your city"
                  />
                  {formData.city && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateField('city', formData.city).isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.city && !validateField('city', formData.city).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validateField('city', formData.city).message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.state ? (validateField('state', formData.state).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="Enter your state"
                  />
                  {formData.state && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateField('state', formData.state).isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.state && !validateField('state', formData.state).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validateField('state', formData.state).message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.zipCode ? (validateField('zipCode', formData.zipCode).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="12345 or 12345-6789"
                  />
                  {formData.zipCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateField('zipCode', formData.zipCode).isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.zipCode && !validateField('zipCode', formData.zipCode).isValid && (
                  <p className="text-red-500 text-sm mt-1">{validateField('zipCode', formData.zipCode).message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Security Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ssnFocused ? ssnDisplayValue : (formData.socialSecurityNumber ? '***-**-****' : '')}
                  onChange={(e) => {
                    // Extract only digits from the input
                    const digits = e.target.value.replace(/\D/g, '');
                    // Limit to 9 digits
                    const limitedDigits = digits.substring(0, 9);
                    // Format with dashes
                    const formatted = formatSSN(limitedDigits);
                    setSsnDisplayValue(formatted);
                    updateFormData('socialSecurityNumber', formatted);
                  }}
                  onFocus={() => {
                    setSsnFocused(true);
                    setSsnDisplayValue(formData.socialSecurityNumber);
                  }}
                  onBlur={() => setSsnFocused(false)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    formData.socialSecurityNumber ? (validateField('socialSecurityNumber', formData.socialSecurityNumber).isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                  }`}
                  placeholder={ssnFocused ? "123-45-6789" : "XXX-XX-XXXX"}
                  maxLength={11}
                />
                {formData.socialSecurityNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validateField('socialSecurityNumber', formData.socialSecurityNumber).isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.socialSecurityNumber && !validateField('socialSecurityNumber', formData.socialSecurityNumber).isValid && (
                <p className="text-red-500 text-sm mt-1">{validateField('socialSecurityNumber', formData.socialSecurityNumber).message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Click to view full number, click away to mask for security. Auto-formats as you type.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Medical Information</h3>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="medicalPermission"
                  checked={formData.medicalRecordsPermission}
                  onChange={(e) => updateFormData('medicalRecordsPermission', e.target.checked)}
                  className="mt-1 mr-3"
                />
                <div>
                  <label htmlFor="medicalPermission" className="text-sm font-medium text-gray-900">
                    Permission to Access Medical Records *
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    I authorize the Social Security Administration to access my medical records 
                    from my doctors and hospitals for the purpose of processing my disability benefits application.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Medical Records (PDF)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('medicalRecordsFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="medicalRecordsUpload"
                />
                <label htmlFor="medicalRecordsUpload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PDF files only, max 10MB. Include all relevant medical documentation.
                </p>
                {formData.medicalRecordsFile && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600">
                      {formData.medicalRecordsFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Financial Information</h3>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Required Documents:</strong> Please upload documents that show proof of your current income, 
                    such as pay stubs, W-2s, or tax returns.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Income Documents (PDF) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('incomeDocumentsFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="incomeDocumentsUpload"
                />
                <label htmlFor="incomeDocumentsUpload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PDF files only, max 10MB. Include pay stubs, W-2s, or tax returns
                </p>
                {formData.incomeDocumentsFile && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600">
                      {formData.incomeDocumentsFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Accepted Document Types:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  Pay stubs (most recent 3 months)
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  W-2 forms (most recent year)
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  Tax returns (most recent year)
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  Bank statements showing income deposits
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  Unemployment benefit statements
                </li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Review Your Application</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                </div>
                <div>
                  <span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {formData.address}, {formData.city}, {formData.state} {formData.zipCode}
                </div>
                <div>
                  <span className="font-medium">SSN:</span> ***-**-{formData.socialSecurityNumber.slice(-4)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Medical Records Permission:</span> 
                  <span className={formData.medicalRecordsPermission ? 'text-green-600' : 'text-red-600'}>
                    {formData.medicalRecordsPermission ? ' Granted' : ' Not Granted'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Medical Records File:</span> 
                  <span className={formData.medicalRecordsFile ? 'text-green-600' : 'text-gray-500'}>
                    {formData.medicalRecordsFile ? ` ${formData.medicalRecordsFile.name}` : ' Not uploaded'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h4>
              <div className="text-sm">
                <div>
                  <span className="font-medium">Income Documents:</span> 
                  <span className={formData.incomeDocumentsFile ? 'text-green-600' : 'text-red-600'}>
                    {formData.incomeDocumentsFile ? ` ${formData.incomeDocumentsFile.name}` : ' Not uploaded'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Important:</strong> By submitting this application, you certify that all information 
                    provided is true and accurate to the best of your knowledge.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If showing interlude screen, render that instead
  if (showInterlude) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="mb-8">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Thank you for submitting your disability benefits application.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="text-left max-w-2xl mx-auto space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">1</div>
                <div>
                  <p className="font-medium text-gray-900">Application Review</p>
                  <p className="text-gray-600">Our team will review your submitted documents and information.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">2</div>
                <div>
                  <p className="font-medium text-gray-900">Medical Records Verification</p>
                  <p className="text-gray-600">We'll contact your healthcare providers to verify your medical information.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-4">3</div>
                <div>
                  <p className="font-medium text-gray-900">Decision Notification</p>
                  <p className="text-gray-600">You'll receive a notification about the status of your application.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <h4 className="text-xl font-semibold text-green-900 mb-2">Estimated Time for Approval</h4>
            <p className="text-3xl font-bold text-green-600">1-2 Days</p>
            <p className="text-sm text-gray-600 mt-2">You will be notified via email once a decision has been made.</p>
          </div>

          <button
            onClick={handleGoToDashboard}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Timeline */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = isStepComplete(step.id);
            const isCurrent = currentStep === step.id;
            // For step 4 (Review & Submit), make it green only after successful submission
            const showAsComplete = step.id === 4 ? isSubmitted : isComplete;
            const isPast = currentStep > step.id || showAsComplete;
            
            return (
              <div key={step.id} className="flex items-center relative flex-1">
                <div className="flex flex-col items-center relative z-10">
                  {/* Icon Circle */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    showAsComplete 
                      ? 'bg-green-500 border-green-500 text-white scale-110' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white scale-110' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {showAsComplete ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isCurrent ? 'text-blue-600' : showAsComplete ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>
        )}

        {currentStep < steps.length ? (
          <button
            onClick={nextStep}
            disabled={!isStepComplete(currentStep)}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 ${
              isStepComplete(currentStep)
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 bg-green-600 text-white hover:bg-green-700"
          >
            <span>Submit Application</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
