# 打刻場所の設定方法

## 概要

このタイムカードシステムでは、**位置情報による打刻場所の検証**が必須です。
打刻可能な場所を2箇所以上設定できます。

## 設定方法

### 方法1: ブラウザコンソールを使用（推奨）

1. 管理者アカウントでログイン
2. ブラウザの開発者ツール（F12）を開く
3. コンソールタブで以下のコードを実行:

```javascript
// 打刻場所を追加
async function addLocation(name, lat, lng, radius = 100) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, latitude: lat, longitude: lng, radius, enabled: true }),
  });
  const data = await res.json();
  console.log(res.ok ? `✅ ${name}を追加しました` : `❌ エラー: ${data.error}`);
  return data;
}

// 例: 本社を設定（緯度、経度、半径100m）
addLocation('本社', 33.88573073361879, 130.70805039162732, 30);

// 例: 支社を設定
addLocation('支社', 33.87358717821837, 130.70818467908092, 30);
```

### 方法2: APIを直接呼び出す

管理者権限を持つユーザーで、以下のAPIエンドポイントを使用:

- **GET** `/api/locations` - 場所一覧を取得
- **POST** `/api/locations` - 新しい場所を追加
- **PUT** `/api/locations` - 場所を更新
- **DELETE** `/api/locations?id={locationId}` - 場所を削除

## 緯度・経度の取得方法

1. **Googleマップを使用**:
   - 場所を右クリック → 緯度・経度をコピー

2. **GPSアプリを使用**:
   - スマートフォンのGPSアプリで現在位置を確認

3. **オンラインツール**:
   - https://www.latlong.net/ など

## 設定例

### 本社と支社の2箇所を設定

```javascript
// 本社（東京駅付近、半径100m）
addLocation('本社', 33.88573073361879, 130.70805039162732, 30);

// 支社（大阪駅付近、半径100m）
addLocation('支社', 33.87358717821837, 130.70818467908092, 30);
```

### 半径の設定

- **50m**: 狭い範囲（オフィスビル内など）
- **100m**: 標準的な範囲（推奨）
- **200m**: 広い範囲（敷地が広い場合）
- **500m以上**: 非常に広い範囲（工場など）

## 注意事項

1. **位置情報の許可**: ユーザーはブラウザで位置情報の許可が必要です
2. **GPSの精度**: 屋内ではGPSの精度が低下する場合があります
3. **半径の調整**: 打刻できない場合は、半径を広げることを検討してください
4. **場所の無効化**: 一時的に場所を無効化する場合は、`enabled: false`に設定

## トラブルシューティング

### 打刻できない場合

1. 位置情報の許可を確認
2. GPSが有効か確認
3. 設定した場所の半径内にいるか確認
4. 管理者に連絡して場所の設定を確認

### 場所を確認する

```javascript
// 現在設定されている場所を確認
async function getLocations() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/locations', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  console.log('打刻可能な場所:', data.locations);
  return data.locations;
}

getLocations();
```

