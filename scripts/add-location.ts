import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 本院の場所を追加または更新
  const location = await prisma.location.upsert({
    where: { id: 'honin-main' },
    update: {
      name: '本院',
      latitude: '33.88507161918166',
      longitude: '130.70780362473587',
      radius: 100,
      enabled: true,
    },
    create: {
      id: 'honin-main',
      name: '本院',
      latitude: '33.88507161918166',
      longitude: '130.70780362473587',
      radius: 100,
      enabled: true,
    },
  });

  console.log('✅ 場所を登録しました:');
  console.log(`   名前: ${location.name}`);
  console.log(`   緯度: ${location.latitude}`);
  console.log(`   経度: ${location.longitude}`);
  console.log(`   半径: ${location.radius}m`);
}

main()
  .catch((e) => {
    console.error('エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
