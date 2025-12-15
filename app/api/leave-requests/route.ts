import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// JWTトークンからユーザー情報を取得
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// 有給申請作成用のスキーマ
const createLeaveRequestSchema = z.object({
  leaveType: z.enum(['年次', '病気', '特別']),
  absenceType: z.enum(['休暇', '欠勤']),
  department: z.string().min(1),
  employeeName: z.string().min(1),
  reason: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().min(0),
  hours: z.number().min(0),
  assignedDepartmentManagerId: z.string().optional(),
});

// POST: 新しい有給申請を作成
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLeaveRequestSchema.parse(body);

    // 日本時間として入力された日時をそのままUTCとして保存
    // フロントエンドから "2024-11-19T08:25" の形式で送られてくる
    // これを日本時間として扱うため、そのままISO文字列に変換
    const startDateStr = validatedData.startDate.includes('Z') 
      ? validatedData.startDate 
      : `${validatedData.startDate}:00.000Z`;
    const endDateStr = validatedData.endDate.includes('Z') 
      ? validatedData.endDate 
      : `${validatedData.endDate}:00.000Z`;

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
      const applicantUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { department: true },
      });

      if (manager.managedDepartment && applicantUser?.department !== manager.managedDepartment) {
        return NextResponse.json(
          { error: '指定された管理者はあなたの部署を管理していません' },
          { status: 400 }
        );
      }
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.userId,
        leaveType: validatedData.leaveType,
        absenceType: validatedData.absenceType,
        department: validatedData.department,
        employeeName: validatedData.employeeName,
        reason: validatedData.reason,
        startDate: startDateStr,
        endDate: endDateStr,
        days: validatedData.days,
        hours: validatedData.hours,
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

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Error creating leave request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力データが不正です', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: '有給申請の作成に失敗しました' }, { status: 500 });
  }
}

// GET: 有給申請一覧を取得
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, approved, rejected, all

    // ユーザー情報を取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, managedDepartment: true },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 申請一覧の取得条件を決定
    const where: any = {};
    
    if (userInfo.role === 'admin') {
      // 全管理者（managedDepartmentがnull）の場合は全ての申請を取得
      // 部署管理者の場合は自分の部署の申請のみを取得
      if (userInfo.managedDepartment) {
        where.assignedDepartmentManagerId = user.userId;
      }
    } else {
      // 職員の場合は自分の申請のみ
      where.userId = user.userId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: '有給申請の取得に失敗しました' }, { status: 500 });
  }
}

// PATCH: 有給申請を承認・却下
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報を取得
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, managedDepartment: true },
    });

    if (!userInfo || userInfo.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, comment } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: '有給申請が見つかりません' }, { status: 404 });
    }

    // 部署管理者の場合、自分の部署の申請のみ承認可能
    if (userInfo.managedDepartment) {
      // 申請が自分の部署の管理者に割り当てられているか確認
      if (leaveRequest.assignedDepartmentManagerId !== user.userId) {
        return NextResponse.json(
          { error: 'この申請を承認する権限がありません' },
          { status: 403 }
        );
      }

      // 申請者の部署が自分の管理部署と一致するか確認
      if (leaveRequest.user.department !== userInfo.managedDepartment) {
        return NextResponse.json(
          { error: 'この申請はあなたの部署の申請ではありません' },
          { status: 403 }
        );
      }
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'この申請は既に処理されています' }, { status: 400 });
    }

    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: user.userId,
        reviewedAt: new Date(),
        reviewComment: comment || null,
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

    return NextResponse.json(updatedLeaveRequest);
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json({ error: '有給申請の更新に失敗しました' }, { status: 500 });
  }
}

