import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // 管理者の場合は全ての申請を取得、職員の場合は自分の申請のみ取得
    const where: any = {};
    
    if (user.role !== 'admin') {
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

    if (user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, comment } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: '有給申請が見つかりません' }, { status: 404 });
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

