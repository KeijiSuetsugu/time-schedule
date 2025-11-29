-- AlterTable
-- 緯度・経度をFloat型からDecimal型に変更（高精度を保持）
ALTER TABLE "Location" ALTER COLUMN "latitude" TYPE DECIMAL(10, 8);
ALTER TABLE "Location" ALTER COLUMN "longitude" TYPE DECIMAL(11, 8);

