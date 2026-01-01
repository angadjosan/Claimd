import { z } from 'zod';

// Helper for File validation
// In a browser environment, File is available globally.
// We allow null because the initial state has nulls.
const fileSchema = z.any().nullable().optional();

// Date validation helper - ensures date is not in the future and not more than 200 years in the past
const dateValidation = z.string().min(1).refine((dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const twoHundredYearsAgo = new Date();
  twoHundredYearsAgo.setFullYear(now.getFullYear() - 200);
  
  return date <= now && date >= twoHundredYearsAgo;
}, {
  message: "Date must not be in the future and not more than 200 years in the past"
});

// Date validation for birthdates - allows dates up to today (not in future)
const birthdateValidation = z.string().min(1).refine((dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const twoHundredYearsAgo = new Date();
  twoHundredYearsAgo.setFullYear(now.getFullYear() - 200);
  
  return date <= now && date >= twoHundredYearsAgo;
}, {
  message: "Birthdate must not be in the future and not more than 200 years in the past"
});

// Year validation - must be a valid 4-digit year, not in the future, and reasonable (1900+)
const yearValidation = z.string().min(1).refine((yearStr) => {
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  return !isNaN(year) && year >= 1900 && year <= currentYear && yearStr.length === 4;
}, {
  message: "Year must be a valid 4-digit year between 1900 and current year"
}); 

export const spouseSchema = z.object({
  spouse_name: z.string().min(1, "Spouse name is required"),
  spouse_ssn: z.string().min(1, "Spouse SSN is required").regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  spouse_birthdate: birthdateValidation,
  marriage_start_date: dateValidation,
  marriage_end_date: z.string().optional().refine((dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    const twoHundredYearsAgo = new Date();
    twoHundredYearsAgo.setFullYear(now.getFullYear() - 200);
    return date <= now && date >= twoHundredYearsAgo;
  }, {
    message: "Date must not be in the future and not more than 200 years in the past"
  }),
  marriage_place_city: z.string().min(1, "City is required"),
  marriage_place_state_or_country: z.string().min(1, "State/Country is required"),
});

export const childSchema = z.object({
  child_name: z.string().min(1, "Child name is required"),
  child_date_of_birth: birthdateValidation,
  child_status: z.object({
    disabled_before_22: z.boolean(),
    under_18_unmarried: z.boolean(),
    age_18_to_19_in_secondary_school_full_time: z.boolean(),
  }),
});

export const directDepositSchema = z.object({
  type: z.string().min(1, "Deposit type is required"),
  domestic: z.object({
    account_type: z.string().optional(),
    account_number: z.string().optional(),
    bank_routing_transit_number: z.string().optional(),
  }).optional().nullable(),
  international: z.object({
    country: z.string().optional(),
    bank_name: z.string().optional(),
    bank_code: z.string().optional(),
    currency: z.string().optional(),
    account_type: z.string().optional(),
    account_number: z.string().optional(),
    branch_or_transit_number: z.string().optional(),
  }).optional().nullable(),
}).superRefine((data, ctx) => {
  if (!['domestic', 'international', 'none'].includes(data.type)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a deposit type", path: ["type"] });
    return;
  }
  if (data.type === 'domestic') {
    if (!data.domestic) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Domestic account details are required", path: ["domestic"] });
      return;
    }
    if (!data.domestic.account_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account type is required", path: ["domestic", "account_type"] });
    }
    if (!data.domestic.account_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required", path: ["domestic", "account_number"] });
    }
    if (!data.domestic.bank_routing_transit_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Routing number is required", path: ["domestic", "bank_routing_transit_number"] });
    }
  }
  if (data.type === 'international') {
    if (!data.international) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "International account details are required", path: ["international"] });
      return;
    }
    if (!data.international.country) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Country is required", path: ["international", "country"] });
    }
    if (!data.international.bank_name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required", path: ["international", "bank_name"] });
    }
    if (!data.international.bank_code) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank code is required", path: ["international", "bank_code"] });
    }
    if (!data.international.currency) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Currency is required", path: ["international", "currency"] });
    }
    if (!data.international.account_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account type is required", path: ["international", "account_type"] });
    }
    if (!data.international.account_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required", path: ["international", "account_number"] });
    }
  }
});

export const emergencyContactSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  relationship: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "Zip is required"),
    country: z.string().min(1, "Country is required"),
  }),
  phone_number: z.string().min(1, "Phone number is required"),
  notes: z.string().optional(),
});

