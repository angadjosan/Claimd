import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { FormData } from '../types/form';
import { initialFormData } from '../types/form';

// Local storage keys for client-side form state (not server-side drafts)
const FORM_STATE_KEY = 'formState';
const FORM_FILES_KEY = 'formFilesMetadata';

// File metadata for persistence (we can't store actual files in localStorage)
interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface FilesMetadata {
  permanent_resident_card: FileMetadata | null;
  social_security_statement: FileMetadata | null;
  birth_certificate: FileMetadata | null;
  citizenship_proof: FileMetadata | null;
  military_discharge_papers: FileMetadata | null;
  evidence_documents: (FileMetadata | null)[];
  w2_forms: { year: string; file: FileMetadata | null }[];
  self_employment_tax_returns: { year: string; file: FileMetadata | null }[];
  workers_comp_proof: { type: string; description: string; file: FileMetadata | null }[];
}

// Form data without File objects (for JSON serialization)
interface SerializableFormData {
  birthdate: string;
  birthplace: string;
  ssn: string;
  spouses: FormData['spouses'];
  children: FormData['children'];
  direct_deposit: FormData['direct_deposit'];
  contact_who_knows_your_condition: FormData['contact_who_knows_your_condition'];
  date_condition_began_affecting_work_ability: string;
  non_self_employment: FormData['non_self_employment'];
  self_employment: FormData['self_employment'];
  served_in_us_military: boolean;
  service_records: FormData['service_records'];
  education: FormData['education'];
  special_education: FormData['special_education'];
  job_training: FormData['job_training'];
  earnings_history: FormData['earnings_history'];
  disability_benefits: FormData['disability_benefits'];
  conditions: FormData['conditions'];
  functional_limitations: FormData['functional_limitations'];
  healthcare_providers: FormData['healthcare_providers'];
  tests: FormData['tests'];
  medications: FormData['medications'];
  other_record_sources: FormData['other_record_sources'];
  evidence_documents: Array<{ document_type: string; description: string }>;
  w2_forms: Array<{ year: string }>;
  self_employment_tax_returns: Array<{ year: string }>;
  workers_comp_proof: Array<{ type: string; description: string }>;
}

