/**
 * 打刻場所を設定するためのスクリプト
 * 
 * 使用方法:
 * 1. 管理者アカウントでログイン
 * 2. ブラウザのコンソールで以下のコードを実行するか、
 *    管理者用のUIページを作成して使用
 * 
 * 例: 本社と支社の2箇所を設定
 */

// 打刻場所を追加する関数
async function addLocation(name: string, latitude: number, longitude: number, radius: number = 100) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      latitude,
      longitude,
      radius,
      enabled: true,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log(`✅ 場所「${name}」を追加しました:`, data.location);
    return data.location;
  } else {
    console.error(`❌ エラー:`, data.error);
    throw new Error(data.error);
  }
}

// 使用例:
// addLocation('本社', 35.6812, 139.7671, 100); // 東京駅付近、半径100m
// addLocation('支社', 34.6937, 135.5023, 100); // 大阪駅付近、半径100m

// すべての打刻場所を取得
async function getLocations() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/locations', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('現在の打刻場所:', data.locations);
    return data.locations;
  } else {
    console.error('❌ エラー:', data.error);
    throw new Error(data.error);
  }
}

// 場所を無効化
async function disableLocation(locationId: string) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/locations', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: locationId,
      enabled: false,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ 場所を無効化しました:', data.location);
    return data.location;
  } else {
    console.error('❌ エラー:', data.error);
    throw new Error(data.error);
  }
}

// 場所を削除
async function deleteLocation(locationId: string) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api/locations?id=${locationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ 場所を削除しました');
    return true;
  } else {
    console.error('❌ エラー:', data.error);
    throw new Error(data.error);
  }
}

// グローバルに公開（ブラウザコンソールで使用可能にする）
if (typeof window !== 'undefined') {
  (window as any).addLocation = addLocation;
  (window as any).getLocations = getLocations;
  (window as any).disableLocation = disableLocation;
  (window as any).deleteLocation = deleteLocation;
}

export { addLocation, getLocations, disableLocation, deleteLocation };

