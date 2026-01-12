import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { FormData } from '../types/form';
import { initialFormData } from '../types/form';

// Local storage keys for clearing any existing cached data
const FORM_STATE_KEY = 'formState';
const FORM_FILES_KEY = 'formFilesMetadata';

interface FormContextType {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
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
  const [isLoaded] = useState(true);
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

  // Update form data
  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data };
      return updated;
    });
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

  const value: FormContextType = {
    formData,
    updateFormData,
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
