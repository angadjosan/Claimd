# Claimd - Technical Documentation

AI-powered SSDI application processing platform.

**Updated**: January 13, 2026

## Architecture

CloudFront → S3 (React) + API Gateway → Lambda (Node.js/Python) → Supabase (PostgreSQL + Storage) + SQS → AI Worker

**Flow**: Applicant submits form → SQS queues job → AI Worker (Claude Haiku 4.5) processes → Results stored → Caseworker reviews

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + React Router v7 + Zod
- **Backend**: Node.js 20 + Express 5 + @vendia/serverless-express + Multer
- **AI**: Python 3.13 + Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) + Anthropic SDK
- **Data**: Supabase (PostgreSQL 15 + Auth + Storage + RLS)
- **Infrastructure**: AWS Lambda + API Gateway HTTP v2 + CloudFront + S3 + SQS + SSM Parameter Store
- **CI/CD**: GitHub Actions

## Components

### Applicant Portal (`applicant/`)
- **Frontend**: Port 5173 (dev) → S3, Routes: `/`, `/application` (13-step form), `/dashboard`
- **Backend**: Port 3001 (dev) → Lambda `claimd-applicant-api`, Entry: `App.js`

### Caseworker Portal (`caseworker/`)
- **Frontend**: Port 5191 (dev) → S3, Routes: `/`, `/dashboard`, `/application/:id`
- **Backend**: Port 3002 (dev) → Lambda `claimd-caseworker-api`, Entry: `App.js`

### Demo Mode
- **Public demo routes** (no authentication required):
  - Applicant: `/demo` (form), `/demo/dashboard`
  - Caseworker: `/demo/caseworker/dashboard`, `/demo/caseworker/dashboard/applications/:id`
- **Backend**: `/api/demo/*` routes (demo middleware handles session isolation)
- **Important**: When updating dashboard/application detail components, **MUST update both**:
  - Live/production versions (`Dashboard.tsx`, `ApplicationDetail.tsx`, `ActionPanel.tsx`)
  - Demo versions (`DemoDashboard.tsx`, `DemoApplicationDetail.tsx`, `DemoActionPanel.tsx`)
- Demo components use `demoApi` service and `DemoContext`; live components use `api` service and auth context

### AI Processing Service (`ai-app-processing-service/`)
- **Runtime**: Python 3.13 Lambda `claimd-ai-worker`
- **Prompts**: S3 bucket `ai-service-configs` (`prompts/*.md`, `schemas/*.json`)
- **Dual Agents**:
  - Extractor: PDFs → Structured JSON
  - Reasoning: SSA 5-Step Evaluation → Recommendation + Confidence Score
- **Queue**: SQS `calhacksy1-ai-worker-queue`

## AI System

**Dual Agents**: Extractor (document parsing) + Reasoning (legal evaluation)

**SSA 5-Step Evaluation**:
0. Basic Eligibility & Insured Status (20/40 quarters rule)
1. Substantial Gainful Activity (SGA threshold: $1,550/month)
2. Severe Impairment (>12 months duration)
3. Listed Impairments (Blue Book match)
4. Residual Functional Capacity vs. Past Relevant Work
5. Adjustment to Other Work (Grid Rules)

**Confidence**: 0.9-1.0 (high) | 0.7-0.89 (medium-high) | 0.5-0.69 (medium) | 0-0.49 (low)

## Database (Supabase PostgreSQL)

**Tables**: `users`, `applications` (JSONB data + AI results), `application_files`, `processing_queue`, `assigned_applications`

**Storage**: `application-files` bucket (`{user_id}/{application_id}/*.pdf`)

**RLS**: Applicants see own data, caseworkers see all applications, admins have full access

**Migrations**: `supabase/migrations/` (run `supabase db reset` locally)

## AWS Infrastructure

**Regions**: us-east-2 (backend), us-east-1 (frontend)

### Lambda Functions
- `claimd-applicant-api`: Node.js 20, 512MB, 30s timeout
- `claimd-caseworker-api`: Node.js 20, 512MB, 30s timeout
- `claimd-ai-worker`: Python 3.13, 1024MB, 5min timeout, SQS trigger

### API Gateway HTTP v2
- **Applicant**: `5feq6kxwfj` → `https://5feq6kxwfj.execute-api.us-east-2.amazonaws.com`
- **Caseworker**: `c9vzz3ujrb` → `https://c9vzz3ujrb.execute-api.us-east-2.amazonaws.com`
- **Stage**: `$default` (required for HTTP API v2)

### CloudFront
- **Applicant**: `E19N9CLEWYM9KP` → `applicant.claimd.tech`
- **Caseworker**: `EUH7AYTFW0871` → `caseworker.claimd.tech`
- **Cache**: `/*` → S3, `/api/*` → API Gateway (no cache)

### SQS
- **Queue**: `calhacksy1-ai-worker-queue`
- **URL**: `https://sqs.us-east-2.amazonaws.com/211125407739/calhacksy1-ai-worker-queue`

