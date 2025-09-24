/**
 * Test User Helper Functions
 */

import { prisma } from '../../lib/db/prisma';
import bcrypt from 'bcryptjs';

export async function createTestUser(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0],
      passwordHash,
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(2, 7),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    }
  });
  
  return user;
}

export async function deleteTestUser(userId: string) {
  try {
    // Delete all user data in proper order
    await prisma.accountSnapshot.deleteMany({
      where: {
        account: {
          userId
        }
      }
    });
    
    await prisma.brokerageEntry.deleteMany({
      where: {
        brokerageAccount: {
          userId
        }
      }
    });
    
    await prisma.account.deleteMany({
      where: { userId }
    });
    
    await prisma.institution.deleteMany({
      where: { userId }
    });
    
    await prisma.assetSnapshot.deleteMany({
      where: {
        asset: {
          userId
        }
      }
    });
    
    await prisma.asset.deleteMany({
      where: { userId }
    });
    
    await prisma.user.delete({
      where: { id: userId }
    });
  } catch (error) {
    console.error('Error deleting test user:', error);
  }
}
