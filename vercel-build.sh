#!/bin/bash
set -e

echo "🔧 Starting Vercel build..."

# Prisma Clientを生成
echo "📦 Generating Prisma Client..."
npx prisma generate

# マイグレーションを実行（Vercel環境のみ）
if [ "$VERCEL" = "1" ]; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate deploy || echo "⚠️  Migration failed, but continuing..."
  
  # Decimal精度を自動修正（マイグレーションの補完）
  echo "🔧 Ensuring decimal precision is correct..."
  if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_PRISMA_URL" ]; then
    cat > /tmp/fix-decimal.js << 'EOFJS'
const { Client } = require('pg');
const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!url) {
  console.log('⚠️  No database URL, skipping');
  process.exit(0);
}
const client = new Client({ connectionString: url });
(async () => {
  try {
    await client.connect();
    console.log('✓ Connected');
    await client.query('ALTER TABLE "Location" ALTER COLUMN "latitude" TYPE DECIMAL(18, 15) USING latitude::numeric');
    await client.query('ALTER TABLE "Location" ALTER COLUMN "longitude" TYPE DECIMAL(19, 15) USING longitude::numeric');
    console.log('✅ Decimal precision updated to 15 digits (18 chars total)');
    
    // 本院の場所を登録（存在しない場合のみ）
    const checkResult = await client.query("SELECT id FROM \"Location\" WHERE name = '本院'");
    if (checkResult.rows.length === 0) {
      await client.query(`
        INSERT INTO "Location" (id, name, latitude, longitude, radius, enabled, "createdAt", "updatedAt")
        VALUES (
          'honin-main',
          '本院',
          33.88507161918166,
          130.70780362473587,
          100,
          true,
          NOW(),
          NOW()
        )
      `);
      console.log('✅ 本院の場所を登録しました');
    } else {
      // 既存の場所を更新
      await client.query(`
        UPDATE "Location"
        SET latitude = 33.88507161918166,
            longitude = 130.70780362473587,
            "updatedAt" = NOW()
        WHERE name = '本院'
      `);
      console.log('✅ 本院の場所を更新しました');
    }
  } catch (err) {
    console.log('⚠️  Decimal fix:', err.message.substring(0, 100));
  } finally {
    await client.end();
  }
})();
EOFJS
    node /tmp/fix-decimal.js || echo "⚠️  Skipped decimal fix"
  fi
else
  echo "⏭️  Skipping migrations (not in Vercel environment)"
fi

# Next.jsをビルド
echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"

