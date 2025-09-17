import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../src/lib/db/prisma'
import { withAuth } from '../../../../../src/lib/auth/api-auth'

export const POST = withAuth(async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { balance } = await request.json()
    
    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json(
        { error: 'Invalid balance value' },
        { status: 400 }
      )
    }

    const accountId = params.id

    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { 
        institution: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get the latest exchange rate for currency conversion
    let exchangeRate = 1.0
    let valueEur = balance

    if (account.currency !== 'EUR') {
      const latestRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: account.currency,
          toCurrency: 'EUR'
        },
        orderBy: { date: 'desc' }
      })

      if (latestRate) {
        exchangeRate = latestRate.rate
        valueEur = balance * exchangeRate
      }
    }

    // Create a new snapshot with the updated balance
    const snapshot = await prisma.accountSnapshot.create({
      data: {
        accountId: accountId,
        date: new Date(),
        valueOriginal: balance,
        currency: account.currency,
        valueEur: valueEur,
        exchangeRate: exchangeRate,
        notes: 'Balance updated via inline edit'
      }
    })

    // Get the previous snapshot for comparison
    const previousSnapshot = account.snapshots[0]

    // Return the updated account with snapshot info
    const updatedAccount = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        institution: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 2
        },
        _count: {
          select: { snapshots: true }
        }
      }
    })

    // Calculate change metrics
    const change = previousSnapshot 
      ? balance - previousSnapshot.valueOriginal 
      : 0
    const changePercent = previousSnapshot && previousSnapshot.valueOriginal > 0
      ? (change / previousSnapshot.valueOriginal) * 100
      : 0

    return NextResponse.json({
      account: {
        ...updatedAccount,
        currentBalance: balance,
        previousBalance: previousSnapshot?.valueOriginal,
        change,
        changePercent,
        lastSnapshotDate: snapshot.date
      },
      snapshot: {
        id: snapshot.id,
        date: snapshot.date,
        value: snapshot.valueOriginal,
        valueEur: snapshot.valueEur
      },
      message: 'Balance updated and snapshot created successfully'
    })
    
  } catch (error) {
    console.error('Error updating balance:', error)
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    )
  }
})
