import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 部署管理者一覧を取得
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

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    // 部署が指定されている場合、その部署の管理者を取得
    // 部署が指定されていない場合、全管理者を取得
    const where: any = {
      role: 'admin',
    };

    if (department) {
      // 指定部署の管理者（managedDepartmentがnullまたは指定部署）を取得
      where.OR = [
        { managedDepartment: null }, // 全管理者
        { managedDepartment: department }, // 指定部署の管理者
      ];
    } else {
      // 部署が指定されていない場合は全管理者を取得
      // where条件はそのまま（role: 'admin'のみ）
    }

    const managers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        managedDepartment: true,
      },
      orderBy: [
        { managedDepartment: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ managers });
  } catch (error) {
    console.error('部署管理者取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

