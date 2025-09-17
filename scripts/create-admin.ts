#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  console.log('=== FinFlow Tracker Admin User Creation ===\n');

  try {
    // Check if any user exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const overwrite = await question(
        `${userCount} user(s) already exist. Do you want to create another user? (y/N): `
      );
      if (overwrite.toLowerCase() !== 'y') {
        console.log('User creation cancelled.');
        process.exit(0);
      }
    }

    // Get username
    let username = await question('Enter admin username (default: admin): ');
    username = username.trim() || 'admin';

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.error(`Error: User '${username}' already exists.`);
      process.exit(1);
    }

    // Get password
    let password = await question('Enter admin password (min 8 characters): ');
    while (password.length < 8) {
      console.log('Password must be at least 8 characters long.');
      password = await question('Enter admin password (min 8 characters): ');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   ID: ${user.id}`);
    console.log(`\nYou can now login with these credentials.`);

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script
createAdminUser();
