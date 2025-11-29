import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 未承認申請の件数を取得（管理者のみ）
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // 管理者権限チェック
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 各種申請の未承認件数を取得
    const [timecardRequestCount, leaveRequestCount, overtimeRequestCount] = await Promise.all([
      // 打刻申請の未承認件数
      prisma.timeCardRequest.count({
        where: { status: 'pending' },
      }),
      // 有給申請の未承認件数
      prisma.leaveRequest.count({
        where: { status: 'pending' },
      }),
      // 時間外業務届の未承認件数
      prisma.overtimeRequest.count({
        where: { status: 'pending' },
      }),
    ]);

    return NextResponse.json({
      timecardRequests: timecardRequestCount,
      leaveRequests: leaveRequestCount,
      overtimeRequests: overtimeRequestCount,
      total: timecardRequestCount + leaveRequestCount + overtimeRequestCount,
    });
  } catch (error) {
    console.error('未承認件数取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}


