# Architecture: Zero Risk Agent

## System Overview

Zero Risk Agent is a multi-tenant, AI-powered healthcare revenue recovery platform designed specifically for Indian hospitals dealing with complex insurance payers (ESIC, CGHS, ECHS).

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Mobile App  │  │     API      │      │
│  │   (React)    │  │  (Future)    │  │  Integrations│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS/WSS
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │  AI Agents   │  │  Supabase    │      │
│  │     Auth     │  │  (GPT-4,     │  │    Edge      │      │
│  │              │  │   Claude)    │  │  Functions   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ SQL/RPC
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Supabase   │  │  Knowledge   │      │
│  │   Database   │  │   Storage    │  │    Graph     │      │
│  │              │  │  (Documents) │  │   (ML)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Dashboard (React + Vite + TypeScript)

**Purpose:** Web-based admin interface for hospital staff to monitor claims, denials, appeals, and recoveries.

**Tech Stack:**
- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- Tailwind CSS (styling)
- Supabase JS Client (data fetching)
- Recharts (charts and visualizations)

**Key Features:**
- Real-time dashboard metrics
- Claim lifecycle tracking
- Denial analysis and prioritization
- Appeal status monitoring
- Revenue tracking (gain-share model)
- Payer performance analytics

**Deployment:** Vercel (CDN)

**URL:** https://dashboard-tau-weld-72.vercel.app

---

### 2. Database (Supabase PostgreSQL)

**Purpose:** Central data store with advanced features (RLS, triggers, materialized views).

**Key Tables:**

1. **hospitals**: Multi-payer hospital configuration
2. **payer_organizations**: Master data for ESIC, CGHS, ECHS, etc.
3. **claims**: Core claim tracking with lifecycle management
4. **claim_denials**: Denial reasons with AI analysis
5. **appeals**: Multi-level appeal tracking
6. **recovery_transactions**: Revenue tracking with automatic fee calculation
7. **agent_actions**: Complete audit trail of AI agent activities
8. **payer_knowledge_graph**: Machine learning knowledge base
9. **users**: Hospital staff with role-based access control
10. **notifications**: System alerts and notifications

**Key Views:**
- `dashboard_metrics` (materialized view for performance)
- `payer_performance` (aggregated payer stats)
- `high_priority_denials` (AI-prioritized denials for agent processing)
- `agent_performance` (AI agent cost and effectiveness tracking)

**Security:**
- Row Level Security (RLS) policies
- Hospital data isolation
- Role-based access control
- Audit logging

---

### 3. AI Agent System (Future)

**Purpose:** Autonomous agents for claim denial analysis and appeal generation.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                        │
│                  (Supabase Edge Function)                    │
└────────────────┬──────────────┬──────────────┬──────────────┘
                 │              │              │
        ┌────────▼───────┐ ┌───▼──────────┐ ┌─▼──────────────┐
        │ Denial Detector│ │Appeal Generator│ │ Policy Lookup │
        │   Agent        │ │   Agent        │ │   Agent       │
        │ (Classification)│ │  (GPT-4)      │ │ (RAG)         │
        └────────────────┘ └────────────────┘ └────────────────┘
```

**Agent Types:**

1. **Denial Detector Agent**
   - Monitors new claims
   - Detects denials automatically
   - Classifies denial categories
   - Calculates recovery probability

2. **Appeal Generator Agent**
   - Analyzes denial reason
   - Reviews clinical notes
   - Looks up payer policies
   - Generates appeal letter (payer-specific format)
   - Cites policy clauses
   - Attaches supporting documents

3. **Policy Lookup Agent**
   - RAG (Retrieval-Augmented Generation) system
   - Searches payer policy documents
   - Finds relevant clauses
   - Provides citations for appeals

4. **Knowledge Graph Agent**
   - Learns from historical patterns
   - Updates success rates
   - Identifies optimal strategies
   - Self-improving over time

**AI Models:**
- OpenAI GPT-4 Turbo: Appeal generation
- Anthropic Claude 3 Opus: Medical analysis
- OpenAI Embeddings: Policy search (RAG)

**Cost Tracking:**
- Every agent action logs tokens used and cost
- Monthly budget tracking
- ROI calculation (recovery vs. AI cost)

---

### 4. Payer Integration Layer (Future)

**Purpose:** Direct integration with Indian healthcare payer systems.

**Supported Payers:**

1. **ESIC (Employees' State Insurance Corporation)**
   - Portal automation (web scraping if no API)
   - Claim submission automation
   - Status checking
   - Appeal submission

2. **CGHS (Central Government Health Scheme)**
   - Form generation (CGHS-1, CGHS-2)
   - Referral tracking
   - Rate approval automation

3. **ECHS (Ex-Servicemen Contributory Health Scheme)**
   - Beneficiary verification
   - Station-wise claim routing
   - Authorization tracking

**Integration Methods:**
- API (if available)
- Web scraping (fallback)
- Email parsing (for notifications)
- Manual upload (last resort)

---

## Data Flow

### 1. Claim Submission to Recovery

```
Hospital Billing System
    │
    │ CSV/API Import
    ▼
[claims table]
    │
    │ Automatic detection
    ▼
