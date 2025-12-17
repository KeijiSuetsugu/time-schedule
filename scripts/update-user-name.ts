import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// 環境変数を読み込む
config();

// 環境変数に応じてデータベースURLを設定
const databaseUrl = 
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  console.error('\n使用方法:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function updateUserName(email: string, newName: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ エラー: メールアドレス「${email}」のユーザーが見つかりません`);
      process.exit(1);
    }

    console.log(`📋 現在のユーザー情報:`);
    console.log(`   名前: ${user.name}`);
    console.log(`   メール: ${user.email}`);
    console.log(`   部署: ${user.department || '未設定'}`);

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { name: newName },
    });

    console.log(`\n✅ ユーザー名を変更しました: ${user.name} → ${updatedUser.name}`);
    return updatedUser;
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const newName = process.argv[3];

if (!email || !newName) {
  console.error('使用方法: npx tsx scripts/update-user-name.ts <メールアドレス> <新しい名前>');
  console.error('例: npx tsx scripts/update-user-name.ts user@example.com "山田太郎"');
  process.exit(1);
}

updateUserName(email, newName)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });
