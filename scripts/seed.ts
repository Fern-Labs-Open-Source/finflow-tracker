#!/usr/bin/env node

import { PrismaClient, Currency, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
    },
  });
  console.log('✅ Created admin user');

  // Create institutions
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { name: 'HSBC UK' },
      update: {},
      create: {
        name: 'HSBC UK',
        type: 'bank',
        color: '#ee0005',
        displayOrder: 1,
      },
    }),
    prisma.institution.upsert({
      where: { name: 'Revolut' },
      update: {},
      create: {
        name: 'Revolut',
        type: 'bank',
        color: '#191c1f',
        displayOrder: 2,
      },
    }),
    prisma.institution.upsert({
      where: { name: 'Interactive Brokers' },
      update: {},
      create: {
        name: 'Interactive Brokers',
        type: 'brokerage',
        color: '#d81e2a',
        displayOrder: 3,
      },
    }),
    prisma.institution.upsert({
      where: { name: 'Nordea' },
      update: {},
      create: {
        name: 'Nordea',
        type: 'bank',
        color: '#0000a0',
        displayOrder: 4,
      },
    }),
  ]);
  console.log('✅ Created institutions');

  // Create accounts
  const hsbcAccount = await prisma.account.create({
    data: {
      institutionId: institutions[0].id,
      name: 'Current Account',
      type: AccountType.CHECKING,
      currency: Currency.GBP,
      displayOrder: 1,
    },
  });

  const revolutEurAccount = await prisma.account.create({
    data: {
      institutionId: institutions[1].id,
      name: 'EUR Account',
      type: AccountType.CHECKING,
      currency: Currency.EUR,
      displayOrder: 1,
    },
  });

  const revolutGbpAccount = await prisma.account.create({
    data: {
      institutionId: institutions[1].id,
      name: 'GBP Account',
      type: AccountType.CHECKING,
      currency: Currency.GBP,
      displayOrder: 2,
    },
  });

  const ibkrAccount = await prisma.account.create({
    data: {
      institutionId: institutions[2].id,
      name: 'Brokerage Account',
      type: AccountType.BROKERAGE_TOTAL,
      currency: Currency.EUR,
      displayOrder: 1,
    },
  });

  const nordeaAccount = await prisma.account.create({
    data: {
      institutionId: institutions[3].id,
      name: 'Savings Account',
      type: AccountType.CHECKING,
      currency: Currency.SEK,
      displayOrder: 1,
    },
  });
  console.log('✅ Created accounts');

  // Create sample exchange rates
  const today = new Date();
  const exchangeRates = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    exchangeRates.push(
      // EUR to GBP
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'EUR',
            toCurrency: 'GBP',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'EUR',
          toCurrency: 'GBP',
          rate: new Decimal(0.86 + Math.random() * 0.02),
        },
      }),
      // EUR to SEK
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'EUR',
            toCurrency: 'SEK',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'EUR',
          toCurrency: 'SEK',
          rate: new Decimal(11.4 + Math.random() * 0.2),
        },
      }),
      // GBP to EUR
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'GBP',
            toCurrency: 'EUR',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'GBP',
          toCurrency: 'EUR',
          rate: new Decimal(1.16 + Math.random() * 0.02),
        },
      }),
      // GBP to SEK
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'GBP',
            toCurrency: 'SEK',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'GBP',
          toCurrency: 'SEK',
          rate: new Decimal(13.3 + Math.random() * 0.2),
        },
      }),
      // SEK to EUR
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'SEK',
            toCurrency: 'EUR',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'SEK',
          toCurrency: 'EUR',
          rate: new Decimal(0.087 + Math.random() * 0.001),
        },
      }),
      // SEK to GBP
      prisma.exchangeRate.upsert({
        where: {
          date_fromCurrency_toCurrency: {
            date,
            fromCurrency: 'SEK',
            toCurrency: 'GBP',
          },
        },
        update: {},
        create: {
          date,
          fromCurrency: 'SEK',
          toCurrency: 'GBP',
          rate: new Decimal(0.075 + Math.random() * 0.001),
        },
      })
    );
  }
  await Promise.all(exchangeRates);
  console.log('✅ Created exchange rates');

  // Create sample snapshots
  const snapshots = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // HSBC snapshot
    const hsbcValue = new Decimal(5000 + Math.random() * 500);
    const gbpToEur = await prisma.exchangeRate.findUnique({
      where: {
        date_fromCurrency_toCurrency: {
          date,
          fromCurrency: 'GBP',
          toCurrency: 'EUR',
        },
      },
    });
    snapshots.push(
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: hsbcAccount.id,
            date,
          },
        },
        update: {},
        create: {
          accountId: hsbcAccount.id,
          date,
          valueOriginal: hsbcValue,
          currency: Currency.GBP,
          valueEur: hsbcValue.mul(gbpToEur?.rate || new Decimal(1.16)),
          exchangeRate: gbpToEur?.rate || new Decimal(1.16),
        },
      })
    );

    // Revolut EUR snapshot
    const revolutEurValue = new Decimal(3000 + Math.random() * 200);
    snapshots.push(
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: revolutEurAccount.id,
            date,
          },
        },
        update: {},
        create: {
          accountId: revolutEurAccount.id,
          date,
          valueOriginal: revolutEurValue,
          currency: Currency.EUR,
          valueEur: revolutEurValue,
          exchangeRate: new Decimal(1),
        },
      })
    );

    // Revolut GBP snapshot
    const revolutGbpValue = new Decimal(1500 + Math.random() * 100);
    snapshots.push(
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: revolutGbpAccount.id,
            date,
          },
        },
        update: {},
        create: {
          accountId: revolutGbpAccount.id,
          date,
          valueOriginal: revolutGbpValue,
          currency: Currency.GBP,
          valueEur: revolutGbpValue.mul(gbpToEur?.rate || new Decimal(1.16)),
          exchangeRate: gbpToEur?.rate || new Decimal(1.16),
        },
      })
    );

    // IBKR brokerage snapshot
    const ibkrTotal = new Decimal(25000 + Math.random() * 2000 + i * 50);
    const ibkrCash = new Decimal(2000 + Math.random() * 500);
    snapshots.push(
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: ibkrAccount.id,
            date,
          },
        },
        update: {},
        create: {
          accountId: ibkrAccount.id,
          date,
          valueOriginal: ibkrTotal,
          currency: Currency.EUR,
          valueEur: ibkrTotal,
          exchangeRate: new Decimal(1),
        },
      })
    );

    // Also create brokerage entry
    snapshots.push(
      prisma.brokerageEntry.upsert({
        where: {
          brokerageAccountId_date: {
            brokerageAccountId: ibkrAccount.id,
            date,
          },
        },
        update: {},
        create: {
          brokerageAccountId: ibkrAccount.id,
          date,
          totalValue: ibkrTotal,
          cashValue: ibkrCash,
          currency: Currency.EUR,
        },
      })
    );

    // Nordea SEK snapshot
    const nordeaValue = new Decimal(50000 + Math.random() * 5000);
    const sekToEur = await prisma.exchangeRate.findUnique({
      where: {
        date_fromCurrency_toCurrency: {
          date,
          fromCurrency: 'SEK',
          toCurrency: 'EUR',
        },
      },
    });
    snapshots.push(
      prisma.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: nordeaAccount.id,
            date,
          },
        },
        update: {},
        create: {
          accountId: nordeaAccount.id,
          date,
          valueOriginal: nordeaValue,
          currency: Currency.SEK,
          valueEur: nordeaValue.mul(sekToEur?.rate || new Decimal(0.087)),
          exchangeRate: sekToEur?.rate || new Decimal(0.087),
        },
      })
    );
  }
  await Promise.all(snapshots);
  console.log('✅ Created account snapshots');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