interface FormContextType {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  clearFormData: () => void;
  isLoaded: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: number[];
  markStepCompleted: (step: number) => void;
  // File handling - store files in memory during session
  storedFiles: Map<string, File>;
  storeFile: (key: string, file: File | null) => void;
  getFile: (key: string) => File | null;
  clearFiles: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Store files in memory (can't persist to localStorage)
  const storedFilesRef = useRef<Map<string, File>>(new Map());

  // Get files map for current render
  const storedFiles = storedFilesRef.current;

  // Store a file in memory
  const storeFile = useCallback((key: string, file: File | null) => {
    if (file) {
      storedFilesRef.current.set(key, file);
    } else {
      storedFilesRef.current.delete(key);
    }
  }, []);

  // Get a file from memory
  const getFile = useCallback((key: string): File | null => {
    return storedFilesRef.current.get(key) || null;
  }, []);

  // Clear all stored files
  const clearFiles = useCallback(() => {
    storedFilesRef.current.clear();
  }, []);

  // Extract file metadata for persistence
  const extractFileMetadata = (file: File | null): FileMetadata | null => {
    if (!file) return null;
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
  };

  // Convert form data to serializable format (without File objects)
  const toSerializable = (data: FormData): SerializableFormData => {
    return {
      birthdate: data.birthdate,
      birthplace: data.birthplace,
      ssn: data.ssn,
      spouses: data.spouses,
      children: data.children,
      direct_deposit: data.direct_deposit,
      contact_who_knows_your_condition: data.contact_who_knows_your_condition,
      date_condition_began_affecting_work_ability: data.date_condition_began_affecting_work_ability,
      non_self_employment: data.non_self_employment,
      self_employment: data.self_employment,
      served_in_us_military: data.served_in_us_military,
      service_records: data.service_records,
      education: data.education,
      special_education: data.special_education,
      job_training: data.job_training,
      earnings_history: data.earnings_history,
      disability_benefits: data.disability_benefits,
      conditions: data.conditions,
      functional_limitations: data.functional_limitations,
      healthcare_providers: data.healthcare_providers,
      tests: data.tests,
      medications: data.medications,
      other_record_sources: data.other_record_sources,
      evidence_documents: data.evidence_documents.map(doc => ({
        document_type: doc.document_type,
        description: doc.description,
      })),
      w2_forms: data.w2_forms.map(w2 => ({ year: w2.year })),
      self_employment_tax_returns: data.self_employment_tax_returns.map(ret => ({ year: ret.year })),
      workers_comp_proof: data.workers_comp_proof.map(proof => ({
        type: proof.type,
        description: proof.description,
      })),
    };
  };

  // Save file metadata separately
  const saveFilesMetadata = (data: FormData) => {
    const metadata: FilesMetadata = {
      permanent_resident_card: extractFileMetadata(data.permanent_resident_card),
      social_security_statement: extractFileMetadata(data.social_security_statement),
      birth_certificate: extractFileMetadata(data.birth_certificate),
      citizenship_proof: extractFileMetadata(data.citizenship_proof),
      military_discharge_papers: extractFileMetadata(data.military_discharge_papers),
      evidence_documents: data.evidence_documents.map(doc => extractFileMetadata(doc.file)),
      w2_forms: data.w2_forms.map(w2 => ({
        year: w2.year,
        file: extractFileMetadata(w2.file),
      })),
      self_employment_tax_returns: data.self_employment_tax_returns.map(ret => ({
        year: ret.year,
        file: extractFileMetadata(ret.file),
      })),
      workers_comp_proof: data.workers_comp_proof.map(proof => ({
        type: proof.type,
        description: proof.description,
        file: extractFileMetadata(proof.file),
      })),
    };
    localStorage.setItem(FORM_FILES_KEY, JSON.stringify(metadata));
  };

  // Update form data and optionally auto-save
  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data };
      return updated;
    });
  }, []);

  // Save form data to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const serializable = toSerializable(formData);
      localStorage.setItem(FORM_STATE_KEY, JSON.stringify({
        data: serializable,
        currentStep,
        completedSteps,
        savedAt: new Date().toISOString(),
      }));
      saveFilesMetadata(formData);
    } catch (e) {
      console.error('Failed to save form state', e);
    }
  }, [formData, currentStep, completedSteps]);

  // Load form data from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(FORM_STATE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Restore form data (merge with initial to ensure all fields exist)
        const restoredData = { ...initialFormData, ...parsed.data };
        
        // Restore arrays with file placeholders
        if (parsed.data.evidence_documents) {
          restoredData.evidence_documents = parsed.data.evidence_documents.map((doc: any) => ({
            ...doc,
            file: null, // Files can't be restored from localStorage
          }));
        }
        if (parsed.data.w2_forms) {
          restoredData.w2_forms = parsed.data.w2_forms.map((w2: any) => ({
            ...w2,
            file: null,
          }));
        }
        if (parsed.data.self_employment_tax_returns) {
          restoredData.self_employment_tax_returns = parsed.data.self_employment_tax_returns.map((ret: any) => ({
            ...ret,
            file: null,
          }));
        }
        if (parsed.data.workers_comp_proof) {
          restoredData.workers_comp_proof = parsed.data.workers_comp_proof.map((proof: any) => ({
            ...proof,
            file: null,
          }));
        }

        setFormData(restoredData);
        
        // Restore navigation state
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.completedSteps) {
          setCompletedSteps(parsed.completedSteps);
        }
      }
    } catch (e) {
      console.error('Failed to load form state', e);
    }
    setIsLoaded(true);
  }, []);

  // Clear all form data
  const clearFormData = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setCompletedSteps([]);
    clearFiles();
    localStorage.removeItem(FORM_STATE_KEY);
    localStorage.removeItem(FORM_FILES_KEY);
  }, [clearFiles]);

  // Mark a step as completed
  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps((prev) => {
      if (!prev.includes(step)) {
        return [...prev, step].sort((a, b) => a - b);
      }
      return prev;
    });
  }, []);

  // Load data on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Auto-save when form data changes (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeoutId = setTimeout(() => {
      saveToLocalStorage();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, completedSteps, isLoaded, saveToLocalStorage]);

  const value: FormContextType = {
    formData,
    updateFormData,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearFormData,
    isLoaded,
    currentStep,
    setCurrentStep,
    completedSteps,
    markStepCompleted,
    storedFiles,
    storeFile,
    getFile,
    clearFiles,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}
