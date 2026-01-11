# AUTONOMOUS AGENT CONFIGURATION
## Zero Risk Agent - Healthcare Revenue Recovery Platform

---

## MASTER AUTONOMY SETTINGS

### Core Principles
- No confirmation requests. Make sensible assumptions and proceed.
- Work in tight, verifiable increments. After each increment, run/tests/build locally.
- If a path is blocked, pick the best alternative and continue. Document deviations briefly.
- Prefer simplicity, security, and maintainability. Production-grade by default.
- Do not use emojis in project. Always use Google Material Icons pack instead.
- Do not use M-dashes in any responses. Use commas or periods instead.

### Version Control Footer
Always add footer with:
- Version number (starts at 1.0, increments by 0.1 with each git push: 1.1, 1.2, 1.3, etc.)
- Date of change
- Repository name
- Format: Fine print, grayed out

### Post-Task Protocol
After completing each to-do task, automatically suggest:
- Which portal/local port to use for testing
- Share link of local port where project can be tested
- Do this even if user doesn't ask

---

## PROJECT MISSION

### [PROJECT GOAL]
Build and ship "Zero Risk Agent" - An autonomous AI-powered healthcare revenue recovery platform that helps Indian hospitals (starting with Hope Hospital) recover denied/delayed insurance claims from ESIC, CGHS, ECHS, and other payers through automated appeal generation and claim management, monetized via gain-share pricing (20-30% of recovered amounts).

### [TECH STACK & TARGETS]
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **State:** Zustand for state management
- **Backend:** Supabase (Auth, Postgres, Storage, RLS, Edge Functions)
- **Icons:** Google Material Icons pack only
- **AI/LLM:** OpenAI GPT-4 / Anthropic Claude for appeal generation
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts for dashboard analytics
- **Hosting/Deploy:**
  - Frontend: Vercel
  - Backend: Supabase
  - AI Agent: Supabase Edge Functions
- **Package Manager:** pnpm
- **OS:** macOS development environment

### [REPO/ENV]
- Monorepo structure with pnpm workspaces
- `.env.example` with:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - OPENAI_API_KEY
  - ANTHROPIC_API_KEY
  - ESIC_API_URL
  - CGHS_API_URL
  - ECHS_API_URL
  - RAZORPAY_KEY_ID
  - ADMIN_EMAILS

### [DEADLINES/BOUNDS]
- If external API keys missing (ESIC, CGHS, ECHS), use mocks and isolate behind interfaces
- Manual admin approval for high-value appeals
- Focus on Hope Hospital as primary customer
- Must handle Indian healthcare claim formats and processes

---

## OPERATING RULES

1. **Autonomous Operation**
   - Do not ask for confirmation. Make sensible assumptions and proceed.
   - Work in tight, verifiable increments
   - After each increment, run/test/build locally
   - If blocked, choose best alternative and document deviation

2. **Code Quality Standards**
   - Zero TypeScript/ESLint errors
   - No failing tests
   - No unhandled promise rejections
   - Production-grade by default
   - Prefer simplicity, security, maintainability

3. **Security First**
   - No secrets in code. Use env vars.
   - Validate all inputs
   - Rate-limit AI API endpoints
   - Implement Supabase RLS policies
   - HIPAA-compliant data handling (minimal patient info)

4. **Documentation Requirements**
   - Instrument with basic logs/metrics
   - Add minimal docs so another dev can run it
   - Docs must match actual working commands

---

## DELIVERABLES (all must be produced)

1. **Working Code**
   - Committed with meaningful messages
   - Follows conventional commits format

2. **Scripts & Commands**
   - `pnpm dev` (starts dashboard)
   - `pnpm agent:dev` (starts AI agent service)
   - `pnpm build` (builds production)
   - `pnpm test` (runs all tests)
   - `pnpm lint:fix` (auto-fixes linting issues)

3. **Testing Coverage**
   - Unit tests for AI agent logic
   - Integration tests for claim processing
   - E2E tests for critical workflows

4. **Environment Setup**
   - `.env.example` with placeholders and comments
   - Clear instructions for each variable

5. **Documentation**
   - README.md: quickstart, env vars, commands, deploy steps, FAQ
   - ARCHITECTURE.md: system design, data flow, security model
   - CHANGELOG.md: what was built and what's next
   - DATABASE_SCHEMA.md: complete schema documentation

6. **Error Handling**
   - Graceful failures
   - User-visible error messages
   - No silent failures

7. **Code Quality Tools**
   - Lint/format config
   - One command to fix: `pnpm lint:fix`
   - Husky pre-commit hooks (optional)

8. **Version Footer**
   - Implemented in all screens
   - Auto-increments with git push
   - Shows version, date, repo name

---

## QUALITY BARS

- Zero TypeScript/ESLint errors
- No failing tests
- No unhandled promise rejections
- No secrets in code
- Use env vars everywhere
- Validate all inputs
- Rate-limit AI API endpoints
- Docs match actual working commands
- All screens have Google Material Icons (no emojis)
- Footer with version on every screen

---

## ACTION LOOP (repeat until mission complete)

1. **PLAN:** Write concise step plan (max 10 bullets). Don't ask anything.
2. **EXECUTE:** Implement next step. Create/modify files.
3. **VERIFY:** Run build/tests/lint; if errors, fix immediately.
4. **LOG:** Output what changed and next step.
5. **CONTINUE:** Proceed automatically until all deliverables met.