### S3 Buckets
- `claimd-applicant-frontend`, `claimd-caseworker-frontend`, `claimd-landing-page` (us-east-1)
- `ai-service-configs` (us-east-2) - prompts & schemas

### SSM Parameters (us-east-2)
```
/calhacksy1/supabase/url
/calhacksy1/supabase/service-key
/calhacksy1/sqs/queue-url
/calhacksy1/cors/applicant-frontend-origin
/calhacksy1/cors/caseworker-frontend-origin
/calhacksy1/anthropic/api-key
```

## Deployment

### CI/CD (GitHub Actions: `.github/workflows/`)
- **Backend**: `deploy-applicant-api.yml`, `deploy-caseworker-api.yml` → Zip → Update Lambda
- **Frontend**: `deploy-applicant-frontend.yml`, `deploy-caseworker-frontend.yml` → Build → S3 sync → CloudFront invalidation
- **AI Worker**: `deploy-ai-worker.yml` → Upload prompts to S3 → Zip → Update Lambda

### Local Development

**Backend**:
```bash
cd applicant/backend  # or caseworker/backend
npm install
# Create .env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SQS_QUEUE_URL, PORT
npm start
```

**Frontend**:
```bash
cd applicant/frontend  # or caseworker/frontend
npm install
# Create .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev
```

**AI Worker**:
```bash
cd ai-app-processing-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Create .env: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY, SQS_QUEUE_URL
python worker.py
```

## API Endpoints

### Applicant API
- `POST /api/private/applications` - Create application
- `GET /api/private/applications/:id` - Get application
- `PUT /api/private/applications/:id` - Update application
- `POST /api/private/applications/:id/upload` - Upload PDF
- `GET /api/private/applications/:id/status` - Get status
- `GET /health` - Health check

### Caseworker API
- `GET /api/private/dashboard` - Get application queue (filters: status, ai_recommendation, date, search)
- `GET /api/private/applications/:id` - Get application details
- `PUT /api/private/applications/:id/status` - Update status (approve/deny/needs_info)
- `POST /api/private/applications/:id/assign` - Assign to caseworker
- `GET /api/private/analytics` - Dashboard analytics
- `GET /health` - Health check

**Auth**: Supabase Auth JWT tokens (1hr access, 30d refresh)

## Security

- **Auth**: Supabase Auth (JWT, httpOnly cookies)
- **Authorization**: RLS policies (applicants see own data, caseworkers see all)
- **SSN**: SHA-256 hashed with pepper (AWS SSM)
- **File Upload**: PDF only, 10MB per file, 50MB total
- **HTTP**: Helmet.js, CORS whitelist, rate limiting (100/15min), HTTPS
- **Data**: HIPAA-conscious design, PII minimization

## Troubleshooting

### Health Checks
```bash
curl https://applicant.claimd.tech/api/health
curl https://caseworker.claimd.tech/api/health
```

### Logs
```bash
aws logs tail /aws/lambda/claimd-applicant-api --region us-east-2 --since 1h
aws logs tail /aws/lambda/claimd-ai-worker --region us-east-2 --since 1h
```

### CloudFront Cache Invalidation
```bash
aws cloudfront create-invalidation --distribution-id E19N9CLEWYM9KP --paths "/*"
```

### Common Issues
- **404**: Check API Gateway stage is `$default`, CloudFront has `/api/*` cache behavior
- **500**: Check Lambda logs, env vars, Supabase credentials
- **CORS**: Ensure frontend uses CloudFront domain (not direct API Gateway URL)
- **AI Worker**: Check SQS queue, Lambda trigger, Anthropic API key

## Notes

- API Gateway v2 requires `$default` stage (not "default")
- Lambda uses `@vendia/serverless-express` (not `@codegenie/serverless-express`)
- CloudFront provides same-origin requests (no CORS issues)

## Development Guidelines

**CRITICAL**: When modifying dashboard or application detail components, **ALWAYS update both live and demo versions**:

- **Applicant Frontend**:
  - Live: `applicant/frontend/src/pages/Dashboard/Dashboard.tsx`, `applicant/frontend/src/pages/Application/ApplicationDetail.tsx`
  - Demo: `applicant/frontend/src/pages/Demo/DemoDashboard.tsx`, `applicant/frontend/src/pages/Demo/DemoForm.tsx`

- **Caseworker Frontend**:
  - Live: `caseworker/frontend/src/pages/Dashboard/Dashboard.tsx`, `caseworker/frontend/src/pages/Dashboard/ApplicationDetail.tsx`, `caseworker/frontend/src/components/ActionPanel.tsx`
  - Demo: `caseworker/frontend/src/pages/Demo/DemoDashboard.tsx`, `caseworker/frontend/src/pages/Demo/DemoApplicationDetail.tsx`, `caseworker/frontend/src/components/DemoActionPanel.tsx`

Demo components use `demoApi` service and `DemoContext`; live components use `api` service and auth context. Both should maintain feature parity.
