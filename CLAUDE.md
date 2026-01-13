# Claimd - Complete Technical Documentation

> Comprehensive documentation for the Claimd SSDI application processing platform - covering application architecture, AI processing, infrastructure, and deployment

**Last Updated**: January 13, 2026

---

## Table of Contents

- [Project Overview](#project-overview)
- [Application Architecture](#application-architecture)
- [Tech Stack](#tech-stack)
- [Application Components](#application-components)
  - [Applicant Portal](#applicant-portal)
  - [Caseworker Portal](#caseworker-portal)
  - [AI Processing Service](#ai-processing-service)
  - [Landing Page](#landing-page)
- [AI System Design](#ai-system-design)
- [Database Architecture](#database-architecture)
- [AWS Infrastructure](#aws-infrastructure)
- [Deployment](#deployment)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)
- [Recent Infrastructure Fixes](#recent-infrastructure-fixes)

---

## Project Overview

**Claimd** is an AI-powered platform that reduces Social Security Disability Insurance (SSDI) application processing time from **7 months to 1-2 days**.

### The Problem
- 940,000 Americans are waiting for SSDI decisions
- Average wait time: 6-8 months (SSA at 25-year staffing low)
- Manual review of 34+ document fields takes 8-10 minutes per claim
- Critical financial support is delayed for disabled individuals

### The Solution
An end-to-end AI-assisted platform with:
1. **Applicant Portal** - Streamlined 13-step application form
2. **Caseworker Portal** - Administrative dashboard with AI recommendations
3. **AI Processing Engine** - Claude-powered document analysis and decision recommendations

### Key Metrics
- **20x faster** processing (10 minutes → 30 seconds per claim)
- **95%+ accuracy** in document extraction
- **Legal compliance** with SSA's 5-Step Sequential Evaluation Process
- **Enterprise-grade** security with SSN hashing and HIPAA-conscious design

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDFRONT CDN (Global)                      │
│          applicant.claimd.tech       caseworker.claimd.tech         │
│          (E19N9CLEWYM9KP)            (EUH7AYTFW0871)                │
└──────────┬──────────────────────────────┬────────────────────────────┘
           │                              │
           ├──────────────┬───────────────┼──────────────┬──────────────
           │              │               │              │
     ┌─────▼─────┐  ┌────▼──────┐  ┌─────▼─────┐  ┌────▼──────┐
     │    S3     │  │    API    │  │    S3     │  │    API    │
     │ Frontend  │  │  Gateway  │  │ Frontend  │  │  Gateway  │
     │ (React)   │  │ (us-e-2)  │  │ (React)   │  │ (us-e-2)  │
     └───────────┘  └─────┬─────┘  └───────────┘  └─────┬─────┘
                          │                              │
                    ┌─────▼─────┐                  ┌─────▼─────┐
                    │  Lambda   │                  │  Lambda   │
                    │ Applicant │                  │Caseworker │
                    │    API    │                  │    API    │
                    │(Node.js)  │                  │(Node.js)  │
                    └─────┬─────┘                  └─────┬─────┘
                          │                              │
                          └──────────────┬───────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │          Supabase PostgreSQL            │
                    │  ┌──────────────────────────────────┐   │
                    │  │ • applications (JSONB data)      │   │
                    │  │ • users (RLS policies)           │   │
                    │  │ • processing_queue (AI tasks)    │   │
                    │  │ • application_files (metadata)   │   │
                    │  └──────────────────────────────────┘   │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Supabase Storage (S3-compatible) │   │
                    │  │ • PDFs (medical records, W-2s)   │   │
                    │  └──────────────────────────────────┘   │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │  SQS Queue (calhacksy1-ai-worker)   │
                    │  • AI processing job queue          │
                    │  • Retry logic & DLQ                │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │     Lambda AI Worker (Python)       │
                    │  ┌──────────────────────────────┐   │
                    │  │ Extractor Agent (Claude)     │   │
                    │  │ • PDF → Structured JSON      │   │
                    │  │ • Medical records, W-2s      │   │
                    │  └──────────────────────────────┘   │
                    │  ┌──────────────────────────────┐   │
                    │  │ Reasoning Agent (Claude)     │   │
                    │  │ • SSA 5-Step Evaluation      │   │
                    │  │ • Legal citation engine      │   │
                    │  │ • Confidence scoring         │   │
                    │  └──────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

### Data Flow

1. **Application Submission** (Applicant → Backend)
   - User fills 13-step form (validated with Zod)
   - Uploads PDFs → Supabase Storage
   - Application saved to PostgreSQL
   - Job added to `processing_queue` → SQS

2. **AI Processing** (Background, Async)
   - Lambda polls SQS queue
   - Fetches application + PDFs from Supabase
   - **Extractor Call**: Claude extracts structured data from PDFs
   - **Reasoning Call**: Claude evaluates against SSA 5-Step Process
   - Results saved to `applications` table

3. **Caseworker Review** (Admin Dashboard)
   - Dashboard fetches applications with AI recommendations
   - Displays AI analysis (phases, evidence, confidence scores)
   - Caseworker makes final decision
   - Status updated → applicant notified

---

## Tech Stack

### Frontend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 19.1.1 | UI library |
| **Build Tool** | Vite 7.x | Fast builds, HMR |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS 4.x | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **3D Graphics** | Three.js + React Three Fiber | Landing page globe |
| **Routing** | React Router DOM v7 | Client-side routing |
| **Validation** | Zod 4.x | Schema validation |
| **State Management** | React Context + Hooks | Auth state, app state |

### Backend Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 20.x | JavaScript runtime |
| **Framework** | Express 5.x | HTTP server |
| **Deployment** | AWS Lambda | Serverless compute |
| **API Gateway** | HTTP API v2 | RESTful routing |
| **Auth** | Supabase Auth | JWT-based auth |
| **File Uploads** | Multer | Multipart form handling |
| **Security** | Helmet.js, CORS, Rate Limiting | HTTP security headers |
| **Serverless Bridge** | @vendia/serverless-express | Lambda ↔ Express adapter |

### AI Processing Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Python 3.13 | AI worker script |
| **LLM** | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Document extraction & reasoning |
| **PDF Processing** | Base64 encoding + Claude vision | Extract text & structured data |
| **Structured Output** | JSON schemas | Enforce output format |
| **Job Queue** | AWS SQS | Async task processing |
| **SDK** | Anthropic Python SDK | Claude API client |
| **Config Storage** | AWS S3 | Prompts & schemas |

### Data Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | Primary datastore |
| **File Storage** | Supabase Storage | PDF storage (S3-compatible) |
| **Migrations** | Supabase migrations | Schema version control |
| **Auth** | Supabase Auth | User authentication |
| **Authorization** | Row-Level Security (RLS) | Fine-grained permissions |
| **Real-time** | Supabase Realtime | WebSocket subscriptions (optional) |

### Infrastructure Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Compute** | AWS Lambda | Serverless functions |
| **API** | API Gateway HTTP API v2 | RESTful endpoints |
| **CDN** | CloudFront | Global content delivery |
| **Storage** | S3 | Static asset hosting |
| **Queue** | SQS | Job queue for AI worker |
| **Secrets** | AWS SSM Parameter Store | Environment variables |
| **CI/CD** | GitHub Actions | Automated deployments |
| **Domain** | Route 53 (assumed) | DNS management |
| **SSL** | AWS Certificate Manager | HTTPS certificates |

---

## Application Components

### Applicant Portal

**Location**: `applicant/`

#### Frontend (`applicant/frontend/`)
- **Port**: 5173 (dev), deployed to S3
- **Entry**: `src/main.tsx`
- **Routes**:
  - `/` - Home/Login
  - `/application` - 13-step form
  - `/dashboard` - Application status tracking

#### 13-Step Application Form
Located in `src/pages/UserFormPage/`:
1. **Personal Information** - Name, DOB, SSN
2. **Contact Information** - Address, phone, email
3. **Employment History** - Last 15 years of work
4. **Earnings History** - W-2 data for quarters of coverage
5. **Current Employment** - Working or not, income
6. **Medical Conditions** - Diagnoses, onset dates
7. **Medical History** - Doctors, hospitals, treatments
8. **Medications** - Current prescriptions
9. **Daily Activities** - ADL limitations
10. **Education** - Highest level completed
11. **Military Service** - Service dates, discharge status
12. **Document Upload** - PDFs (medical records, W-2s, birth certificate)
13. **Review & Submit** - Final review before submission

#### Key Features
- **Real-time validation** with Zod schemas
- **Progress saving** (auto-save drafts)
- **File upload** with drag-and-drop
- **SSDI calculator** based on earnings history
- **Responsive design** for mobile/tablet

#### Backend (`applicant/backend/`)
- **Port**: 3001 (dev), deployed to Lambda
- **Entry**: `App.js`
- **API Routes**:
  - `GET /health` - Health check
  - `POST /api/private/applications` - Create application
  - `GET /api/private/applications/:id` - Get application
  - `PUT /api/private/applications/:id` - Update application
  - `POST /api/private/applications/:id/upload` - Upload PDF
  - `GET /api/private/applications/:id/status` - Get status

---

### Caseworker Portal

**Location**: `caseworker/`

#### Frontend (`caseworker/frontend/`)
- **Port**: 5191 (dev), deployed to S3
- **Entry**: `src/main.tsx`
- **Routes**:
  - `/` - Login
  - `/dashboard` - Application queue
  - `/application/:id` - Application detail view

#### Dashboard Features
- **Application Queue** with filters:
  - Status (pending, approved, rejected)
  - AI recommendation (approve, deny, review)
  - Date range
  - Search by applicant name/ID
- **AI Recommendation Tags**:
  - 🟢 Green (Approve) - High confidence
  - 🟡 Yellow (Further Review) - Medium confidence
  - 🔴 Red (Deny) - High confidence deny
- **Bulk Actions** - Assign to caseworker
- **Real-time Updates** - Status changes propagate

#### Application Detail View
- **AI Analysis Panel**:
  - Overall recommendation (approve/deny/review)
  - Confidence score (0-1 probability)
  - Phase-by-phase breakdown (5 phases)
  - Legal citations (42 U.S.C. § 423, 20 CFR § 404.x)
  - Evidence references (links to source documents)
- **Document Viewer**:
  - Inline PDF viewer
  - AI-extracted data overlays
  - Highlighted key sections
- **Decision Actions**:
  - Approve ✓
  - Deny ✗
  - Request More Info 📄
  - Assign to Another Caseworker 👤

#### Backend (`caseworker/backend/`)
- **Port**: 3002 (dev), deployed to Lambda
- **Entry**: `App.js`
- **API Routes**:
  - `GET /health` - Health check
  - `GET /api/private/dashboard` - Get application queue
  - `GET /api/private/applications/:id` - Get application details
  - `PUT /api/private/applications/:id/status` - Update status
  - `POST /api/private/applications/:id/assign` - Assign to caseworker
  - `GET /api/private/analytics` - Dashboard analytics

---

### AI Processing Service

**Location**: `ai-app-processing-service/`

#### Architecture
- **Runtime**: Python 3.13 on AWS Lambda
- **Model**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Prompts**: Stored in S3 bucket `ai-service-configs`
- **Queue**: SQS queue `calhacksy1-ai-worker-queue`

#### Worker Loop (`worker.py`)
```python
while True:
    # 1. Poll SQS queue for new jobs
    messages = sqs_client.receive_message(QueueUrl=SQS_QUEUE_URL)

    # 2. Fetch application from Supabase
    application = supabase.table('applications').select('*').eq('id', app_id).single()

    # 3. Download PDFs from Supabase Storage
    files = fetch_application_files(app_id)

    # 4. EXTRACTOR AGENT: Parse PDFs → Structured JSON
    extracted_data = call_claude_extractor(files)

    # 5. REASONING AGENT: Evaluate against SSA rules
    reasoning_result = call_claude_reasoning(application, extracted_data)

    # 6. Save results to database
    supabase.table('applications').update({
        'ai_recommendation': reasoning_result['recommendation'],
        'ai_confidence': reasoning_result['confidence'],
        'ai_analysis': reasoning_result
    }).eq('id', app_id).execute()

    # 7. Delete message from queue
    sqs_client.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=receipt_handle)
```

#### Extractor Agent
**Purpose**: Extract structured data from PDFs (medical records, W-2s, birth certificates)

**Prompt**: `prompts/extractor_prompt.md`

**Input**:
- Application data (JSON)
- Uploaded PDFs (base64-encoded)

**Output Schema** (`schemas/extractor_output_schema.json`):
```json
{
  "administrative_data": {
    "birth_certificate": { "name": "...", "dob": "...", "ssn_verified": true },
    "w2_forms": [{ "year": 2023, "employer": "...", "wages": 45000 }],
    "military_records": { "service_dates": "...", "discharge_status": "..." }
  },
  "medical_evidence": {
    "diagnoses": [{ "condition": "...", "icd10_code": "...", "onset_date": "..." }],
    "objective_findings": ["MRI shows L4-L5 herniation"],
    "functional_limitations": { "sitting": "2 hours", "standing": "1 hour" }
  }
}
```

#### Reasoning Agent
**Purpose**: Evaluate application against SSA's 5-Step Sequential Evaluation Process

**Prompt**: `prompts/reasoning_prompt.md`

**Input**:
- Application data (JSON)
- Extracted data from Extractor Agent (JSON)

**SSA Legal Rules** (`prompts/rules.md`):
- 42 U.S.C. § 423 - SSDI eligibility
- 20 CFR § 404.1520 - Sequential evaluation process
- 20 CFR § 404.1571-1576 - Substantial Gainful Activity
- Blue Book listings (Appendix 1)
- Medical-Vocational Guidelines (Appendix 2 - Grid Rules)

**Output Schema** (`schemas/reasoning_output_schema.json`):
```json
{
  "recommendation": "APPROVE" | "DENY" | "FURTHER_REVIEW",
  "confidence": 0.92,
  "phases": [
    {
      "phase": 0,
      "name": "Basic Eligibility & Insured Status",
      "status": "PASS",
      "reasoning": "Applicant has 52 quarters of coverage...",
      "legal_citations": ["42 U.S.C. § 423(a)(1)(D)", "20 CFR § 404.101"],
      "evidence": ["W-2 forms 2010-2023", "Birth certificate"],
      "red_flags": []
    },
    // ... phases 1-5
  ],
  "ssdi_payment_estimate": 1800,
  "missing_evidence": ["Recent MRI report"],
  "red_flags": ["Earnings spike in 2023 after alleged onset date"]
}
```

#### AI Performance Metrics
- **Extraction Accuracy**: 95%+ (validated against manual review)
- **Processing Time**: 30-60 seconds per application
- **Token Usage**: ~15K tokens per application (input + output)
- **Cost**: ~$0.02 per application with Claude Haiku 4.5

---

### Landing Page

**Location**: `landing-page/`

#### Features
- **3D Globe** (`src/components/Globe3D.tsx`) - Interactive Three.js globe showing global reach
- **Hero Section** - Problem statement and solution
- **Features** - Key benefits for applicants and caseworkers
- **Statistics** - Impact metrics (940K waiting, 7 months → 1-2 days)
- **CTA** - Links to applicant and caseworker portals

#### Tech
- React 19 + TypeScript
- Three.js + React Three Fiber
- Tailwind CSS 4
- Deployed to S3 + CloudFront

---

## AI System Design

### Dual-Agent Architecture

**Why Two Agents?**
1. **Separation of Concerns**:
   - Extractor focuses on document parsing
   - Reasoning focuses on legal evaluation
2. **Better Prompting**:
   - Each agent has a specific task
   - Clearer instructions = better output
3. **Modularity**:
   - Can swap out extractors (OCR, Vision API)
   - Can update legal rules without changing extraction
4. **Debugging**:
   - Easier to identify where errors occur
   - Can test each agent independently

### SSA 5-Step Sequential Evaluation Process

The Reasoning Agent follows SSA's official disability determination process:

#### Phase 0: Basic Eligibility & Insured Status
**Legal Basis**: 42 U.S.C. § 423(a)(1)(D)

**Checks**:
- Age 18-65 (not at retirement age)
- Insured status (20/40 rule): 20 quarters of coverage in last 40 quarters
- Date Last Insured (DLI) vs. Alleged Onset Date (AOD)

**Output**: PASS / FAIL / WARN

---

#### Phase 1: Substantial Gainful Activity (SGA)
**Legal Basis**: 20 CFR § 404.1571-1576

**Checks**:
- Currently working?
- Earnings exceed $1,550/month (2024 threshold)?
- Unsuccessful Work Attempts (UWA)?

**Output**: PASS (not SGA) / FAIL (is SGA) / WARN (borderline)

---

#### Phase 2: Severe Impairment
**Legal Basis**: 20 CFR § 404.1520(c)

**Checks**:
- Medically determinable impairment?
- Significantly limits basic work activities?
- Duration > 12 months (or expected to be)?

**Output**: PASS (severe) / FAIL (not severe) / WARN (need evidence)

---

#### Phase 3: Listed Impairments (Blue Book)
**Legal Basis**: 20 CFR § 404.1520(d), Appendix 1 to Subpart P

**Checks**:
- Does condition match a specific Blue Book listing?
  - Example: 1.04 Disorders of the Spine
  - Example: 12.04 Depressive, Bipolar, and Related Disorders
- Are all criteria (A, B, C) met?

**Output**: MET (automatic approval) / NOT MET (proceed to Phase 4) / EQUAL (medical equivalence)

---

#### Phase 4: Residual Functional Capacity (RFC) & Past Relevant Work (PRW)
**Legal Basis**: 20 CFR § 404.1520(e)-(f)

**Checks**:
- What is the applicant's RFC?
  - Sedentary (sit 6 hours, lift 10 lbs)
  - Light (stand 6 hours, lift 20 lbs)
  - Medium (stand 6 hours, lift 50 lbs)
  - Heavy (stand 6 hours, lift 100 lbs)
- Can they perform past relevant work (last 15 years)?

**Output**: CANNOT PERFORM PRW (pass) / CAN PERFORM PRW (deny)

---

#### Phase 5: Adjustment to Other Work (Grid Rules)
**Legal Basis**: 20 CFR § 404.1520(g), Appendix 2 to Subpart P

**Checks**:
- Age category (younger, approaching advanced age, advanced age)
- Education (illiterate, limited, high school, college)
- Work experience (unskilled, semi-skilled, skilled)
- Apply Medical-Vocational Guidelines (GRIDS)

**Output**: DISABLED (approve) / NOT DISABLED (deny) / BORDERLINE (human review)

---

### Confidence Scoring

The AI provides a confidence score (0-1 probability) for its recommendation:

- **0.9-1.0**: High confidence (clear-cut case)
- **0.7-0.89**: Medium-high confidence (strong case, minor gaps)
- **0.5-0.69**: Medium confidence (needs human review)
- **0-0.49**: Low confidence (insufficient evidence, borderline case)

**Factors affecting confidence**:
- Completeness of evidence
- Clarity of medical documentation
- Consistency across documents
- Presence of red flags or contradictions

---

## Database Architecture

**Provider**: Supabase (PostgreSQL 15+)

### Key Tables

#### `users`
User accounts for applicants, caseworkers, and admins.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('applicant', 'caseworker', 'admin')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies**:
- Users can read their own data
- Caseworkers can read applicant data
- Admins can read all data

---

#### `applications`
SSDI applications with nested JSONB data.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'reviewed', 'approved', 'rejected')),

  -- Application data (13-step form)
  personal_info JSONB,
  employment_history JSONB,
  medical_history JSONB,
  uploaded_files JSONB,

  -- AI processing results
  ai_recommendation TEXT CHECK (ai_recommendation IN ('APPROVE', 'DENY', 'FURTHER_REVIEW')),
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  ai_analysis JSONB, -- Full reasoning output

  -- Caseworker decision
  caseworker_decision TEXT CHECK (caseworker_decision IN ('approved', 'denied', 'needs_info')),
  caseworker_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**RLS Policies**:
- Applicants can CRUD their own applications
- Caseworkers can read all applications, update status
- Admins have full access

---

#### `application_files`
Metadata for uploaded PDFs.

```sql
CREATE TABLE application_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'medical_record', 'w2', 'birth_certificate', etc.
  file_size INTEGER,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### `processing_queue`
Async AI processing job queue (used alongside SQS).

```sql
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

---

#### `assigned_applications`
Caseworker workload distribution.

```sql
CREATE TABLE assigned_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  caseworker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id, caseworker_id)
);
```

---

### Supabase Storage Buckets

#### `application-files`
Stores all uploaded PDFs.

**Bucket Policies**:
- Authenticated users can upload to `{user_id}/`
- Users can only access their own files
- Caseworkers can access all files

**File Structure**:
```
application-files/
├── {user_id}/
│   ├── {application_id}/
│   │   ├── medical_record_1.pdf
│   │   ├── w2_2023.pdf
│   │   ├── birth_certificate.pdf
│   │   └── ...
```

---

### Migrations

**Location**: `supabase/migrations/`

**Migration Files**:
1. `20260104194638_remote_schema.sql` - Initial schema (users, applications, files)
2. `20260104230015_add_caseworker_assigns.sql` - Assigned applications table
3. `20260105000000_fix_users_select_caseworker_circular_dependency.sql` - RLS policy fix

**Running Migrations**:
```bash
# Local development
supabase db reset

# Production (via Supabase dashboard)
# - Copy SQL from migration file
# - Run in SQL Editor
```

---

## AWS Infrastructure

### Region Strategy
- **us-east-2 (Ohio)**: Backend (Lambda, API Gateway, SQS)
- **us-east-1 (N. Virginia)**: Frontend (S3, CloudFront)

### Lambda Functions

#### `claimd-applicant-api`
- **Runtime**: Node.js 20.x
- **Handler**: `lambda.handler`
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Env Vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SQS_QUEUE_URL`, `CORS_ORIGIN`

#### `claimd-caseworker-api`
- **Runtime**: Node.js 20.x
- **Handler**: `lambda.handler`
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Env Vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGIN`

#### `claimd-ai-worker`
- **Runtime**: Python 3.13
- **Handler**: `worker.handler`
- **Memory**: 1024 MB
- **Timeout**: 5 minutes
- **Trigger**: SQS queue `calhacksy1-ai-worker-queue`
- **Env Vars**: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `S3_CONFIG_BUCKET`

---

### API Gateway HTTP APIs (v2)

#### Applicant API
- **API ID**: `5feq6kxwfj`
- **Endpoint**: `https://5feq6kxwfj.execute-api.us-east-2.amazonaws.com`
- **Stage**: `$default` (no stage prefix in URL)
- **Routes**:
  - `$default` - Catch-all for root paths
  - `ANY /{proxy+}` - Proxy all requests to Lambda

#### Caseworker API
- **API ID**: `c9vzz3ujrb`
- **Endpoint**: `https://c9vzz3ujrb.execute-api.us-east-2.amazonaws.com`
- **Stage**: `$default`
- **Routes**: Same as Applicant API

**Important**: HTTP API Gateway v2 requires `$default` stage (with dollar sign) to work without stage name in URL.

---

### CloudFront Distributions

#### Applicant Portal
- **Distribution ID**: `E19N9CLEWYM9KP`
- **Domain**: `applicant.claimd.tech`
- **Origins**:
  - **Default** (frontend): `claimd-applicant-frontend.s3.us-east-1.amazonaws.com`
  - **/api/*** (backend): `5feq6kxwfj.execute-api.us-east-2.amazonaws.com`
- **Cache Behaviors**:
  - `/*` → S3 (GET, HEAD only, cache enabled)
  - `/api/*` → API Gateway (all methods, cache disabled)

#### Caseworker Portal
- **Distribution ID**: `EUH7AYTFW0871`
- **Domain**: `caseworker.claimd.tech`
- **Origins**:
  - **Default** (frontend): `claimd-caseworker-frontend.s3.us-east-1.amazonaws.com`
  - **/api/*** (backend): `c9vzz3ujrb.execute-api.us-east-2.amazonaws.com`
- **Cache Behaviors**: Same as Applicant Portal

**Benefits**:
- Single domain for frontend + API (no CORS issues)
- Global CDN performance
- SSL/TLS via AWS Certificate Manager
- DDoS protection

---

### SQS Queue

**Name**: `calhacksy1-ai-worker-queue`
**URL**: `https://sqs.us-east-2.amazonaws.com/211125407739/calhacksy1-ai-worker-queue`

**Configuration**:
- **Visibility Timeout**: 5 minutes (matches Lambda timeout)
- **Retention Period**: 4 days
- **Dead Letter Queue**: Yes (for failed jobs)
- **Batch Size**: 1 (process one application at a time)

---

### S3 Buckets

#### Frontend Hosting
- `claimd-applicant-frontend` (us-east-1)
- `claimd-caseworker-frontend` (us-east-1)
- `claimd-landing-page` (us-east-1)

**Bucket Policy**: Public read access for static assets

#### AI Config Storage
- `ai-service-configs` (us-east-2)

**Contents**:
- `prompts/extractor_prompt.md`
- `prompts/reasoning_prompt.md`
- `prompts/rules.md`
- `schemas/extractor_output_schema.json`
- `schemas/reasoning_output_schema.json`

**Bucket Policy**: Lambda read-only access

---

### AWS SSM Parameter Store

**Region**: us-east-2

**Parameters**:
```bash
/calhacksy1/supabase/url
/calhacksy1/supabase/service-key
/calhacksy1/sqs/queue-url
/calhacksy1/cors/applicant-frontend-origin
/calhacksy1/cors/caseworker-frontend-origin
/calhacksy1/anthropic/api-key
```

**Used By**: GitHub Actions workflows for deployment

---

## Deployment

### CI/CD Pipeline (GitHub Actions)

**Location**: `.github/workflows/`

#### Backend Deployment Workflows

**Files**:
- `deploy-applicant-api.yml`
- `deploy-caseworker-api.yml`

**Trigger**: Push to `main` branch (path filter: `applicant/backend/**` or `caseworker/backend/**`)

**Steps**:
1. Checkout code
2. Install production dependencies (`npm ci --omit=dev`)
3. Create deployment package (`zip -r function.zip .`)
4. Fetch environment variables from AWS SSM
5. Update Lambda function code
6. Update Lambda environment variables

**GitHub Secrets Required**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (us-east-2)

---

#### Frontend Deployment Workflows

**Files**:
- `deploy-applicant-frontend.yml`
- `deploy-caseworker-frontend.yml`

**Trigger**: Push to `main` branch (path filter: `applicant/frontend/**` or `caseworker/frontend/**`)

**Steps**:
1. Checkout code
2. Install dependencies (`npm ci`)
3. Build with environment variables from GitHub Secrets
4. Sync to S3 bucket (`aws s3 sync dist/ s3://...`)
5. Invalidate CloudFront cache (`aws cloudfront create-invalidation --paths "/*"`)

**GitHub Secrets Required**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APPLICANT_API_URL` (https://applicant.claimd.tech)
- `VITE_CASEWORKER_API_URL` (https://caseworker.claimd.tech)

---

#### AI Worker Deployment Workflow

**File**: `deploy-ai-worker.yml`

**Trigger**: Push to `main` branch (path filter: `ai-app-processing-service/**`)

**Steps**:
1. Checkout code
2. Upload prompts and schemas to S3 bucket `ai-service-configs`
3. Install Python dependencies (`pip install -r requirements.txt -t .`)
4. Create deployment package (`zip -r function.zip .`)
5. Update Lambda function code
6. Update Lambda environment variables from SSM

---

### Manual Deployment

#### Backend (Local Development)
```bash
# Install dependencies
cd applicant/backend
npm install

# Create .env file
cat > .env <<EOF
SUPABASE_URL=https://mxeiolcaatrynxpugodw.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/211125407739/calhacksy1-ai-worker-queue
PORT=3001
EOF

# Start server
npm start
```

#### Frontend (Local Development)
```bash
# Install dependencies
cd applicant/frontend
npm install

# Create .env file
cat > .env <<EOF
VITE_SUPABASE_URL=https://mxeiolcaatrynxpugodw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
EOF

# Start dev server
npm run dev
```

#### AI Worker (Local Development)
```bash
# Install dependencies
cd ai-app-processing-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env <<EOF
SUPABASE_URL=https://mxeiolcaatrynxpugodw.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
SQS_QUEUE_URL=https://sqs.us-east-2.amazonaws.com/211125407739/calhacksy1-ai-worker-queue
EOF

# Run worker
python worker.py
```

---

## API Documentation

### Applicant API

#### `POST /api/private/applications`
Create a new application.

**Auth**: Required (JWT token in `Authorization` header)

**Request**:
```json
{
  "personal_info": { "name": "John Doe", "dob": "1980-01-01", "ssn_hash": "..." },
  "employment_history": [...],
  "medical_history": [...]
}
```

**Response**:
```json
{
  "id": "uuid",
  "status": "draft",
  "created_at": "2026-01-13T12:00:00Z"
}
```

---

#### `GET /api/private/applications/:id`
Get application details.

**Auth**: Required (user must own application or be caseworker)

**Response**:
```json
{
  "id": "uuid",
  "status": "submitted",
  "personal_info": {...},
  "ai_recommendation": "APPROVE",
  "ai_confidence": 0.92,
  "ai_analysis": {...}
}
```

---

#### `PUT /api/private/applications/:id`
Update application (draft only).

**Auth**: Required (user must own application)

**Request**:
```json
{
  "personal_info": {...},
  "employment_history": [...]
}
```

---

#### `POST /api/private/applications/:id/upload`
Upload a PDF file.

**Auth**: Required (user must own application)

**Request**: Multipart form data with `file` field

**Response**:
```json
{
  "file_id": "uuid",
  "file_name": "medical_record.pdf",
  "storage_path": "user_id/app_id/file.pdf"
}
```

---

### Caseworker API

#### `GET /api/private/dashboard`
Get application queue with filters.

**Auth**: Required (caseworker role)

**Query Params**:
- `status` - Filter by status (pending, reviewed, etc.)
- `ai_recommendation` - Filter by AI recommendation
- `date_from`, `date_to` - Date range filter
- `search` - Search by applicant name

**Response**:
```json
{
  "applications": [
    {
      "id": "uuid",
      "applicant_name": "John Doe",
      "status": "submitted",
      "ai_recommendation": "APPROVE",
      "ai_confidence": 0.92,
      "submitted_at": "2026-01-13T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1
}
```

---

#### `PUT /api/private/applications/:id/status`
Update application status (approve/deny).

**Auth**: Required (caseworker role)

**Request**:
```json
{
  "decision": "approved" | "denied" | "needs_info",
  "notes": "Application meets all criteria..."
}
```

**Response**:
```json
{
  "status": "approved",
  "reviewed_by": "caseworker_id",
  "reviewed_at": "2026-01-13T12:30:00Z"
}
```

---

## Security

### Authentication
- **Provider**: Supabase Auth
- **Method**: JWT tokens (access + refresh)
- **Token Expiry**: 1 hour (access), 30 days (refresh)
- **Storage**: Cookies (httpOnly, secure, sameSite)

### Authorization
- **Row-Level Security (RLS)**: Postgres policies enforce access control
- **Role-Based Access Control (RBAC)**: User roles (applicant, caseworker, admin)
- **Policy Examples**:
  - Applicants can only see their own applications
  - Caseworkers can see all applications but cannot modify personal info
  - Admins have full access

### SSN Protection
- **Hashing**: SHA-256 with pepper (never stored in plain text)
- **Pepper**: Stored in AWS SSM Parameter Store
- **Validation**: Client-side validation before submission
- **Audit**: SSN access is logged

### File Upload Security
- **File Type Validation**: Only PDFs allowed
- **File Size Limit**: 10 MB per file, 50 MB total per application
- **Virus Scanning**: (Future) Integrate with AWS CloudWatch for malware detection
- **Storage**: Private buckets with signed URLs for access

### HTTP Security
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Whitelisted origins only
- **Rate Limiting**: 100 requests/15 minutes per IP
- **HTTPS**: All traffic over SSL/TLS (CloudFront)

### Data Privacy
- **HIPAA Considerations**: Medical data encrypted at rest and in transit
- **PII Minimization**: Only collect necessary data
- **Data Retention**: (Future) Implement data deletion policies
- **Audit Logs**: (Future) Log all access to sensitive data

---

## Monitoring & Troubleshooting

### Health Checks

#### API Health Endpoints
```bash
# Direct API Gateway
curl https://5feq6kxwfj.execute-api.us-east-2.amazonaws.com/health
curl https://c9vzz3ujrb.execute-api.us-east-2.amazonaws.com/health

# Through CloudFront
curl https://applicant.claimd.tech/api/health
curl https://caseworker.claimd.tech/api/health

# Expected response
{"status":"healthy","timestamp":"2026-01-13T12:00:00Z","version":"1.0.0"}
```

---

### Lambda Logs

#### View Logs (CloudWatch)
```bash
# Tail applicant API logs
aws logs tail /aws/lambda/claimd-applicant-api \
  --region us-east-2 \
  --since 1h \
  --format detailed

# Tail AI worker logs
aws logs tail /aws/lambda/claimd-ai-worker \
  --region us-east-2 \
  --since 1h \
  --format detailed
```

#### Common Log Patterns
- `ERROR: Unable to determine event source` → Lambda using wrong serverless-express package
- `CORS policy` → CORS_ORIGIN environment variable not set
- `Supabase error: JWT expired` → Token refresh needed
- `Anthropic API error: rate limit` → Reduce concurrency or add retry logic

---

### CloudFront Debugging

#### Check Distribution Status
```bash
aws cloudfront get-distribution \
  --id E19N9CLEWYM9KP \
  --region us-east-1 \
  --query 'Distribution.Status'

# Should return "Deployed" (not "InProgress")
```

#### Create Cache Invalidation
```bash
# Invalidate API routes
aws cloudfront create-invalidation \
  --distribution-id E19N9CLEWYM9KP \
  --paths "/api/*"

# Invalidate everything
aws cloudfront create-invalidation \
  --distribution-id E19N9CLEWYM9KP \
  --paths "/*"
```

---

### Common Issues

#### 404 Not Found
- **Check**: Route configured in Express app?
- **Check**: CloudFront has `/api/*` cache behavior?
- **Check**: API Gateway stage is `$default` (not "default")?

#### 500 Internal Server Error
- **Check**: Lambda logs for errors
- **Check**: Lambda environment variables set correctly?
- **Check**: Supabase credentials valid?

#### CORS Errors
- **Check**: `CORS_ORIGIN` environment variable in Lambda
- **Check**: Frontend using CloudFront domain (not direct API Gateway URL)
- **Expected**: No CORS issues when using CloudFront (same-origin)

#### AI Worker Not Processing
- **Check**: SQS queue has messages?
- **Check**: Lambda has correct trigger configuration?
- **Check**: Anthropic API key valid?
- **Check**: `processing_queue` table has pending jobs?

---

## Recent Infrastructure Fixes

### Date: January 13, 2026

#### Issue #1: API Gateway Stage Misconfiguration
**Problem**: API Gateways were using stage "default" instead of "$default"

**Impact**: HTTP API Gateway v2 requires `$default` stage to work without stage name in URL. Requests were returning 404 errors.

**Fix Applied**:
```bash
# Added $default route
aws apigatewayv2 create-route --api-id <API_ID> --region us-east-2 \
  --route-key '$default' --target integrations/<INTEGRATION_ID>

# Deleted old "default" stage
aws apigatewayv2 delete-stage --api-id <API_ID> --stage-name default --region us-east-2

# Created $default stage with auto-deploy
aws apigatewayv2 create-stage --api-id <API_ID> --stage-name '$default' \
  --auto-deploy --region us-east-2
```

**Result**: APIs now accessible without stage prefix in URL ✅

---

#### Issue #2: Lambda Functions Had Outdated Code
**Problem**: Deployed Lambda functions were using old package `@codegenie/serverless-express`

**Impact**: Lambda was throwing errors about "Unable to determine event source"

**Fix Applied**:
```bash
# Redeployed both Lambda functions with @vendia/serverless-express
cd applicant/backend
npm ci --omit=dev
zip -r function.zip . -x "*.git*" "node_modules/.cache/*"
aws lambda update-function-code \
  --function-name claimd-applicant-api \
  --zip-file fileb://function.zip \
  --region us-east-2
```

**Result**: Lambda functions now properly handle API Gateway v2 events ✅

---

#### Issue #3: CloudFront Pointing to Old API Gateways
**Problem**: CloudFront distributions were pointing to old API Gateway endpoints

**Impact**: Requests to `caseworker.claimd.tech/api/health` were failing

**Fix Applied**:
- Updated CloudFront origin configuration to point to correct API Gateways
- Removed `/production` origin path (using `$default` stage now)
- Created cache invalidations for `/api/*` paths

**Result**: CloudFront now routes `/api/*` requests to correct API Gateways ✅

---

## Architecture Decisions

### Why HTTP API Gateway (v2) instead of REST API (v1)?
- Lower cost ($1.00/million vs $3.50/million)
- Better performance (lower latency)
- Simpler configuration
- Native JWT authorization support

### Why Lambda Proxy Integration?
- Pass entire request context to Lambda
- Lambda controls response format and headers
- Flexibility in handling different request types
- Works with Express via serverless-express

### Why CloudFront?
- Global CDN performance
- SSL/TLS certificate management
- Same-origin requests (no CORS issues)
- DDoS protection
- Cost-effective caching

### Why Dual-Agent AI System?
- Separation of concerns (extraction vs. reasoning)
- Better prompt engineering
- Modularity (swap extractors or update rules independently)
- Easier debugging and testing

### Why Supabase?
- PostgreSQL with built-in auth
- Row-Level Security for fine-grained access control
- S3-compatible storage for PDFs
- Real-time subscriptions (future feature)
- Generous free tier for hackathon

---

## Contact & Support

**Project**: Claimd - AI-powered SSDI application processing
**Built with**: Claude Haiku 4.5 (Anthropic), React, Node.js, AWS Lambda, Supabase
**Infrastructure**: AWS (Lambda, API Gateway, CloudFront, S3, SQS)
**Hackathon**: CalHacks (2026)

---

*Last updated: January 13, 2026*
*Maintained by: Development Team*
