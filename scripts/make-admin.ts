import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// 環境変数を読み込む
config();

// 環境変数に応じてデータベースURLを設定（コマンドライン引数からも取得可能）
const databaseUrl = 
  process.argv.find(arg => arg.startsWith('DATABASE_URL='))?.split('=')[1] ||
  process.argv.find(arg => arg.startsWith('PRISMA_DATABASE_URL='))?.split('=')[1] ||
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  console.error('\n使用方法:');
  console.error('  1. 環境変数として設定:');
  console.error('     export DATABASE_URL="postgresql://user:password@host:5432/database"');
  console.error('     npx tsx scripts/make-admin.ts onepeace0710@gmail.com');
  console.error('\n  2. コマンドライン引数として指定:');
  console.error('     npx tsx scripts/make-admin.ts onepeace0710@gmail.com DATABASE_URL="postgresql://..."');
  console.error('\n  3. Vercelの環境変数を確認して設定:');
  console.error('     Vercelダッシュボード → Settings → Environment Variables から PRISMA_DATABASE_URL を取得');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  console.error(`現在のURL: ${databaseUrl.substring(0, 50)}...`);
  console.error('\nVercelの環境変数から PRISMA_DATABASE_URL を取得して設定してください:');
  console.error('  export PRISMA_DATABASE_URL="postgresql://..."');
  console.error('  npx tsx scripts/make-admin.ts onepeace0710@gmail.com');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
    throw error;
  } finally {
    await prisma.$disconnect();
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

