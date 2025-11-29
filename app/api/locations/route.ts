import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { Decimal } from '@prisma/client/runtime/library';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const locationSchema = z.object({
  name: z.string().min(1),
  latitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < -90 || num > 90) {
      throw new Error('緯度は-90から90の範囲で指定してください');
    }
    return new Decimal(val.toString());
  }),
  longitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < -180 || num > 180) {
      throw new Error('経度は-180から180の範囲で指定してください');
    }
    return new Decimal(val.toString());
  }),
  radius: z.number().min(10).max(10000).default(100), // 10m〜10km
  enabled: z.boolean().default(true),
});

const updateLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  latitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < -90 || num > 90) {
      throw new Error('緯度は-90から90の範囲で指定してください');
    }
    return new Decimal(val.toString());
  }).optional(),
  longitude: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < -180 || num > 180) {
      throw new Error('経度は-180から180の範囲で指定してください');
    }
    return new Decimal(val.toString());
  }).optional(),
  radius: z.number().min(10).max(10000).optional(),
  enabled: z.boolean().optional(),
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

    // Decimal型を文字列に変換してフロントエンドに送信
    const locationsWithStringCoords = locations.map((loc) => ({
      ...loc,
      latitude: loc.latitude.toString(),
      longitude: loc.longitude.toString(),
    }));

    return NextResponse.json({ locations: locationsWithStringCoords });
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
      location: {
        ...location,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      },
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
      location: {
        ...location,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      },
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

