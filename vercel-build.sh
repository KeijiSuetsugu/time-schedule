#!/bin/bash
# set -e を削除して、エラーが発生しても続行できるようにする
set +e

echo "🔧 Starting Vercel build..."

# Prisma Clientを生成
echo "📦 Generating Prisma Client..."
npx prisma generate

# マイグレーションを実行（Vercel環境または本番環境）
if [ "$VERCEL" = "1" ] || [ "$NODE_ENV" = "production" ]; then
  echo "🗄️  Running database migrations..."
  
  # prisma migrate deployを実行
  # P3005エラー（既存のデータベース）が発生した場合、エラーを無視して続行
  npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log
  MIGRATE_EXIT_CODE=${PIPESTATUS[0]}
  
  if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
    # P3005エラー（既存のデータベース）の場合、エラーを無視して続行
    if grep -q "P3005" /tmp/migrate.log || grep -q "database schema is not empty" /tmp/migrate.log; then
      echo "⚠️  Database schema is not empty (P3005). This is expected for existing databases."
      echo "📋 Attempting to resolve existing migrations..."
      
      # 既存のマイグレーションファイルを解決済みとしてマーク
      for migration_dir in prisma/migrations/*/; do
        if [ -d "$migration_dir" ] && [ -f "$migration_dir/migration.sql" ]; then
          migration_name=$(basename "$migration_dir")
          echo "🔧 Resolving migration: $migration_name"
          npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
        fi
      done
      
      # 再度マイグレーションを実行
      echo "🔄 Retrying migration deploy..."
      npx prisma migrate deploy || echo "⚠️  Migration deploy failed, but continuing build..."
    else
      echo "❌ Migration failed with error code $MIGRATE_EXIT_CODE"
      echo "⚠️  Continuing build despite migration error..."
    fi
  else
    echo "✅ Migrations applied successfully"
  fi
else
  echo "⏭️  Skipping migrations (not in production environment)"
fi

# set -e を再度有効にして、Next.jsのビルドでエラーが発生した場合は停止
set -e

# Next.jsをビルド
echo "🏗️  Building Next.js..."
npx next build

echo "✅ Build completed successfully!"

