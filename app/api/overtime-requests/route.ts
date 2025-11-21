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
  startTime: z.string(), // YYYY-MM-DDTHH:mm形式
  endTime: z.string(), // YYYY-MM-DDTHH:mm形式
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

// GET: 時間外業務届の一覧を取得
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 管理者の場合は全ての申請を取得、職員の場合は自分の申請のみ
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const where: any = userInfo.role === 'admin' ? {} : { userId: user.userId };
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

    // 日本時間として入力された日時をそのままUTCとして保存
    const startTimeStr = validatedData.startTime.includes('Z') 
      ? validatedData.startTime 
      : `${validatedData.startTime}:00.000Z`;
    const endTimeStr = validatedData.endTime.includes('Z') 
      ? validatedData.endTime 
      : `${validatedData.endTime}:00.000Z`;
    const overtimeDateStr = validatedData.overtimeDate.includes('T')
      ? validatedData.overtimeDate
      : `${validatedData.overtimeDate}T00:00:00.000Z`;

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

// PATCH: 時間外業務届を承認/却下
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者権限チェック
    const userInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (!userInfo || userInfo.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = reviewRequestSchema.parse(body);

    // 申請を取得
    const overtimeRequest = await prisma.overtimeRequest.findUnique({
      where: { id: validatedData.requestId },
    });

    if (!overtimeRequest) {
      return NextResponse.json({ error: '申請が見つかりません' }, { status: 404 });
    }

    if (overtimeRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'この申請は既に処理されています' },
        { status: 400 }
      );
    }

    // ステータスを更新
    const updatedRequest = await prisma.overtimeRequest.update({
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
    });

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

