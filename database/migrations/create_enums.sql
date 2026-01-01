-- User roles enum
CREATE TYPE user_role AS ENUM ('applicant', 'administrator', 'caseworker');

-- Application status enum
CREATE TYPE application_status AS ENUM (
  'draft',           -- Application started but not submitted
  'submitted',       -- Application submitted, awaiting initial review
  'under_review',    -- Application is being reviewed by caseworkers
  'additional_info', -- Additional information requested from applicant
  'approved',        -- Application approved
  'denied',          -- Application denied
  'appealed',        -- Applicant has appealed the decision
  'closed'           -- Application closed (withdrawn or final)
);

-- Review status enum (for assigned_applications)
CREATE TYPE review_status AS ENUM (
  'unopened',    -- Reviewer has not yet opened the application
  'in_progress', -- Reviewer is currently reviewing
  'completed'    -- Reviewer has completed their review
);

-- Direct deposit type enum
CREATE TYPE direct_deposit_type AS ENUM ('domestic', 'international', 'none');

-- Bank account type enum
CREATE TYPE bank_account_type AS ENUM ('checking', 'savings');

-- Disability benefit type enum
CREATE TYPE disability_benefit_type AS ENUM (
  'workers_compensation',
  'black_lung',
  'longshore_harbor_workers_comp',
  'civil_service_disability_retirement',
  'federal_employees_retirement',
  'federal_employees_compensation',
  'state_local_disability_insurance',
  'military_disability',
  'other'
);

-- Disability benefit status enum
CREATE TYPE disability_benefit_status AS ENUM ('filed', 'received', 'intend_to_file');

-- Payment type enum
CREATE TYPE payment_type AS ENUM ('temporary', 'permanent', 'annuity', 'lump_sum');

-- Payer type enum
CREATE TYPE payer_type AS ENUM (
  'employer',
  'employer_insurance',
  'private_agency',
  'federal_government',
  'state_government',
  'local_government',
  'other'
);

-- Document type enum
CREATE TYPE evidence_document_type AS ENUM ('medical_records', 'doctors_report', 'test_results', 'other');

-- Medication type enum
CREATE TYPE medication_type AS ENUM ('prescription', 'non_prescription');

-- Other record source type enum
CREATE TYPE record_source_type AS ENUM (
  'vocational_rehabilitation',
  'public_welfare',
  'prison_or_jail',
  'attorney',
  'other'
);

-- Workers comp proof type enum
CREATE TYPE workers_comp_proof_type AS ENUM ('award_letter', 'pay_stub', 'settlement_agreement', 'other');
