import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      POSTGRES_URL_EXISTS: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL_EXISTS: !!process.env.POSTGRES_PRISMA_URL,
    },
    timestamp: new Date().toISOString(),
  });
}

