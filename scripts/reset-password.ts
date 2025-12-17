import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// 環境変数を読み込む
config();

const databaseUrl = 
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/reset-password.ts <メールアドレス> <新しいパスワード>');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function resetPassword(email: string, newPassword: string) {
  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`📋 ユーザー情報:`);
    console.log(`   名前: ${user.name}`);
    console.log(`   メール: ${user.email}`);
    console.log(`   部署: ${user.department || '未設定'}`);

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`\n✅ パスワードをリセットしました`);
    console.log(`   新しいパスワード: ${newPassword}`);
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📖 パスワードリセットスクリプト');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('\n使用方法:');
  console.error('  npx tsx scripts/reset-password.ts <メールアドレス> <新しいパスワード>');
  console.error('\n例:');
  console.error('  npx tsx scripts/reset-password.ts user@example.com newpassword123');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(1);
}

resetPassword(email, newPassword)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });

