import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// バリデーションスキーマ
const createOvertimeRequestSchema = z.object({
  department: z.string().min(1, '所属を選択してください'),
  employeeName: z.string().min(1, '氏名を入力してください'),
  content: z.string().min(1, '時間外の内容を入力してください'),
  overtimeDate: z.string(), // YYYY-MM-DD形式
  startTime: z.string(), // HH:mm形式
  endTime: z.string(), // HH:mm形式
  assignedDepartmentManagerId: z.string().optional(),
});

const reviewRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
});

// ヘルパー関数：トークンからユーザー情報を取得
function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}

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

// GET: 時間外業務届の一覧を取得
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 管理者の場合は自分の部署の申請のみ取得、職員の場合は自分の申請のみ
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, managedDepartment: true },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const where: any = {};
    
    if (userInfo.role === 'admin') {
      // 部署管理者の場合、自分の部署の申請のみ
      if (userInfo.managedDepartment) {
        where.assignedDepartmentManagerId = user.userId;
      }
      // 全管理者の場合は全ての申請（whereConditionは空のまま）
    } else {
      // 職員の場合は自分の申請のみ
      where.userId = user.userId;
    }

    if (status) {
      where.status = status;
    }

    const overtimeRequests = await prisma.overtimeRequest.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(overtimeRequests);
  } catch (error) {
    console.error('Error fetching overtime requests:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// POST: 新しい時間外業務届を作成
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOvertimeRequestSchema.parse(body);

    // 部署管理者が指定されている場合、その管理者が存在し、管理者権限を持っているか確認
    if (validatedData.assignedDepartmentManagerId) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.assignedDepartmentManagerId },
      });

      if (!manager || manager.role !== 'admin') {
        return NextResponse.json(
          { error: '指定された管理者が見つかりません' },
          { status: 400 }
        );
      }

      // ユーザーの部署と管理者の管理部署が一致するか確認（全管理者の場合はスキップ）
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { department: true },
      });

      if (manager.managedDepartment && currentUser?.department !== manager.managedDepartment) {
        return NextResponse.json(
          { error: '指定された管理者はあなたの部署を管理していません' },
          { status: 400 }
        );
      }
    }

    // 日付と時間を組み合わせて日時を作成（日本時間としてUTCに保存）
    const overtimeDateStr = validatedData.overtimeDate.includes('T')
      ? validatedData.overtimeDate
      : `${validatedData.overtimeDate}T00:00:00.000Z`;
    
    // 時間のみの入力（HH:mm）を日付と組み合わせる
    const startTimeStr = `${validatedData.overtimeDate}T${validatedData.startTime}:00.000Z`;
    const endTimeStr = `${validatedData.overtimeDate}T${validatedData.endTime}:00.000Z`;

    const overtimeRequest = await prisma.overtimeRequest.create({
      data: {
        userId: user.userId,
        department: validatedData.department,
        employeeName: validatedData.employeeName,
        content: validatedData.content,
        overtimeDate: overtimeDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status: 'pending',
        assignedDepartmentManagerId: validatedData.assignedDepartmentManagerId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json(overtimeRequest);
  } catch (error) {
    console.error('Error creating overtime request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// PATCH: 時間外業務届を承認/却下/取り下げ
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();

    // 取り下げ処理（本人のみ、pendingのみ）
    if (body.action === 'cancel') {
      const { requestId } = body;
      if (!requestId) {
        return NextResponse.json({ error: '申請IDが必要です' }, { status: 400 });
      }

      const overtimeRequest = await prisma.overtimeRequest.findUnique({
        where: { id: requestId },
      });

      if (!overtimeRequest) {
        return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
      }

      if (overtimeRequest.userId !== user.userId) {
        return NextResponse.json({ error: '自分の申請のみ取り下げできます' }, { status: 403 });
      }

      if (overtimeRequest.status !== 'pending') {
        return NextResponse.json({ error: '承認待ちの申請のみ取り下げできます' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.overtimeRequest.update({
          where: { id: requestId },
          data: { status: 'cancelled', cancelledAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            entityType: 'OvertimeRequest',
            entityId: requestId,
            action: 'cancelled',
            performedBy: user.userId,
          },
        }),
      ]);

      return NextResponse.json({ message: '申請を取り下げました' });
    }

    // 承認・却下処理（管理者のみ）
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, managedDepartment: true },
    });

    if (!userInfo || userInfo.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const validatedData = reviewRequestSchema.parse(body);

    // 申請を取得
    const overtimeRequest = await prisma.overtimeRequest.findUnique({
      where: { id: validatedData.requestId },
      include: { user: true },
    });

    if (!overtimeRequest) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    // 部署管理者の場合、自分の部署の申請のみ承認可能
    if (userInfo.managedDepartment) {
      // 申請が自分の部署の管理者に割り当てられているか確認
      if (overtimeRequest.assignedDepartmentManagerId !== user.userId) {
        return NextResponse.json(
          { error: 'この申請を承認する権限がありません' },
          { status: 403 }
        );
      }

      // 申請者の部署が自分の管理部署と一致するか確認
      if (overtimeRequest.user.department !== userInfo.managedDepartment) {
        return NextResponse.json(
          { error: 'この申請はあなたの部署の申請ではありません' },
          { status: 403 }
        );
      }
    }

    if (overtimeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'この申請は既に処理されています' },
        { status: 400 }
      );
    }

    // ステータスを更新（AuditLog と同時にトランザクション）
    const [updatedRequest] = await prisma.$transaction([
      prisma.overtimeRequest.update({
        where: { id: validatedData.requestId },
        data: {
          status: validatedData.action === 'approve' ? 'approved' : 'rejected',
          reviewedBy: user.userId,
          reviewedAt: new Date(),
          reviewComment: validatedData.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          entityType: 'OvertimeRequest',
          entityId: validatedData.requestId,
          action: validatedData.action === 'approve' ? 'approved' : 'rejected',
          performedBy: user.userId,
          detail: validatedData.comment ? JSON.stringify({ comment: validatedData.comment }) : null,
        },
      }),
    ]);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error reviewing overtime request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

