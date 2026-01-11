# 🚨 DATABASE SETUP REQUIRED

## Test Results Summary

```
✅ Passed:  3/10 tests
❌ Failed:  7/10 tests
```

### What's Working
- ✅ Supabase connection successful
- ✅ Environment variables configured correctly
- ✅ Production build exists

### What's Missing
- ❌ Database tables don't exist (migrations weren't actually executed)
- ❌ No data in database
- ❌ Dashboard cannot load metrics

---

## Quick Fix (2 minutes)

### Option 1: One-Click Setup (Recommended)

1. **Open Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/sql/new
   ```

2. **Copy the complete setup SQL**
   - Open file: `supabase/complete-setup.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

3. **Paste and Run**
   - Paste into SQL editor
   - Click **"Run"** button
   - Wait ~5-10 seconds for completion

4. **Verify Setup**
   ```sql
   SELECT
     'hospitals' as table_name,
     COUNT(*) as records
   FROM hospitals
   UNION ALL
   SELECT 'claims', COUNT(*) FROM claims
   UNION ALL
   SELECT 'dashboard_metrics', COUNT(*) FROM dashboard_metrics;
   ```

   Expected output:
   ```
   hospitals          | 1
   claims             | 5
   dashboard_metrics  | 1
   ```

5. **Visit Dashboard**
   ```
   https://zeroriskagentcom.vercel.app/dashboard
   ```

---

### Option 2: Step-by-Step Setup

If you prefer to run migrations individually:

1. Run migrations in order:
   - `supabase/migrations/20260111000001_create_core_tables.sql`
   - `supabase/migrations/20260111000002_create_claims_and_denials.sql`
   - `supabase/migrations/20260111000003_create_appeals_and_recovery.sql`
   - `supabase/migrations/20260111000004_create_agent_and_knowledge_tables.sql`
   - `supabase/migrations/20260111000005_create_views_and_rls.sql`

2. Run seed data:
   - `supabase/seed.sql`

---

## What Gets Created

### Tables (15 total)
- `hospitals` - Hospital information
- `payer_organizations` - ESIC, CGHS, ECHS data
- `users` - Admin users
- `claims` - All insurance claims
- `claim_denials` - Denial records
- `appeals` - AI-generated appeals
- `recovery_transactions` - Revenue tracking
- `agent_actions` - Audit trail
- `payer_knowledge_graph` - ML learning data
- `notifications` - User notifications
- Plus 5 more support tables

### Functions
- `refresh_dashboard_metrics()` - Updates analytics
- `calculate_recovery_fee()` - Auto-calc 25% fee
- `calculate_hospital_share()` - Auto-calc 75% share
- Plus audit triggers

### Sample Data
- **Hope Hospital** with complete details
- **5 sample claims** (approved, denied, under review)
- **Dashboard metrics** ready to display

---

## After Setup Checklist

- [ ] All tables created successfully
- [ ] Seed data inserted (1 hospital, 5 claims)
- [ ] Dashboard metrics populated
- [ ] Dashboard loads without "Configuration Required" error
- [ ] Can see Hope Hospital statistics

---

## Troubleshooting

### Still seeing "Configuration Required"?

1. **Refresh the materialized view:**
   ```sql
   SELECT refresh_dashboard_metrics();
   ```

2. **Check for errors:**
   ```sql
   SELECT * FROM dashboard_metrics;
   ```
   Should return 1 row for Hope Hospital

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Tables still don't exist?

Make sure you:
1. Logged into the correct Supabase project
2. Ran the SQL in the SQL Editor (not the Database tab)
3. Waited for "Success" message after running

---

## Need Help?

Run the test again to see current status:
```bash
node scripts/test-setup.js
```

This will show exactly which tables are missing.

---

**Ready to proceed?** Follow Option 1 above - takes just 2 minutes!
