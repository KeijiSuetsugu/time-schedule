-- AlterTable
-- 緯度・経度をFloat型からDecimal型に変更（超高精度を保持）
-- USING句を使用して既存データを変換
-- Decimal(17, 14): precision=17（総桁数）, scale=14（小数点以下の桁数）
-- これにより、緯度は-90.00000000000000 〜 90.00000000000000の範囲で14桁の精度
-- 経度は-180.00000000000000 〜 180.00000000000000の範囲で14桁の精度
ALTER TABLE "Location" ALTER COLUMN "latitude" TYPE DECIMAL(17, 14) USING latitude::numeric;
ALTER TABLE "Location" ALTER COLUMN "longitude" TYPE DECIMAL(18, 14) USING longitude::numeric;
