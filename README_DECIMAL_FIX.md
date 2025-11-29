# 緯度・経度の精度問題を解決する方法

## 問題
入力: `130.70780362473587` (14桁)
保存: `130.70780362473359` (13桁で丸められる)

## 原因
データベースのカラム定義が古いまま（Decimal(12, 14)または(10, 8)）

## 解決方法

### 方法1: Vercelダッシュボードから直接SQLを実行

1. Vercelダッシュボードにアクセス
2. プロジェクトを選択
3. Storage → Postgres → Data（またはQuery）を選択
4. 以下のSQLを実行:

```sql
-- カラムの型を変更
ALTER TABLE "Location" 
ALTER COLUMN "latitude" TYPE DECIMAL(17, 14) USING latitude::numeric;

ALTER TABLE "Location" 
ALTER COLUMN "longitude" TYPE DECIMAL(18, 14) USING longitude::numeric;

-- 確認
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'Location'
AND column_name IN ('latitude', 'longitude');
```

5. 結果を確認:
   - latitude: DECIMAL(17, 14)
   - longitude: DECIMAL(18, 14)

### 方法2: ローカルから実行

1. Vercelダッシュボードから `PRISMA_DATABASE_URL` を取得
2. ターミナルで実行:

```bash
# psqlを使用する場合
PGPASSWORD='パスワード' psql -h ホスト -U ユーザー -d データベース名 < fix-decimal.sql
```

### 確認方法

実行後、以下のクエリで確認:

```sql
SELECT id, name, latitude, longitude
FROM "Location";
```

緯度・経度が14桁で表示されていればOKです。

### 注意事項

- この変更後、場所を編集すると14桁で保存されます
- 既存のデータも14桁の精度で保持されます
- マイグレーションファイルも更新済みなので、次回のデプロイから自動適用されます
