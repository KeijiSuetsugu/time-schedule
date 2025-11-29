-- AlterTable
-- 緯度・経度をFloat型からDecimal型に変更（高精度を保持）
-- USING句を使用して既存データを変換
ALTER TABLE "Location" ALTER COLUMN "latitude" TYPE DECIMAL(10, 8) USING latitude::numeric;
ALTER TABLE "Location" ALTER COLUMN "longitude" TYPE DECIMAL(11, 8) USING longitude::numeric;

