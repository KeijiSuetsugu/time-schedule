import { PrismaClient } from '@prisma/client';

// Vercel本番環境のデータベースURLを使用
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Vercelデータベースをリセットしています...');
  console.log('データベースURL:', process.env.PRISMA_DATABASE_URL ? '設定済み' : '未設定');
  
  try {
    // 全てのデータを削除
    const timeCards = await prisma.timeCard.deleteMany({});
    console.log(`✓ タイムカードデータを削除しました (${timeCards.count}件)`);
    
    const locations = await prisma.location.deleteMany({});
    console.log(`✓ 場所データを削除しました (${locations.count}件)`);
    
    const users = await prisma.user.deleteMany({});
    console.log(`✓ ユーザーデータを削除しました (${users.count}件)`);
    
    console.log('\n✅ Vercelデータベースのリセットが完了しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
