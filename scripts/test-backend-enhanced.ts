#!/usr/bin/env node

/**
 * Enhanced Backend Testing Script
 * Tests all API endpoints with improved error handling and validation
 */

import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import colors from 'colors';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  message?: string;
  error?: any;
}

class EnhancedBackendTester {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private testUserId: string = '';
  private createdIds = {
    institutions: [] as string[],
    accounts: [] as string[],
  };

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Bypass-Auth': 'test-mode',
      },
      validateStatus: () => true, // Don't throw on error status codes
    });
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const prefix = {
      info: '📘',
      success: '✅',
      error: '❌',
      warn: '⚠️'
    }[type];
    
    const colorFn = {
      info: colors.cyan,
      success: colors.green,
      error: colors.red,
      warn: colors.yellow
    }[type];
    
    console.log(colorFn(`${prefix} ${message}`));
  }

  private addResult(endpoint: string, method: string, status: 'PASS' | 'FAIL', message?: string, error?: any) {
    this.results.push({ endpoint, method, status, message, error });
    const icon = status === 'PASS' ? '✅' : '❌';
    const color = status === 'PASS' ? colors.green : colors.red;
    console.log(color(`  ${icon} ${method} ${endpoint}${message ? ': ' + message : ''}`));
    if (error && process.env.DEBUG) {
      console.error('    Error:', error);
    }
  }

  async setupTestData() {
    this.log('Setting up test data...', 'info');
    
    // Clean existing test data
    await prisma.accountSnapshot.deleteMany({});
    await prisma.brokerageEntry.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.institution.deleteMany({});
    await prisma.exchangeRate.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: hashedPassword,
      },
    });
    this.testUserId = user.id;
    
    this.log('Test data setup complete', 'success');
  }

  async testInstitutionDeletion() {
    this.log('\n🏦 Testing Enhanced Institution Deletion...', 'info');
    
    // Create an institution
    let institutionId = '';
    try {
      const createRes = await this.api.post('/api/institutions', {
        name: 'Test Bank for Deletion',
        type: 'bank',
        color: '#FF5733',
      });
      
      if (createRes.status === 201 || createRes.status === 200) {
        institutionId = createRes.data.id;
        this.createdIds.institutions.push(institutionId);
        this.addResult('/api/institutions', 'POST', 'PASS', 'Created institution for deletion test');
      } else {
        this.addResult('/api/institutions', 'POST', 'FAIL', `Status ${createRes.status}`);
        return;
      }
    } catch (error: any) {
      this.addResult('/api/institutions', 'POST', 'FAIL', 'Create failed', error.message);
      return;
    }
    
    // Create accounts in this institution
    let accountId = '';
    try {
      const accountRes = await this.api.post('/api/accounts', {
        institutionId,
        name: 'Test Account for Deletion',
        type: 'CHECKING',
        currency: 'EUR',
      });
      
      if (accountRes.status === 201 || accountRes.status === 200) {
        accountId = accountRes.data.id;
        this.createdIds.accounts.push(accountId);
        this.addResult('/api/accounts', 'POST', 'PASS', 'Created account in institution');
      }
    } catch (error: any) {
      this.addResult('/api/accounts', 'POST', 'FAIL', 'Account create failed', error.message);
    }
    
    // Test 1: Try to delete institution without cascade (should fail with detailed error)
    try {
      const deleteRes = await this.api.delete(`/api/institutions/${institutionId}`);
      
      if (deleteRes.status === 400) {
        const error = deleteRes.data;
        if (error.accountCount && error.accounts) {
          this.addResult(
            `/api/institutions/${institutionId}`,
            'DELETE',
            'PASS',
            'Correctly prevented deletion with detailed error info'
          );
          console.log(colors.gray(`    → Error details: ${error.message}`));
          console.log(colors.gray(`    → Accounts: ${error.accounts.map((a: any) => a.name).join(', ')}`));
        } else {
          this.addResult(
            `/api/institutions/${institutionId}`,
            'DELETE',
            'FAIL',
            'Missing detailed error information'
          );
        }
      } else {
        this.addResult(
          `/api/institutions/${institutionId}`,
          'DELETE',
          'FAIL',
          `Expected 400, got ${deleteRes.status}`
        );
      }
    } catch (error: any) {
      this.addResult(`/api/institutions/${institutionId}`, 'DELETE', 'FAIL', 'Delete test failed', error.message);
    }
    
    // Test 2: Delete with cascade option (should succeed)
    try {
      const cascadeDeleteRes = await this.api.delete(`/api/institutions/${institutionId}?cascade=true`);
      
      if (cascadeDeleteRes.status === 200) {
        const result = cascadeDeleteRes.data;
        if (result.success && result.message) {
          this.addResult(
            `/api/institutions/${institutionId}?cascade=true`,
            'DELETE',
            'PASS',
            'Cascade deletion successful'
          );
          console.log(colors.gray(`    → ${result.message}`));
        } else {
          this.addResult(
            `/api/institutions/${institutionId}?cascade=true`,
            'DELETE',
            'PASS',
            'Deletion successful but missing message'
          );
        }
        
        // Verify deletion
        const checkRes = await this.api.get(`/api/institutions/${institutionId}`);
        if (checkRes.status === 404) {
          this.addResult(
            `/api/institutions/${institutionId}`,
            'GET',
            'PASS',
            'Institution correctly deleted'
          );
        }
      } else {
        this.addResult(
          `/api/institutions/${institutionId}?cascade=true`,
          'DELETE',
          'FAIL',
          `Status ${cascadeDeleteRes.status}`
        );
      }
    } catch (error: any) {
      this.addResult(
        `/api/institutions/${institutionId}?cascade=true`,
        'DELETE',
        'FAIL',
        'Cascade delete failed',
        error.message
      );
    }
  }

  async testValidationErrors() {
    this.log('\n🔍 Testing Enhanced Validation Error Messages...', 'info');
    
    // Test 1: Missing required fields in account creation
    try {
      const res = await this.api.post('/api/accounts', {
        // Missing: institutionId, name, type, currency
      });
      
      if (res.status === 400) {
        const error = res.data;
        if (error.fieldErrors && error.message) {
          this.addResult(
            '/api/accounts',
            'POST',
            'PASS',
            'Validation errors are detailed'
          );
          console.log(colors.gray(`    → Message: ${error.message}`));
          console.log(colors.gray(`    → Field errors: ${JSON.stringify(error.fieldErrors, null, 2)}`));
        } else {
          this.addResult(
            '/api/accounts',
            'POST',
            'FAIL',
            'Missing detailed validation errors'
          );
        }
      } else {
        this.addResult('/api/accounts', 'POST', 'FAIL', `Expected 400, got ${res.status}`);
      }
    } catch (error: any) {
      this.addResult('/api/accounts', 'POST', 'FAIL', 'Validation test failed', error.message);
    }
    
    // Test 2: Invalid field values
    try {
      const res = await this.api.post('/api/accounts', {
        institutionId: 'not-a-uuid',
        name: '', // Empty string (too short)
        type: 'INVALID_TYPE',
        currency: 'INVALID_CURRENCY',
      });
      
      if (res.status === 400) {
        const error = res.data;
        if (error.fieldErrors) {
          const hasUuidError = error.fieldErrors.institutionId?.some((e: string) => 
            e.toLowerCase().includes('uuid')
          );
          const hasNameError = error.fieldErrors.name?.some((e: string) => 
            e.toLowerCase().includes('character') || e.toLowerCase().includes('required')
          );
          const hasTypeError = error.fieldErrors.type?.some((e: string) => 
            e.toLowerCase().includes('one of')
          );
          
          if (hasUuidError && hasNameError && hasTypeError) {
            this.addResult(
              '/api/accounts',
              'POST',
              'PASS',
              'Field-specific validation errors work correctly'
            );
          } else {
            this.addResult(
              '/api/accounts',
              'POST',
              'WARN',
              'Some validation messages could be improved'
            );
          }
        }
      }
    } catch (error: any) {
      this.addResult('/api/accounts', 'POST', 'FAIL', 'Invalid values test failed', error.message);
    }
    
    // Test 3: Institution color validation
    try {
      const res = await this.api.post('/api/institutions', {
        name: 'Test Institution',
        color: 'not-a-hex-color', // Should fail regex validation
      });
      
      if (res.status === 400) {
        const error = res.data;
        if (error.fieldErrors?.color) {
          const hasColorError = error.fieldErrors.color.some((e: string) => 
            e.toLowerCase().includes('hex') || e.toLowerCase().includes('color')
          );
          if (hasColorError) {
            this.addResult(
              '/api/institutions',
              'POST',
              'PASS',
              'Color validation provides helpful message'
            );
          }
        }
      }
    } catch (error: any) {
      this.addResult('/api/institutions', 'POST', 'FAIL', 'Color validation test failed', error.message);
    }
  }

  async testCacheHeaders() {
    this.log('\n⚡ Testing Cache Headers...', 'info');
    
    // Test GET accounts endpoint for cache headers
    try {
      const res = await this.api.get('/api/accounts');
      
      const cacheControl = res.headers['cache-control'];
      if (cacheControl) {
        if (cacheControl.includes('max-age')) {
          this.addResult(
            '/api/accounts',
            'GET',
            'PASS',
            `Cache headers present: ${cacheControl}`
          );
        } else {
          this.addResult(
            '/api/accounts',
            'GET',
            'WARN',
            'Cache-Control header present but might need tuning'
          );
        }
      } else {
        this.addResult(
          '/api/accounts',
          'GET',
          'FAIL',
          'No cache headers found'
        );
      }
    } catch (error: any) {
      this.addResult('/api/accounts', 'GET', 'FAIL', 'Cache header test failed', error.message);
    }
  }

  async testPerformance() {
    this.log('\n🚀 Testing Performance Improvements...', 'info');
    
    // Create multiple test accounts to test performance with larger datasets
    const institutionId = this.createdIds.institutions[0];
    if (!institutionId) {
      // Create a test institution first
      const res = await this.api.post('/api/institutions', {
        name: 'Performance Test Bank',
        type: 'bank',
      });
      if (res.status === 201 || res.status === 200) {
        this.createdIds.institutions.push(res.data.id);
      }
    }
    
    // Measure response time for list endpoints
    const startTime = Date.now();
    const res = await this.api.get('/api/accounts');
    const responseTime = Date.now() - startTime;
    
    if (responseTime < 500) {
      this.addResult(
        '/api/accounts',
        'GET',
        'PASS',
        `Fast response time: ${responseTime}ms`
      );
    } else if (responseTime < 1000) {
      this.addResult(
        '/api/accounts',
        'GET',
        'WARN',
        `Acceptable response time: ${responseTime}ms`
      );
    } else {
      this.addResult(
        '/api/accounts',
        'GET',
        'FAIL',
        `Slow response time: ${responseTime}ms`
      );
    }
  }

  async cleanup() {
    this.log('\n🧹 Cleaning up test data...', 'info');
    
    try {
      // Clean up in reverse order of dependencies
      await prisma.accountSnapshot.deleteMany({});
      await prisma.brokerageEntry.deleteMany({});
      await prisma.account.deleteMany({});
      await prisma.institution.deleteMany({});
      await prisma.user.deleteMany({});
      
      this.log('Cleanup complete', 'success');
    } catch (error) {
      this.log('Cleanup failed: ' + error, 'error');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    this.log('TEST SUMMARY', 'info');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(colors.cyan(`Total Tests: ${total}`));
    console.log(colors.green(`Passed: ${passed}`));
    console.log(colors.red(`Failed: ${failed}`));
    console.log(colors.yellow(`Success Rate: ${((passed/total)*100).toFixed(1)}%`));
    
    if (failed > 0) {
      console.log('\n' + colors.red('Failed Tests:'));
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(colors.red(`  - ${r.method} ${r.endpoint}: ${r.message || 'No message'}`));
        });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  async run() {
    console.log(colors.cyan.bold('\n🧪 Enhanced Backend Test Suite\n'));
    console.log('='.repeat(60));
    
    try {
      await this.setupTestData();
      await this.testInstitutionDeletion();
      await this.testValidationErrors();
      await this.testCacheHeaders();
      await this.testPerformance();
      await this.cleanup();
      this.printSummary();
      
      process.exit(this.results.filter(r => r.status === 'FAIL').length > 0 ? 1 : 0);
    } catch (error) {
      console.error(colors.red('Test suite failed:'), error);
      process.exit(1);
    }
  }
}

// Run the tests
const tester = new EnhancedBackendTester();
tester.run();
