import { config } from 'dotenv';

config();

const databaseUrl =
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ エラー: データベースURLが設定されていません');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ エラー: データベースURLはPostgreSQL形式である必要があります');
  process.exit(1);
}

async function fixDecimalPrecision() {
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('📡 データベースに接続しました');

    // 現在のカラムの型を確認
    console.log('\n🔍 現在のカラム定義を確認中...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'Location'
      AND column_name IN ('latitude', 'longitude')
      ORDER BY column_name;
    `);

    console.log('現在の設定:');
    checkResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision}, ${row.numeric_scale})`);
    });

    // カラムの型を変更
    console.log('\n🔧 カラムの精度を変更中...');
    await client.query(`
      ALTER TABLE "Location" 
      ALTER COLUMN "latitude" TYPE DECIMAL(17, 14) USING latitude::numeric;
    `);
    console.log('  ✓ latitudeをDECIMAL(17, 14)に変更しました');

    await client.query(`
      ALTER TABLE "Location" 
      ALTER COLUMN "longitude" TYPE DECIMAL(18, 14) USING longitude::numeric;
    `);
    console.log('  ✓ longitudeをDECIMAL(18, 14)に変更しました');

    // 変更後の確認
    console.log('\n✅ 変更後のカラム定義:');
    const afterResult = await client.query(`
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'Location'
      AND column_name IN ('latitude', 'longitude')
      ORDER BY column_name;
    `);

    afterResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision}, ${row.numeric_scale})`);
    });

    // 現在のデータを表示
    console.log('\n📍 現在登録されている場所:');
    const locationsResult = await client.query(`
      SELECT id, name, latitude, longitude, radius, enabled
      FROM "Location"
      ORDER BY "createdAt";
    `);

    if (locationsResult.rows.length === 0) {
      console.log('  （登録されている場所はありません）');
    } else {
      locationsResult.rows.forEach((loc, index) => {
        console.log(`\n  ${index + 1}. ${loc.name} (${loc.enabled ? '有効' : '無効'})`);
        console.log(`     緯度: ${loc.latitude}`);
        console.log(`     経度: ${loc.longitude}`);
        console.log(`     半径: ${loc.radius}m`);
      });
    }

    console.log('\n✅ 完了しました！');
    console.log('💡 これで、小数点以下14桁まで保存できるようになりました。');
    console.log('   次回、場所を編集すると正しい精度で保存されます。');

  } catch (error: any) {
    console.error('❌ エラーが発生しました:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

fixDecimalPrecision()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('スクリプト実行エラー:', error);
    process.exit(1);
  });





