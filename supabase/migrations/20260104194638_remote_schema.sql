drop extension if exists "pg_net";

create extension if not exists "moddatetime" with schema "public";

create type "public"."application_status" as enum ('draft', 'submitted', 'under_review', 'additional_info', 'approved', 'denied', 'appealed', 'closed');

create type "public"."bank_account_type" as enum ('checking', 'savings');

create type "public"."direct_deposit_type" as enum ('domestic', 'international', 'none');

create type "public"."disability_benefit_status" as enum ('filed', 'received', 'intend_to_file');

create type "public"."disability_benefit_type" as enum ('workers_compensation', 'black_lung', 'longshore_harbor_workers_comp', 'civil_service_disability_retirement', 'federal_employees_retirement', 'federal_employees_compensation', 'state_local_disability_insurance', 'military_disability', 'other');

create type "public"."evidence_document_type" as enum ('medical_records', 'doctors_report', 'test_results', 'other');

create type "public"."medication_type" as enum ('prescription', 'non_prescription');

create type "public"."payer_type" as enum ('employer', 'employer_insurance', 'private_agency', 'federal_government', 'state_government', 'local_government', 'other');

create type "public"."payment_type" as enum ('temporary', 'permanent', 'annuity', 'lump_sum');

create type "public"."record_source_type" as enum ('vocational_rehabilitation', 'public_welfare', 'prison_or_jail', 'attorney', 'other');

create type "public"."review_recommendation" as enum ('approve', 'deny', 'request_more_info', 'escalate', 'needs_medical_review');

create type "public"."review_status" as enum ('unopened', 'in_progress', 'completed');

create type "public"."user_role" as enum ('applicant', 'administrator', 'caseworker');

create type "public"."workers_comp_proof_type" as enum ('award_letter', 'pay_stub', 'settlement_agreement', 'other');


create table "public"."app_secrets" (
 "key" text not null,
  "value" text not null
  );


alter table "public"."app_secrets" enable row level security;


  create table "public"."application_files" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "application_id" uuid not null,
    "uploaded_by" uuid not null,
    "file_name" text not null,
    "file_type" text not null,
    "file_size" integer,
    "storage_bucket" text not null default 'application-files'::text,
    "storage_path" text not null,
    "category" text not null,
    "description" text,
    "document_year" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "is_deleted" boolean default false
      );


alter table "public"."application_files" enable row level security;


  create table "public"."application_status_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "application_id" uuid not null,
    "previous_status" public.application_status,
    "new_status" public.application_status not null,
    "changed_by" uuid,
    "notes" text,
    "changed_at" timestamp with time zone not null default now()
      );


alter table "public"."application_status_history" enable row level security;


  create table "public"."applications" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "applicant_id" uuid not null,
    "status" public.application_status not null default 'draft'::public.application_status,
    "status_changed_at" timestamp with time zone default now(),
    "status_notes" text,
    "birthdate" date,
    "birthplace" text,
    "ssn_hash" text,
    "permanent_resident_card_file_id" uuid,
    "spouses" jsonb default '[]'::jsonb,
    "children" jsonb default '[]'::jsonb,
    "direct_deposit_type" public.direct_deposit_type default 'none'::public.direct_deposit_type,
    "direct_deposit_domestic" jsonb,
    "direct_deposit_international" jsonb,
    "emergency_contact" jsonb,
    "earnings_history" jsonb default '[]'::jsonb,
    "date_condition_began_affecting_work" date,
    "served_in_us_military" boolean default false,
    "military_service_records" jsonb default '[]'::jsonb,
    "employment_history" jsonb default '[]'::jsonb,
    "self_employment_history" jsonb default '[]'::jsonb,
    "education" jsonb default '[]'::jsonb,
    "special_education" jsonb default '[]'::jsonb,
    "job_training" jsonb default '[]'::jsonb,
    "disability_benefits" jsonb default '[]'::jsonb,
    "conditions" jsonb default '[]'::jsonb,
    "functional_limitations" jsonb,
    "healthcare_providers" jsonb default '[]'::jsonb,
    "medical_tests" jsonb default '[]'::jsonb,
    "medications" jsonb default '[]'::jsonb,
    "evidence_documents" jsonb default '[]'::jsonb,
    "other_record_sources" jsonb default '[]'::jsonb,
    "social_security_statement_file_id" uuid,
    "birth_certificate_file_id" uuid,
    "citizenship_proof_file_id" uuid,
    "military_discharge_papers_file_id" uuid,
    "w2_forms" jsonb default '[]'::jsonb,
    "self_employment_tax_returns" jsonb default '[]'::jsonb,
    "workers_comp_proof" jsonb default '[]'::jsonb,
    "current_step" integer default 1,
    "steps_completed" jsonb default '[]'::jsonb,
    "submitted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "version" integer default 1,
    "reasoning_overall_recommendation" text,
    "reasoning_confidence_score" double precision,
    "reasoning_summary" text,
    "reasoning_phases" jsonb,
    "reasoning_missing_information" jsonb,
    "reasoning_suggested_actions" jsonb
      );