[claim_denials table] ◄── AI Denial Detector Agent
    │
    │ AI analysis
    ▼
[appeals table] ◄── AI Appeal Generator Agent
    │
    │ Submission to payer
    ▼
Payer System
    │
    │ Response
    ▼
[appeals.appeal_status = 'accepted']
    │
    │ Payment received
    ▼
[recovery_transactions table] ◄── Auto-calculate revenue share
    │
    │ Update claim
    ▼
[claims.claim_status = 'recovered']
```

### 2. AI Agent Execution Flow

```
Trigger (new denial detected)
    │
    ▼
[Agent Orchestrator]
    │
    ├─► Check eligibility
    │   (claim value, aged days, category)
    │
    ├─► Fetch context
    │   (claim details, denial reason, patient notes)
    │
    ├─► Call AI models
    │   (GPT-4 for appeal, Claude for medical analysis)
    │
    ├─► Generate appeal
    │   (letter, justification, policy references)
    │
    ├─► Log action
    │   (agent_actions table: tokens, cost, confidence)
    │
    └─► Create appeal record
        (appeals table: ready for human review/submission)
```

---

## Security Architecture

### 1. Authentication

- **Supabase Auth**: Email/password or magic link
- **Session management**: JWT tokens
- **MFA**: Optional two-factor authentication

### 2. Authorization (RLS Policies)

**Hospital Isolation:**
```sql
-- Users can only see their hospital's data
CREATE POLICY hospital_isolation_policy ON claims
  FOR ALL USING (
    hospital_id IN (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
  );
```

**Role-Based Access:**
- `super_admin`: Access all hospitals
- `hospital_admin`: Full access to own hospital
- `billing_staff`: Create and update claims
- `doctor`: View clinical data only
- `agent_admin`: Manage AI agents

### 3. Data Privacy

**Patient Data:**
- No PII stored (patient_id_hash only)
- SHA-256 hashing
- Minimal patient demographics (age, gender)
- No names, addresses, or contact info

**Document Storage:**
- Supabase Storage with signed URLs
- Time-limited access (1 hour expiry)
- Encrypted at rest

### 4. Audit Trail

Every action logged in `agent_actions`:
- Who (user_id or agent_name)
- What (action_type)
- When (created_at)
- Input/output data (JSON)
- Success/failure status

---

## Scalability

### 1. Database Optimization

**Indexes:**
- All foreign keys indexed
- Composite indexes on frequently queried columns
- Partial indexes (e.g., `WHERE claim_status = 'denied'`)

**Materialized Views:**
- `dashboard_metrics` refreshed on schedule
- Significant performance improvement for dashboards

**Partitioning (Future):**
- Partition claims by year
- Archive old claims to cold storage

### 2. Caching

**Application Level:**
- React Query for API caching
- 5-minute stale time for metrics

**Database Level:**
- PostgreSQL query cache
- Connection pooling

### 3. Rate Limiting

**AI API Calls:**
- Max 100 GPT-4 calls/hour per hospital
- Queue system for batching
- Exponential backoff on errors

**User Actions:**
- Rate limiting on mutations
- Prevent spam appeal submissions

---

## Cost Optimization

### 1. AI Cost Management

**Token Budgets:**
- Track tokens per agent action
- Set monthly budgets per hospital
- Alert when approaching limit

**Model Selection:**
- Use GPT-4 for complex appeals
- Use GPT-3.5 for simple categorization
- Cache frequently used prompts

**ROI Tracking:**
```
ROI = (Total Recovery Amount - Agent Fees - AI Costs) / AI Costs
```

Target ROI: 50x (i.e., recover ₹50 for every ₹1 spent on AI)

### 2. Database Costs

**Supabase Pricing:**
- Free tier: Up to 500MB, 2GB bandwidth
- Pro tier: ₹1,500/month ($20/month)
- Scale with usage

**Optimization:**
- Use materialized views for heavy queries
- Archive old claims
- Compress stored documents

---

## Disaster Recovery

### 1. Backups

**Automated Backups:**
- Daily full database backup (Supabase)
- Point-in-time recovery (7 days)
- Geo-redundant storage

**Manual Backups:**
- Export critical data before major migrations
- Store in separate location (S3 or local)

### 2. Monitoring

**Health Checks:**
- Uptime monitoring (Vercel, Supabase)
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)

**Alerts:**
- Database connection failures
- API errors > 5% rate
- Agent execution failures
- High AI costs

---

## Future Enhancements

### 1. Mobile App (React Native)

- Hospital staff on-the-go
- Push notifications for appeal updates
- Document capture (camera)

### 2. Advanced AI Features

- Predictive denial detection (before submission)
- Optimal claim routing (which payer to submit to)
- Automatic appeal scheduling
- Voice-to-text for doctor notes

### 3. Multi-Hospital Network

- Network-wide analytics
- Shared knowledge graph
- Bulk purchasing power for payer negotiations

### 4. Regulatory Compliance

- NABH compliance reporting
- Insurance audit trails
- HIPAA-like data protection (Indian equivalent)

---

**Version:** 1.0
**Last Updated:** 2026-01-11
**Repository:** zeroriskagent.com
