import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const databaseUrl = 
  process.argv.find(arg => arg.startsWith('DATABASE_URL='))?.split('=')[1] ||
  process.argv.find(arg => arg.startsWith('PRISMA_DATABASE_URL='))?.split('=')[1] ||
  process.env.PRISMA_DATABASE_URL || 
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  console.error('使用方法: npx tsx scripts/check-locations.ts');
  console.error('または: PRISMA_DATABASE_URL="..." npx tsx scripts/check-locations.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function checkLocations() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (locations.length === 0) {
      console.log('📍 打刻場所が登録されていません');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 登録されている打刻場所');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    locations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`);
      console.log(`   ID: ${location.id}`);
      console.log(`   緯度: ${location.latitude}`);
      console.log(`   経度: ${location.longitude}`);
      console.log(`   半径: ${location.radius}m`);
      console.log(`   状態: ${location.enabled ? '✓ 有効' : '✗ 無効'}`);
      console.log(`   登録日: ${location.createdAt.toLocaleDateString('ja-JP')}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`合計: ${locations.length}件の打刻場所`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 有効な場所のみを表示
    const enabledLocations = locations.filter(loc => loc.enabled);
    if (enabledLocations.length > 0) {
      console.log('✓ 有効な場所:');
      enabledLocations.forEach(loc => {
        console.log(`  - ${loc.name} (半径: ${loc.radius}m)`);
      });
    } else {
      console.log('⚠️  有効な打刻場所がありません');
    }

    // 無効な場所を表示
    const disabledLocations = locations.filter(loc => !loc.enabled);
    if (disabledLocations.length > 0) {
      console.log('\n✗ 無効な場所:');
      disabledLocations.forEach(loc => {
        console.log(`  - ${loc.name}`);
      });
    }

  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkLocations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });


