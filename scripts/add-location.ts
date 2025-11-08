import { prisma } from '../lib/prisma';

/**
 * 打刻場所を直接データベースに追加するスクリプト
 * 
 * 使用方法:
 * npx tsx scripts/add-location.ts <name> <latitude> <longitude> [radius]
 * 
 * 例:
 * npx tsx scripts/add-location.ts "本社" 35.6812 139.7671 100
 */

async function addLocation(name: string, latitude: number, longitude: number, radius: number = 100) {
  try {
    const location = await prisma.location.create({
      data: {
        name,
        latitude,
        longitude,
        radius,
        enabled: true,
      },
    });

    console.log(`✅ 場所「${name}」を追加しました:`);
    console.log(`   ID: ${location.id}`);
    console.log(`   緯度: ${location.latitude}`);
    console.log(`   経度: ${location.longitude}`);
    console.log(`   半径: ${location.radius}m`);
    return location;
  } catch (error: any) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数を取得
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('使用方法: npx tsx scripts/add-location.ts <name> <latitude> <longitude> [radius]');
  console.error('例: npx tsx scripts/add-location.ts "本社" 35.6812 139.7671 100');
  process.exit(1);
}

const name = args[0];
const latitude = parseFloat(args[1]);
const longitude = parseFloat(args[2]);
const radius = args[3] ? parseFloat(args[3]) : 100;

if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
  console.error('❌ エラー: 緯度、経度、半径は数値である必要があります');
  process.exit(1);
}

addLocation(name, latitude, longitude, radius)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });

