import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  newPassword: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'このメールアドレスは登録されていません' },
        { status: 404 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { email: validatedData.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: 'パスワードを再設定しました。新しいパスワードでログインしてください。',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'パスワードの再設定に失敗しました' },
      { status: 500 }
    );
  }
}

