import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        managedDepartment: true,
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

// ユーザーの役割と部署管理者設定を更新（管理者のみ）
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
    const { userId, role, managedDepartment, newPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // 自分自身の権限を変更しようとしていないかチェック
    if (userId === decoded.userId && role && role !== 'admin') {
      return NextResponse.json(
        { error: '自分自身の管理者権限は変更できません' },
        { status: 400 }
      );
    }

    // 更新データを構築
    const updateData: any = {};
    if (role !== undefined) {
      if (role !== 'admin' && role !== 'employee') {
        return NextResponse.json(
          { error: '役割は "admin" または "employee" である必要があります' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    
    if (managedDepartment !== undefined) {
      // 部署管理者設定（nullの場合は全管理者、部署名の場合はその部署の管理者）
      updateData.managedDepartment = managedDepartment === '' ? null : managedDepartment;
    }

    // パスワードリセット
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // ユーザーを更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        managedDepartment: true,
      },
    });

    return NextResponse.json({
      message: 'ユーザー情報を更新しました',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('ユーザー更新エラー:', error);
    
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
