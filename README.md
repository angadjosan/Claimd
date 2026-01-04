# Claimd

**Accelerating Social Security Disability Insurance (SSDI) claim processing from 7 months to 1-2 days with AI-powered document analysis**

[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20Haiku%204.5-blue)](https://www.anthropic.com)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)](https://supabase.com)

---

## Table of Contents

- [Overview](#overview)
  - [The Problem](#the-problem)
  - [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [AI Processing Pipeline](#ai-processing-pipeline)
- [Database Schema](#database-schema)
- [Impact](#impact)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Claimd is an AI-powered platform that dramatically reduces SSDI application processing time from **7 months to 1-2 days**. By automating document review and validation using Claude Haiku 4.5, we help 940,000 Americans waiting for disability benefits get faster decisions while giving SSA officers powerful AI assistance to review claims **20x faster**.

### The Problem

- **940,000 Americans** are currently waiting for SSDI claim decisions
- **6-8 month average wait time** nationally due to SSA understaffing (25-year staffing low)
- SSA officers must manually review **34+ document fields** across multiple PDFs, taking **8-10 minutes per claim**
- Critical financial support is delayed for disabled individuals who can no longer work

### Our Solution

Claimd provides an end-to-end platform with three main components:
- **Applicant Portal**: Streamlined 13-step application form mirroring SSA's official process
- **Caseworker Portal**: Administrative dashboard with AI-powered decision recommendations
- **AI Processing Service**: Background worker that extracts data from documents and evaluates applications using SSA's official 5-Step Sequential Evaluation Process

---

## Key Features

### Applicant Portal
- **13-step guided application form** with validation at each step
- **Document upload system** for medical records, W-2s, birth certificates, and financial proof
- **Real-time status tracking** with progress indicators
- **Personal dashboard** showing application progress and next steps
- **SSDI payment calculator** based on earnings history

### Caseworker Portal
- **Application queue** with AI recommendation tags (approve/reject/further review)
- **Detailed AI analysis** including:
  - 5-phase evaluation breakdown following SSA rules
  - Color-coded confidence scoring (green/yellow/red)
  - Legal citations (42 U.S.C. § 423, 20 CFR § 404.x)
  - Source document references
  - SSDI payment calculations
- **One-click approval/rejection** workflow
- **Document viewer** with AI-extracted insights
- **Assignment system** for distributing workload among caseworkers

### AI Processing Engine
- **Dual-agent system**:
  - **Extractor Agent**: Parses PDFs using Claude's document understanding
  - **Reasoning Agent**: Evaluates applications against SSA's 5-Step Sequential Evaluation Process
- **Structured output validation** with JSON schemas
- **Multi-document analysis** cross-referencing medical records, financial documents, and personal information
- **Confidence scoring** (0-1 probability scale) for decision transparency
- **ChromaDB vector store** for RAG-powered document retrieval
- **Processing queue** with retry logic and error handling

---

## Architecture

### Multi-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
├──────────────────┬──────────────────┬───────────────────┤
│  Applicant UI    │  Caseworker UI   │   Landing Page    │
│  (Port 5173)     │  (Port 5191)     │   (Port 5173)     │
│  React/TypeScript│  React/TypeScript│   React/Three.js  │
└────────┬─────────┴────────┬─────────┴───────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND LAYER                         │
├──────────────────┬──────────────────────────────────────┤
│  Applicant API   │         Caseworker API               │
│  (Port 3001)     │         (Port 3002)                  │
│  Node.js/Express │         Node.js/Express              │
└────────┬─────────┴────────┬───────────────────────────┬─┘
         │                  │                           │
         └──────────────────┼───────────────────────────┘
                            ▼
         ┌─────────────────────────────────────┐
         │    Supabase (PostgreSQL + Auth)     │
         │  - Applications DB                  │
         │  - Users & Roles (RLS)              │
         │  - File Storage (S3)                │
         │  - Processing Queue                 │
         └─────────────┬───────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────────┐
         │   AI Processing Service (Python)    │
         │  - Worker Loop (Background)         │
         │  - Document Extractor (Claude API)  │
         │  - Reasoning Engine (Claude API)    │
         │  - ChromaDB (Vector Store)          │
         └─────────────────────────────────────┘
```

### Data Flow

1. **Application Submission**:
   - Applicant fills 13-step form → Frontend validates with Zod
   - Uploads PDFs (medical records, W-2s) → Stored in Supabase Storage
   - Submits application → Stored in `applications` table
   - Triggers task in `processing_queue`

2. **AI Processing** (Async):
   - Worker polls queue → Fetches application + PDFs
   - **Extractor Call**: Claude extracts structured data from PDFs
   - **Reasoning Call**: Claude evaluates against SSA 5-Step Process
   - Updates `applications` table with AI recommendations

3. **Caseworker Review**:
   - Dashboard shows applications with AI recommendations
   - Clicks application → Views AI analysis (phases, evidence, confidence)
   - Reviews extracted data and supporting documents
   - Makes final decision → Updates status → Applicant notified

---

## Tech Stack

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.x
- **Language**: TypeScript
- **UI/Styling**: Tailwind CSS 4.x, Lucide React (icons)
- **3D Graphics**: Three.js with React Three Fiber (landing page)
- **Routing**: React Router DOM v7
- **Validation**: Zod schemas
- **Authentication**: Supabase Auth

### Backend
- **APIs**: Node.js with Express 5.x
- **Security**: Helmet.js, CORS, Express Rate Limiting
- **File Upload**: Multer
- **Environment**: dotenv

### AI Processing Service
- **Runtime**: Python 3.x
- **LLM**: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Document Processing**: PDF extraction with base64 encoding
- **Vector DB**: ChromaDB for RAG-powered document retrieval
- **Structured Output**: JSON schemas with validation

### Database & Storage
- **Database**: PostgreSQL via Supabase
- **File Storage**: Supabase Storage (S3-compatible buckets)
- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row-Level Security (RLS) policies

### Security Features
- **SSN Protection**: SHA-256 hashing with pepper (never stored in plain text)
- **Role-Based Access**: Applicants, caseworkers, administrators with RLS policies
- **Rate Limiting**: API throttling on all endpoints
- **HTTP Security**: Helmet.js, CORS protection
- **Authentication**: JWT tokens with Supabase Auth

---

## Project Structure

```
calhacksy1/
├── applicant/
│   ├── frontend/          # React UI for SSDI applicants
│   │   ├── src/
│   │   │   ├── pages/UserFormPage/    # 13-step application form
│   │   │   ├── components/            # Reusable form components
│   │   │   └── services/auth.ts       # Supabase auth integration
│   │   └── package.json
│   └── backend/           # Node.js/Express API
│       ├── routes/private/applications.js  # Application CRUD
│       └── server.js
│
├── caseworker/
│   ├── frontend/          # React UI for SSA caseworkers
│   │   ├── src/
│   │   │   ├── pages/Dashboard/       # Admin dashboard
│   │   │   └── services/auth.ts       # Supabase auth integration
│   │   └── package.json
│   └── backend/           # Node.js/Express API
│       ├── routes/private/dashboard.js    # Dashboard API
│       └── server.js
│
├── ai-app-processing-service/    # Python AI worker
│   ├── worker.py          # Main processing loop (391 lines)
│   ├── prompts/
│   │   ├── extractor_prompt.md      # Document extraction instructions
│   │   ├── reasoning_prompt.md      # SSDI evaluation instructions
│   │   └── rules.md                 # Legal standards and SSA rules
│   ├── schemas/
│   │   ├── extractor_output_schema.json
│   │   └── reasoning_output_schema.json
│   └── requirements.txt
│
├── database/
│   ├── migrations/        # PostgreSQL schema migrations
│   │   ├── create_applications.sql
│   │   ├── queue_schema.sql
│   │   └── ...
│   └── README.md          # Complete schema documentation
│
└── landing-page/          # Public-facing marketing site
    ├── src/
    │   └── components/Globe3D.tsx    # Three.js 3D globe
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Python 3.x**
- **pip** (Python package manager)
- **PostgreSQL** (or Supabase account)
- **Anthropic API key** (sign up at [Anthropic Console](https://console.anthropic.com/))

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd calhacksy1
```

#### 2. Applicant Portal Setup

```bash
# Frontend
cd applicant/frontend
npm install

# Backend
cd ../backend
npm install
```

Create `applicant/backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3001
```

Create `applicant/frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. Caseworker Portal Setup

```bash
# Frontend
cd caseworker/frontend
npm install

# Backend
cd ../backend
npm install
```

Create `caseworker/backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3002
```

Create `caseworker/frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. AI Processing Service Setup

```bash
cd ai-app-processing-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `ai-app-processing-service/.env`:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

#### 5. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order from `/database/migrations/` using the Supabase SQL editor
3. Configure Row-Level Security (RLS) policies as documented in `/database/README.md`
4. Create storage buckets:
   - `application-files` (for uploaded PDFs)
   - Configure bucket policies to allow authenticated uploads

### Running the Application

You'll need **5 terminals** to run all services:

#### Terminal 1 - Applicant Backend
```bash
cd applicant/backend
npm start
# Runs on http://localhost:3001
```

#### Terminal 2 - Applicant Frontend
```bash
cd applicant/frontend
npm run dev
# Runs on http://localhost:5173
```

#### Terminal 3 - Caseworker Backend
```bash
cd caseworker/backend
npm start
# Runs on http://localhost:3002
```

#### Terminal 4 - Caseworker Frontend
```bash
cd caseworker/frontend
npm run dev
# Runs on http://localhost:5191
```

#### Terminal 5 - AI Processing Service
```bash
cd ai-app-processing-service
source venv/bin/activate
python worker.py
# Polls processing queue in background
```

### Access Points

- **Applicant Portal**: `http://localhost:5173`
- **Caseworker Portal**: `http://localhost:5191`
- **Landing Page**: `http://localhost:5173` (landing-page build)

---

## AI Processing Pipeline

### SSA 5-Step Sequential Evaluation Process

The AI Reasoning Agent evaluates applications using the official SSA disability determination process:

#### Phase 0: Basic Eligibility & Insured Status
- Validates quarters of coverage (20/40 rule)
- Checks age requirements (18-65)
- **Legal basis**: 42 U.S.C. § 423(a)(1)(D)

#### Phase 1: Substantial Gainful Activity (SGA)
- Checks if earnings exceed $1,550/month threshold
- **Legal basis**: 20 CFR § 404.1571-1576

#### Phase 2: Severe Impairment
- Validates medical conditions significantly limit work
- **Legal basis**: 20 CFR § 404.1520(c)

#### Phase 3: Listed Impairments (Blue Book)
- Checks against official SSA medical listings
- **Legal basis**: 20 CFR § 404.1520(d), Appendix 1 to Subpart P

#### Phase 4: Residual Functional Capacity (RFC) & Past Relevant Work
- Evaluates ability to perform previous work
- **Legal basis**: 20 CFR § 404.1520(e)-(f)

#### Phase 5: Adjustment to Other Work (Grid Rules)
- Applies Medical-Vocational Guidelines
- **Legal basis**: 20 CFR § 404.1520(g), Appendix 2 to Subpart P

### AI Output Format

Each phase produces:
- **Status**: PASS / FAIL / WARN
- **Reasoning**: Detailed explanation
- **Legal Citations**: Relevant statutes and regulations
- **Evidence**: Document references supporting the decision
- **Confidence Score**: 0-1 probability scale

---

## Database Schema

Key tables:

- **users**: Applicants, caseworkers, and administrators
- **applications**: SSDI applications with JSONB fields for complex nested data
- **application_files**: Uploaded PDFs (medical records, W-2s, etc.)
- **application_status_history**: Audit trail of status changes
- **processing_queue**: Async AI task queue
- **assigned_applications**: Caseworker workload distribution

See `/database/README.md` for complete schema documentation.

---

## Database Migrations

We use Supabase migrations to manage database schema changes. All migrations are stored in `supabase/migrations/` and are automatically validated and deployed via CI/CD.

### Creating New Migrations

#### 1. Create a migration

```bash
supabase migration new add_xyz
```

This creates a new migration file:
```
supabase/migrations/<timestamp>_add_xyz.sql
```

#### 2. Write your SQL

Edit the migration file with your SQL changes. Examples include:

- **Creating tables**: `CREATE TABLE ...`
- **Altering tables**: `ALTER TABLE ... ADD COLUMN ...`
- **Creating indexes**: `CREATE INDEX ...`
- **Setting up RLS policies**: `CREATE POLICY ...`
- **Creating functions**: `CREATE OR REPLACE FUNCTION ...`
- **Creating triggers**: `CREATE TRIGGER ...`
- **Data migrations**: `INSERT`, `UPDATE`, `DELETE` statements

Example migration:
```sql
-- Migration: add_xyz
-- Description: Add new column to applications table

ALTER TABLE applications 
ADD COLUMN new_field TEXT;

CREATE INDEX idx_applications_new_field 
ON applications(new_field);

-- Add RLS policy
CREATE POLICY "Users can view their own applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);
```

#### 3. Validate locally (recommended)

Before committing, always test your migration locally:

```bash
# Start local Supabase instance
supabase start

# Reset database and apply all migrations
supabase db reset

# Verify the migration was applied correctly
supabase migration list

# Then, commit to github
```

### CI/CD Pipeline

Our CI/CD pipeline automatically:

1. **On Pull Requests**: 
   - Validates migration file syntax
   - Tests migrations in a clean local Supabase instance
   - Verifies all migrations can be applied in order
   - Checks for duplicate migration names

2. **On Merge to Main**:
   - Pre-deployment validation
   - Applies migrations to production database
   - Verifies deployment success
   - Provides deployment summary

### Migration Best Practices

- ✅ **Always test locally** before pushing
- ✅ **Use descriptive names** for migrations (e.g., `add_user_email_index`, not `migration_1`)
- ✅ **Keep migrations small and focused** - one logical change per migration
- ✅ **Never modify existing migrations** - create a new migration to fix issues
- ✅ **Include comments** explaining the purpose of the migration
- ✅ **Test rollback scenarios** if your migration is complex
- ✅ **Check for breaking changes** that might affect running applications
- ⚠️ **Never drop columns/tables** without a deprecation period
- ⚠️ **Be careful with data migrations** - test with production-like data

### Troubleshooting

**Migration fails in CI/CD:**
- Check the GitHub Actions logs for specific SQL errors
- Verify your migration works locally with `supabase db reset`
- Ensure all required dependencies exist before your migration runs

**Migration conflicts:**
- Ensure migration timestamps are sequential
- Never force-push changes to main branch
- Coordinate with team members on migration order

**Rollback needed:**
- Use Supabase dashboard to manually revert if needed
- Create a new migration to undo changes (preferred)
- Contact team lead for production rollback assistance

---

## Impact

### For Applicants
- Reduce wait time from **7 months → 1-2 days**
- Clear, transparent decision-making process
- Faster access to critical financial support
- Better understanding of application status

### For SSA Officers
- **20x efficiency improvement** (10 minutes → 30 seconds per claim)
- AI-assisted decision-making with confidence scoring
- Focus on complex cases requiring human judgment
- Reduced administrative burden

### At Scale
- Help process backlog of **940,000 pending claims**
- Reduce burden on understaffed SSA offices (25-year staffing low)
- Improve outcomes for disabled Americans in need
- Save taxpayer dollars through increased efficiency

---

## Roadmap

### Current (MVP)
- ✅ 13-step application form with validation
- ✅ PDF upload and storage
- ✅ AI document extraction (Claude Haiku 4.5)
- ✅ AI reasoning engine (SSA 5-Step Process)
- ✅ Caseworker dashboard with recommendations
- ✅ Role-based authentication (applicants, caseworkers, admins)
- ✅ Processing queue with retry logic

### Future Enhancements
- 🔄 Real-time WebSocket notifications for applicants
- 🔄 Email notifications for status updates
- 🔄 Appeals workflow for rejected applications
- 🔄 Advanced analytics dashboard for SSA administrators
- 🔄 Integration with SSA's existing systems (EDIB, SSA-831)
- 🔄 Mobile application for applicants
- 🔄 Multi-language support
- 🔄 Audit logging and compliance reporting
- 🔄 A/B testing for AI prompt optimization
- 🔄 Model fine-tuning with historical SSA decisions

---

## Contributing

This project was built for the CalHacks hackathon. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

[Add your license here]

---

## Acknowledgments

- **Anthropic** for Claude Haiku 4.5 API
- **Supabase** for database and authentication
- **CalHacks** for the opportunity to build impactful technology
- **Social Security Administration** for public documentation of disability determination process

---

Built with ❤️ to help Americans get faster access to disability benefits
