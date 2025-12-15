-- 緯度・経度の精度を修正
-- 現在の設定を確認
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'Location'
AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

-- カラムの型を変更
ALTER TABLE "Location" 
ALTER COLUMN "latitude" TYPE DECIMAL(17, 14) USING latitude::numeric;

ALTER TABLE "Location" 
ALTER COLUMN "longitude" TYPE DECIMAL(18, 14) USING longitude::numeric;

-- 変更後の確認
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'Location'
AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;

-- 現在のデータを確認
SELECT id, name, latitude, longitude, radius, enabled
FROM "Location"
ORDER BY "createdAt";




