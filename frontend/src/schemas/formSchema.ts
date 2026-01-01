import { z } from 'zod';

// Helper for File validation
// In a browser environment, File is available globally.
// We allow null because the initial state has nulls.
const fileSchema = z.any().nullable().optional(); 

export const spouseSchema = z.object({
  spouse_name: z.string().min(1, "Spouse name is required"),
  spouse_ssn: z.string().min(1, "Spouse SSN is required"), // You might want stricter validation
  spouse_birthdate: z.string().min(1, "Spouse birthdate is required"),
  marriage_start_date: z.string().min(1, "Marriage start date is required"),
  marriage_end_date: z.string().optional(),
  marriage_place_city: z.string().min(1, "City is required"),
  marriage_place_state_or_country: z.string().min(1, "State/Country is required"),
});

export const childSchema = z.object({
  child_name: z.string().min(1, "Child name is required"),
  child_date_of_birth: z.string().min(1, "Child birthdate is required"),
  child_status: z.object({
    disabled_before_22: z.boolean(),
    under_18_unmarried: z.boolean(),
    age_18_to_19_in_secondary_school_full_time: z.boolean(),
  }),
});

export const directDepositSchema = z.object({
  type: z.enum(['domestic', 'international', 'none']),
  domestic: z.object({
    account_type: z.string().min(1, "Account type is required"),
    account_number: z.string().min(1, "Account number is required"),
    bank_routing_transit_number: z.string().min(1, "Routing number is required"),
  }).optional(),
  international: z.object({
    country: z.string().min(1, "Country is required"),
    bank_name: z.string().min(1, "Bank name is required"),
    bank_code: z.string().min(1, "Bank code is required"),
    currency: z.string().min(1, "Currency is required"),
    account_type: z.string().min(1, "Account type is required"),
    account_number: z.string().min(1, "Account number is required"),
    branch_or_transit_number: z.string().optional(),
  }).optional(),
}).refine((data) => {
  if (data.type === 'domestic') return !!data.domestic;
  if (data.type === 'international') return !!data.international;
  return true;
}, {
  message: "Direct deposit details are required for the selected type",
  path: ["type"],
});

export const emergencyContactSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  relationship: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "Zip is required"),
    country: z.string().optional(),
  }),
  phone_number: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
});

export const jobSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  employer_name: z.string().min(1, "Employer name is required"),
  employment_start_date: z.string().min(1, "Start date is required"),
  employment_end_date: z.string().optional(),
  total_earnings: z.string().min(1, "Total earnings is required"),
  job_duties_summary: z.string().min(1, "Job duties summary is required"),
  employer_address: z.string().min(1, "Employer address is required"),
});

export const selfEmploymentSchema = z.object({
  business_type: z.string().min(1, "Business type is required"),
  net_income_total: z.string().min(1, "Net income is required"),
  tax_year: z.string().min(1, "Tax year is required"),
});

export const serviceRecordSchema = z.object({
  branch: z.string().min(1, "Branch is required"),
  type_of_duty: z.string().min(1, "Type of duty is required"),
  service_start_date: z.string().min(1, "Start date is required"),
  service_end_date: z.string().min(1, "End date is required"),
});

export const educationSchema = z.object({
  level: z.string().min(1, "Level is required"),
  date_completed: z.string().min(1, "Date completed is required"),
});

export const specialEducationSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export const jobTrainingSchema = z.object({
  program_name: z.string().min(1, "Program name is required"),
  date_completed: z.string().min(1, "Date completed is required"),
});

export const earningsRecordSchema = z.object({
  year: z.string().min(1, "Year is required"),
  total_earnings: z.string().min(1, "Total earnings is required"),
});

export const disabilityBenefitSchema = z.object({
  type: z.string().min(1, "Type is required"),
  status: z.enum(['filed', 'received', 'intend_to_file']),
  payment_type: z.enum(['temporary', 'permanent', 'annuity', 'lump_sum']),
  payer: z.string().min(1, "Payer is required"),
  details: z.string().optional(),
});

export const medicalConditionSchema = z.object({
  condition_name: z.string().min(1, "Condition name is required"),
  date_began: z.string().min(1, "Date began is required"),
  how_it_limits_activities: z.string().min(1, "Description of limitations is required"),
  treatment_received: z.string().min(1, "Treatment received is required"),
});

