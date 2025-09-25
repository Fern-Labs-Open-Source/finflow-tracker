#!/usr/bin/env node

/**
 * Test script to validate empty portfolio behavior
 */

const BASE_URL = 'http://localhost:3000';

// Test user for empty portfolio
const TEST_USER = {
  id: 'test-user-empty',
  email: 'empty@test.com',
  name: 'Empty User'
};

async function fetchWithAuth(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Auth': 'test-mode',
      'X-Test-User-Id': TEST_USER.id,
      ...(options.headers || {})
    }
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function testEmptyPortfolio() {
  console.log('🧪 Testing Empty Portfolio Behavior\n');
  console.log(`Using test user: ${TEST_USER.email} (${TEST_USER.id})\n`);
  
  try {
    // Test 1: Check portfolio quick stats for empty user
    console.log('1️⃣ Testing /api/portfolio/quick-stats for empty portfolio...');
    const quickStats = await fetchWithAuth('/api/portfolio/quick-stats');
    
    // Validate empty portfolio response
    const checks = [
      {
        name: 'Total value is 0',
        pass: quickStats.totalValue?.eur === 0
      },
      {
        name: 'Formatted value is €0.00',
        pass: quickStats.totalValue?.formatted === '€0.00'
      },
      {
        name: 'Account count is 0',
        pass: quickStats.accountCount === 0
      },
      {
        name: 'Distribution by type is empty',
        pass: Array.isArray(quickStats.distribution?.byType) && quickStats.distribution.byType.length === 0
      },
      {
        name: 'Distribution by currency is empty',
        pass: Array.isArray(quickStats.distribution?.byCurrency) && quickStats.distribution.byCurrency.length === 0
      },
      {
        name: 'Distribution by institution is empty',
        pass: Array.isArray(quickStats.distribution?.byInstitution) && quickStats.distribution.byInstitution.length === 0
      }
    ];
    
    checks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = checks.every(c => c.pass);
    if (!allPassed) {
      console.log('\n📊 Actual response:', JSON.stringify(quickStats, null, 2));
    }
    
    // Test 2: Check portfolio performance
    console.log('\n2️⃣ Testing /api/portfolio/performance for empty portfolio...');
    const performance = await fetchWithAuth('/api/portfolio/performance');
    
    const performanceChecks = [
      {
        name: 'Current value is 0',
        pass: performance.currentValue === 0
      },
      {
        name: 'Previous value is 0',
        pass: performance.previousValue === 0
      },
      {
        name: 'Change amount is 0',
        pass: performance.change === 0
      },
      {
        name: 'Change percent is 0',
        pass: performance.changePercent === 0
      },
      {
        name: 'History is empty array',
        pass: Array.isArray(performance.history) && performance.history.length === 0
      }
    ];
    
    performanceChecks.forEach(check => {
      console.log(`  ${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    // Test 3: Check institutions endpoint
    console.log('\n3️⃣ Testing /api/institutions for empty user...');
    const institutions = await fetchWithAuth('/api/institutions');
    console.log(`  ${Array.isArray(institutions) && institutions.length === 0 ? '✅' : '❌'} No institutions exist`);
    
    // Test 4: Check accounts endpoint
    console.log('\n4️⃣ Testing /api/accounts for empty user...');
    const accounts = await fetchWithAuth('/api/accounts');
    console.log(`  ${Array.isArray(accounts) && accounts.length === 0 ? '✅' : '❌'} No accounts exist`);
    
    // Summary
    console.log('\n✨ Summary:');
    const totalChecks = checks.length + performanceChecks.length + 2;
    const passedChecks = checks.filter(c => c.pass).length + 
                        performanceChecks.filter(c => c.pass).length +
                        (Array.isArray(institutions) && institutions.length === 0 ? 1 : 0) +
                        (Array.isArray(accounts) && accounts.length === 0 ? 1 : 0);
    
    console.log(`  Passed: ${passedChecks}/${totalChecks} tests`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 All empty portfolio tests passed! The backend correctly handles empty states.');
    } else {
      console.log('\n⚠️ Some tests failed. The backend may not be handling empty states correctly.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testEmptyPortfolio().catch(console.error);
