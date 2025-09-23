import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: process.env.NETLIFY ? 'netlify' : 'local'
  });
}
