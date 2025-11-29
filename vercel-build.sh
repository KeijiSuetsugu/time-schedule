#!/bin/bash
set -e

echo "🔧 Starting Vercel build..."

# Prisma Clientを生成
echo "📦 Generating Prisma Client..."
npx prisma generate

# マイグレーションを実行（Vercel環境または本番環境）
if [ "$VERCEL" = "1" ] || [ "$NODE_ENV" = "production" ]; then
  echo "🗄️  Running database migrations..."
  npx prisma migrate deploy
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

# Next.jsをビルド
echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"

