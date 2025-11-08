import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { generateToken } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // レート制限チェック（認証エンドポイントはより厳しく）
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'login') {
      const { email, password } = loginSchema.parse(body);
      
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json(
          { error: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 }
        );
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    if (action === 'register') {
      const { email, password, name } = registerSchema.parse(body);
      
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    return NextResponse.json(
      { error: '無効なアクション' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

