# Dashboard Data Mapping Reference

This document provides the technical mapping between the dashboard UI components and the database schema.

## Database Tables Overview

- **applications** - Main application data and AI reasoning output
- **users** - Applicant information (join via `applications.applicant_id`)
- **assigned_applications** - Review assignment and reviewer actions
- **application_files** - Uploaded document metadata
- **application_status_history** - Audit trail of status changes

---

## Header / Applicant Summary

### Applicant Name
- **Source:** `users.first_name` + `users.last_name`
- **Join:** `applications.applicant_id` → `users.id`
- **Display:** Concatenate with space between

### Application ID
- **Source:** `applications.id`
- **Type:** UUID
- **Display:** Full UUID or truncated format

### Submission Date
- **Source:** `applications.submitted_at`
- **Type:** TIMESTAMPTZ
- **Display:** Formatted date with relative time (e.g., "Submitted 3 days ago")

### Overall AI Recommendation
- **Source:** `applications.reasoning_overall_recommendation`
- **Type:** TEXT (enum-like: `APPROVE`, `DENY`, `NEEDS_REVIEW`)
- **Display:** Color-coded badge
- **Mapping:**
  - `APPROVE` → Green badge
  - `DENY` → Red badge
  - `NEEDS_REVIEW` → Yellow/amber badge

### AI Confidence Score
- **Source:** `applications.reasoning_confidence_score`
- **Type:** FLOAT (0.0 - 1.0)
- **Display:** Convert to percentage (multiply by 100), show as circular progress or percentage badge

### AI Summary
- **Source:** `applications.reasoning_summary`
- **Type:** TEXT
- **Display:** 2-3 sentence executive summary in callout box

---

## Progress Tracker

### Phase Status Values
- **Source:** `applications.reasoning_phases` (JSONB object)
- **Path:** `phases.phase_N.status` where N is 0-5

#### Phase 0: Eligibility
- **Status Values:** `PASS` | `FAIL` | `WARN`
- **Path:** `phases.phase_0.status`

#### Phase 1: SGA
- **Status Values:** `PASS` | `FAIL` | `WARN`
- **Path:** `phases.phase_1.status`

#### Phase 2: Severe Impairment
- **Status Values:** `PASS` | `FAIL` | `WARN`
- **Path:** `phases.phase_2.status`

#### Phase 3: Listings
- **Status Values:** `MET` | `NOT_MET` | `EQUALED` | `WARN`
- **Path:** `phases.phase_3.status`

#### Phase 4: RFC & Past Work
- **Status Values:** `PASS` | `FAIL` | `WARN`
- **Path:** `phases.phase_4.status`

#### Phase 5: Other Work
- **Status Values:** `DISABLED` | `NOT_DISABLED` | `WARN`
- **Path:** `phases.phase_5.status`

---

## Detailed Phase Views

All phase data comes from `applications.reasoning_phases` (JSONB object).

### Common Phase Fields
Each phase object (`phases.phase_N`) contains:
- `status` - Phase-specific status value
- `reasoning` - String explanation from AI
- `citations` - Array of rule IDs or legal codes (string[])
- `evidence` - Array of field names or document snippets (string[])

### Phase 0: Basic Eligibility & Insured Status
**Source:** `phases.phase_0`

- `phase_0.status` → Display as badge
- `phase_0.reasoning` → AI reasoning text
- `phase_0.citations` → Array of citation strings
- `phase_0.evidence` → Array of evidence references

**Supporting Data from `applications` table:**
- Age: Calculate from `applications.birthdate`
- Date Last Insured (DLI): Calculate from `applications.earnings_history`
- Quarters of Coverage: From `applications.earnings_history` array

---

### Phase 1: Substantial Gainful Activity (SGA)
**Source:** `phases.phase_1`

- `phase_1.status` → Display as badge
- `phase_1.reasoning` → AI reasoning text
- `phase_1.citations` → Array of citation strings
- `phase_1.evidence` → Array of evidence references
- `phase_1.calculated_monthly_earnings` → Number (optional)

**Supporting Data from `applications` table:**
- Employment status: `applications.employment_history` (JSONB array)
- Earnings: `applications.earnings_history` (JSONB array)
- Date condition began: `applications.date_condition_began_affecting_work` (DATE)

---

### Phase 2: Severe Impairment(s)
**Source:** `phases.phase_2`

- `phase_2.status` → Display as badge
- `phase_2.reasoning` → AI reasoning text
- `phase_2.citations` → Array of citation strings
- `phase_2.evidence` → Array of evidence references
- `phase_2.identified_impairments` → Array of impairment strings