export const functionalLimitationsSchema = z.object({
  walking: z.boolean().optional(),
  sitting: z.boolean().optional(),
  standing: z.boolean().optional(),
  lifting: z.boolean().optional(),
  carrying: z.boolean().optional(),
  understanding_instructions: z.boolean().optional(),
  remembering_instructions: z.boolean().optional(),
  other: z.string().optional(),
});

export const healthcareProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  patient_id_number: z.string().min(1, "Patient ID is required"),
  dates_of_exams_and_treatments: z.string().min(1, "Dates are required"),
});

export const medicalTestSchema = z.object({
  test_name: z.string().min(1, "Test name is required"),
  test_date: z.string().min(1, "Test date is required"),
  ordered_by: z.string().min(1, "Ordered by is required"),
  results_summary: z.string().min(1, "Results summary is required"),
});

export const medicationSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required"),
  type: z.enum(['prescription', 'non-prescription']),
  reason: z.string().min(1, "Reason is required"),
  prescribed_by: z.string().min(1, "Prescribed by is required"),
});

export const evidenceDocumentSchema = z.object({
  document_type: z.enum(['medical_records', 'doctors_report', 'test_results', 'other']),
  description: z.string().min(1, "Description is required"),
  file: fileSchema,
});

export const otherRecordSourceSchema = z.object({
  type: z.string().min(1, "Type is required"),
  name_or_description: z.string().min(1, "Name or description is required"),
  contact_info: z.string().optional(),
});

// Step Schemas
export const step1Schema = z.object({
  birthdate: z.string().min(1, "Birthdate is required"),
  birthplace: z.string().min(1, "Birthplace is required"),
  ssn: z.string().min(9, "SSN must be at least 9 characters"),
  permanent_resident_card: fileSchema,
});

export const step2Schema = z.object({
  spouses: z.array(spouseSchema),
});

export const step3Schema = z.object({
  children: z.array(childSchema),
});

export const step4Schema = z.object({
  direct_deposit: directDepositSchema,
});

export const step5Schema = z.object({
  contact_who_knows_your_condition: emergencyContactSchema,
});

export const step6Schema = z.object({
  date_condition_began_affecting_work_ability: z.string().min(1, "Date is required"),
  non_self_employment: z.array(jobSchema),
  self_employment: z.array(selfEmploymentSchema),
});

export const step7Schema = z.object({
  served_in_us_military: z.boolean(),
  service_records: z.array(serviceRecordSchema),
  education: z.array(educationSchema),
  special_education: z.array(specialEducationSchema),
  job_training: z.array(jobTrainingSchema),
});

export const step8Schema = z.object({
  earnings_history: z.array(earningsRecordSchema),
  disability_benefits: z.array(disabilityBenefitSchema),
});

export const step9Schema = z.object({
  conditions: z.array(medicalConditionSchema).min(1, "At least one medical condition is required"),
  functional_limitations: functionalLimitationsSchema,
});

export const step10Schema = z.object({
  healthcare_providers: z.array(healthcareProviderSchema),
  tests: z.array(medicalTestSchema),
  medications: z.array(medicationSchema),
});

export const step11Schema = z.object({
  evidence_documents: z.array(evidenceDocumentSchema),
  other_record_sources: z.array(otherRecordSourceSchema),
});

export const step12Schema = z.object({
  social_security_statement: fileSchema,
  birth_certificate: fileSchema,
  citizenship_proof: fileSchema,
  military_discharge_papers: fileSchema,
  w2_forms: z.array(z.object({ year: z.string(), file: fileSchema })),
  self_employment_tax_returns: z.array(z.object({ year: z.string(), file: fileSchema })),
  workers_comp_proof: z.array(z.object({ type: z.string(), description: z.string(), file: fileSchema })),
});

// Map step number to schema
export const stepSchemas: Record<number, z.ZodSchema> = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: step6Schema,
  7: step7Schema,
  8: step8Schema,
  9: step9Schema,
  10: step10Schema,
  11: step11Schema,
  12: step12Schema,
  // Step 13 is review, no validation needed usually, or validate full form
};