alter table "public"."applications" enable row level security;


  create table "public"."assigned_applications" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "reviewer_id" uuid not null,
    "application_id" uuid not null,
    "review_status" public.review_status not null default 'unopened'::public.review_status,
    "assigned_by" uuid,
    "assigned_at" timestamp with time zone not null default now(),
    "first_opened_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "reviewer_notes" text,
    "recommendation" public.review_recommendation,
    "recommendation_notes" text,
    "priority" integer default 0,
    "due_date" date,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."assigned_applications" enable row level security;


  create table "public"."processing_queue" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "application_id" uuid,
    "task_type" text not null,
    "payload" jsonb default '{}'::jsonb,
    "status" text not null default 'pending'::text,
    "attempts" integer default 0,
    "last_error" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "locked_at" timestamp with time zone
      );


alter table "public"."processing_queue" enable row level security;


  create table "public"."users" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "auth_id" uuid,
    "role" public.user_role not null default 'applicant'::public.user_role,
    "email" text not null,
    "first_name" text,
    "last_name" text,
    "phone_number" text,
    "profile_complete" boolean default false,
    "department" text,
    "employee_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "last_login_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "is_active" boolean default true
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX app_secrets_pkey ON public.app_secrets USING btree (key);

CREATE UNIQUE INDEX application_files_pkey ON public.application_files USING btree (id);

CREATE UNIQUE INDEX application_status_history_pkey ON public.application_status_history USING btree (id);

CREATE UNIQUE INDEX applications_pkey ON public.applications USING btree (id);

CREATE UNIQUE INDEX assigned_applications_pkey ON public.assigned_applications USING btree (id);

CREATE INDEX idx_application_files_application_id ON public.application_files USING btree (application_id);

CREATE INDEX idx_application_files_category ON public.application_files USING btree (category);

CREATE INDEX idx_application_files_uploaded_by ON public.application_files USING btree (uploaded_by);

CREATE INDEX idx_application_status_history_application_id ON public.application_status_history USING btree (application_id, changed_at DESC);

CREATE INDEX idx_applications_applicant_id ON public.applications USING btree (applicant_id);

CREATE INDEX idx_applications_conditions ON public.applications USING gin (conditions);

CREATE INDEX idx_applications_created_at ON public.applications USING btree (created_at);

CREATE INDEX idx_applications_spouses ON public.applications USING gin (spouses);

CREATE INDEX idx_applications_status ON public.applications USING btree (status);

CREATE INDEX idx_applications_submitted_at ON public.applications USING btree (submitted_at);

CREATE INDEX idx_assigned_applications_application_id ON public.assigned_applications USING btree (application_id);

CREATE INDEX idx_assigned_applications_due_date ON public.assigned_applications USING btree (due_date);