**Supporting Data from `applications` table:**
- Medical conditions: `applications.conditions` (JSONB array)
- Medical evidence: `applications.evidence_documents` (JSONB array)
- Healthcare providers: `applications.healthcare_providers` (JSONB array)
- Medical tests: `applications.medical_tests` (JSONB array)

**JSONB Structure for `conditions`:**
```json
[{
  "condition_name": "string",
  "date_began": "date",
  "how_it_limits_activities": "string",
  "treatment_received": "string"
}]
```

---

### Phase 3: Listed Impairments (The "Blue Book")
**Source:** `phases.phase_3`

- `phase_3.status` → Display as badge (MET/NOT_MET/EQUALED/WARN)
- `phase_3.reasoning` → AI reasoning text
- `phase_3.citations` → Array of citation strings
- `phase_3.evidence` → Array of evidence references
- `phase_3.considered_listings` → Array of listing strings (e.g., `["1.15", "12.04"]`)

**Supporting Data from `applications` table:**
- Medical evidence documents: `applications.evidence_documents` (JSONB array)
- Medical tests: `applications.medical_tests` (JSONB array)
- Functional limitations: `applications.functional_limitations` (JSONB object)

---

### Phase 4: Residual Functional Capacity (RFC) & Past Work
**Source:** `phases.phase_4`

- `phase_4.status` → Display as badge
- `phase_4.reasoning` → AI reasoning text
- `phase_4.citations` → Array of citation strings
- `phase_4.evidence` → Array of evidence references
- `phase_4.estimated_rfc` → String: `SEDENTARY` | `LIGHT` | `MEDIUM` | `HEAVY`
- `phase_4.past_work_analysis` → String description

**Supporting Data from `applications` table:**
- Functional limitations: `applications.functional_limitations` (JSONB object)
- Employment history: `applications.employment_history` (JSONB array)

**JSONB Structure for `functional_limitations`:**
```json
{
  "walking": "string",
  "sitting": "string",
  "standing": "string",
  "lifting": "string",
  "carrying": "string",
  "understanding_instructions": "string",
  "remembering_instructions": "string",
  "other": "string"
}
```

**JSONB Structure for `employment_history`:**
```json
[{
  "job_title": "string",
  "employer_name": "string",
  "employment_start_date": "date",
  "employment_end_date": "date|null",
  "total_earnings": "number",
  "job_duties_summary": "string",
  "employer_address": "string"
}]
```

---

### Phase 5: Adjustment to Other Work (The Grid)
**Source:** `phases.phase_5`

- `phase_5.status` → Display as badge (DISABLED/NOT_DISABLED/WARN)
- `phase_5.reasoning` → AI reasoning text
- `phase_5.citations` → Array of citation strings
- `phase_5.evidence` → Array of evidence references
- `phase_5.grid_rule_applied` → String (optional, e.g., `"201.28"`)

**Supporting Data from `applications` table:**
- Age: Calculate from `applications.birthdate`
- Education: `applications.education` (JSONB array)
- Job training: `applications.job_training` (JSONB array)
- Skills: Derived from `applications.employment_history`

**JSONB Structure for `education`:**
```json
[{
  "level": "string",
  "date_completed": "date"
}]
```

---

## AI Recommendations Section

### Missing Information
- **Source:** `applications.reasoning_missing_information`
- **Type:** JSONB array of strings
- **Example:**
  ```json
  [
    "Medical Source Statement from Dr. Smith",
    "MRI results from 2023",
    "Workers' compensation award letter"
  ]
  ```
- **Display:** List of items, each as a string

### Suggested Actions
- **Source:** `applications.reasoning_suggested_actions`
- **Type:** JSONB array of strings
- **Example:**
  ```json
  [
    "Request Medical Source Statement from Dr. Smith",
    "Schedule Consultative Exam for Mental Status",
    "Obtain additional earnings records for 2022"
  ]
  ```
- **Display:** List of action items, each as a string

---

## Action Panel (Human Operator)

All data from `assigned_applications` table, filtered by current reviewer and application.

### Review Status
- **Source:** `assigned_applications.review_status`
- **Type:** ENUM
- **Values:**
  - `unopened` - Reviewer has not yet opened the application
  - `in_progress` - Reviewer is currently reviewing
  - `completed` - Reviewer has completed their review
- **Display:** Status badge with appropriate color

