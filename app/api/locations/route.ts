import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const locationSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(10).max(10000).default(100), // 10m〜10km
  enabled: z.boolean().default(true),
});

const updateLocationSchema = locationSchema.partial().extend({
  id: z.string(),
});

// 打刻場所の一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者のみ全情報を取得、一般ユーザーは有効な場所のみ
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const locations = await prisma.location.findMany({
      where: user?.role === 'admin' ? {} : { enabled: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 打刻場所の作成（管理者のみ）
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, latitude, longitude, radius, enabled } = locationSchema.parse(body);

    const location = await prisma.location.create({
      data: {
        name,
        latitude,
        longitude,
        radius,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Create location error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 打刻場所の更新（管理者のみ）
export async function PUT(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = updateLocationSchema.parse(body);

    const location = await prisma.location.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// 打刻場所の削除（管理者のみ）
export async function DELETE(request: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '場所IDが必要です' },
        { status: 400 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete location error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

