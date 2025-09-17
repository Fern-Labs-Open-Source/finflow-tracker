#!/usr/bin/env node

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    // Clean up and create test user
    await prisma.user.deleteMany({});
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: hashedPassword,
      },
    });
    console.log('✅ Created test user:', user.username);
    
    // Test signin endpoint
    console.log('\n📝 Testing sign-in endpoint...');
    const signInRes = await axios.post(`${BASE_URL}/api/auth/signin`, {
      username: 'testuser',
      password: 'testpass123',
    }, {
      validateStatus: () => true,
      withCredentials: true,
    });
    
    console.log('Sign-in response status:', signInRes.status);
    console.log('Sign-in response headers:', signInRes.headers);
    console.log('Sign-in response data:', signInRes.data);
    
    // Test the NextAuth signin page
    console.log('\n📝 Testing NextAuth callback...');
    const callbackRes = await axios.post(
      `${BASE_URL}/api/auth/callback/credentials`,
      new URLSearchParams({
        username: 'testuser',
        password: 'testpass123',
        csrfToken: 'test',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        validateStatus: () => true,
        withCredentials: true,
        maxRedirects: 0,
      }
    );
    
    console.log('Callback response status:', callbackRes.status);
    console.log('Callback response headers:', callbackRes.headers);
    
    // Test session endpoint
    console.log('\n📝 Testing session endpoint...');
    const sessionRes = await axios.get(`${BASE_URL}/api/auth/session`, {
      validateStatus: () => true,
    });
    
    console.log('Session response status:', sessionRes.status);
    console.log('Session response data:', sessionRes.data);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth().catch(console.error);
