/**
 * API User Context Tests
 * 
 * Tests to ensure all API endpoints properly filter by userId
 * and prevent cross-user data access
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestUser, deleteTestUser } from './helpers/test-users';
import { apiClient } from './helpers/api-client';

describe('API User Context Security', () => {
  let user1: any;
  let user2: any;
  let user1Token: string;
  let user2Token: string;
  let user1Institution: any;
  let user2Institution: any;
  let user1Account: any;
  let user2Account: any;

  beforeAll(async () => {
    // Create two test users
    user1 = await createTestUser('user1@test.com', 'password123');
    user2 = await createTestUser('user2@test.com', 'password456');
    
    // Login both users to get tokens
    const login1 = await apiClient.post('/api/auth/signin', {
      email: 'user1@test.com',
      password: 'password123',
    });
    user1Token = login1.data.token;

    const login2 = await apiClient.post('/api/auth/signin', {
      email: 'user2@test.com',
      password: 'password456',
    });
    user2Token = login2.data.token;

    // Create institutions for each user
    user1Institution = await apiClient.post(
      '/api/institutions',
      {
        name: 'User 1 Bank',
        type: 'bank',
        color: '#FF0000',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    user2Institution = await apiClient.post(
      '/api/institutions',
      {
        name: 'User 2 Bank',
        type: 'bank',
        color: '#00FF00',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );

    // Create accounts for each user
    user1Account = await apiClient.post(
      '/api/accounts',
      {
        institutionId: user1Institution.data.id,
        name: 'User 1 Checking',
        type: 'CHECKING',
        currency: 'USD',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    user2Account = await apiClient.post(
      '/api/accounts',
      {
        institutionId: user2Institution.data.id,
        name: 'User 2 Savings',
        type: 'SAVINGS',
        currency: 'EUR',
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
  });

  afterAll(async () => {
    // Cleanup test users and their data
    await deleteTestUser(user1.id);
    await deleteTestUser(user2.id);
  });

  describe('Institution API Security', () => {
    it('should not allow user to access another user\'s institution', async () => {
      // User 1 tries to access User 2's institution
      const response = await apiClient.get(
        `/api/institutions/${user2Institution.data.id}`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to update another user\'s institution', async () => {
      // User 1 tries to update User 2's institution
      const response = await apiClient.patch(
        `/api/institutions/${user2Institution.data.id}`,
        { name: 'Hacked Bank' },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to delete another user\'s institution', async () => {
      // User 1 tries to delete User 2's institution
      const response = await apiClient.delete(
        `/api/institutions/${user2Institution.data.id}`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should only return current user\'s institutions in list', async () => {
      // User 1 gets their institutions
      const response = await apiClient.get('/api/institutions', {
        headers: { Authorization: `Bearer ${user1Token}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      
      // Should only contain User 1's institutions
      const institutionIds = response.data.map((i: any) => i.id);
      expect(institutionIds).toContain(user1Institution.data.id);
      expect(institutionIds).not.toContain(user2Institution.data.id);
    });

    it('should allow user to delete their own institution with cascade', async () => {
      // Create a temporary institution for User 1
      const tempInstitution = await apiClient.post(
        '/api/institutions',
        {
          name: 'Temporary Bank',
          type: 'bank',
          color: '#0000FF',
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );

      // Delete it with cascade
      const response = await apiClient.delete(
        `/api/institutions/${tempInstitution.data.id}?cascade=true`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Account API Security', () => {
    it('should not allow user to access another user\'s account', async () => {
      // User 1 tries to access User 2's account
      const response = await apiClient.get(
        `/api/accounts/${user2Account.data.id}`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to update another user\'s account', async () => {
      // User 1 tries to update User 2's account
      const response = await apiClient.patch(
        `/api/accounts/${user2Account.data.id}`,
        { name: 'Hacked Account' },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to delete another user\'s account', async () => {
      // User 1 tries to delete User 2's account
      const response = await apiClient.delete(
        `/api/accounts/${user2Account.data.id}`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should only return current user\'s accounts in list', async () => {
      // User 1 gets their accounts
      const response = await apiClient.get('/api/accounts', {
        headers: { Authorization: `Bearer ${user1Token}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      
      // Should only contain User 1's accounts
      const accountIds = response.data.map((a: any) => a.id);
      expect(accountIds).toContain(user1Account.data.id);
      expect(accountIds).not.toContain(user2Account.data.id);
    });

    it('should not allow creating account with another user\'s institution', async () => {
      // User 1 tries to create account under User 2's institution
      const response = await apiClient.post(
        '/api/accounts',
        {
          institutionId: user2Institution.data.id,
          name: 'Hacked Account',
          type: 'CHECKING',
          currency: 'USD',
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('Institution not found');
    });
  });

  describe('Account Snapshot API Security', () => {
    it('should not allow user to access snapshots of another user\'s account', async () => {
      // User 1 tries to get snapshots for User 2's account
      const response = await apiClient.get(
        `/api/accounts/${user2Account.data.id}/snapshot`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to create snapshot for another user\'s account', async () => {
      // User 1 tries to create snapshot for User 2's account
      const response = await apiClient.post(
        `/api/accounts/${user2Account.data.id}/snapshot`,
        {
          date: new Date().toISOString(),
          valueOriginal: 1000,
          currency: 'USD',
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });

    it('should not allow user to delete snapshot of another user\'s account', async () => {
      // User 1 tries to delete snapshot for User 2's account
      const response = await apiClient.delete(
        `/api/accounts/${user2Account.data.id}/snapshot?date=${new Date().toISOString()}`,
        {
          headers: { Authorization: `Bearer ${user1Token}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      expect(response.data.error).toContain('not found');
    });
  });

  describe('Registration API', () => {
    it('should create new user without sample data by default', async () => {
      // Register new user without sample data flag
      const response = await apiClient.post('/api/auth/register', {
        email: 'nosample@test.com',
        password: 'password789',
        name: 'No Sample User',
      });

      expect(response.status).toBe(201);
      expect(response.data.sampleDataCreated).toBe(false);

      // Login and check they have no institutions
      const loginResponse = await apiClient.post('/api/auth/signin', {
        email: 'nosample@test.com',
        password: 'password789',
      });
      
      const token = loginResponse.data.token;
      const institutionsResponse = await apiClient.get('/api/institutions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(institutionsResponse.data).toHaveLength(0);

      // Cleanup
      await deleteTestUser(response.data.user.id);
    });

    it('should create sample data when explicitly requested', async () => {
      // Register new user with sample data flag
      const response = await apiClient.post('/api/auth/register?sampleData=true', {
        email: 'withsample@test.com',
        password: 'password789',
        name: 'With Sample User',
      });

      expect(response.status).toBe(201);
      expect(response.data.sampleDataCreated).toBe(true);

      // Login and check they have sample institutions
      const loginResponse = await apiClient.post('/api/auth/signin', {
        email: 'withsample@test.com',
        password: 'password789',
      });
      
      const token = loginResponse.data.token;
      const institutionsResponse = await apiClient.get('/api/institutions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(institutionsResponse.data.length).toBeGreaterThan(0);
      expect(institutionsResponse.data[0].name).toContain('Sample');

      // Cleanup
      await deleteTestUser(response.data.user.id);
    });
  });
});
