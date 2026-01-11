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

4. **Create GitHub Actions workflows** with OIDC auth

```
.github/
└── workflows/
    ├── deploy-landing.yml           # Landing page → S3
    ├── deploy-applicant-frontend.yml # Applicant frontend → S3
    ├── deploy-caseworker-frontend.yml # Caseworker frontend → S3
    ├── deploy-applicant-api.yml      # Applicant backend → Lambda
    ├── deploy-caseworker-api.yml     # Caseworker backend → Lambda
    └── deploy-ai-worker.yml          # AI worker → Lambda
```

### 4. CORS Configuration
- [ ] Allow origins: `mysite.com`, `applicant.mysite.com`, `caseworker.mysite.com`
- [ ] Configure in both Express apps and API Gateway

Additional notes:
Frontend environment variables (build-time, not SSM):
VITE_SUPABASE_URL — For applicant & caseworker frontends
VITE_SUPABASE_ANON_KEY — For applicant & caseworker frontends
VITE_API_URL — Optional (has defaults)
VITE_APPLICANT_URL — For landing page (optional)
VITE_CASEWORKER_URL — For landing page (optional)
VITE_BASE_URL — For navbar (optional)
Lambda environment variables (not secrets, can be set directly):
AWS_REGION — Optional (defaults to us-east-1 in applicant backend)
NODE_ENV — Set to production for Lambda
Important: Your code currently reads from process.env and os.getenv. You'll need to either:
Update the code to read from SSM Parameter Store at runtime, or
Set Lambda environment variables that reference SSM parameters (using Lambda's SSM integration)
I've updated your AWS_SETUP_GUIDE.md to include the SQS Queue URL parameter. You now need 5 SSM parameters total.

## AWS Storage for AI Service Files

Since the schemas and markdown files are specific to the AI service, they can be stored in the following AWS resources:

- **S3 Bucket**: Store the schemas and markdown files in a dedicated S3 bucket for the AI service. This ensures easy access and versioning.
  - Example: `s3://ai-service-configs/schemas/` and `s3://ai-service-configs/prompts/`
- **SSM Parameter Store**: For smaller configuration files or critical prompts, consider storing them as secure parameters in AWS Systems Manager Parameter Store.
  - Example: `/ai-service/schemas/application_schema` or `/ai-service/prompts/extractor_prompt`



6. **Set up custom domains** with Route 53 + ACM certificates
7. test everything.