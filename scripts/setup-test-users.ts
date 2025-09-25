/**
 * Setup test users for multi-user testing
 * This script creates test users directly in the database for testing purposes
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupTestUsers() {
  console.log('🔧 Setting up test users...');
  
  const testUsers = [
    { 
      id: 'user-alice',
      email: 'alice@test.com',
      name: 'Alice Test',
      username: 'alice_test',
    },
    {
      id: 'user-bob',
      email: 'bob@test.com', 
      name: 'Bob Test',
      username: 'bob_test',
    },
    {
      id: 'test-user-1',
      email: 'test1@test.com',
      name: 'Test User 1',
      username: 'test_user_1',
    },
    {
      id: 'test-user-2',
      email: 'test2@test.com',
      name: 'Test User 2',
      username: 'test_user_2',
    },
    {
      id: 'test-user-new',
      email: 'new@test.com',
      name: 'New Test User',
      username: 'test_user_new',
    },
  ];
  
  // Default password for all test users
  const passwordHash = await bcrypt.hash('testpassword123', 12);
  
  for (const userData of testUsers) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id: userData.id }
      });
      
      if (existing) {
        console.log(`✓ User ${userData.email} already exists`);
        continue;
      }
      
      // Create user
      await prisma.user.create({
        data: {
          ...userData,
          passwordHash,
          emailVerified: new Date(), // Mark as verified
        }
      });
      
      console.log(`✅ Created test user: ${userData.email}`);
    } catch (error) {
      // Try to update if ID exists but with different email
      try {
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {
            id: userData.id,
            name: userData.name,
            username: userData.username,
          },
          create: {
            ...userData,
            passwordHash,
            emailVerified: new Date(),
          }
        });
        console.log(`✅ Upserted test user: ${userData.email}`);
      } catch (upsertError) {
        console.error(`❌ Failed to create user ${userData.email}:`, upsertError);
      }
    }
  }
  
  console.log('✅ Test users setup complete!');
}

setupTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
