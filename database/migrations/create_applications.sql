CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to the applicant who submitted
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Application status tracking
  status application_status NOT NULL DEFAULT 'draft',
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  status_notes TEXT,
  
  -- ========================================
  -- YOUR INFO SECTION
  -- ========================================
  
  -- Basic personal info
  birthdate DATE,
  birthplace TEXT,
  
  -- SSN stored as hash (use hash_ssn function to store, verify_ssn to check)
  -- NOTE: Original SSN is NEVER stored, only the hash
  ssn_hash TEXT,
  
  -- Permanent resident card file reference (for non-US residents)
  permanent_resident_card_file_id UUID,
  
  -- Spouses (array of spouse objects)
  -- Current spouse comes first, prior spouses only if marriage > 10 years or ended in death
  spouses JSONB DEFAULT '[]'::JSONB,
  
  -- Children
  children JSONB DEFAULT '[]'::JSONB,
  
  -- Direct deposit information
  direct_deposit_type direct_deposit_type DEFAULT 'none',
  direct_deposit_domestic JSONB,  -- {account_type, account_number_encrypted, routing_number}
  direct_deposit_international JSONB, -- {country, bank_name, bank_code, currency, account_type, account_number_encrypted, branch_transit_number}
  
  -- Emergency contact who knows applicant's condition
  emergency_contact JSONB,
  
  -- ========================================
  -- EMPLOYMENT SECTION
  -- ========================================
  
  -- Earnings history by year
  earnings_history JSONB DEFAULT '[]'::JSONB,
  
  -- When condition began affecting work
  date_condition_began_affecting_work DATE,
  
  -- Military service
  served_in_us_military BOOLEAN DEFAULT FALSE,
  military_service_records JSONB DEFAULT '[]'::JSONB,
  
  -- Employment history (non-self-employment)
  employment_history JSONB DEFAULT '[]'::JSONB,
  
  -- Self-employment history
  self_employment_history JSONB DEFAULT '[]'::JSONB,
  
  -- Education
  education JSONB DEFAULT '[]'::JSONB,
  
  -- Special education
  special_education JSONB DEFAULT '[]'::JSONB,
  
  -- Job training
  job_training JSONB DEFAULT '[]'::JSONB,
  
  -- Other disability benefits filed or received
  disability_benefits JSONB DEFAULT '[]'::JSONB,
  
  -- ========================================
  -- MEDICAL SECTION
  -- ========================================
  
  -- Medical conditions
  conditions JSONB DEFAULT '[]'::JSONB,
  
  -- Functional limitations
  functional_limitations JSONB,
  
  -- Healthcare providers
  healthcare_providers JSONB DEFAULT '[]'::JSONB,
  
  -- Medical tests
  medical_tests JSONB DEFAULT '[]'::JSONB,
  
  -- Medications
  medications JSONB DEFAULT '[]'::JSONB,
  
  -- Medical evidence documents (references to file storage)
  evidence_documents JSONB DEFAULT '[]'::JSONB,
  
  -- Other record sources
  other_record_sources JSONB DEFAULT '[]'::JSONB,
  
  -- ========================================
  -- DOCUMENTS SECTION (file references)
  -- ========================================
  
  -- Social security statement PDF
  social_security_statement_file_id UUID,
  
  -- Birth certificate
  birth_certificate_file_id UUID,
  
  -- Citizenship proof (if not US born)
  citizenship_proof_file_id UUID,
  
  -- Military discharge papers (DD-214, if served before 1968)
  military_discharge_papers_file_id UUID,
  
  -- W2 forms by year
  w2_forms JSONB DEFAULT '[]'::JSONB,
  
  -- Self-employment tax returns by year
  self_employment_tax_returns JSONB DEFAULT '[]'::JSONB,
  
  -- Workers comp proof documents
  workers_comp_proof JSONB DEFAULT '[]'::JSONB,
  
  -- ========================================
  -- METADATA & AUDIT
  -- ========================================
  
  -- Form progress tracking
  current_step INTEGER DEFAULT 1,
  steps_completed JSONB DEFAULT '[]'::JSONB,
  
  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Version for optimistic locking
  version INTEGER DEFAULT 1
);

-- Indexes for common queries
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX idx_applications_created_at ON applications(created_at);

-- GIN index for JSONB searches
CREATE INDEX idx_applications_conditions ON applications USING GIN (conditions);
CREATE INDEX idx_applications_spouses ON applications USING GIN (spouses);

-- Trigger for updated_at
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Comments for documentation
COMMENT ON TABLE applications IS 'Social Security disability applications with all form data';
COMMENT ON COLUMN applications.ssn_hash IS 'SHA-256 hash of SSN - original SSN is NEVER stored';
COMMENT ON COLUMN applications.spouses IS 'Array of spouse objects. Current spouse first, prior only if marriage > 10 years or ended in death';
COMMENT ON COLUMN applications.children IS 'Array of child objects with eligibility status';
COMMENT ON COLUMN applications.direct_deposit_domestic IS 'Encrypted domestic bank account details';
COMMENT ON COLUMN applications.direct_deposit_international IS 'Encrypted international bank account details';
