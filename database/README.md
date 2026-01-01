# Database Schema for Social Security Application System

## Overview

This database is designed for a Social Security disability application system with three user roles:
- **Applicants**: Submit and manage their disability applications
- **Caseworkers**: Review assigned applications
- **Administrators**: Manage users, assignments, and oversee all applications

## Directory Structure

```
database/
├── migrations/           # Schema creation scripts (run in order)
│   ├── enable_extensions.sql
│   ├── create_enums.sql
│   ├── create_users.sql
│   ├── create_applications.sql
│   ├── create_assigned_applications.sql
│   ├── create_file_storage.sql
│   └── create_application_history.sql
├── functions/            # PostgreSQL functions
│   ├── ssn_functions.sql
│   └── application_functions.sql
├── policies/             # Row Level Security policies
│   ├── enable_rls.sql
│   ├── users_policies.sql
│   ├── applications_policies.sql
│   ├── assigned_applications_policies.sql
│   ├── files_policies.sql
│   └── history_policies.sql
└── seed/                 # Initial data
    └── seed_admin.sql
```

## Table Descriptions

### users
Core user table with role-based access control.
- Links to Supabase Auth via `auth_id`
- `role` field enables RLS (applicant, administrator, caseworker)

### applications
Stores all Social Security disability application data.
- SSNs are **hashed** (never stored in plain text)
- Complex nested data stored as JSONB
- Tracks application status and form progress

### assigned_applications
Many-to-many relationship between caseworkers and applications.
- Tracks review status (unopened, in_progress, completed)
- Stores reviewer notes and recommendations
- Supports priority and due dates

### application_files
Tracks uploaded files stored in Supabase Storage.
- Soft delete support
- Categorized by document type

### application_status_history
Audit trail for all status changes.
- Immutable log of status transitions
- Records who made changes and why

## Security Features

### SSN Handling
- SSNs are **never** stored in plain text
- `hash_ssn()` function creates SHA-256 hash with pepper
- `verify_ssn()` function for verification
- `get_ssn_last_four()` for masked display (XXX-XX-1234)

### Row Level Security (RLS)
- **Applicants**: Can only access their own data
- **Caseworkers**: Can access assigned applications
- **Administrators**: Full access to all data

### Sensitive Data
- Bank account numbers should be encrypted at application level
- Use Supabase Vault for storing encryption keys
- All file access controlled via RLS

## JSONB Field Schemas

### spouses
```json
[{
  "spouse_name": "string",
  "spouse_ssn_hash": "string (hashed)",
  "spouse_birthdate": "date",
  "marriage_start_date": "date",
  "marriage_end_date": "date|null",
  "marriage_place_city": "string",
  "marriage_place_state_or_country": "string"
}]
```

### children
```json
[{
  "child_name": "string",
  "child_date_of_birth": "date",
  "child_status": {
    "disabled_before_22": "boolean",
    "under_18_unmarried": "boolean",
    "age_18_to_19_in_secondary_school_full_time": "boolean"
  }
}]
```

### conditions
```json
[{
  "condition_name": "string",
  "date_began": "date",
  "how_it_limits_activities": "string",
  "treatment_received": "string"
}]
```

See `schema.json` for complete field documentation.

## Useful Queries

### Get caseworker's pending reviews
```sql
SELECT aa.*, a.status, a.submitted_at
FROM assigned_applications aa
JOIN applications a ON a.id = aa.application_id
WHERE aa.reviewer_id = 'CASEWORKER_UUID'
AND aa.review_status != 'completed'
ORDER BY aa.priority DESC, aa.due_date;
```

### Get application with reviewer info
```sql
SELECT a.*, 
  json_agg(json_build_object(
    'reviewer_name', u.first_name || ' ' || u.last_name,
    'review_status', aa.review_status,
    'recommendation', aa.recommendation
  )) as reviewers
FROM applications a
LEFT JOIN assigned_applications aa ON aa.application_id = a.id
LEFT JOIN users u ON u.id = aa.reviewer_id
WHERE a.id = 'APPLICATION_UUID'
GROUP BY a.id;
```
