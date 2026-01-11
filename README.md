# Zero Risk Agent

> Autonomous AI-Powered Healthcare Revenue Recovery Platform for Indian Hospitals

Zero Risk Agent is a specialized software platform designed to help Indian hospitals recover denied and delayed insurance claims from ESIC, CGHS, ECHS, and other payers through AI-powered automated appeal generation and claim management.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/chatgptnotes/zeroriskagent.com.git
cd zeroriskagent.com

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Set up dashboard environment
cp apps/dashboard/.env.example apps/dashboard/.env
# Edit apps/dashboard/.env with your Supabase credentials
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run migrations in order:

```bash
# In your Supabase SQL editor, run these files in order:
# 1. supabase/migrations/20260111000001_create_core_tables.sql
# 2. supabase/migrations/20260111000002_create_claims_and_denials.sql
# 3. supabase/migrations/20260111000003_create_appeals_and_recovery.sql
# 4. supabase/migrations/20260111000004_create_agent_and_knowledge_tables.sql
# 5. supabase/migrations/20260111000005_create_views_and_rls.sql
```

3. Load seed data (optional, for testing):

```bash
# Run supabase/seed.sql in your Supabase SQL editor
```

### Running Locally

```bash
# Start dashboard (development)
pnpm dev

# This will start the dashboard at http://localhost:5173
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build only dashboard
cd apps/dashboard && pnpm build
```

## Environment Variables

### Root `.env`

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Agent Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Indian Healthcare System Integration
ESIC_API_URL=https://esic.nic.in/api
ESIC_HOSPITAL_CODE=your-hospital-code
CGHS_API_URL=https://cghs.gov.in/api
CGHS_WELLNESS_CENTER_CODE=your-center-code
ECHS_API_URL=https://echs.gov.in/api
ECHS_POLYCLINIC_CODE=your-polyclinic-code

# Admin Configuration
ADMIN_EMAILS=admin@hopehospital.com
```

### Dashboard `.env` (apps/dashboard/.env)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
zeroriskagent.com/
├── apps/
│   ├── dashboard/              # React dashboard (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── lib/           # Supabase client
│   │   │   ├── types/         # TypeScript types
│   │   │   └── App.tsx        # Main app component
│   │   └── package.json
│   └── agent/                  # AI agent service (coming soon)
├── packages/
│   ├── ui/                     # Shared UI components (coming soon)
│   ├── types/                  # Shared TypeScript types (coming soon)
│   └── utils/                  # Shared utilities (coming soon)
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql               # Seed data
├── docs/
│   ├── DATABASE_SCHEMA.md     # Complete database documentation
│   ├── ARCHITECTURE.md        # System architecture
│   └── CHANGELOG.md           # Version history
├── .env.example               # Environment variables template
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── package.json               # Root package.json
```

## Key Features

### 1. Dashboard

Real-time analytics dashboard showing:
- Total claims, denials, and recoveries
- Financial metrics (claimed, approved, paid, outstanding)
- Payer-wise breakdown (ESIC, CGHS, ECHS)
- Denial category analysis
- Claim aging reports
- Appeal success rates
- Gain-share revenue tracking

**Live Demo:** https://dashboard-tau-weld-72.vercel.app

### 2. Database Schema

Comprehensive schema covering:
- **Hospitals**: Multi-payer registration (ESIC, CGHS, ECHS)
- **Claims**: Full lifecycle tracking
- **Denials**: AI-powered analysis and recovery scoring
- **Appeals**: Multi-level appeal management
- **Recovery Transactions**: Gain-share revenue tracking
- **Payer Knowledge Graph**: Machine learning from patterns
- **Agent Actions**: Complete audit trail

### 3. AI Agent System (Coming Soon)

Autonomous agents for:
- Denial detection and categorization
- Recovery probability scoring
- Appeal letter generation (payer-specific)
- Medical justification analysis
- Policy reference lookup
- Document validation

### 4. Payer-Specific Workflows (Coming Soon)

**ESIC (Employees' State Insurance Corporation):**
- Regional office routing
- ESI beneficiary verification
- Standard forms (ESI-1, ESI-2)

**CGHS (Central Government Health Scheme):**
- Wellness center empanelment check
- Referral requirement validation
- CGHS rate approval

**ECHS (Ex-Servicemen Contributory Health Scheme):**
- Polyclinic authorization
- Dependent verification
- Station-wise processing

## Deployment

### Vercel (Dashboard)

The dashboard is automatically deployed to Vercel on every push to main.

Manual deployment:

```bash
vercel --prod
```

Set the following environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase (Backend)

Backend is hosted on Supabase. No deployment required for database, just run migrations.

## Gain-Share Pricing Model

Zero Risk Agent operates on a **gain-share** model:

- **No upfront fees**: Hospitals pay nothing to get started
- **Performance-based**: Only charge on successful recoveries
- **Default: 25%** of recovered amount goes to Zero Risk Agent
- **Minimum claim value**: ₹5,000
- **Transparent tracking**: All fees tracked in dashboard

### Example:

- Hospital has ₹10,00,000 in denied claims
- Agent successfully recovers ₹7,50,000
- Agent fee (25%): ₹1,87,500
- Hospital receives: ₹5,62,500 (net recovery)

All fees are automatically calculated and tracked in the `recovery_transactions` table.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run dashboard in development mode
pnpm dev                        # Runs on http://localhost:5173

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm typecheck

# Run tests (coming soon)
pnpm test
```

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Material Icons** - Icons (no emojis)

### Backend
- **Supabase** - PostgreSQL database, Auth, Storage, Edge Functions
- **Row Level Security (RLS)** - Data security
- **PostgreSQL Triggers** - Automated workflows

### AI/ML
- **OpenAI GPT-4** - Appeal generation
- **Anthropic Claude** - Medical analysis
- **Supabase Edge Functions** - Agent orchestration

## Contributing

This is a proprietary project for Hope Hospital. Internal contributions only.

## Support

For support, contact:
- Email: admin@hopehospital.com
- Phone: +91-22-12345678

## License

Copyright © 2026 Zero Risk Agent. All rights reserved.

Proprietary software. Unauthorized copying, modification, or distribution is prohibited.

---

**Version:** 1.0
**Last Updated:** 2026-01-11
**Repository:** zeroriskagent.com
