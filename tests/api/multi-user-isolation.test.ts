/**
 * Multi-User Data Isolation Test Suite
 * 
 * Critical tests to ensure users can only access their own financial data
 * and that deletion properly cascades to prevent stale data issues.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE = 'http://localhost:3000/api';

// Test headers for authentication bypass
const getTestHeaders = (userId: string) => ({
  'X-Test-Bypass-Auth': 'test-mode',
  'X-Test-User-Id': userId,
  'X-Test-User-Email': `${userId}@test.com`,
  'Content-Type': 'application/json',
});

// Helper to make API calls
async function apiCall(
  method: string,
  endpoint: string,
  userId: string,
  body?: any
) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: getTestHeaders(userId),
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

describe('Multi-User Data Isolation', () => {
  const user1Id = 'test-user-1';
  const user2Id = 'test-user-2';
  
  let user1InstitutionId: string;
  let user2InstitutionId: string;
  let user1AccountId: string;
  let user2AccountId: string;

  describe('Institution Isolation', () => {
    it('User 1 should create an institution', async () => {
      const { status, data } = await apiCall('POST', '/institutions', user1Id, {
        name: 'User 1 Bank',
        type: 'bank',
        color: '#FF0000',
      });
      
      expect(status).toBe(201);
      expect(data.name).toBe('User 1 Bank');
      expect(data.userId).toBe(user1Id);
      user1InstitutionId = data.id;
    });

    it('User 2 should create a different institution', async () => {
      const { status, data } = await apiCall('POST', '/institutions', user2Id, {
        name: 'User 2 Bank',
        type: 'bank',
        color: '#00FF00',
      });
      
      expect(status).toBe(201);
      expect(data.name).toBe('User 2 Bank');
      expect(data.userId).toBe(user2Id);
      user2InstitutionId = data.id;
    });

    it('User 1 should only see their own institution', async () => {
      const { status, data } = await apiCall('GET', '/institutions', user1Id);
      
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('User 1 Bank');
      expect(data[0].id).toBe(user1InstitutionId);
    });

    it('User 2 should only see their own institution', async () => {
      const { status, data } = await apiCall('GET', '/institutions', user2Id);
      
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('User 2 Bank');
      expect(data[0].id).toBe(user2InstitutionId);
    });
  });

  describe('Account Isolation', () => {
    it('User 1 should create an account in their institution', async () => {
      const { status, data } = await apiCall('POST', '/accounts', user1Id, {
        name: 'User 1 Checking',
        institutionId: user1InstitutionId,
        type: 'CHECKING',
        currency: 'EUR',
      });
      
      expect(status).toBe(201);
      expect(data.name).toBe('User 1 Checking');
      expect(data.userId).toBe(user1Id);
      user1AccountId = data.id;
    });

    it('User 2 should create an account in their institution', async () => {
      const { status, data } = await apiCall('POST', '/accounts', user2Id, {
        name: 'User 2 Savings',
        institutionId: user2InstitutionId,
        type: 'CHECKING',
        currency: 'EUR',
      });
      
      expect(status).toBe(201);
      expect(data.name).toBe('User 2 Savings');
      expect(data.userId).toBe(user2Id);
      user2AccountId = data.id;
    });

    it('User 1 cannot create account in User 2 institution', async () => {
      const { status, data } = await apiCall('POST', '/accounts', user1Id, {
        name: 'Invalid Account',
        institutionId: user2InstitutionId, // User 2's institution!
        type: 'CHECKING',
        currency: 'EUR',
      });
      
      expect(status).toBe(404);
      expect(data.error).toContain('Institution not found');
    });

    it('User 1 should only see their own accounts', async () => {
      const { status, data } = await apiCall('GET', '/accounts', user1Id);
      
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('User 1 Checking');
      expect(data[0].userId).toBe(user1Id);
    });

    it('User 2 should only see their own accounts', async () => {
      const { status, data } = await apiCall('GET', '/accounts', user2Id);
      
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('User 2 Savings');
      expect(data[0].userId).toBe(user2Id);
    });
  });

  describe('Portfolio Data Isolation', () => {
    beforeAll(async () => {
      // Add snapshots for both users
      await apiCall('POST', `/accounts/${user1AccountId}/update-balance`, user1Id, {
        balance: 1000,
      });
      
      await apiCall('POST', `/accounts/${user2AccountId}/update-balance`, user2Id, {
        balance: 5000,
      });
    });

    it('User 1 portfolio should show only their data', async () => {
      const { status, data } = await apiCall('GET', '/portfolio/quick-stats', user1Id);
      
      expect(status).toBe(200);
      expect(data.accountCount).toBe(1);
      expect(data.totalValue.eur).toBeCloseTo(1000, 2);
      
      // Check distribution
      if (data.distribution.byInstitution.length > 0) {
        expect(data.distribution.byInstitution[0].name).toBe('User 1 Bank');
      }
    });

    it('User 2 portfolio should show only their data', async () => {
      const { status, data } = await apiCall('GET', '/portfolio/quick-stats', user2Id);
      
      expect(status).toBe(200);
      expect(data.accountCount).toBe(1);
      expect(data.totalValue.eur).toBeCloseTo(5000, 2);
      
      // Check distribution
      if (data.distribution.byInstitution.length > 0) {
        expect(data.distribution.byInstitution[0].name).toBe('User 2 Bank');
      }
    });

    it('New user should have zero portfolio value', async () => {
      const newUserId = 'test-user-new';
      const { status, data } = await apiCall('GET', '/portfolio/quick-stats', newUserId);
      
      expect(status).toBe(200);
      expect(data.accountCount).toBe(0);
      expect(data.totalValue.eur).toBe(0);
      expect(data.totalValue.formatted).toBe('€0.00');
      expect(data.distribution.byInstitution).toEqual([]);
      expect(data.distribution.byType).toEqual([]);
      expect(data.distribution.byCurrency).toEqual([]);
    });
  });

  describe('Cascade Deletion and Zero Portfolio', () => {
    it('User 1 deletes institution with cascade should result in zero portfolio', async () => {
      // Delete institution with cascade
      const { status: deleteStatus } = await apiCall(
        'DELETE',
        `/institutions/${user1InstitutionId}?cascade=true`,
        user1Id
      );
      
      expect(deleteStatus).toBe(200);
      
      // Check portfolio is now zero
      const { status, data } = await apiCall('GET', '/portfolio/quick-stats', user1Id);
      
      expect(status).toBe(200);
      expect(data.accountCount).toBe(0);
      expect(data.totalValue.eur).toBe(0);
      expect(data.totalValue.formatted).toBe('€0.00');
    });

    it('User 2 data should remain intact after User 1 deletion', async () => {
      const { status, data } = await apiCall('GET', '/portfolio/quick-stats', user2Id);
      
      expect(status).toBe(200);
      expect(data.accountCount).toBe(1);
      expect(data.totalValue.eur).toBeCloseTo(5000, 2);
    });
  });

  describe('Portfolio Summary Isolation', () => {
    it('User 2 portfolio summary should show only their data', async () => {
      const { status, data } = await apiCall('GET', '/portfolio/summary', user2Id);
      
      expect(status).toBe(200);
      expect(data.totalNetWorth).toBeGreaterThan(0);
      expect(data.accountsByType).toBeDefined();
      expect(data.accountsByCurrency).toBeDefined();
    });

    it('User 1 portfolio summary should be empty after deletion', async () => {
      const { status, data } = await apiCall('GET', '/portfolio/summary', user1Id);
      
      expect(status).toBe(200);
      expect(data.totalNetWorth).toBe(0);
    });
  });

  // Cleanup
  afterAll(async () => {
    // Clean up User 2 data
    try {
      await apiCall('DELETE', `/institutions/${user2InstitutionId}?cascade=true`, user2Id);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
});
