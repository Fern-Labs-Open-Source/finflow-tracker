import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDemoData() {
  console.log('🌱 Seeding demo data...')
  
  try {
    // Create institutions
    const bank1 = await prisma.institution.create({
      data: {
        name: 'Deutsche Bank',
        type: 'bank',
        color: '#0018A8',
        displayOrder: 1,
      }
    })

    const bank2 = await prisma.institution.create({
      data: {
        name: 'Commerzbank',
        type: 'bank', 
        color: '#004B3D',
        displayOrder: 2,
      }
    })

    const broker = await prisma.institution.create({
      data: {
        name: 'Trade Republic',
        type: 'broker',
        color: '#FF5100',
        displayOrder: 3,
      }
    })

    const crypto = await prisma.institution.create({
      data: {
        name: 'Coinbase',
        type: 'exchange',
        color: '#0052FF',
        displayOrder: 4,
      }
    })

    console.log('✅ Created 4 institutions')

    // Create accounts
    const checkingAccount = await prisma.account.create({
      data: {
        name: 'Main Checking',
        type: 'CHECKING',
        currency: 'EUR',
        institutionId: bank1.id,
        isActive: true,
        displayOrder: 1,
      }
    })

    const savingsAccount = await prisma.account.create({
      data: {
        name: 'Emergency Fund',
        type: 'CHECKING',  // Using CHECKING as there's no SAVINGS type
        currency: 'EUR',
        institutionId: bank2.id,
        isActive: true,
        displayOrder: 2,
      }
    })

    const investmentAccount = await prisma.account.create({
      data: {
        name: 'Investment Portfolio',
        type: 'INVESTMENT',
        currency: 'EUR',
        institutionId: broker.id,
        isActive: true,
        displayOrder: 3,
      }
    })

    const cryptoAccount = await prisma.account.create({
      data: {
        name: 'Crypto Holdings',
        type: 'INVESTMENT',
        currency: 'EUR',
        institutionId: crypto.id,
        isActive: true,
        displayOrder: 4,
      }
    })

    const gbpAccount = await prisma.account.create({
      data: {
        name: 'UK Account',
        type: 'CHECKING',
        currency: 'GBP',
        institutionId: bank1.id,
        isActive: true,
        displayOrder: 5,
      }
    })

    console.log('✅ Created 5 accounts')

    // Create exchange rates
    const today = new Date()
    await prisma.exchangeRate.createMany({
      data: [
        {
          date: today,
          fromCurrency: 'GBP',
          toCurrency: 'EUR',
          rate: 1.18,
          source: 'ECB'
        },
        {
          date: today,
          fromCurrency: 'EUR',
          toCurrency: 'EUR',
          rate: 1.0,
          source: 'ECB'
        }
      ]
    })

    console.log('✅ Created exchange rates')

    // Create account snapshots for the last 30 days
    const snapshots = []
    const accounts = [
      { account: checkingAccount, baseValue: 12500, volatility: 500 },
      { account: savingsAccount, baseValue: 25000, volatility: 100 },
      { account: investmentAccount, baseValue: 18750, volatility: 2000 },
      { account: cryptoAccount, baseValue: 3500, volatility: 800 },
      { account: gbpAccount, baseValue: 625, volatility: 50, currency: 'GBP' },
    ]

    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      for (const { account, baseValue, volatility, currency = 'EUR' } of accounts) {
        // Add some random variation
        const variation = (Math.random() - 0.5) * 2 * volatility
        const value = Math.max(0, baseValue + variation + (29 - i) * (volatility * 0.1))
        
        const exchangeRate = currency === 'GBP' ? 1.18 : 1.0
        
        snapshots.push({
          accountId: account.id,
          date,
          valueOriginal: Math.round(value * 100) / 100,
          currency: currency as any,
          valueEur: Math.round(value * exchangeRate * 100) / 100,
          exchangeRate,
          notes: i === 0 ? 'Latest snapshot' : null,
        })
      }
    }

    await prisma.accountSnapshot.createMany({
      data: snapshots
    })

    console.log(`✅ Created ${snapshots.length} account snapshots`)

    // Get summary
    const accountCount = await prisma.account.count()
    const snapshotCount = await prisma.accountSnapshot.count()
    
    const latestSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        date: today
      },
      include: {
        account: true
      }
    })

    const totalValue = latestSnapshots.reduce((sum, s) => sum + Number(s.valueEur), 0)

    console.log('\n📊 Demo Data Summary:')
    console.log(`   - Institutions: 4`)
    console.log(`   - Accounts: ${accountCount}`)
    console.log(`   - Snapshots: ${snapshotCount}`)
    console.log(`   - Total Portfolio Value: €${totalValue.toFixed(2)}`)
    console.log('\n✨ Demo data seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedDemoData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
