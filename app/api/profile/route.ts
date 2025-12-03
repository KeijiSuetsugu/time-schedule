import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}







import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}







import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}



import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// プロフィール情報を取得
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
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// プロフィール情報を更新
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

    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 更新するデータを準備
    const updateData: any = {};

    // メールアドレスの変更
    if (email && email !== user.email) {
      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'メールアドレスの形式が正しくありません' },
          { status: 400 }
        );
      }

      // 既に使用されているメールアドレスかチェック
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に使用されています' },
          { status: 400 }
        );
      }

      updateData.email = email;
    }

    // パスワードの変更
    if (newPassword) {
      // 現在のパスワードが提供されているかチェック
      if (!currentPassword) {
        return NextResponse.json(
          { error: '現在のパスワードを入力してください' },
          { status: 400 }
        );
      }

      // 現在のパスワードが正しいか確認
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '現在のパスワードが正しくありません' },
          { status: 400 }
        );
      }

      // 新しいパスワードの長さチェック
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'パスワードは6文字以上である必要があります' },
          { status: 400 }
        );
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // 更新するデータがない場合
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      );
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        department: true,
        role: true,
      },
    });

    // 更新内容に応じたメッセージを作成
    let message = 'プロフィールを更新しました';
    if (updateData.email && updateData.password) {
      message = 'メールアドレスとパスワードを更新しました';
    } else if (updateData.email) {
      message = 'メールアドレスを更新しました';
    } else if (updateData.password) {
      message = 'パスワードを更新しました';
    }

    return NextResponse.json({
      message,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}