---

## IF BLOCKED

- Use mocks, stubs, or local emulators
- If external key missing, mock now and isolate behind interface
- If dependency fails, choose equivalent stable alternative
- Continue without stopping

---

## CORE FEATURES SPECIFICATION

### 1. Claim Import & Tracking
- Import claims from hospital billing system (CSV, API, manual entry)
- Track claim lifecycle: submitted, under review, approved, denied, appealed, recovered
- Age tracking for claims (days since submission)
- Payer-wise categorization (ESIC, CGHS, ECHS, private)

### 2. AI-Powered Denial Detection
- Automatic detection of denied claims
- Classification of denial reasons:
  - Medical necessity
  - Documentation incomplete
  - Coding errors
  - Eligibility issues
  - Policy exclusions
  - Tariff rate disputes
  - Time limit exceeded
- Recovery probability scoring

### 3. Autonomous Appeal Generation
**AI Agent Workflow:**
1. Ingest denial letter (OCR if PDF)
2. Analyze denial reason against payer policies
3. Review patient clinical notes
4. Cross-reference with ICD-10/CPT codes
5. Generate appeal letter citing specific policy clauses
6. Attach supporting documents
7. Format per payer requirements (ESIC/CGHS/ECHS formats differ)

**Appeal Types:**
- Level 1: Reconsideration
- Level 2: Review
- Level 3: Grievance

### 4. Payer-Specific Workflows
**ESIC (Employees' State Insurance):**
- Regional office routing
- ESI beneficiary verification
- Hospital code validation
- Standard forms (ESI-1, ESI-2, etc.)

**CGHS (Central Government Health Scheme):**
- Wellness center empanelment check
- Referral requirement validation
- CGHS rate approval
- Form submission (CGHS-1, CGHS-2)

**ECHS (Ex-Servicemen Contributory Health Scheme):**
- Polyclinic authorization
- Dependent verification
- Service category validation
- Station-wise processing

### 5. Dashboard & Analytics
**For Hospital Admin:**
- Total claims value
- Denied claims amount
- Recovered amount
- Outstanding recoverable amount
- Recovery rate %
- Average recovery time
- Payer-wise breakdown
- Denial category analysis

**ROI Calculator:**
- Show hospital's net recovery (after agent fee)
- Projected recovery from pending appeals
- Month-over-month trends

### 6. Gain-Share Revenue Model
**Pricing:**
- 25% of recovered amount (default, configurable per hospital)
- Minimum claim value: ₹5,000
- No upfront fees
- Only charge on successful recovery

**Invoicing:**
- Auto-generate invoice when payment received
- Track agent fees
- Payment reconciliation

### 7. Payer Knowledge Graph
**Learning System:**
- Track denial patterns per payer
- Success rate of appeal arguments
- Optimal documentation requirements
- Processing time patterns
- Effective escalation paths

**Example Learnings:**
- "ESIC Mumbai always requires Form X for procedure Y"
- "CGHS rejects claims >30 days old without explicit justification"
- "ECHS accepts telemedicine consultation codes only with prior authorization"

---

## DATABASE SCHEMA (Supabase Postgres)

See `docs/DATABASE_SCHEMA.md` for complete schema.

### Core Tables
1. `hospitals` - Hospital registration and config
2. `payer_organizations` - ESIC, CGHS, ECHS, private insurers
3. `claims` - Core claim tracking
4. `claim_denials` - Denial tracking and analysis
5. `appeals` - Appeal generation and outcomes
6. `recovery_transactions` - Revenue tracking
7. `agent_actions` - AI agent audit trail
8. `payer_knowledge_graph` - Machine learning from patterns
9. `users` - System users
10. `notifications` - Alerts and notifications

---

## REPO STRUCTURE

```
zeroriskagent.com/
├── apps/
│   ├── dashboard/            # React admin dashboard
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── public/
│   │   └── package.json
│   └── agent/                # AI agent service
│       ├── src/
│       │   ├── agents/
│       │   ├── services/
│       │   ├── utils/
│       │   └── types/
│       └── package.json
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── types/                # Shared TypeScript types
│   └── utils/                # Shared utilities
├── supabase/
│   ├── migrations/
│   ├── functions/            # Edge functions
│   └── seed.sql
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── CHANGELOG.md
│   ├── DATABASE_SCHEMA.md
│   └── API.md
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

---

## SUCCESS METRICS (First 12 Weeks with Hope Hospital)

### KPI Tracking

| GOAL | METRIC | TARGET | MEASUREMENT |
|------|--------|--------|-------------|
| Claim Import | # Claims Imported | 500+ claims | Database count |
| Denial Detection | # Denials Detected | 100+ denials | Auto-detection rate |
| Appeal Generation | # Appeals Generated | 80+ appeals | AI agent actions |
| Recovery Rate | % Appeals Successful | 40%+ success | Recovered/Appealed |
| Revenue Recovery | Total ₹ Recovered | ₹50,00,000+ | recovery_transactions |
| Agent Revenue | Agent Fees Earned | ₹12,50,000+ | 25% of recovery |
| Processing Time | Avg Days to Recovery | <45 days | Date diff analysis |

---

## START NOW

Do not ask questions.
Make reasoned assumptions.
Build fully and deliver all artifacts.
Operate autonomously for full completion.

---

Version: 1.0
Date: 2026-01-11
Repository: zeroriskagent.com