CREATE INDEX idx_assigned_applications_priority ON public.assigned_applications USING btree (priority DESC);

CREATE INDEX idx_assigned_applications_review_status ON public.assigned_applications USING btree (review_status);

CREATE INDEX idx_assigned_applications_reviewer_id ON public.assigned_applications USING btree (reviewer_id);

CREATE INDEX idx_assigned_applications_reviewer_queue ON public.assigned_applications USING btree (reviewer_id, review_status, priority DESC, due_date);

CREATE INDEX idx_processing_queue_created_at ON public.processing_queue USING btree (created_at);

CREATE INDEX idx_processing_queue_status ON public.processing_queue USING btree (status);

CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_users_role ON public.users USING btree (role);

CREATE UNIQUE INDEX processing_queue_pkey ON public.processing_queue USING btree (id);

CREATE UNIQUE INDEX unique_reviewer_application ON public.assigned_applications USING btree (reviewer_id, application_id);

CREATE UNIQUE INDEX users_auth_id_key ON public.users USING btree (auth_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."app_secrets" add constraint "app_secrets_pkey" PRIMARY KEY using index "app_secrets_pkey";

alter table "public"."application_files" add constraint "application_files_pkey" PRIMARY KEY using index "application_files_pkey";

alter table "public"."application_status_history" add constraint "application_status_history_pkey" PRIMARY KEY using index "application_status_history_pkey";

alter table "public"."applications" add constraint "applications_pkey" PRIMARY KEY using index "applications_pkey";

alter table "public"."assigned_applications" add constraint "assigned_applications_pkey" PRIMARY KEY using index "assigned_applications_pkey";

alter table "public"."processing_queue" add constraint "processing_queue_pkey" PRIMARY KEY using index "processing_queue_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."application_files" add constraint "application_files_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE not valid;

alter table "public"."application_files" validate constraint "application_files_application_id_fkey";

alter table "public"."application_files" add constraint "application_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.users(id) not valid;

alter table "public"."application_files" validate constraint "application_files_uploaded_by_fkey";

alter table "public"."application_status_history" add constraint "application_status_history_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE not valid;

alter table "public"."application_status_history" validate constraint "application_status_history_application_id_fkey";

alter table "public"."application_status_history" add constraint "application_status_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES public.users(id) not valid;

alter table "public"."application_status_history" validate constraint "application_status_history_changed_by_fkey";

alter table "public"."applications" add constraint "applications_applicant_id_fkey" FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE RESTRICT not valid;

alter table "public"."applications" validate constraint "applications_applicant_id_fkey";

alter table "public"."assigned_applications" add constraint "assigned_applications_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE not valid;

alter table "public"."assigned_applications" validate constraint "assigned_applications_application_id_fkey";

alter table "public"."assigned_applications" add constraint "assigned_applications_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES public.users(id) not valid;

alter table "public"."assigned_applications" validate constraint "assigned_applications_assigned_by_fkey";

alter table "public"."assigned_applications" add constraint "assigned_applications_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."assigned_applications" validate constraint "assigned_applications_reviewer_id_fkey";

alter table "public"."assigned_applications" add constraint "unique_reviewer_application" UNIQUE using index "unique_reviewer_application";

alter table "public"."processing_queue" add constraint "processing_queue_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) not valid;

alter table "public"."processing_queue" validate constraint "processing_queue_application_id_fkey";

alter table "public"."users" add constraint "users_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_auth_id_fkey";

alter table "public"."users" add constraint "users_auth_id_key" UNIQUE using index "users_auth_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_reviewer(p_application_id uuid, p_reviewer_id uuid, p_assigned_by uuid, p_priority integer DEFAULT 0, p_due_date date DEFAULT NULL::date)
 RETURNS public.assigned_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_assignment assigned_applications;
BEGIN
  -- Verify reviewer is a caseworker
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_reviewer_id 
    AND role = 'caseworker'
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'User is not an active caseworker';
  END IF;
  
  -- Create or update assignment
  INSERT INTO assigned_applications (
    application_id,
    reviewer_id,
    assigned_by,
    priority,
    due_date
  ) VALUES (
    p_application_id,
    p_reviewer_id,
    p_assigned_by,
    p_priority,
    p_due_date
  )
  ON CONFLICT (reviewer_id, application_id) 
  DO UPDATE SET
    priority = EXCLUDED.priority,
    due_date = EXCLUDED.due_date,
    updated_at = NOW()
  RETURNING * INTO v_assignment;
  
  -- Update application status if still submitted
  UPDATE applications
  SET status = 'under_review', status_changed_at = NOW()
  WHERE id = p_application_id
    AND status = 'submitted';
  
  RETURN v_assignment;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_caseworker(p_auth_id uuid, p_email text, p_first_name text, p_last_name text, p_department text DEFAULT NULL::text, p_employee_id text DEFAULT NULL::text)
 RETURNS public.users
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user users;
BEGIN
  -- Only administrators can create caseworkers
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create caseworkers';
  END IF;
  
  INSERT INTO users (
    auth_id,
    role,
    email,
    first_name,
    last_name,
    department,
    employee_id,
    is_active
  ) VALUES (
    p_auth_id,
    'caseworker',
    p_email,
    p_first_name,
    p_last_name,
    p_department,
    p_employee_id,
    TRUE
  )
  RETURNING * INTO v_user;
  
  RETURN v_user;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_next_task()
 RETURNS TABLE(id uuid, task_type text, payload jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
    selected_task_id UUID;
BEGIN
    -- Find and lock the next pending task
    SELECT pq.id INTO selected_task_id
    FROM processing_queue pq
    WHERE pq.status = 'pending'
    ORDER BY pq.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If a task was found, update it to 'processing' and return it
    IF selected_task_id IS NOT NULL THEN
        UPDATE processing_queue
        SET status = 'processing',
            locked_at = NOW(),
            updated_at = NOW(),
            attempts = attempts + 1
        WHERE processing_queue.id = selected_task_id;

        RETURN QUERY
        SELECT pq.id, pq.task_type, pq.payload
        FROM processing_queue pq
        WHERE pq.id = selected_task_id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_ssn_last_four(ssn text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  normalized_ssn TEXT;
BEGIN
  normalized_ssn := regexp_replace(ssn, '[^0-9]', '', 'g');
  
  IF length(normalized_ssn) != 9 THEN
    RETURN NULL;
  END IF;
  
  RETURN 'XXX-XX-' || right(normalized_ssn, 4);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT id FROM users WHERE auth_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS public.user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM users WHERE auth_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (
    auth_id,
    email,
    role,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    NEW.email,
    'applicant',  -- Default role for new signups
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.hash_ssn(ssn text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  pepper TEXT;
  normalized_ssn TEXT;
BEGIN
  -- Read pepper from app_secrets table
  SELECT value INTO pepper FROM app_secrets WHERE key = 'ssn_pepper';
  
  -- Normalize SSN: remove dashes and spaces
  normalized_ssn := regexp_replace(ssn, '[^0-9]', '', 'g');
  
  -- Validate SSN format (9 digits)
  IF length(normalized_ssn) != 9 THEN
    RAISE EXCEPTION 'Invalid SSN format';
  END IF;
  
  -- Return SHA-256 hash with pepper
  RETURN encode(
    digest(normalized_ssn || COALESCE(pepper, ''), 'sha256'),
    'hex'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
 RETURNS public.users
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user users;
BEGIN
  UPDATE users
  SET role = 'administrator'
  WHERE email = user_email
  RETURNING * INTO v_user;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RETURN v_user;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_application(p_application_id uuid)
 RETURNS public.applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_application applications;
BEGIN
  -- Update application to submitted status
  UPDATE applications
  SET 
    status = 'submitted',
    submitted_at = NOW(),
    status_changed_at = NOW()
  WHERE id = p_application_id
    AND status = 'draft'
  RETURNING * INTO v_application;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not in draft status';
  END IF;
  
  -- Record in history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    'draft',
    'submitted',
    v_application.applicant_id,
    'Application submitted by applicant'
  );
  
  RETURN v_application;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_recommendation(p_application_id uuid, p_reviewer_id uuid, p_recommendation public.review_recommendation, p_recommendation_notes text DEFAULT NULL::text)
 RETURNS public.assigned_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_assignment assigned_applications;
  v_application applications;
  v_old_status application_status;
BEGIN
  -- Verify assignment exists and belongs to reviewer
  SELECT * INTO v_assignment
  FROM assigned_applications
  WHERE application_id = p_application_id
    AND reviewer_id = p_reviewer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application is not assigned to this reviewer';
  END IF;
  
  -- Get current application status
  SELECT status INTO v_old_status
  FROM applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Update assigned_applications with recommendation (transactional)
  UPDATE assigned_applications
  SET 
    recommendation = p_recommendation,
    recommendation_notes = p_recommendation_notes,
    review_status = 'completed',
    completed_at = NOW(),
    last_accessed_at = NOW(),
    first_opened_at = COALESCE(first_opened_at, NOW()),
    updated_at = NOW()
  WHERE id = v_assignment.id
  RETURNING * INTO v_assignment;
  
  -- Record recommendation in application status history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    v_old_status,
    v_old_status, -- Status doesn't change automatically, just recording the recommendation
    p_reviewer_id,
    'Reviewer recommendation: ' || p_recommendation || 
    CASE WHEN p_recommendation_notes IS NOT NULL 
      THEN E'\nNotes: ' || p_recommendation_notes 
      ELSE '' 
    END
  );
  
  RETURN v_assignment;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_application_status(p_application_id uuid, p_new_status public.application_status, p_notes text DEFAULT NULL::text, p_changed_by uuid DEFAULT NULL::uuid)
 RETURNS public.applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_old_status application_status;
  v_application applications;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Update application
  UPDATE applications
  SET 
    status = p_new_status,
    status_changed_at = NOW(),
    status_notes = p_notes
  WHERE id = p_application_id
  RETURNING * INTO v_application;
  
  -- Record in history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    v_old_status,
    p_new_status,
    p_changed_by,
    p_notes
  );
  
  RETURN v_application;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_review_status(p_assignment_id uuid, p_new_status public.review_status, p_reviewer_id uuid)
 RETURNS public.assigned_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_assignment assigned_applications;
BEGIN
  UPDATE assigned_applications
  SET 
    review_status = p_new_status,
    first_opened_at = CASE 
      WHEN review_status = 'unopened' AND p_new_status != 'unopened' 
      THEN NOW() 
      ELSE first_opened_at 
    END,
    last_accessed_at = NOW(),
    completed_at = CASE 
      WHEN p_new_status = 'completed' THEN NOW() 
      ELSE completed_at 
    END
  WHERE id = p_assignment_id
    AND reviewer_id = p_reviewer_id
  RETURNING * INTO v_assignment;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or unauthorized';
  END IF;
  
  RETURN v_assignment;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_ssn(ssn text, stored_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN hash_ssn(ssn) = stored_hash;
END;
$function$
;

grant delete on table "public"."app_secrets" to "service_role";

grant insert on table "public"."app_secrets" to "service_role";

grant references on table "public"."app_secrets" to "service_role";

grant select on table "public"."app_secrets" to "service_role";

grant trigger on table "public"."app_secrets" to "service_role";

grant truncate on table "public"."app_secrets" to "service_role";

grant update on table "public"."app_secrets" to "service_role";

grant delete on table "public"."application_files" to "anon";

grant insert on table "public"."application_files" to "anon";

grant references on table "public"."application_files" to "anon";

grant select on table "public"."application_files" to "anon";

grant trigger on table "public"."application_files" to "anon";

grant truncate on table "public"."application_files" to "anon";

grant update on table "public"."application_files" to "anon";

grant delete on table "public"."application_files" to "authenticated";

grant insert on table "public"."application_files" to "authenticated";

grant references on table "public"."application_files" to "authenticated";

grant select on table "public"."application_files" to "authenticated";

grant trigger on table "public"."application_files" to "authenticated";

grant truncate on table "public"."application_files" to "authenticated";

grant update on table "public"."application_files" to "authenticated";

grant delete on table "public"."application_files" to "service_role";

grant insert on table "public"."application_files" to "service_role";

grant references on table "public"."application_files" to "service_role";

grant select on table "public"."application_files" to "service_role";

grant trigger on table "public"."application_files" to "service_role";

grant truncate on table "public"."application_files" to "service_role";

grant update on table "public"."application_files" to "service_role";

grant delete on table "public"."application_status_history" to "anon";

grant insert on table "public"."application_status_history" to "anon";

grant references on table "public"."application_status_history" to "anon";

grant select on table "public"."application_status_history" to "anon";

grant trigger on table "public"."application_status_history" to "anon";

grant truncate on table "public"."application_status_history" to "anon";

grant update on table "public"."application_status_history" to "anon";

grant delete on table "public"."application_status_history" to "authenticated";

grant insert on table "public"."application_status_history" to "authenticated";

grant references on table "public"."application_status_history" to "authenticated";

grant select on table "public"."application_status_history" to "authenticated";

grant trigger on table "public"."application_status_history" to "authenticated";

grant truncate on table "public"."application_status_history" to "authenticated";

grant update on table "public"."application_status_history" to "authenticated";

grant delete on table "public"."application_status_history" to "service_role";

grant insert on table "public"."application_status_history" to "service_role";

grant references on table "public"."application_status_history" to "service_role";

grant select on table "public"."application_status_history" to "service_role";

grant trigger on table "public"."application_status_history" to "service_role";

grant truncate on table "public"."application_status_history" to "service_role";

grant update on table "public"."application_status_history" to "service_role";

grant delete on table "public"."applications" to "anon";

grant insert on table "public"."applications" to "anon";

grant references on table "public"."applications" to "anon";

grant select on table "public"."applications" to "anon";

grant trigger on table "public"."applications" to "anon";

grant truncate on table "public"."applications" to "anon";

grant update on table "public"."applications" to "anon";

grant delete on table "public"."applications" to "authenticated";

grant insert on table "public"."applications" to "authenticated";

grant references on table "public"."applications" to "authenticated";

grant select on table "public"."applications" to "authenticated";

grant trigger on table "public"."applications" to "authenticated";

grant truncate on table "public"."applications" to "authenticated";

grant update on table "public"."applications" to "authenticated";

grant delete on table "public"."applications" to "service_role";

grant insert on table "public"."applications" to "service_role";

grant references on table "public"."applications" to "service_role";

grant select on table "public"."applications" to "service_role";

grant trigger on table "public"."applications" to "service_role";

grant truncate on table "public"."applications" to "service_role";

grant update on table "public"."applications" to "service_role";

grant delete on table "public"."assigned_applications" to "anon";

grant insert on table "public"."assigned_applications" to "anon";

grant references on table "public"."assigned_applications" to "anon";

grant select on table "public"."assigned_applications" to "anon";

grant trigger on table "public"."assigned_applications" to "anon";

grant truncate on table "public"."assigned_applications" to "anon";

grant update on table "public"."assigned_applications" to "anon";

grant delete on table "public"."assigned_applications" to "authenticated";

grant insert on table "public"."assigned_applications" to "authenticated";

grant references on table "public"."assigned_applications" to "authenticated";

grant select on table "public"."assigned_applications" to "authenticated";

grant trigger on table "public"."assigned_applications" to "authenticated";

grant truncate on table "public"."assigned_applications" to "authenticated";

grant update on table "public"."assigned_applications" to "authenticated";

grant delete on table "public"."assigned_applications" to "service_role";

grant insert on table "public"."assigned_applications" to "service_role";

grant references on table "public"."assigned_applications" to "service_role";

grant select on table "public"."assigned_applications" to "service_role";

grant trigger on table "public"."assigned_applications" to "service_role";

grant truncate on table "public"."assigned_applications" to "service_role";

grant update on table "public"."assigned_applications" to "service_role";

grant delete on table "public"."processing_queue" to "anon";

grant insert on table "public"."processing_queue" to "anon";

grant references on table "public"."processing_queue" to "anon";

grant select on table "public"."processing_queue" to "anon";

grant trigger on table "public"."processing_queue" to "anon";

grant truncate on table "public"."processing_queue" to "anon";

grant update on table "public"."processing_queue" to "anon";

grant delete on table "public"."processing_queue" to "authenticated";

grant insert on table "public"."processing_queue" to "authenticated";

grant references on table "public"."processing_queue" to "authenticated";

grant select on table "public"."processing_queue" to "authenticated";

grant trigger on table "public"."processing_queue" to "authenticated";

grant truncate on table "public"."processing_queue" to "authenticated";

grant update on table "public"."processing_queue" to "authenticated";

grant delete on table "public"."processing_queue" to "service_role";

grant insert on table "public"."processing_queue" to "service_role";

grant references on table "public"."processing_queue" to "service_role";

grant select on table "public"."processing_queue" to "service_role";

grant trigger on table "public"."processing_queue" to "service_role";

grant truncate on table "public"."processing_queue" to "service_role";

grant update on table "public"."processing_queue" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."users" to "supabase_auth_admin";

grant insert on table "public"."users" to "supabase_auth_admin";

grant references on table "public"."users" to "supabase_auth_admin";

grant select on table "public"."users" to "supabase_auth_admin";

grant trigger on table "public"."users" to "supabase_auth_admin";

grant truncate on table "public"."users" to "supabase_auth_admin";

grant update on table "public"."users" to "supabase_auth_admin";


  create policy "files_all_admin"
  on "public"."application_files"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "files_delete_own"
  on "public"."application_files"
  as permissive
  for delete
  to authenticated
using (((uploaded_by = public.get_user_id()) AND (EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_files.application_id) AND (a.status = ANY (ARRAY['draft'::public.application_status, 'additional_info'::public.application_status])))))));



  create policy "files_insert_own"
  on "public"."application_files"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_files.application_id) AND (a.applicant_id = public.get_user_id()) AND (a.status = ANY (ARRAY['draft'::public.application_status, 'additional_info'::public.application_status]))))) AND (uploaded_by = public.get_user_id())));



  create policy "files_select_admin"
  on "public"."application_files"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "files_select_assigned"
  on "public"."application_files"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.assigned_applications aa
     JOIN public.users u ON ((u.auth_id = auth.uid())))
  WHERE ((aa.application_id = application_files.application_id) AND (aa.reviewer_id = u.id) AND (u.role = 'caseworker'::public.user_role)))));



  create policy "files_select_own"
  on "public"."application_files"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_files.application_id) AND (a.applicant_id = public.get_user_id())))));



  create policy "files_update_own"
  on "public"."application_files"
  as permissive
  for update
  to authenticated
