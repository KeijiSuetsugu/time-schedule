import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// 全ユーザー一覧を取得（管理者のみ）
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

    // 管理者権限チェック
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 全ユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'desc' }, // admin が先
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// ユーザーの役割を更新（管理者のみ）
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // 管理者権限チェック
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'ユーザーIDと役割が必要です' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json(
        { error: '役割は "admin" または "staff" である必要があります' },
        { status: 400 }
      );
    }

    // 自分自身の権限を変更しようとしていないかチェック
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: '自分自身の管理者権限は変更できません' },
        { status: 400 }
      );
    }

    // ユーザーの役割を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: role === 'admin' 
        ? `${updatedUser.name}を管理者に設定しました` 
        : `${updatedUser.name}の管理者権限を削除しました`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('ユーザー役割更新エラー:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

