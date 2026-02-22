import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 部署管理者を取得するヘルパー関数
async function getDepartmentManager(department: string | null): Promise<string | null> {
  if (!department) {
    return null;
  }

  // その部署を管理している管理者を検索
  const manager = await prisma.user.findFirst({
    where: {
      role: 'admin',
      managedDepartment: department,
    },
    select: { id: true },
  });

  return manager?.id || null;
}

// 打刻申請作成のスキーマ
const createRequestSchema = z.object({
  requestType: z.enum(['clock_in', 'clock_out']),
  requestedTime: z.string(), // ISO 8601形式
  reason: z.string().min(1, '理由を入力してください'),
  assignedDepartmentManagerId: z.string().optional(),
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

    // 申請一覧の取得条件を決定
    let whereCondition: any = {};
    
    if (user.role === 'admin') {
      // 全管理者（managedDepartmentがnull）の場合は全ての申請を取得
      // 部署管理者の場合は自分の部署の申請のみを取得
      if (user.managedDepartment) {
        // 部署管理者の場合、自分の部署の申請のみ
        whereCondition = {
          assignedDepartmentManagerId: user.id,
        };
      }
      // managedDepartmentがnullの場合は全申請を取得（whereConditionは空のまま）
    } else {
      // 職員の場合は自分の申請のみ
      whereCondition = { userId: user.id };
    }

    const requests = await prisma.timeCardRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        assignedDepartmentManager: {
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

    // 取り下げ処理（本人のみ、pendingのみ）
    if (body.action === 'cancel') {
      const { requestId } = body;
      if (!requestId) {
        return NextResponse.json({ error: '申請IDが必要です' }, { status: 400 });
      }

      const timeCardRequest = await prisma.timeCardRequest.findUnique({
        where: { id: requestId },
      });

      if (!timeCardRequest) {
        return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
      }

      if (timeCardRequest.userId !== user.id) {
        return NextResponse.json({ error: '自分の申請のみ取り下げできます' }, { status: 403 });
      }

      if (timeCardRequest.status !== 'pending') {
        return NextResponse.json({ error: '承認待ちの申請のみ取り下げできます' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.timeCardRequest.update({
          where: { id: requestId },
          data: { status: 'cancelled', cancelledAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            entityType: 'TimeCardRequest',
            entityId: requestId,
            action: 'cancelled',
            performedBy: user.id,
          },
        }),
      ]);

      return NextResponse.json({ message: '申請を取り下げました' });
    }

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

      // 部署管理者の場合、自分の部署の申請のみ承認可能
      if (user.managedDepartment) {
        // 申請が自分の部署の管理者に割り当てられているか確認
        if (timeCardRequest.assignedDepartmentManagerId !== user.id) {
          return NextResponse.json(
            { error: 'この申請を承認する権限がありません' },
            { status: 403 }
          );
        }

        // 申請者の部署が自分の管理部署と一致するか確認
        if (timeCardRequest.user.department !== user.managedDepartment) {
          return NextResponse.json(
            { error: 'この申請はあなたの部署の申請ではありません' },
            { status: 403 }
          );
        }
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
          // 監査ログ
          prisma.auditLog.create({
            data: {
              entityType: 'TimeCardRequest',
              entityId: requestId,
              action: 'approved',
              performedBy: user.id,
              detail: comment ? JSON.stringify({ comment }) : null,
            },
          }),
        ]);

        return NextResponse.json({
          message: '申請を承認し、タイムカードを作成しました',
        });
      } else {
        // 却下の場合
        await prisma.$transaction([
          prisma.timeCardRequest.update({
            where: { id: requestId },
            data: {
              status: 'rejected',
              reviewedBy: user.id,
              reviewedAt: new Date(),
              reviewComment: comment,
            },
          }),
          prisma.auditLog.create({
            data: {
              entityType: 'TimeCardRequest',
              entityId: requestId,
              action: 'rejected',
              performedBy: user.id,
              detail: comment ? JSON.stringify({ comment }) : null,
            },
          }),
        ]);

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

      const { requestType, requestedTime, reason, assignedDepartmentManagerId } = validation.data;

      // 部署管理者が指定されている場合、その管理者が存在し、管理者権限を持っているか確認
      if (assignedDepartmentManagerId) {
        const manager = await prisma.user.findUnique({
          where: { id: assignedDepartmentManagerId },
        });

        if (!manager || manager.role !== 'admin') {
          return NextResponse.json(
            { error: '指定された管理者が見つかりません' },
            { status: 400 }
          );
        }

        // ユーザーの部署と管理者の管理部署が一致するか確認（全管理者の場合はスキップ）
        if (manager.managedDepartment && user.department !== manager.managedDepartment) {
          return NextResponse.json(
            { error: '指定された管理者はあなたの部署を管理していません' },
            { status: 400 }
          );
        }
      }

      const newRequest = await prisma.timeCardRequest.create({
        data: {
          userId: user.id,
          requestType,
          requestedTime: new Date(requestedTime),
          reason,
          assignedDepartmentManagerId: assignedDepartmentManagerId || null,
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