### Review Actions (Recommendation)
- **Source:** `assigned_applications.recommendation`
- **Type:** ENUM (`review_recommendation`)
- **Values:**
  - `approve` - Approve the claim
  - `deny` - Deny the claim
  - `request_more_info` - Request more information
  - `escalate` - Escalate to supervisor
  - `needs_medical_review` - Needs medical review
- **Update:** Set this field when caseworker submits recommendation

### Reviewer Notes
- **Source:** `assigned_applications.reviewer_notes`
- **Type:** TEXT
- **Display:** Rich text editor
- **Note:** Internal notes, not visible to applicant

### Recommendation Notes
- **Source:** `assigned_applications.recommendation_notes`
- **Type:** TEXT
- **Display:** Text area in recommendation modal
- **Note:** Notes that accompany the recommendation

### Assignment Metadata
- **Assigned By:** `assigned_applications.assigned_by` (UUID → join to `users` table)
- **Assigned At:** `assigned_applications.assigned_at` (TIMESTAMPTZ)
- **Priority:** `assigned_applications.priority` (INTEGER, higher = more urgent)
- **Due Date:** `assigned_applications.due_date` (DATE)
- **First Opened:** `assigned_applications.first_opened_at` (TIMESTAMPTZ)
- **Last Accessed:** `assigned_applications.last_accessed_at` (TIMESTAMPTZ)
- **Completed At:** `assigned_applications.completed_at` (TIMESTAMPTZ)

---

## Query Examples

### Get Application with AI Reasoning
```sql
SELECT 
  a.*,
  u.first_name,
  u.last_name,
  aa.review_status,
  aa.recommendation,
  aa.reviewer_notes,
  aa.priority,
  aa.due_date
FROM applications a
JOIN users u ON u.id = a.applicant_id
LEFT JOIN assigned_applications aa ON aa.application_id = a.id 
  AND aa.reviewer_id = :current_reviewer_id
WHERE a.id = :application_id;
```

### Get Phase Status
```sql
SELECT 
  reasoning_phases->'phase_0'->>'status' as phase_0_status,
  reasoning_phases->'phase_1'->>'status' as phase_1_status,
  reasoning_phases->'phase_2'->>'status' as phase_2_status,
  reasoning_phases->'phase_3'->>'status' as phase_3_status,
  reasoning_phases->'phase_4'->>'status' as phase_4_status,
  reasoning_phases->'phase_5'->>'status' as phase_5_status
FROM applications
WHERE id = :application_id;
```

### Update Review Status
```sql
UPDATE assigned_applications
SET 
  review_status = 'in_progress',
  last_accessed_at = NOW()
WHERE application_id = :application_id 
  AND reviewer_id = :reviewer_id;
```

### Submit Recommendation
```sql
UPDATE assigned_applications
SET 
  review_status = 'completed',
  recommendation = :recommendation,
  recommendation_notes = :notes,
  completed_at = NOW(),
  last_accessed_at = NOW()
WHERE application_id = :application_id 
  AND reviewer_id = :reviewer_id;
```

---

## JSONB Field Reference

### `applications.reasoning_phases`
Complete structure:
```json
{
  "phase_0": {
    "status": "PASS | FAIL | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"]
  },
  "phase_1": {
    "status": "PASS | FAIL | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"],
    "calculated_monthly_earnings": 0
  },
  "phase_2": {
    "status": "PASS | FAIL | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"],
    "identified_impairments": ["string"]
  },
  "phase_3": {
    "status": "MET | NOT_MET | EQUALED | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"],
    "considered_listings": ["string"]
  },
  "phase_4": {
    "status": "PASS | FAIL | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"],
    "estimated_rfc": "SEDENTARY | LIGHT | MEDIUM | HEAVY",
    "past_work_analysis": "string"
  },
  "phase_5": {
    "status": "DISABLED | NOT_DISABLED | WARN",
    "reasoning": "string",
    "citations": ["string"],
    "evidence": ["string"],
    "grid_rule_applied": "string"
  }
}
```

### Other Key JSONB Fields
- `applications.reasoning_missing_information` - string[]
- `applications.reasoning_suggested_actions` - string[]
- `applications.conditions` - condition objects[]
- `applications.employment_history` - employment objects[]
- `applications.earnings_history` - earnings objects[]
- `applications.functional_limitations` - limitations object
- `applications.healthcare_providers` - provider objects[]
- `applications.medical_tests` - test objects[]
- `applications.evidence_documents` - document objects[]

