#!/usr/bin/env node

/**
 * Seed Database with Test Data
 * Creates realistic test data for development
 */

import { PrismaClient, Currency, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.accountSnapshot.deleteMany();
    await prisma.brokerageEntry.deleteMany();
    await prisma.account.deleteMany();
    await prisma.institution.deleteMany();
    await prisma.exchangeRate.deleteMany();
    await prisma.user.deleteMany();

    // Create user
    console.log('👤 Creating user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'demo',
        passwordHash: hashedPassword,
      },
    });
    console.log('  Created user: demo (password: demo123)');

    // Create institutions
    console.log('\n🏦 Creating institutions...');
    const institutions = await Promise.all([
      prisma.institution.create({
        data: {
          name: 'Revolut',
          type: 'bank',
          color: '#0666eb',
          displayOrder: 1,
        },
      }),
      prisma.institution.create({
        data: {
          name: 'Wise',
          type: 'bank',
          color: '#9fe870',
          displayOrder: 2,
        },
      }),
      prisma.institution.create({
        data: {
          name: 'Interactive Brokers',
          type: 'brokerage',
          color: '#d8232a',
          displayOrder: 3,
        },
      }),
      prisma.institution.create({
        data: {
          name: 'Vanguard',
          type: 'investment',
          color: '#852828',
          displayOrder: 4,
        },
      }),
    ]);
    console.log(`  Created ${institutions.length} institutions`);

    // Create accounts
    console.log('\n💳 Creating accounts...');
    const accounts = await Promise.all([
      // Revolut accounts
      prisma.account.create({
        data: {
          institutionId: institutions[0].id,
          name: 'Revolut EUR',
          type: AccountType.CHECKING,
          currency: Currency.EUR,
          displayOrder: 1,
          isActive: true,
        },
      }),
      prisma.account.create({
        data: {
          institutionId: institutions[0].id,
          name: 'Revolut GBP',
          type: AccountType.CHECKING,
          currency: Currency.GBP,
          displayOrder: 2,
          isActive: true,
        },
      }),
      // Wise account
      prisma.account.create({
        data: {
          institutionId: institutions[1].id,
          name: 'Wise Multi-Currency',
          type: AccountType.CHECKING,
          currency: Currency.EUR,
          displayOrder: 3,
          isActive: true,
        },
      }),
      // Interactive Brokers
      prisma.account.create({
        data: {
          institutionId: institutions[2].id,
          name: 'IBKR Trading',
          type: AccountType.BROKERAGE_TOTAL,
          currency: Currency.EUR,
          displayOrder: 4,
          isActive: true,
        },
      }),
      // Vanguard
      prisma.account.create({
        data: {
          institutionId: institutions[3].id,
          name: 'Vanguard S&P 500',
          type: AccountType.INVESTMENT,
          currency: Currency.EUR,
          displayOrder: 5,
          isActive: true,
        },
      }),
    ]);
    console.log(`  Created ${accounts.length} accounts`);

    // Create account snapshots with realistic data
    console.log('\n📊 Creating account snapshots...');
    const today = new Date();
    const snapshots = [];

    // Generate 30 days of historical data
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      // Revolut EUR - Growing from 5000 to 7500
      snapshots.push({
        accountId: accounts[0].id,
        date,
        valueOriginal: new Decimal(5000 + (2500 * (30 - daysAgo) / 30) + Math.random() * 200 - 100),
        valueEur: new Decimal(5000 + (2500 * (30 - daysAgo) / 30) + Math.random() * 200 - 100),
        currency: Currency.EUR,
      });

      // Revolut GBP - Stable around 2000
      const gbpValue = 2000 + Math.random() * 100 - 50;
      snapshots.push({
        accountId: accounts[1].id,
        date,
        valueOriginal: new Decimal(gbpValue),
        valueEur: new Decimal(gbpValue * 1.16), // Approximate EUR conversion
        currency: Currency.GBP,
      });

      // Wise - Growing from 3000 to 4000
      snapshots.push({
        accountId: accounts[2].id,
        date,
        valueOriginal: new Decimal(3000 + (1000 * (30 - daysAgo) / 30) + Math.random() * 100 - 50),
        valueEur: new Decimal(3000 + (1000 * (30 - daysAgo) / 30) + Math.random() * 100 - 50),
        currency: Currency.EUR,
      });

      // IBKR - Growing with volatility from 15000 to 18000
      const ibkrValue = 15000 + (3000 * (30 - daysAgo) / 30) + Math.random() * 1000 - 500;
      snapshots.push({
        accountId: accounts[3].id,
        date,
        valueOriginal: new Decimal(ibkrValue),
        valueEur: new Decimal(ibkrValue),
        currency: Currency.EUR,
      });

      // Vanguard - Steady growth from 25000 to 28000
      const vanguardValue = 25000 + (3000 * (30 - daysAgo) / 30) + Math.random() * 500 - 250;
      snapshots.push({
        accountId: accounts[4].id,
        date,
        valueOriginal: new Decimal(vanguardValue),
        valueEur: new Decimal(vanguardValue),
        currency: Currency.EUR,
      });
    }

    await prisma.accountSnapshot.createMany({
      data: snapshots,
    });
    console.log(`  Created ${snapshots.length} snapshots`);

    // Create exchange rates
    console.log('\n💱 Creating exchange rates...');
    const exchangeRates = [];
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      // EUR to GBP
      exchangeRates.push({
        date,
        fromCurrency: Currency.EUR,
        toCurrency: Currency.GBP,
        rate: new Decimal(0.86 + Math.random() * 0.02 - 0.01),
      });

      // EUR to SEK
      exchangeRates.push({
        date,
        fromCurrency: Currency.EUR,
        toCurrency: Currency.SEK,
        rate: new Decimal(11.5 + Math.random() * 0.3 - 0.15),
      });

      // GBP to EUR
      exchangeRates.push({
        date,
        fromCurrency: Currency.GBP,
        toCurrency: Currency.EUR,
        rate: new Decimal(1.16 + Math.random() * 0.02 - 0.01),
      });
    }

    await prisma.exchangeRate.createMany({
      data: exchangeRates,
    });
    console.log(`  Created ${exchangeRates.length} exchange rates`);

    // Create brokerage entries for IBKR
    console.log('\n📈 Creating brokerage entries...');
    const brokerageEntries = [];
    for (let daysAgo = 30; daysAgo >= 0; daysAgo -= 7) { // Weekly updates
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      const totalValue = 15000 + (3000 * (30 - daysAgo) / 30);
      const cashValue = totalValue * 0.1; // 10% cash

      brokerageEntries.push({
        brokerageAccountId: accounts[3].id, // IBKR
        date,
        totalValue: new Decimal(totalValue),
        cashValue: new Decimal(cashValue),
        currency: Currency.EUR,
      });
    }

    await prisma.brokerageEntry.createMany({
      data: brokerageEntries,
    });
    console.log(`  Created ${brokerageEntries.length} brokerage entries`);

    // Print summary
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`  • 1 user (demo/demo123)`);
    console.log(`  • ${institutions.length} institutions`);
    console.log(`  • ${accounts.length} accounts`);
    console.log(`  • ${snapshots.length} account snapshots`);
    console.log(`  • ${exchangeRates.length} exchange rates`);
    console.log(`  • ${brokerageEntries.length} brokerage entries`);
    
    // Calculate current portfolio value
    const latestSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        date: today,
      },
      select: {
        valueEur: true,
      },
    });
    
    const totalValue = latestSnapshots.reduce(
      (sum, snapshot) => sum.add(snapshot.valueEur),
      new Decimal(0)
    );
    
    console.log(`\n💰 Current portfolio value: €${totalValue.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
