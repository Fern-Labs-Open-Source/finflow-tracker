#!/usr/bin/env node

/**
 * Test script to verify multi-user authentication and data isolation
 */

const fetch = require('node-fetch');
const colors = require('colors');

const BASE_URL = 'http://localhost:3001';

// Test users
const testUser1 = {
  email: 'user1@test.com',
  password: 'TestPassword123!',
  name: 'Test User 1',
};

const testUser2 = {
  email: 'user2@test.com', 
  password: 'TestPassword456!',
  name: 'Test User 2',
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json().catch(() => null);
  
  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

// Test user registration
async function testRegistration() {
  console.log('\n📝 Testing User Registration...'.cyan);
  
  // Register user 1
  const result1 = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser1),
  });
  
  if (result1.status === 201) {
    console.log('✅ User 1 registered successfully'.green);
  } else if (result1.status === 409) {
    console.log('⚠️  User 1 already exists'.yellow);
  } else {
    console.log('❌ Failed to register User 1'.red, result1.data);
    return false;
  }
  
  // Register user 2
  const result2 = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(testUser2),
  });
  
  if (result2.status === 201) {
    console.log('✅ User 2 registered successfully'.green);
  } else if (result2.status === 409) {
    console.log('⚠️  User 2 already exists'.yellow);
  } else {
    console.log('❌ Failed to register User 2'.red, result2.data);
    return false;
  }
  
  return true;
}

// Test login and get session token
async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for ${email}...`.cyan);
  
  const result = await apiCall('/api/auth/callback/credentials', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      csrfToken: 'test', // In real scenario, get this from /api/auth/csrf
    }),
  });
  
  if (result.status === 200) {
    console.log('✅ Login successful'.green);
    // Extract session cookie
    const cookies = result.headers.get('set-cookie');
    return cookies;
  } else {
    console.log('❌ Login failed'.red, result.data);
    return null;
  }
}

// Test data isolation
async function testDataIsolation(user1Cookie, user2Cookie) {
  console.log('\n🔒 Testing Data Isolation...'.cyan);
  
  // User 1 gets their institutions
  const user1Institutions = await apiCall('/api/institutions', {
    headers: {
      Cookie: user1Cookie,
    },
  });
  
  // User 2 gets their institutions  
  const user2Institutions = await apiCall('/api/institutions', {
    headers: {
      Cookie: user2Cookie,
    },
  });
  
  if (user1Institutions.status === 200 && user2Institutions.status === 200) {
    const user1Count = user1Institutions.data.length;
    const user2Count = user2Institutions.data.length;
    
    console.log(`✅ User 1 has ${user1Count} institutions`.green);
    console.log(`✅ User 2 has ${user2Count} institutions`.green);
    
    // Check if any institutions are shared (they shouldn't be)
    if (user1Count > 0 && user2Count > 0) {
      const user1Ids = user1Institutions.data.map(i => i.id);
      const user2Ids = user2Institutions.data.map(i => i.id);
      const shared = user1Ids.filter(id => user2Ids.includes(id));
      
      if (shared.length === 0) {
        console.log('✅ No data leakage detected - users have separate data'.green);
      } else {
        console.log('❌ CRITICAL: Data leakage detected!'.red);
        console.log('Shared institution IDs:', shared);
        return false;
      }
    }
  } else {
    console.log('❌ Failed to fetch institutions'.red);
    return false;
  }
  
  return true;
}

// Test unauthorized access
async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing Unauthorized Access...'.cyan);
  
  const result = await apiCall('/api/accounts');
  
  if (result.status === 401) {
    console.log('✅ Unauthorized access properly blocked'.green);
    return true;
  } else {
    console.log('❌ CRITICAL: Unauthorized access not blocked!'.red);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('================================='.blue);
  console.log('🧪 Multi-User Authentication Test'.blue.bold);
  console.log('================================='.blue);
  
  try {
    // Test unauthorized access first
    const unauthorizedTest = await testUnauthorizedAccess();
    if (!unauthorizedTest) {
      console.log('\n❌ Tests failed'.red);
      return;
    }
    
    // Test registration
    const registrationSuccess = await testRegistration();
    if (!registrationSuccess) {
      console.log('\n❌ Tests failed'.red);
      return;
    }
    
    // Test login for both users
    const user1Session = await testLogin(testUser1.email, testUser1.password);
    const user2Session = await testLogin(testUser2.email, testUser2.password);
    
    if (!user1Session || !user2Session) {
      console.log('\n❌ Login tests failed'.red);
      return;
    }
    
    // Test data isolation
    const isolationSuccess = await testDataIsolation(user1Session, user2Session);
    if (!isolationSuccess) {
      console.log('\n❌ Data isolation test failed'.red);
      return;
    }
    
    console.log('\n================================='.green);
    console.log('✅ All tests passed successfully!'.green.bold);
    console.log('================================='.green);
    
  } catch (error) {
    console.error('\n❌ Test error:'.red, error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

// Start tests
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚠️  Server is not running. Please start the dev server first:'.yellow);
    console.log('npm run dev'.cyan);
    process.exit(1);
  }
  
  await runTests();
})();
