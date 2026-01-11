#!/usr/bin/env node

const https = require('https');

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

let SUPABASE_URL, SUPABASE_KEY;

try {
  const envPath = path.join(__dirname, '../apps/dashboard/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  SUPABASE_URL = envVars.VITE_SUPABASE_URL;
  SUPABASE_KEY = envVars.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  console.error('❌ Could not load .env file:', error.message);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 ZERO RISK AGENT - COMPREHENSIVE SYSTEM TEST\n');
  console.log('=' .repeat(60));
  console.log('\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Supabase Connection
  console.log('📡 TEST 1: Supabase Connection');
  try {
    const result = await makeRequest('GET', '/rest/v1/');
    if (result.status === 200 || result.status === 404) {
      console.log('   ✅ Successfully connected to Supabase');
      console.log(`   📍 URL: ${SUPABASE_URL}`);
      passedTests++;
    } else {
      console.log(`   ❌ Unexpected status: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 2: Check hospitals table
  console.log('🏥 TEST 2: Hospitals Table');
  try {
    const result = await makeRequest('GET', '/rest/v1/hospitals?select=count');
    if (result.status === 200) {
      const count = result.data[0]?.count || 0;
      console.log(`   ✅ Hospitals table exists`);
      console.log(`   📊 Records found: ${count}`);
      if (count === 0) {
        console.log('   ⚠️  WARNING: No hospitals in database - dashboard will be empty');
      }
      passedTests++;
    } else {
      console.log(`   ❌ Could not access hospitals table: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 3: Check claims table
  console.log('📋 TEST 3: Claims Table');
  try {
    const result = await makeRequest('GET', '/rest/v1/claims?select=count');
    if (result.status === 200) {
      const count = result.data[0]?.count || 0;
      console.log(`   ✅ Claims table exists`);
      console.log(`   📊 Records found: ${count}`);
      if (count === 0) {
        console.log('   ⚠️  WARNING: No claims in database');
      }
      passedTests++;
    } else {
      console.log(`   ❌ Could not access claims table: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 4: Check claim_denials table
  console.log('🚫 TEST 4: Claim Denials Table');
  try {
    const result = await makeRequest('GET', '/rest/v1/claim_denials?select=count');
    if (result.status === 200) {
      const count = result.data[0]?.count || 0;
      console.log(`   ✅ Claim denials table exists`);
      console.log(`   📊 Records found: ${count}`);
      passedTests++;
    } else {
      console.log(`   ❌ Could not access claim_denials table: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 5: Check appeals table
  console.log('📝 TEST 5: Appeals Table');
  try {
    const result = await makeRequest('GET', '/rest/v1/appeals?select=count');
    if (result.status === 200) {
      const count = result.data[0]?.count || 0;
      console.log(`   ✅ Appeals table exists`);
      console.log(`   📊 Records found: ${count}`);
      passedTests++;
    } else {
      console.log(`   ❌ Could not access appeals table: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 6: Check recovery_transactions table
  console.log('💰 TEST 6: Recovery Transactions Table');
  try {
    const result = await makeRequest('GET', '/rest/v1/recovery_transactions?select=count');
    if (result.status === 200) {
      const count = result.data[0]?.count || 0;
      console.log(`   ✅ Recovery transactions table exists`);
      console.log(`   📊 Records found: ${count}`);
      passedTests++;
    } else {
      console.log(`   ❌ Could not access recovery_transactions table: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 7: Check dashboard_metrics materialized view
  console.log('📊 TEST 7: Dashboard Metrics View');
  try {
    const result = await makeRequest('GET', '/rest/v1/dashboard_metrics?select=*&limit=1');
    if (result.status === 200) {
      console.log(`   ✅ Dashboard metrics view exists`);
      if (result.data && result.data.length > 0) {
        console.log(`   📊 Sample data found:`);
        const metrics = result.data[0];
        console.log(`      Hospital: ${metrics.hospital_name || 'N/A'}`);
        console.log(`      Total Claims: ${metrics.total_claims || 0}`);
        console.log(`      Denied Claims: ${metrics.denied_claims || 0}`);
        console.log(`      Recovery Value: ₹${(metrics.total_recovery_value || 0).toLocaleString('en-IN')}`);
      } else {
        console.log('   ⚠️  WARNING: No data in dashboard metrics - view may need refresh');
      }
      passedTests++;
    } else {
      console.log(`   ❌ Could not access dashboard_metrics: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 8: Test refresh function
  console.log('🔄 TEST 8: Refresh Dashboard Metrics Function');
  try {
    const result = await makeRequest('POST', '/rest/v1/rpc/refresh_dashboard_metrics', {});
    if (result.status === 200 || result.status === 204) {
      console.log(`   ✅ Refresh function executed successfully`);
      passedTests++;
    } else {
      console.log(`   ❌ Refresh function failed: ${result.status}`);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 9: Environment Variables in Vercel
  console.log('🔐 TEST 9: Vercel Environment Variables');
  console.log('   ℹ️  Checking local .env file...');
  try {
    const envPath = path.join(__dirname, '../apps/dashboard/.env');
    const envExists = fs.existsSync(envPath);
    if (envExists) {
      console.log('   ✅ Local .env file exists');
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
      const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
      const hasOpenAI = envContent.includes('VITE_OPENAI_API_KEY');
      const hasGemini = envContent.includes('VITE_GEMINI_API_KEY');

      console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} VITE_SUPABASE_URL`);
      console.log(`   ${hasSupabaseKey ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY`);
      console.log(`   ${hasOpenAI ? '✅' : '❌'} VITE_OPENAI_API_KEY`);
      console.log(`   ${hasGemini ? '✅' : '❌'} VITE_GEMINI_API_KEY`);

      if (hasSupabaseUrl && hasSupabaseKey && hasOpenAI && hasGemini) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      console.log('   ❌ Local .env file not found');
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Test 10: Build verification
  console.log('🔨 TEST 10: Build Status');
  try {
    const distPath = path.join(__dirname, '../apps/dashboard/dist');
    const distExists = fs.existsSync(distPath);
    if (distExists) {
      const indexPath = path.join(distPath, 'index.html');
      const indexExists = fs.existsSync(indexPath);
      if (indexExists) {
        console.log('   ✅ Production build exists');
        console.log(`   📁 Build directory: ${distPath}`);
        passedTests++;
      } else {
        console.log('   ❌ Build directory exists but index.html is missing');
        failedTests++;
      }
    } else {
      console.log('   ⚠️  WARNING: No production build found');
      console.log('   💡 Run: cd apps/dashboard && pnpm build');
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    failedTests++;
  }
  console.log('');

  // Summary
  console.log('=' .repeat(60));
  console.log('\n📈 TEST RESULTS SUMMARY\n');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📊 Total:  ${passedTests + failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready to use.\n');
    console.log('🌐 Production URL: https://zeroriskagentcom.vercel.app');
    console.log('📊 Dashboard URL: https://zeroriskagentcom.vercel.app/dashboard\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Please review the errors above\n');

    if (passedTests >= 7) {
      console.log('💡 RECOMMENDED ACTIONS:\n');
      console.log('   1. Run seed data to populate the database:');
      console.log('      - Visit: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/editor');
      console.log('      - Run the SQL from: supabase/seed.sql\n');
      console.log('   2. Rebuild the dashboard:');
      console.log('      cd apps/dashboard && pnpm build\n');
    }
  }

  console.log('=' .repeat(60));
  console.log('');
}

runTests().catch(error => {
  console.error('\n💥 CRITICAL ERROR:', error.message);
  process.exit(1);
});
