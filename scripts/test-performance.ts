#!/usr/bin/env tsx
/**
 * Test script for backend performance improvements
 */

const API_BASE = 'http://localhost:3000/api';
const headers = {
  'X-Test-Bypass-Auth': 'test-mode',
  'Content-Type': 'application/json',
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEndpoint(name: string, url: string, options?: RequestInit) {
  try {
    const start = Date.now();
    const response = await fetch(url, { ...options, headers });
    const duration = Date.now() - start;
    const data = await response.json();
    
    if (response.ok) {
      log(`  ✓ ${name} (${duration}ms)`, colors.green);
      
      // Check for cache headers
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        log(`    Cache: ${cacheControl}`, colors.dim);
      }
      
      return { success: true, duration, data };
    } else {
      log(`  ✗ ${name}: ${response.status} - ${data.error}`, colors.red);
      return { success: false, error: data.error };
    }
  } catch (error) {
    log(`  ✗ ${name}: ${error}`, colors.red);
    return { success: false, error };
  }
}

async function main() {
  log('\n🚀 Testing Backend Performance Improvements\n', colors.blue);
  
  // Test Quick Stats
  log('📊 Quick Stats Endpoint:', colors.yellow);
  const quickStats = await testEndpoint(
    'GET /api/portfolio/quick-stats',
    `${API_BASE}/portfolio/quick-stats`
  );
  
  if (quickStats.success && quickStats.data) {
    log(`    Total Value: ${quickStats.data.totalValue?.formatted}`, colors.dim);
    log(`    Daily Change: ${quickStats.data.dailyChange?.formatted}`, colors.dim);
    log(`    Accounts: ${quickStats.data.accountCount}`, colors.dim);
  }
  
  // Test Search
  log('\n🔍 Search Endpoint:', colors.yellow);
  await testEndpoint(
    'Search for "bank"',
    `${API_BASE}/search?q=bank`
  );
  
  await testEndpoint(
    'Search accounts only',
    `${API_BASE}/search?q=test&type=accounts`
  );
  
  await testEndpoint(
    'Invalid search (too short)',
    `${API_BASE}/search?q=a`
  );
  
  // Test Batch Update
  log('\n🔄 Batch Update Endpoint:', colors.yellow);
  
  // First, get some accounts to update
  const accountsResp = await fetch(`${API_BASE}/accounts`, { headers });
  const accounts = await accountsResp.json();
  
  if (accounts.length >= 2) {
    const updates = accounts.slice(0, 2).map((acc: any, i: number) => ({
      id: acc.id,
      balance: acc.balance + (i + 1) * 100,
    }));
    
    const batchUpdate = await testEndpoint(
      'Batch update 2 accounts',
      `${API_BASE}/accounts/batch-update`,
      {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }
    );
    
    if (batchUpdate.success && batchUpdate.data) {
      log(`    Updated: ${batchUpdate.data.updated} accounts`, colors.dim);
    }
  } else {
    log('  ⚠ Not enough accounts for batch update test', colors.yellow);
  }
  
  // Test validation
  await testEndpoint(
    'Invalid batch update (negative balance)',
    `${API_BASE}/accounts/batch-update`,
    {
      method: 'POST',
      body: JSON.stringify({
        updates: [{ id: 'test', balance: -100 }],
      }),
    }
  );
  
  // Performance Summary
  log('\n📈 Performance Summary:', colors.blue);
  
  const endpoints = [
    '/portfolio/summary',
    '/portfolio/quick-stats',
    '/accounts',
    '/institutions',
    '/search?q=test',
  ];
  
  let totalDuration = 0;
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const start = Date.now();
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    const duration = Date.now() - start;
    
    if (response.ok) {
      successCount++;
      totalDuration += duration;
      const status = duration < 100 ? '⚡' : duration < 200 ? '✓' : '⚠';
      log(`  ${status} ${endpoint}: ${duration}ms`, 
        duration < 100 ? colors.green : duration < 200 ? colors.yellow : colors.red);
    } else {
      log(`  ✗ ${endpoint}: Failed`, colors.red);
    }
  }
  
  const avgDuration = Math.round(totalDuration / successCount);
  log(`\n  Average response time: ${avgDuration}ms`, 
    avgDuration < 100 ? colors.green : colors.yellow);
  
  // Test caching behavior
  log('\n💾 Cache Behavior:', colors.blue);
  
  // First request (cold cache)
  const cold1 = Date.now();
  await fetch(`${API_BASE}/portfolio/quick-stats`, { headers });
  const coldDuration = Date.now() - cold1;
  
  // Second request (should use cache)
  const warm1 = Date.now();
  await fetch(`${API_BASE}/portfolio/quick-stats`, { headers });
  const warmDuration = Date.now() - warm1;
  
  log(`  Cold cache: ${coldDuration}ms`, colors.yellow);
  log(`  Warm cache: ${warmDuration}ms`, colors.green);
  
  if (warmDuration < coldDuration * 0.5) {
    log(`  ✓ Cache is effective (${Math.round((1 - warmDuration/coldDuration) * 100)}% faster)`, colors.green);
  } else {
    log(`  ⚠ Cache might not be working effectively`, colors.yellow);
  }
  
  log('\n✅ Performance tests complete!\n', colors.green);
}

main().catch(console.error);
