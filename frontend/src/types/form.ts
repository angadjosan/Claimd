export interface Spouse {
  spouse_name: string;
  spouse_ssn: string;
  spouse_birthdate: string;
  marriage_start_date: string;
  marriage_end_date?: string;
  marriage_place_city: string;
  marriage_place_state_or_country: string;
}

export interface Child {
  child_name: string;
  child_date_of_birth: string;
  child_status: {
    disabled_before_22: boolean;
    under_18_unmarried: boolean;
    age_18_to_19_in_secondary_school_full_time: boolean;
  };
}

export interface DirectDeposit {
  type: 'domestic' | 'international' | 'none';
  domestic?: {
    account_type: string;
    account_number: string;
    bank_routing_transit_number: string;
  };
  international?: {
    country: string;
    bank_name: string;
    bank_code: string;
    currency: string;
    account_type: string;
    account_number: string;
    branch_or_transit_number?: string;
  };
}

export interface EmergencyContact {
  contact_name: string;
  relationship?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  phone_number: string;
  notes?: string;
}

export interface Job {
  job_title: string;
  employer_name: string;
  employment_start_date: string;
  employment_end_date?: string;
  total_earnings: string;
  job_duties_summary: string;
  employer_address: string;
}

export interface SelfEmployment {
  business_type: string;
  net_income_total: string;
  tax_year: string;
}

export interface ServiceRecord {
  branch: string;
  type_of_duty: string;
  service_start_date: string;
  service_end_date: string;
}

export interface Education {
  level: string;
  date_completed: string;
}

export interface SpecialEducation {
  school_name: string;
  city: string;
  state: string;
}

export interface JobTraining {
  program_name: string;
  date_completed: string;
}

export interface EarningsRecord {
  year: string;
  total_earnings: string;
}

export interface DisabilityBenefit {
  type: 'workers_compensation' | 'black_lung' | 'longshore_harbor_workers_comp' | 'civil_service_disability_retirement' | 'federal_employees_retirement' | 'federal_employees_compensation' | 'state_local_disability_insurance' | 'military_disability' | 'other';
  status: 'filed' | 'received' | 'intend_to_file';
  payment_type: 'temporary' | 'permanent' | 'annuity' | 'lump_sum';
  payer: 'employer' | 'employer_insurance' | 'private_agency' | 'federal_government' | 'state_government' | 'local_government' | 'other';
  details?: string;
}

export interface MedicalCondition {
  condition_name: string;
  date_began: string;
  how_it_limits_activities: string;
  treatment_received: string;
}

export interface FunctionalLimitations {
  walking?: string;
  sitting?: string;
  standing?: string;
  lifting?: string;
  carrying?: string;
  understanding_instructions?: string;
  remembering_instructions?: string;
  other?: string;
}

export interface HealthcareProvider {
  name: string;
  address: string;
  phone_number: string;
  patient_id_number?: string;
  dates_of_exams_and_treatments: string;
}

export interface MedicalTest {
  test_name: string;
  test_date: string;
  ordered_by: string;
  results_summary: string;
}

export interface Medication {
  medication_name: string;
  type: 'prescription' | 'non_prescription';
  reason: string;
  prescribed_by: string;
}

export interface EvidenceDocument {
  document_type: 'medical_records' | 'doctors_report' | 'test_results' | 'other';
  description: string;
  file: File | null;
}

export interface OtherRecordSource {
  type: 'vocational_rehabilitation' | 'public_welfare' | 'prison_or_jail' | 'attorney' | 'other';
  name_or_description: string;
  contact_info?: string;
}

export interface FormData {
  // Step 1: Personal Info
  birthdate: string;
  birthplace: string;
  ssn: string;
  permanent_resident_card: File | null;

  // Step 2: Marital Status
  spouses: Spouse[];

  // Step 3: Children
  children: Child[];

  // Step 4: Direct Deposit
  direct_deposit: DirectDeposit;

  // Step 5: Emergency Contact
  contact_who_knows_your_condition: EmergencyContact;

  // Step 6: Employment History
  date_condition_began_affecting_work_ability: string;
  non_self_employment: Job[];
  self_employment: SelfEmployment[];

  // Step 7: Military & Education
  served_in_us_military: boolean;
  service_records: ServiceRecord[];
  education: Education[];
  special_education: SpecialEducation[];
  job_training: JobTraining[];

  // Step 8: Earnings & Benefits
  earnings_history: EarningsRecord[];
  disability_benefits: DisabilityBenefit[];

  // Step 9: Medical Conditions
  conditions: MedicalCondition[];
  functional_limitations: FunctionalLimitations;

  // Step 10: Healthcare Providers
  healthcare_providers: HealthcareProvider[];
  tests: MedicalTest[];
  medications: Medication[];

  // Step 11: Medical Evidence
  evidence_documents: EvidenceDocument[];
  other_record_sources: OtherRecordSource[];

  // Step 12: Document Uploads
  social_security_statement: File | null;
  birth_certificate: File | null;
  citizenship_proof: File | null;
  military_discharge_papers: File | null;
  w2_forms: { year: string; file: File | null }[];
  self_employment_tax_returns: { year: string; file: File | null }[];
  workers_comp_proof: { type: 'award_letter' | 'pay_stub' | 'settlement_agreement' | 'other'; description: string; file: File | null }[];
}

export const initialFormData: FormData = {
  birthdate: '',
  birthplace: '',
  ssn: '',
  permanent_resident_card: null,
  spouses: [],
  children: [],
  direct_deposit: { type: '' as any },
  contact_who_knows_your_condition: {
    contact_name: '',
    address: { street: '', city: '', state: '', zip: '', country: '' },
    phone_number: ''
  },
  date_condition_began_affecting_work_ability: '',
  non_self_employment: [],
  self_employment: [],
  served_in_us_military: false,
  service_records: [],
  education: [],
  special_education: [],
  job_training: [],
  earnings_history: [],
  disability_benefits: [],
  conditions: [],
  functional_limitations: {},
  healthcare_providers: [],
  tests: [],
  medications: [],
  evidence_documents: [],
  other_record_sources: [],
  social_security_statement: null,
  birth_certificate: null,
  citizenship_proof: null,
  military_discharge_papers: null,
  w2_forms: [],
  self_employment_tax_returns: [],
  workers_comp_proof: []
};
