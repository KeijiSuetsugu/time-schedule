import { PrismaClient } from '@prisma/client';

// 環境変数に応じてデータベースURLを設定
const databaseUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log('データベースをリセットしています...');
  
  try {
    // 全てのデータを削除
    await prisma.timeCard.deleteMany({});
    console.log('✓ タイムカードデータを削除しました');
    
    await prisma.location.deleteMany({});
    console.log('✓ 場所データを削除しました');
    
    await prisma.user.deleteMany({});
    console.log('✓ ユーザーデータを削除しました');
    
    console.log('\n✅ データベースのリセットが完了しました！');
    console.log('新規登録から再度開始できます。');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