using (((uploaded_by = public.get_user_id()) AND (EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_files.application_id) AND (a.status = ANY (ARRAY['draft'::public.application_status, 'additional_info'::public.application_status])))))))
with check ((uploaded_by = public.get_user_id()));



  create policy "history_insert_system"
  on "public"."application_status_history"
  as permissive
  for insert
  to authenticated
with check (false);



  create policy "history_select_admin"
  on "public"."application_status_history"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "history_select_assigned"
  on "public"."application_status_history"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.assigned_applications aa
     JOIN public.users u ON ((u.auth_id = auth.uid())))
  WHERE ((aa.application_id = application_status_history.application_id) AND (aa.reviewer_id = u.id) AND (u.role = 'caseworker'::public.user_role)))));



  create policy "history_select_own"
  on "public"."application_status_history"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = application_status_history.application_id) AND (a.applicant_id = public.get_user_id())))));



  create policy "applications_delete_admin"
  on "public"."applications"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "applications_insert_own"
  on "public"."applications"
  as permissive
  for insert
  to authenticated
with check (((applicant_id = public.get_user_id()) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'applicant'::public.user_role))))));



  create policy "applications_select_admin"
  on "public"."applications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "applications_select_assigned"
  on "public"."applications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.assigned_applications aa
     JOIN public.users u ON ((u.auth_id = auth.uid())))
  WHERE ((aa.application_id = applications.id) AND (aa.reviewer_id = u.id) AND (u.role = 'caseworker'::public.user_role)))));



  create policy "applications_select_own"
  on "public"."applications"
  as permissive
  for select
  to authenticated
