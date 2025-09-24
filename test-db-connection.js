const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user table exists
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible, ${userCount} users found`);
    
    // Test creating a user
    const testEmail = `test${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);
    
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        username: `testuser${Date.now()}`,
      }
    });
    
    console.log('✅ User created successfully:', newUser.email);
    
    // Clean up
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
