import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 各申請の保留中カウントを取得
    const [timeCardRequestCount, leaveRequestCount, overtimeRequestCount] = await Promise.all([
      prisma.timeCardRequest.count({
        where: { status: 'pending' }
      }),
      prisma.leaveRequest.count({
        where: { status: 'pending' }
      }),
      prisma.overtimeRequest.count({
        where: { status: 'pending' }
      })
    ]);

    return NextResponse.json({
      timeCardRequests: timeCardRequestCount,
      leaveRequests: leaveRequestCount,
      overtimeRequests: overtimeRequestCount,
      total: timeCardRequestCount + leaveRequestCount + overtimeRequestCount
    });
  } catch (error) {
    console.error('Pending counts error:', error);
    return NextResponse.json(
      { error: 'カウント取得に失敗しました' },
      { status: 500 }
    );
  }
}