export const jobSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  employer_name: z.string().min(1, "Employer name is required"),
  employment_start_date: dateValidation,
  employment_end_date: z.string().optional().refine((dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();
    const twoHundredYearsAgo = new Date();
    twoHundredYearsAgo.setFullYear(now.getFullYear() - 200);
    return date <= now && date >= twoHundredYearsAgo;
  }, {
    message: "Date must not be in the future and not more than 200 years in the past"
  }),
  total_earnings: z.string().min(1, "Total earnings is required"),
  job_duties_summary: z.string().min(1, "Job duties summary is required"),
  employer_address: z.string().min(1, "Employer address is required"),
});

export const selfEmploymentSchema = z.object({
  business_type: z.string().min(1, "Business type is required"),
  net_income_total: z.string().min(1, "Net income is required"),
  tax_year: yearValidation,
});

export const serviceRecordSchema = z.object({
  branch: z.string().min(1, "Branch is required"),
  type_of_duty: z.string().min(1, "Type of duty is required"),
  service_start_date: dateValidation,
  service_end_date: dateValidation,
});

export const educationSchema = z.object({
  level: z.string().min(1, "Level is required"),
  date_completed: dateValidation,
});

export const specialEducationSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export const jobTrainingSchema = z.object({
  program_name: z.string().min(1, "Program name is required"),
  date_completed: dateValidation,
});

export const earningsRecordSchema = z.object({
  year: yearValidation,
  total_earnings: z.string().min(1, "Total earnings is required"),
});

export const disabilityBenefitSchema = z.object({
  type: z.enum(['workers_compensation', 'black_lung', 'longshore_harbor_workers_comp', 'civil_service_disability_retirement', 'federal_employees_retirement', 'federal_employees_compensation', 'state_local_disability_insurance', 'military_disability', 'other']),
  status: z.enum(['filed', 'received', 'intend_to_file']),
  payment_type: z.enum(['temporary', 'permanent', 'annuity', 'lump_sum']),
  payer: z.enum(['employer', 'employer_insurance', 'private_agency', 'federal_government', 'state_government', 'local_government', 'other']),
  details: z.string().optional(),
});

export const medicalConditionSchema = z.object({
  condition_name: z.string().min(1, "Condition name is required"),
  date_began: dateValidation,
  how_it_limits_activities: z.string().min(1, "Description of limitations is required"),
  treatment_received: z.string().min(1, "Treatment received is required"),
});

export const functionalLimitationsSchema = z.object({
  walking: z.string().optional(),
  sitting: z.string().optional(),
  standing: z.string().optional(),
  lifting: z.string().optional(),
  carrying: z.string().optional(),
  understanding_instructions: z.string().optional(),
  remembering_instructions: z.string().optional(),
  other: z.string().optional(),
});

export const healthcareProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  patient_id_number: z.string().optional(),
  dates_of_exams_and_treatments: z.string().min(1, "Dates are required"),
});

export const medicalTestSchema = z.object({
  test_name: z.string().min(1, "Test name is required"),
  test_date: dateValidation,
  ordered_by: z.string().min(1, "Ordered by is required"),
  results_summary: z.string().min(1, "Results summary is required"),
});

export const medicationSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required"),
  type: z.enum(['prescription', 'non_prescription']),
  reason: z.string().min(1, "Reason is required"),
  prescribed_by: z.string().min(1, "Prescribed by is required"),
});

export const evidenceDocumentSchema = z.object({
  document_type: z.enum(['medical_records', 'doctors_report', 'test_results', 'other']),
  description: z.string().min(1, "Description is required"),
  file: fileSchema,
});

export const otherRecordSourceSchema = z.object({
  type: z.enum(['vocational_rehabilitation', 'public_welfare', 'prison_or_jail', 'attorney', 'other']),
  name_or_description: z.string().min(1, "Name or description is required"),
  contact_info: z.string().optional(),
});

// Step Schemas
export const step1Schema = z.object({
  birthdate: birthdateValidation,
  birthplace: z.string().min(1, "Birthplace is required"),
  ssn: z.string().min(1, "SSN is required").regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
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
  date_condition_began_affecting_work_ability: dateValidation,
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
  w2_forms: z.array(z.object({ year: yearValidation, file: fileSchema })),
  self_employment_tax_returns: z.array(z.object({ year: yearValidation, file: fileSchema })),
  workers_comp_proof: z.array(z.object({ type: z.enum(['award_letter', 'pay_stub', 'settlement_agreement', 'other']), description: z.string(), file: fileSchema })),
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
