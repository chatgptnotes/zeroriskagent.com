# Database Setup Instructions

## Current Status
✅ Supabase project connected
✅ Environment variables configured
❌ Database tables NOT created (migrations marked as applied but SQL never executed)

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
Visit: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/sql/new

### Step 2: Run All Migrations

Copy and paste this command to create all tables:

```sql
-- ============================================
-- ZERO RISK AGENT - COMPLETE DATABASE SETUP
-- ============================================
-- This creates all tables, functions, and seed data

```

Then open each migration file in order and copy/paste into the SQL editor:

1. **Migration 1: Core Tables**
   - File: `supabase/migrations/20260111000001_create_core_tables.sql`
   - Creates: hospitals, payer_organizations, users tables

2. **Migration 2: Claims and Denials**
   - File: `supabase/migrations/20260111000002_create_claims_and_denials.sql`
   - Creates: claims, claim_denials tables with triggers

3. **Migration 3: Appeals and Recovery**
   - File: `supabase/migrations/20260111000003_create_appeals_and_recovery.sql`
   - Creates: appeals, recovery_transactions tables

4. **Migration 4: Agent and Knowledge**
   - File: `supabase/migrations/20260111000004_create_agent_and_knowledge_tables.sql`
   - Creates: agent_actions, payer_knowledge_graph, notifications tables

5. **Migration 5: Views and RLS**
   - File: `supabase/migrations/20260111000005_create_views_and_rls.sql`
   - Creates: dashboard_metrics view, RLS policies, helper functions

### Step 3: Run Seed Data
   - File: `supabase/seed.sql`
   - Creates: Hope Hospital with sample claims

### Step 4: Verify
Run this query to check:

```sql
SELECT
  'hospitals' as table_name,
  COUNT(*) as record_count
FROM hospitals
UNION ALL
SELECT 'claims', COUNT(*) FROM claims
UNION ALL
SELECT 'dashboard_metrics', COUNT(*) FROM dashboard_metrics;
```

Expected output:
- hospitals: 1
- claims: 5
- dashboard_metrics: 1

## Alternative: Automated Setup

If you prefer, I can create a single consolidated SQL file with everything. Just let me know!

## After Setup

1. Visit: https://zeroriskagentcom.vercel.app/dashboard
2. You should see Hope Hospital dashboard with:
   - Total Claims
   - Denied Claims
   - Recovery metrics
   - Aging analysis

## Troubleshooting

If you see "Configuration Required" error:
1. Check that migrations ran successfully
2. Run: `SELECT refresh_dashboard_metrics();` in SQL editor
3. Clear browser cache and refresh

---

**Need help?** Let me know which step you're stuck on!
