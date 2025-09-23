import { prisma } from '../db/prisma';
import { AccountType, Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ExchangeRateService } from './exchange-rate.service';

export class BrokerageService {
  /**
   * Process a brokerage entry and create/update snapshots for derived accounts
   */
  static async processBrokerageEntry(
    brokerageAccountId: string,
    date: Date,
    totalValue: number | Decimal,
    cashValue: number | Decimal,
    currency: Currency
  ) {
    // Start a transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // Get the brokerage account with its child accounts
      const brokerageAccount = await tx.account.findUnique({
        where: { id: brokerageAccountId },
        include: {
          childAccounts: true,
        },
      });

      if (!brokerageAccount) {
        throw new Error('Brokerage account not found');
      }

      if (brokerageAccount.type !== AccountType.BROKERAGE_TOTAL) {
        throw new Error('Account is not a brokerage account');
      }

      const decimalTotal = new Decimal(totalValue.toString());
      const decimalCash = new Decimal(cashValue.toString());
      const investmentValue = decimalTotal.sub(decimalCash);

      // Create or update the brokerage entry
      const entry = await tx.brokerageEntry.upsert({
        where: {
          brokerageAccountId_date: {
            brokerageAccountId,
            date,
          },
        },
        create: {
          brokerageAccountId,
          date,
          totalValue: decimalTotal,
          cashValue: decimalCash,
          currency,
        },
        update: {
          totalValue: decimalTotal,
          cashValue: decimalCash,
          currency,
        },
      });

      // Convert to EUR for normalized storage
      const exchangeRate = await ExchangeRateService.getExchangeRate(
        date,
        currency,
        Currency.EUR
      );

      const totalValueEur = decimalTotal.mul(exchangeRate);
      const cashValueEur = decimalCash.mul(exchangeRate);
      const investmentValueEur = investmentValue.mul(exchangeRate);

      // Update snapshot for the main brokerage account
      await tx.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: brokerageAccountId,
            date,
          },
        },
        create: {
          accountId: brokerageAccountId,
          date,
          valueOriginal: decimalTotal,
          currency,
          valueEur: totalValueEur,
          exchangeRate,
        },
        update: {
          valueOriginal: decimalTotal,
          currency,
          valueEur: totalValueEur,
          exchangeRate,
        },
      });

      // Find or create derived accounts
      let cashAccount = brokerageAccount.childAccounts.find(
        (acc) => acc.type === AccountType.BROKERAGE_CASH
      );

      let investmentAccount = brokerageAccount.childAccounts.find(
        (acc) => acc.type === AccountType.BROKERAGE_INVESTMENT
      );

      // Create cash account if it doesn't exist
      if (!cashAccount) {
        cashAccount = await tx.account.create({
          data: {
            userId: brokerageAccount.userId,
            institutionId: brokerageAccount.institutionId,
            name: `${brokerageAccount.name} - Cash`,
            type: AccountType.BROKERAGE_CASH,
            currency: brokerageAccount.currency,
            isDerived: true,
            parentAccountId: brokerageAccountId,
            displayOrder: brokerageAccount.displayOrder + 1,
            isActive: brokerageAccount.isActive,
          },
        });
      }

      // Create investment account if it doesn't exist
      if (!investmentAccount) {
        investmentAccount = await tx.account.create({
          data: {
            userId: brokerageAccount.userId,
            institutionId: brokerageAccount.institutionId,
            name: `${brokerageAccount.name} - Investments`,
            type: AccountType.BROKERAGE_INVESTMENT,
            currency: brokerageAccount.currency,
            isDerived: true,
            parentAccountId: brokerageAccountId,
            displayOrder: brokerageAccount.displayOrder + 2,
            isActive: brokerageAccount.isActive,
          },
        });
      }

      // Create snapshots for derived accounts
      await tx.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: cashAccount.id,
            date,
          },
        },
        create: {
          accountId: cashAccount.id,
          date,
          valueOriginal: decimalCash,
          currency,
          valueEur: cashValueEur,
          exchangeRate,
        },
        update: {
          valueOriginal: decimalCash,
          currency,
          valueEur: cashValueEur,
          exchangeRate,
        },
      });

      await tx.accountSnapshot.upsert({
        where: {
          accountId_date: {
            accountId: investmentAccount.id,
            date,
          },
        },
        create: {
          accountId: investmentAccount.id,
          date,
          valueOriginal: investmentValue,
          currency,
          valueEur: investmentValueEur,
          exchangeRate,
        },
        update: {
          valueOriginal: investmentValue,
          currency,
          valueEur: investmentValueEur,
          exchangeRate,
        },
      });

      return {
        entry,
        accounts: {
          total: brokerageAccount,
          cash: cashAccount,
          investment: investmentAccount,
        },
        snapshots: {
          total: { value: decimalTotal, valueEur: totalValueEur },
          cash: { value: decimalCash, valueEur: cashValueEur },
          investment: { value: investmentValue, valueEur: investmentValueEur },
        },
      };
    });
  }

  /**
   * Get brokerage summary for a specific date range
   */
  static async getBrokerageSummary(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const entries = await prisma.brokerageEntry.findMany({
      where: {
        brokerageAccountId: accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        account: {
          include: {
            institution: true,
          },
        },
      },
    });

    const summary = entries.map((entry) => ({
      date: entry.date,
      totalValue: entry.totalValue.toNumber(),
      cashValue: entry.cashValue.toNumber(),
      investmentValue: entry.totalValue.sub(entry.cashValue).toNumber(),
      currency: entry.currency,
      institution: entry.account.institution.name,
      accountName: entry.account.name,
    }));

    return summary;
  }
}
