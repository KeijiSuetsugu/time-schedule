/**
 * 2点間の距離を計算（ハーバーサイン公式）
 * @param lat1 地点1の緯度
 * @param lon1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lon2 地点2の経度
 * @returns 距離（メートル）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 指定された位置が許可された場所の範囲内かチェック
 * @param latitude 現在位置の緯度
 * @param longitude 現在位置の経度
 * @param locations 許可された場所のリスト
 * @returns 範囲内の場所ID、範囲外の場合はnull
 */
export function checkLocationWithinRange(
  latitude: number,
  longitude: number,
  locations: Array<{ id: string; latitude: number; longitude: number; radius: number; enabled: boolean }>
): string | null {
  for (const location of locations) {
    if (!location.enabled) continue;
    
    const distance = calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    if (distance <= location.radius) {
      return location.id;
    }
  }
  
  return null;
}