using ((applicant_id = public.get_user_id()));



  create policy "applications_update_admin"
  on "public"."applications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "applications_update_caseworker"
  on "public"."applications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.assigned_applications aa
     JOIN public.users u ON ((u.auth_id = auth.uid())))
  WHERE ((aa.application_id = applications.id) AND (aa.reviewer_id = u.id) AND (u.role = 'caseworker'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM (public.assigned_applications aa
     JOIN public.users u ON ((u.auth_id = auth.uid())))
  WHERE ((aa.application_id = applications.id) AND (aa.reviewer_id = u.id) AND (u.role = 'caseworker'::public.user_role)))));



  create policy "applications_update_own_draft"
  on "public"."applications"
  as permissive
  for update
  to authenticated
using (((applicant_id = public.get_user_id()) AND (status = ANY (ARRAY['draft'::public.application_status, 'additional_info'::public.application_status]))))
with check ((applicant_id = public.get_user_id()));



  create policy "assigned_applications_delete_admin"
  on "public"."assigned_applications"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "assigned_applications_insert_admin"
  on "public"."assigned_applications"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "assigned_applications_select_admin"
  on "public"."assigned_applications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "assigned_applications_select_applicant"
  on "public"."assigned_applications"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.applications a
  WHERE ((a.id = assigned_applications.application_id) AND (a.applicant_id = public.get_user_id())))));



  create policy "assigned_applications_select_own"
  on "public"."assigned_applications"
  as permissive
  for select
  to authenticated
