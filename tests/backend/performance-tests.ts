/**
 * Tests for backend performance improvements
 * Focus on simplicity and practical improvements
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000/api';
const TEST_HEADERS = {
  'X-Test-Bypass-Auth': 'test-mode',
  'Content-Type': 'application/json',
};

describe('Backend Performance Improvements', () => {
  let testAccountIds: string[] = [];
  
  beforeAll(async () => {
    // Create some test accounts for testing
    const institutions = await fetch(`${API_BASE}/institutions`, {
      headers: TEST_HEADERS,
    }).then(r => r.json());
    
    if (institutions.length > 0) {
      for (let i = 0; i < 3; i++) {
        const account = await fetch(`${API_BASE}/accounts`, {
          method: 'POST',
          headers: TEST_HEADERS,
          body: JSON.stringify({
            name: `Test Account ${i}`,
            type: 'CHECKING',
            balance: 1000 + i * 500,
            currency: 'EUR',
            institutionId: institutions[0].id,
          }),
        }).then(r => r.json());
        
        testAccountIds.push(account.id);
      }
    }
  });
  
  afterAll(async () => {
    // Clean up test accounts
    for (const id of testAccountIds) {
      await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'DELETE',
        headers: TEST_HEADERS,
      });
    }
  });

  describe('Quick Stats Endpoint', () => {
    test('should return portfolio quick stats', async () => {
      const response = await fetch(`${API_BASE}/portfolio/quick-stats`, {
        headers: TEST_HEADERS,
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toContain('max-age=60');
      
      const data = await response.json();
      expect(data).toHaveProperty('totalValue');
      expect(data).toHaveProperty('dailyChange');
      expect(data).toHaveProperty('accountCount');
      expect(data).toHaveProperty('distribution');
      expect(data.distribution).toHaveProperty('byType');
      expect(data.distribution).toHaveProperty('byCurrency');
      expect(data.distribution).toHaveProperty('byInstitution');
    });
    
    test('should be fast (< 100ms)', async () => {
      const start = Date.now();
      const response = await fetch(`${API_BASE}/portfolio/quick-stats`, {
        headers: TEST_HEADERS,
      });
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Batch Update Endpoint', () => {
    test('should update multiple accounts at once', async () => {
      if (testAccountIds.length < 2) {
        console.log('Skipping batch update test - not enough test accounts');
        return;
      }
      
      const updates = testAccountIds.slice(0, 2).map((id, i) => ({
        id,
        balance: 2000 + i * 1000,
      }));
      
      const response = await fetch(`${API_BASE}/accounts/batch-update`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify({ updates }),
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.accounts).toHaveLength(2);
    });
    
    test('should validate batch update data', async () => {
      const response = await fetch(`${API_BASE}/accounts/batch-update`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify({
          updates: [
            { id: 'test', balance: -100 }, // Invalid balance
          ],
        }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('fieldErrors');
    });
    
    test('should handle non-existent accounts', async () => {
      const response = await fetch(`${API_BASE}/accounts/batch-update`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify({
          updates: [
            { id: 'non-existent-id', balance: 1000 },
          ],
        }),
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('not found');
      expect(data.missingIds).toContain('non-existent-id');
    });
  });

  describe('Search Endpoint', () => {
    test('should search accounts and institutions', async () => {
      const response = await fetch(`${API_BASE}/search?q=test`, {
        headers: TEST_HEADERS,
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('summary');
      expect(data.summary.query).toBe('test');
      
      if (data.accounts) {
        expect(Array.isArray(data.accounts)).toBe(true);
        data.accounts.forEach((account: any) => {
          expect(account).toHaveProperty('matchedOn');
        });
      }
    });
    
    test('should filter by type', async () => {
      const accountsResponse = await fetch(`${API_BASE}/search?q=test&type=accounts`, {
        headers: TEST_HEADERS,
      });
      
      expect(accountsResponse.status).toBe(200);
      const accountsData = await accountsResponse.json();
      expect(accountsData).toHaveProperty('accounts');
      expect(accountsData).not.toHaveProperty('institutions');
      
      const instResponse = await fetch(`${API_BASE}/search?q=bank&type=institutions`, {
        headers: TEST_HEADERS,
      });
      
      expect(instResponse.status).toBe(200);
      const instData = await instResponse.json();
      expect(instData).toHaveProperty('institutions');
      expect(instData).not.toHaveProperty('accounts');
    });
    
    test('should validate query length', async () => {
      const response = await fetch(`${API_BASE}/search?q=a`, {
        headers: TEST_HEADERS,
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('at least 2 characters');
    });
    
    test('should include cache headers', async () => {
      const response = await fetch(`${API_BASE}/search?q=test`, {
        headers: TEST_HEADERS,
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toContain('max-age');
      expect(response.headers.get('x-search-query')).toBe('test');
    });
  });

  describe('Cache Headers', () => {
    test('portfolio endpoints should have appropriate cache headers', async () => {
      const endpoints = [
        { path: '/portfolio/summary', expectedCache: 'max-age=60' },
        { path: '/portfolio/quick-stats', expectedCache: 'max-age=60' },
        { path: '/accounts', expectedCache: 'max-age=60' },
        { path: '/institutions', expectedCache: 'max-age=60' },
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE}${endpoint.path}`, {
          headers: TEST_HEADERS,
        });
        
        expect(response.status).toBe(200);
        const cacheControl = response.headers.get('cache-control');
        expect(cacheControl).toContain(endpoint.expectedCache);
      }
    });
  });

  describe('Response Times', () => {
    test('all endpoints should respond within 200ms', async () => {
      const endpoints = [
        '/portfolio/summary',
        '/portfolio/quick-stats',
        '/accounts',
        '/institutions',
        '/search?q=test',
      ];
      
      for (const endpoint of endpoints) {
        const start = Date.now();
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: TEST_HEADERS,
        });
        const duration = Date.now() - start;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(200);
        console.log(`${endpoint}: ${duration}ms`);
      }
    });
  });
});
