'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  radius: number;
  enabled: boolean;
}

export default function AdminLocationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    if (userData.role !== 'admin') {
      alert('管理者権限が必要です');
      router.push('/dashboard');
      return;
    }

    loadLocations();
  }, [router]);

  const loadLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mappedLocations: Location[] = (data.locations || []).map((loc: any) => ({
          ...loc,
          latitude: typeof loc.latitude === 'string' 
            ? loc.latitude 
            : (typeof loc.latitude === 'object' && loc.latitude !== null 
              ? loc.latitude.toString() 
              : String(loc.latitude || '')),
          longitude: typeof loc.longitude === 'string' 
            ? loc.longitude 
            : (typeof loc.longitude === 'object' && loc.longitude !== null 
              ? loc.longitude.toString() 
              : String(loc.longitude || '')),
        }));
        setLocations(mappedLocations);
      }
    } catch (error) {
      console.error('Load locations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          latitude: formData.latitude.trim(),
          longitude: formData.longitude.trim(),
          radius: parseFloat(formData.radius),
          enabled: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '場所の追加に失敗しました');
      }

      setSuccess(`場所「${formData.name}」を追加しました`);
      setFormData({ name: '', latitude: '', longitude: '', radius: '100' });
      setShowAddForm(false);
      await loadLocations();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('この場所を削除しますか？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/locations?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('場所を削除しました');
        await loadLocations();
      } else {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleEnabled = async (location: Location) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: location.id,
          enabled: !location.enabled,
        }),
      });

      if (response.ok) {
        await loadLocations();
      }
    } catch (error) {
      console.error('Toggle enabled error:', error);
    }
  };

  const handleStartEdit = (location: Location) => {
    setEditingLocationId(location.id);
    setEditingData({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingLocationId(null);
    setEditingData({
      name: '',
      latitude: '',
      longitude: '',
      radius: '',
    });
  };

  const handleSaveLocation = async (locationId: string) => {
    try {
      const latStr = editingData.latitude.trim();
      const lonStr = editingData.longitude.trim();
      const radiusStr = editingData.radius.trim();
      
      const radiusValue = parseFloat(radiusStr);
      const latValue = Number(latStr);
      const lonValue = Number(lonStr);
      
      if (isNaN(radiusValue) || radiusValue < 10 || radiusValue > 10000) {
        setError('半径は10〜10000メートルの範囲で指定してください');
        return;
      }

      if (isNaN(latValue) || latValue < -90 || latValue > 90) {
        setError('緯度は-90から90の範囲で指定してください');
        return;
      }

      if (isNaN(lonValue) || lonValue < -180 || lonValue > 180) {
        setError('経度は-180から180の範囲で指定してください');
        return;
      }

      if (!editingData.name.trim()) {
        setError('場所の名前を入力してください');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: locationId,
          name: editingData.name.trim(),
          latitude: latStr,
          longitude: lonStr,
          radius: radiusValue,
        }),
      });

      if (response.ok) {
        setSuccess('場所情報を更新しました');
        setEditingLocationId(null);
        setEditingData({
          name: '',
          latitude: '',
          longitude: '',
          radius: '',
        });
        await loadLocations();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">打刻場所の管理</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="card bg-red-50 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="card bg-green-50 border border-green-200">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">打刻場所一覧</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
            >
              {showAddForm ? 'キャンセル' : '+ 新しい場所を追加'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddLocation} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所の名前
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="例: 本社"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    緯度
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="input-field font-mono"
                    required
                    placeholder="例: 35.6812"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    経度
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="input-field font-mono"
                    required
                    placeholder="例: 130.70780362473587"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  半径（メートル）
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                場所を追加
              </button>
            </form>
          )}

          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              打刻場所が設定されていません。<br />
              上記の「+ 新しい場所を追加」ボタンから設定してください。
            </p>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  {editingLocationId === location.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          場所の名前
                        </label>
                        <input
                          type="text"
                          value={editingData.name}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="例: 本社"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            緯度（17桁対応）
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingData.latitude}
                            onChange={(e) => setEditingData({ ...editingData, latitude: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                            placeholder="例: 35.6812"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            経度（17桁対応）
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingData.longitude}
                            onChange={(e) => setEditingData({ ...editingData, longitude: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                            placeholder="例: 130.70780362473587"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          半径（メートル）
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={editingData.radius}
                          onChange={(e) => setEditingData({ ...editingData, radius: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="100"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveLocation(location.id)}
                          className="flex-1 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm font-semibold"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 text-sm font-semibold"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              location.enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {location.enabled ? '有効' : '無効'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="font-mono">📍 緯度: {location.latitude}</p>
                          <p className="font-mono">📍 経度: {location.longitude}</p>
                          <p>📏 半径: {location.radius}m</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleStartEdit(location)}
                          className="px-4 py-2 rounded text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 font-semibold whitespace-nowrap"
                        >
                          ✏️ 編集
                        </button>
                        <button
                          onClick={() => handleToggleEnabled(location)}
                          className={`px-4 py-2 rounded text-sm font-semibold whitespace-nowrap ${
                            location.enabled
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {location.enabled ? '無効化' : '有効化'}
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="px-4 py-2 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200 font-semibold whitespace-nowrap"
                        >
                          🗑️ 削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
