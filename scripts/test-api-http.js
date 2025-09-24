#!/usr/bin/env node

/**
 * HTTP API test to validate the fixes through actual API calls
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Create axios instance with test bypass header
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Bypass-Auth': 'test-mode', // Bypass auth for testing
  },
  validateStatus: () => true, // Don't throw on error status codes
});

async function testInstitutionAPIs() {
  console.log('🏦 Testing Institution APIs...\n');
  
  // Test 1: Create institution
  console.log('1. Creating institution...');
  const createRes = await api.post('/institutions', {
    name: 'Test Bank',
    type: 'bank',
    color: '#123456',
  });
  
  if (createRes.status === 201) {
    console.log('✅ Institution created successfully');
    const institutionId = createRes.data.id;
    
    // Test 2: Get institution (should work with proper user context)
    console.log('2. Fetching institution...');
    const getRes = await api.get(`/institutions/${institutionId}`);
    
    if (getRes.status === 200) {
      console.log('✅ Institution fetched successfully');
    } else {
      console.log(`❌ Failed to fetch institution: ${getRes.status}`);
    }
    
    // Test 3: Update institution
    console.log('3. Updating institution...');
    const updateRes = await api.patch(`/institutions/${institutionId}`, {
      name: 'Updated Test Bank',
    });
    
    if (updateRes.status === 200) {
      console.log('✅ Institution updated successfully');
    } else {
      console.log(`❌ Failed to update institution: ${updateRes.status}`);
    }
    
    // Test 4: Delete institution without cascade (should fail if has accounts)
    console.log('4. Testing delete without cascade...');
    const deleteRes = await api.delete(`/institutions/${institutionId}`);
    
    if (deleteRes.status === 200 || deleteRes.status === 400) {
      console.log('✅ Delete behavior correct (200 if no accounts, 400 if has accounts)');
    } else {
      console.log(`❌ Unexpected delete response: ${deleteRes.status}`);
    }
    
    // Test 5: Delete with cascade
    console.log('5. Testing delete with cascade...');
    const cascadeRes = await api.delete(`/institutions/${institutionId}?cascade=true`);
    
    if (cascadeRes.status === 200) {
      console.log('✅ Institution deleted with cascade');
    } else {
      console.log(`❌ Failed to delete with cascade: ${cascadeRes.status}`);
    }
  } else {
    console.log(`❌ Failed to create institution: ${createRes.status}`);
    console.log('Error:', createRes.data);
  }
  
  console.log('\n');
}

async function testAccountAPIs() {
  console.log('💳 Testing Account APIs...\n');
  
  // First create an institution
  const instRes = await api.post('/institutions', {
    name: 'Test Bank for Accounts',
    type: 'bank',
    color: '#654321',
  });
  
  if (instRes.status === 201) {
    const institutionId = instRes.data.id;
    
    // Test 1: Create account
    console.log('1. Creating account...');
    const createRes = await api.post('/accounts', {
      institutionId,
      name: 'Test Checking Account',
      type: 'CHECKING',
      currency: 'EUR',
    });
    
    if (createRes.status === 201) {
      console.log('✅ Account created successfully');
      const accountId = createRes.data.id;
      
      // Test 2: Get account
      console.log('2. Fetching account...');
      const getRes = await api.get(`/accounts/${accountId}`);
      
      if (getRes.status === 200) {
        console.log('✅ Account fetched successfully');
      } else {
        console.log(`❌ Failed to fetch account: ${getRes.status}`);
      }
      
      // Test 3: Update account
      console.log('3. Updating account...');
      const updateRes = await api.patch(`/accounts/${accountId}`, {
        name: 'Updated Checking Account',
      });
      
      if (updateRes.status === 200) {
        console.log('✅ Account updated successfully');
      } else {
        console.log(`❌ Failed to update account: ${updateRes.status}`);
      }
      
      // Test 4: Create snapshot
      console.log('4. Creating account snapshot...');
      const snapshotRes = await api.post(`/accounts/${accountId}/snapshot`, {
        date: new Date().toISOString(),
        valueOriginal: 1000,
        currency: 'EUR',
      });
      
      if (snapshotRes.status === 201 || snapshotRes.status === 200) {
        console.log('✅ Snapshot created successfully');
      } else {
        console.log(`❌ Failed to create snapshot: ${snapshotRes.status}`);
      }
      
      // Test 5: Get snapshots
      console.log('5. Fetching snapshots...');
      const getSnapshotsRes = await api.get(`/accounts/${accountId}/snapshot`);
      
      if (getSnapshotsRes.status === 200) {
        console.log('✅ Snapshots fetched successfully');
      } else {
        console.log(`❌ Failed to fetch snapshots: ${getSnapshotsRes.status}`);
      }
      
      // Test 6: Delete account
      console.log('6. Deleting account...');
      const deleteRes = await api.delete(`/accounts/${accountId}`);
      
      if (deleteRes.status === 200) {
        console.log('✅ Account deleted successfully');
      } else {
        console.log(`❌ Failed to delete account: ${deleteRes.status}`);
      }
    } else {
      console.log(`❌ Failed to create account: ${createRes.status}`);
      console.log('Error:', createRes.data);
    }
    
    // Cleanup - delete institution
    await api.delete(`/institutions/${institutionId}?cascade=true`);
  } else {
    console.log('❌ Failed to create test institution for accounts');
  }
  
  console.log('\n');
}

async function testRegistrationAPI() {
  console.log('👤 Testing Registration API...\n');
  
  const timestamp = Date.now();
  
  // Test 1: Register without sample data (default)
  console.log('1. Register without sample data...');
  const noSampleRes = await api.post('/auth/register', {
    email: `nosample${timestamp}@test.com`,
    password: 'password123',
    name: 'No Sample User',
  });
  
  if (noSampleRes.status === 201 && noSampleRes.data.sampleDataCreated === false) {
    console.log('✅ Registration without sample data works');
  } else {
    console.log(`❌ Registration without sample data failed: ${noSampleRes.status}`);
  }
  
  // Test 2: Register with sample data (explicit flag)
  console.log('2. Register with sample data...');
  const withSampleRes = await api.post('/auth/register?sampleData=true', {
    email: `withsample${timestamp}@test.com`,
    password: 'password123',
    name: 'With Sample User',
  });
  
  if (withSampleRes.status === 201 && withSampleRes.data.sampleDataCreated === true) {
    console.log('✅ Registration with sample data works');
  } else {
    console.log(`❌ Registration with sample data failed: ${withSampleRes.status}`);
  }
  
  console.log('\n');
}

async function runAllTests() {
  console.log('🚀 Starting HTTP API Tests\n');
  console.log('================================\n');
  
  try {
    // Test server connectivity
    console.log('🔌 Testing server connectivity...');
    const pingRes = await api.get('/health').catch(() => ({ status: 404 }));
    if (pingRes.status === 404) {
      console.log('✅ Server is running (health endpoint not found is expected)\n');
    }
    
    await testInstitutionAPIs();
    await testAccountAPIs();
    await testRegistrationAPI();
    
    console.log('================================\n');
    console.log('✨ All HTTP API tests completed!\n');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if server is running
axios.get('http://localhost:3001')
  .then(() => {
    console.log('✅ Server detected at localhost:3001\n');
    runAllTests();
  })
  .catch(() => {
    console.error('❌ Server not running at localhost:3001');
    console.error('Please start the dev server with: npm run dev');
    process.exit(1);
  });
