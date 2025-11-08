import { prisma } from '@/lib/prisma';

/**
 * ユーザーを管理者にするスクリプト
 * 
 * 使用方法:
 * 1. ターミナルで実行: npx tsx scripts/make-admin.ts <email>
 * 2. または、Node.jsで実行: node -r ts-node/register scripts/make-admin.ts <email>
 */

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log(`✅ ユーザー「${user.name}」(${user.email})を管理者に設定しました`);
    return user;
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
    } else {
      console.error('❌ エラー:', error.message);
    }
    process.exit(1);
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];

if (!email) {
  console.error('使用方法: npx tsx scripts/make-admin.ts <email>');
  console.error('例: npx tsx scripts/make-admin.ts admin@example.com');
  process.exit(1);
}

makeAdmin(email)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });

