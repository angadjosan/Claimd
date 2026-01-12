## Architecture Overview

| Service | Type | AWS Service |
|---------|------|-------------|
| **Landing Page** | Static React/Vite | S3 + CloudFront |
| **Applicant Frontend** | Static React/Vite | S3 + CloudFront |
| **Caseworker Frontend** | Static React/Vite | S3 + CloudFront |
| **Applicant Backend** | Node.js Express API | API Gateway (HTTP API) + Lambda |
| **Caseworker Backend** | Node.js Express API | API Gateway (HTTP API) + Lambda |
| **AI Worker** | Background processor (≤2 min jobs) | SQS → Lambda |
| **Database** | PostgreSQL | Supabase (managed) |
| **Auth** | JWT | Supabase Auth |
| **File Storage** | Object storage (≤10MB) | Supabase Storage |

---

### 1. Static Frontends → S3 + CloudFront *(~$1–5/month)*

Three Vite/React apps served via CloudFront:

| Domain | Source |
|--------|--------|
| `mysite.com` | `landing-page/` |
| `applicant.mysite.com` | `applicant/frontend/` |
| `caseworker.mysite.com` | `caseworker/frontend/` |

- CloudFront handles SSL termination and caching
- Path-based routing: `/api/*` requests forwarded to API Gateway

---

### 2. Node.js Backends → API Gateway + Lambda *(~$0–10/month)*

| API | Route | Flow |
|-----|-------|------|
| **Applicant API** | `applicant.mysite.com/api/*` | CloudFront → API Gateway (HTTP API) → Lambda |
| **Caseworker API** | `caseworker.mysite.com/api/*` | CloudFront → API Gateway (HTTP API) → Lambda |

**Implementation Details:**
- Express apps wrapped for Lambda using a serverless adapter (e.g., `@vendia/serverless-express`)
- Supabase JWT verification middleware in each API
- Role enforcement: applicant vs caseworker tokens

---

### 3. AI Worker → SQS + Lambda *(~$0–5/month)*

**Event-driven architecture — no polling required.**

| Component | Configuration |
|-----------|---------------|
| **Trigger** | SQS queue message |
| **Typical runtime** | ~30 seconds |
| **Worst-case runtime** | ~2 minutes |
| **Lambda timeout** | 3–5 minutes |
| **Error handling** | Dead Letter Queue (DLQ) |

**Workflow:**
1. Backend enqueues task to SQS when application is submitted/updated
2. Lambda is triggered automatically by SQS
3. Lambda fetches application data from Supabase
4. Lambda runs AI processing (Claude API)
5. Lambda writes results back to Supabase
6. On success: message deleted; on failure: sent to DLQ
---

## Infrastructure Setup (One-Time)

| Resource | Purpose |
|----------|---------|
| S3 Buckets (3) | Frontend hosting |
| CloudFront Distributions (3) | CDN + `/api/*` routing to API Gateway |
| API Gateway HTTP APIs (2) | Applicant + Caseworker APIs |
| Lambda Functions (3+) | Applicant API, Caseworker API, AI Worker |
| SQS Queue + DLQ | AI task processing |
| IAM Roles | Per-service isolation, GitHub OIDC |
| SSM Parameter Store | Secrets & environment variables |

## Next Steps
---

Frontend environment variable: set these before building
VITE_SUPABASE_URL — For applicant & caseworker frontends
VITE_SUPABASE_ANON_KEY — For applicant & caseworker frontends
VITE_API_URL — Optional (has defaults)
VITE_APPLICANT_URL — For landing page (optional)
VITE_CASEWORKER_URL — For landing page (optional)
VITE_BASE_URL — For navbar (optional)

Lambda environment variables (not secrets, can be set directly):

CORS_ORIGIN set them up in lambda via API Gateway. Go to CORS Settings. I have the distributions already.
Also set them up via process.env

## AWS Storage for AI Service Files

Since the schemas and markdown files are specific to the AI service, they can be stored in the following AWS resources:

- **S3 Bucket**: Store the schemas and markdown files in a dedicated S3 bucket for the AI service. This ensures easy access and versioning.
  - Example: `s3://ai-service-configs/schemas/` and `s3://ai-service-configs/prompts/`
- **SSM Parameter Store**: For smaller configuration files or critical prompts, consider storing them as secure parameters in AWS Systems Manager Parameter Store.
  - Example: `/ai-service/schemas/application_schema` or `/ai-service/prompts/extractor_prompt`

add to CI/CD also

3. AI service files storage
The AI worker reads from local filesystem (prompts/ and schemas/). In Lambda, store them in S3.
Steps:
Create an S3 bucket (e.g., ai-service-configs)
Upload files:
ai-app-processing-service/prompts/extractor_prompt.md → s3://ai-service-configs/prompts/extractor_prompt.md
ai-app-processing-service/prompts/reasoning_prompt.md → s3://ai-service-configs/prompts/reasoning_prompt.md
ai-app-processing-service/prompts/rules.md → s3://ai-service-configs/prompts/rules.md
ai-app-processing-service/schemas/*.json → s3://ai-service-configs/schemas/
Update worker.py to load from S3 instead of local filesystem (or create a Lambda layer with the files)
Grant the AI Worker Lambda IAM role permission to read from this bucket

6. **Set up custom domains** with Route 53 + ACM certificates
7. test everything.