using (((reviewer_id = public.get_user_id()) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'caseworker'::public.user_role))))));



  create policy "assigned_applications_update_admin"
  on "public"."assigned_applications"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "assigned_applications_update_own"
  on "public"."assigned_applications"
  as permissive
  for update
  to authenticated
using (((reviewer_id = public.get_user_id()) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'caseworker'::public.user_role))))))
with check ((reviewer_id = public.get_user_id()));



  create policy "users_insert_admin"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "users_insert_own"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check (((auth_id = auth.uid()) AND (role = 'applicant'::public.user_role)));



  create policy "users_select_admin"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "users_select_caseworker"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = ANY (ARRAY['caseworker'::public.user_role, 'administrator'::public.user_role]))))));



  create policy "users_select_own"
  on "public"."users"
  as permissive
  for select
  to authenticated
using ((auth_id = auth.uid()));



  create policy "users_update_admin"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.auth_id = auth.uid()) AND (u.role = 'administrator'::public.user_role)))));



  create policy "users_update_own"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth_id = auth.uid()))
with check (((auth_id = auth.uid()) AND (( SELECT users_1.role
   FROM public.users users_1
  WHERE (users_1.auth_id = auth.uid())) = role)));


CREATE TRIGGER application_files_updated_at BEFORE UPDATE ON public.application_files FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER assigned_applications_updated_at BEFORE UPDATE ON public.assigned_applications FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.moddatetime('updated_at');

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


