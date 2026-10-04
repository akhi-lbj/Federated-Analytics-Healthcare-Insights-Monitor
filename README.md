# Project F.A.H.I.M.
## Federated Analytics & Healthcare Insights Monitor

Clinical Operational Telemetry Cockpit & Embedded SAS Retrieval Agent Manager (RAM) v1 Copilot for the **Emirates Health Services (EHS)** regional hospital network (AQH, KWH, SKMC).

---

## 1. System Overview

Project F.A.H.I.M. integrates two core systems:
1. **Interactive Clinical Telemetry & CRUD Console**: Connects to **Supabase PostgreSQL** for real-time reads, updates, and inserts across ED Boarding Intake, Ward Bed Capacities, Discharge Readiness Registry, and Transfer Referrals. Includes a live SQL mutation buffer, CTAS triage acuity controls, and a single-click **Refresh** button.
2. **SAS RAM Clinical Decision Copilot**: Embedded conversational agent powered by SAS Retrieval Agent Manager (RAM) v1 REST APIs, featuring **4-Tier Tool Call Observability**:
   - **Tier 1 (Mid-Flight Live Activity Feed)**: Streaming execution indicators (`🛠 toolName`, `📚 RAG Search`, `✦ LLM Reasoning`).
   - **Tier 2 (Inline Collapsible Turn Summary)**: Step-by-step numbered cards with compact inputs and outputs.
   - **Tier 3 (Deep Observability Modal)**: Un-truncated JSON inspector, token usage breakdown, latency, USD cost, and RAG similarity scores.
   - **Tier 4 (Tool-Driven Rich Visual Widgets)**: Renders interactive SVG charts (`render_chart`) and SAS Visual Analytics snapshot cards (`render_report`).

---

## 2. Directory Structure

```
Project F.A.H.I.M/
├── backend/                             # Python FastAPI BFF Application Gateway
│   ├── app/
│   │   ├── main.py                      # FastAPI app + Mangum handler for AWS Lambda
│   │   ├── config.py                    # Environment settings (Pydantic BaseSettings)
│   │   ├── routers/
│   │   │   └── ram.py                   # SAS RAM BFF endpoints (PKCE, Viya SSO, 504 async query, trace)
│   │   └── services/
│   │       └── ram_client.py            # Mutex-locked tokens, 302 trap, async poller, trace aggregator
│   ├── Dockerfile                       # Amazon ECR / AWS Lambda container build
│   ├── requirements.txt                 # FastAPI, HTTPX, Mangum, pypdf, pydantic
│   └── .env.example                     # Sample backend environment configuration
│
├── frontend/                            # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx               # Branding, facility switcher, refresh button, copilot trigger
│   │   │   ├── Sidebar.tsx              # Operations module navigation & cluster telemetry
│   │   │   ├── ed/
│   │   │   │   └── EdBoardingModule.tsx # Full CRUD console, CTAS triage, live SQL/JSON buffer
│   │   │   ├── ward/
│   │   │   │   └── WardCapacityModule.tsx # Ward capacity matrix, usable bed calculation, telemetry
│   │   │   ├── discharge/
│   │   │   │   └── DischargeModule.tsx  # Length of stay vs DRG target, readiness, blockers
│   │   │   ├── referrals/
│   │   │   │   └── ReferralsModule.tsx  # Inter-facility transfers (AQH, KWH, SKMC)
│   │   │   ├── facilities/
│   │   │   │   └── FacilitiesModule.tsx # Hospital facilities master reference
│   │   │   └── copilot/
│   │   │       ├── RamCopilotDrawer.tsx # Sliding SAS RAM chat drawer
│   │   │       ├── SignInModal.tsx      # OAuth 2.0 PKCE Device Flow & SASLogon Code modal
│   │   │       ├── LiveStepIndicator.tsx # Tier 1: Mid-flight live steps indicator
│   │   │       ├── ToolCallTrace.tsx    # Tier 2: Inline collapsible tool call summary
│   │   │       ├── QueryInspectorModal.tsx # Tier 3: Deep observability audit drawer
│   │   │       ├── ChartWidget.tsx      # Tier 4: Interactive SVG chart renderer
│   │   │       ├── ReportWidget.tsx     # Tier 4: SAS Visual Analytics snapshot preview
│   │   │       └── AttachmentBar.tsx    # PDF/DOCX/CSV document text extraction
│   │   ├── lib/
│   │   │   ├── supabase.ts              # Supabase client SDK & typed CRUD operations
│   │   │   └── ramApi.ts                # BFF client SDK, 504-immune async poller & stream
│   │   ├── types/
│   │   │   ├── supabase.ts              # Database interfaces matching PostgreSQL tables
│   │   │   └── ram.ts                   # Tool calls, traces, turns, chart specs interfaces
│   │   ├── App.tsx                      # Root cockpit layout and state coordination
│   │   └── main.tsx                     # React DOM mount
│   ├── tailwind.config.js               # EHS Operational Intelligence design system tokens
│   └── package.json
│
├── supabase/
│   └── migrations/
│       └── 20261004_enable_rls_policies.sql # Row Level Security remediation script
│
├── amplify.yml                          # AWS Amplify Hosting build configuration
└── README.md
```

---

## 3. Quick Start (Local Development)

### 3.1 Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your SAS RAM host URL or static RAM_TOKEN

uvicorn app.main:app --reload --port 8000
```

### 3.2 Frontend Setup (Vite / React)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Cloud Deployment Architecture

### 4.1 Frontend on AWS Amplify Hosting
1. Connect your Git repository to **AWS Amplify Console**.
2. Amplify will auto-detect the root `amplify.yml`.
3. Set the build environment variables in Amplify:
   - `VITE_SUPABASE_URL`: `https://trrdapomdjhklwngvwxm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGci...`
   - `VITE_RAM_GATEWAY_URL`: `https://<your-lambda-url-id>.lambda-url.me-central-1.on.aws/api/ram`
4. Deploy the application to Amplify's global CDN.

### 4.2 Backend on Amazon ECR & AWS Lambda
1. Build and tag the Docker image:
   ```bash
   docker build -t fahim-ram-gateway backend/
   docker tag fahim-ram-gateway:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/fahim-ram-gateway:latest
   ```
2. Push image to Amazon ECR:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/fahim-ram-gateway:latest
   ```
3. Create/Update AWS Lambda with Function URL:
   - Package Type: `Image`
   - Timeout: `900s` (15 minutes for long retrieval agent queries)
   - Memory: `1024 MB`
   - Handler: `app.main.handler`
   - Enable **Lambda Function URL** with CORS enabled for your Amplify domain.
