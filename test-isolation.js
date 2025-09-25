/**
 * Simple test runner for multi-user isolation
 */

const API_BASE = 'http://localhost:3000/api';

// Test headers for authentication bypass
const getTestHeaders = (userId) => ({
  'X-Test-Bypass-Auth': 'test-mode',
  'X-Test-User-Id': userId,
  'X-Test-User-Email': `${userId}@test.com`,
  'Content-Type': 'application/json',
});

// Helper to make API calls
async function apiCall(method, endpoint, userId, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: getTestHeaders(userId),
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Running Multi-User Isolation Tests\n');
  console.log('=====================================\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Create institution for test user 3
  console.log('Test 1: Creating institution for test-user-3...');
  const inst3 = await apiCall('POST', '/institutions', 'test-user-1', {
    name: 'Test User 3 Bank',
    type: 'bank',
  });
  
  if (inst3.status === 201) {
    console.log('✅ PASS: Institution created');
    passed++;
  } else {
    console.log('❌ FAIL: Could not create institution');
    failed++;
  }
  
  // Test 2: Create institution for test user 4
  console.log('\nTest 2: Creating institution for test-user-4...');
  const inst4 = await apiCall('POST', '/institutions', 'test-user-2', {
    name: 'Test User 4 Bank',
    type: 'bank',
  });
  
  if (inst4.status === 201) {
    console.log('✅ PASS: Institution created');
    passed++;
  } else {
    console.log('❌ FAIL: Could not create institution');
    failed++;
  }
  
  // Test 3: User 3 should only see their institution
  console.log('\nTest 3: Checking test-user-1 institutions...');
  const user3Inst = await apiCall('GET', '/institutions', 'test-user-1');
  
  if (user3Inst.data.length === 1 && user3Inst.data[0].name === 'Test User 3 Bank') {
    console.log('✅ PASS: User sees only their institution');
    passed++;
  } else {
    console.log('❌ FAIL: User data isolation broken');
    console.log('  Found:', user3Inst.data);
    failed++;
  }
  
  // Test 4: Check portfolio stats isolation
  console.log('\nTest 4: Checking portfolio isolation...');
  
  // Create accounts with balances
  const acc3 = await apiCall('POST', '/accounts', 'test-user-1', {
    name: 'Test Account 3',
    institutionId: inst3.data.id,
    type: 'CHECKING',
    currency: 'EUR',
  });
  
  await apiCall('POST', `/accounts/${acc3.data.id}/update-balance`, 'test-user-1', {
    balance: 3000,
  });
  
  const acc4 = await apiCall('POST', '/accounts', 'test-user-2', {
    name: 'Test Account 4',
    institutionId: inst4.data.id,
    type: 'CHECKING',
    currency: 'EUR',
  });
  
  await apiCall('POST', `/accounts/${acc4.data.id}/update-balance`, 'test-user-2', {
    balance: 7000,
  });
  
  // Check user 3 portfolio
  const portfolio3 = await apiCall('GET', '/portfolio/quick-stats', 'test-user-1');
  const portfolio4 = await apiCall('GET', '/portfolio/quick-stats', 'test-user-2');
  
  if (portfolio3.data.totalValue.eur === 3000 && portfolio4.data.totalValue.eur === 7000) {
    console.log('✅ PASS: Portfolio data properly isolated');
    console.log(`  User 3: €${portfolio3.data.totalValue.eur}`);
    console.log(`  User 4: €${portfolio4.data.totalValue.eur}`);
    passed++;
  } else {
    console.log('❌ FAIL: Portfolio isolation broken');
    console.log(`  User 3: €${portfolio3.data.totalValue.eur} (expected 3000)`);
    console.log(`  User 4: €${portfolio4.data.totalValue.eur} (expected 7000)`);
    failed++;
  }
  
  // Test 5: Cascade deletion
  console.log('\nTest 5: Testing cascade deletion...');
  await apiCall('DELETE', `/institutions/${inst3.data.id}?cascade=true`, 'test-user-1');
  
  const portfolio3After = await apiCall('GET', '/portfolio/quick-stats', 'test-user-1');
  
  if (portfolio3After.data.totalValue.eur === 0) {
    console.log('✅ PASS: Portfolio correctly shows 0 after deletion');
    passed++;
  } else {
    console.log('❌ FAIL: Portfolio not zero after deletion');
    console.log(`  Found: €${portfolio3After.data.totalValue.eur}`);
    failed++;
  }
  
  // Test 6: Other user unaffected
  console.log('\nTest 6: Checking other user unaffected...');
  const portfolio4After = await apiCall('GET', '/portfolio/quick-stats', 'test-user-2');
  
  if (portfolio4After.data.totalValue.eur === 7000) {
    console.log('✅ PASS: Other user data unaffected');
    passed++;
  } else {
    console.log('❌ FAIL: Other user data was affected');
    console.log(`  Found: €${portfolio4After.data.totalValue.eur}`);
    failed++;
  }
  
  // Cleanup
  await apiCall('DELETE', `/institutions/${inst4.data.id}?cascade=true`, 'test-user-2');
  
  // Summary
  console.log('\n=====================================');
  console.log('Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('=====================================\n');
  
  if (failed > 0) {
    console.log('⚠️  CRITICAL: Multi-user isolation has failures!');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! Multi-user isolation is working correctly.');
  }
}

runTests().catch(console.error);
