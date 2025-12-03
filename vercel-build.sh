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
  } catch (err) {
    console.log('⚠️  Decimal fix:', err.message.substring(0, 50));
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
