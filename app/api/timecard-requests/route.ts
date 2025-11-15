import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 打刻申請作成のスキーマ
const createRequestSchema = z.object({
  requestType: z.enum(['clock_in', 'clock_out']),
  requestedTime: z.string(), // ISO 8601形式
  reason: z.string().min(1, '理由を入力してください'),
});

// 打刻申請の承認/却下スキーマ
const reviewRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
});

// GET: 打刻申請一覧取得
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者の場合は全ての申請を取得、職員の場合は自分の申請のみ
    const requests = await prisma.timeCardRequest.findMany({
      where: user.role === 'admin' ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('打刻申請取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// POST: 打刻申請作成 or 承認/却下
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const body = await request.json();

    // アクションによって処理を分岐
    if (body.action === 'approve' || body.action === 'reject') {
      // 承認/却下処理（管理者のみ）
      if (user.role !== 'admin') {
        return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
      }

      const validation = reviewRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      const { requestId, action, comment } = validation.data;

      // 申請を取得
      const timeCardRequest = await prisma.timeCardRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!timeCardRequest) {
        return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
      }

      if (timeCardRequest.status !== 'pending') {
        return NextResponse.json({ error: 'この申請は既に処理されています' }, { status: 400 });
      }

      // 承認の場合、タイムカードを作成
      if (action === 'approve') {
        await prisma.$transaction([
          // タイムカードを作成
          prisma.timeCard.create({
            data: {
              userId: timeCardRequest.userId,
              type: timeCardRequest.requestType,
              timestamp: timeCardRequest.requestedTime,
            },
          }),
          // 申請のステータスを更新
          prisma.timeCardRequest.update({
            where: { id: requestId },
            data: {
              status: 'approved',
              reviewedBy: user.id,
              reviewedAt: new Date(),
              reviewComment: comment,
            },
          }),
        ]);

        return NextResponse.json({
          message: '申請を承認し、タイムカードを作成しました',
        });
      } else {
        // 却下の場合
        await prisma.timeCardRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            reviewedBy: user.id,
            reviewedAt: new Date(),
            reviewComment: comment,
          },
        });

        return NextResponse.json({
          message: '申請を却下しました',
        });
      }
    } else {
      // 新規申請作成
      const validation = createRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      const { requestType, requestedTime, reason } = validation.data;

      const newRequest = await prisma.timeCardRequest.create({
        data: {
          userId: user.id,
          requestType,
          requestedTime: new Date(requestedTime),
          reason,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: '打刻申請を送信しました',
        request: newRequest,
      });
    }
  } catch (error) {
    console.error('打刻申請処理エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

