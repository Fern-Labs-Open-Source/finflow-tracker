/**
 * Simple search endpoint for accounts and institutions
 * Provides quick search across portfolio entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { prisma } from '@/lib/db/prisma';
import { CacheHeaders } from '@/lib/api/cache-headers';

// GET /api/search - Search accounts and institutions
export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type'); // 'accounts', 'institutions', or 'all'
  
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const results: any = {};
    const searchQuery = `%${query}%`;
    
    // Search accounts if requested
    if (!type || type === 'accounts' || type === 'all') {
      const accounts = await prisma.account.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          institution: {
            select: {
              name: true,
              type: true,
            },
          },
          snapshots: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        take: 10, // Limit results
      });
      
      results.accounts = accounts.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.snapshots[0] ? Number(account.snapshots[0].valueOriginal) : 0,
        currency: account.currency,
        institution: account.institution.name,
        matchedOn: 
          account.name.toLowerCase().includes(query.toLowerCase()) ? 'name' : 'type',
      }));
    }
    
    // Search institutions if requested
    if (!type || type === 'institutions' || type === 'all') {
      const institutions = await prisma.institution.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },

            { type: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: { accounts: true },
          },
        },
        take: 10, // Limit results
      });
      
      results.institutions = institutions.map(inst => ({
        id: inst.id,
        name: inst.name,
        type: inst.type,
        accountCount: inst._count.accounts,
        matchedOn:
          inst.name.toLowerCase().includes(query.toLowerCase()) ? 'name' : 'type',
      }));
    }
    
    // Add summary
    results.summary = {
      query,
      totalResults: 
        (results.accounts?.length || 0) + 
        (results.institutions?.length || 0),
      timestamp: new Date().toISOString(),
    };
    
    // Cache for 30 seconds - search results can be slightly stale
    return NextResponse.json(results, {
      headers: {
        ...CacheHeaders.shortCache,
        'X-Search-Query': query,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
});
