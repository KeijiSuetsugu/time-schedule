import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const decimalStringSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const strValue = typeof value === 'number' ? value.toString() : value.trim();
    if (!strValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '数値を入力してください',
      });
      return z.NEVER;
    }

    const numValue = Number(strValue);
    if (Number.isNaN(numValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '数値として認識できません',
      });
      return z.NEVER;
    }

    return {
      string: strValue,
      number: numValue,
    };
  });

const locationSchema = z.object({
  name: z.string().min(1),
  latitude: decimalStringSchema.refine(
    ({ number }) => number >= -90 && number <= 90,
    '緯度は-90〜90の範囲で入力してください'
  ),
  longitude: decimalStringSchema.refine(
    ({ number }) => number >= -180 && number <= 180,
    '経度は-180〜180の範囲で入力してください'
  ),
  radius: z.number().min(10).max(10000).default(100), // 10m〜10km
  enabled: z.boolean().default(true),
});

const updateLocationSchema = locationSchema
  .partial()
  .extend({
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

    const serializedLocations = locations.map((loc) => ({
      ...loc,
      latitude:
        typeof loc.latitude === 'object' && loc.latitude !== null
          ? loc.latitude.toString()
          : loc.latitude,
      longitude:
        typeof loc.longitude === 'object' && loc.longitude !== null
          ? loc.longitude.toString()
          : loc.longitude,
    }));

    return NextResponse.json({ locations: serializedLocations });
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
    const parsed = locationSchema.parse(body);

    const location = await prisma.location.create({
      data: {
        name: parsed.name,
        latitude: parsed.latitude.string,
        longitude: parsed.longitude.string,
        radius: parsed.radius,
        enabled: parsed.enabled ?? true,
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

    const dataToUpdate: Record<string, unknown> = {};

    if (typeof updateData.name === 'string') {
      dataToUpdate.name = updateData.name;
    }

    if (updateData.latitude) {
      dataToUpdate.latitude = updateData.latitude.string;
    }

    if (updateData.longitude) {
      dataToUpdate.longitude = updateData.longitude.string;
    }

    if (typeof updateData.radius === 'number') {
      dataToUpdate.radius = updateData.radius;
    }

    if (typeof updateData.enabled === 'boolean') {
      dataToUpdate.enabled = updateData.enabled;
    }

    const location = await prisma.location.update({
      where: { id },
      data: dataToUpdate,
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
