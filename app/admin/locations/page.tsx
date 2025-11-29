'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  latitude: string; // Decimal型を文字列として扱う
  longitude: string; // Decimal型を文字列として扱う
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
  const [editingRadiusId, setEditingRadiusId] = useState<string | null>(null);
  const [editingRadius, setEditingRadius] = useState<string>('');

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
        setLocations(data.locations || []);
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
          latitude: formData.latitude, // 文字列のまま送信
          longitude: formData.longitude, // 文字列のまま送信
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

  const handleStartEditRadius = (location: Location) => {
    setEditingRadiusId(location.id);
    setEditingRadius(location.radius.toString());
  };

  const handleCancelEditRadius = () => {
    setEditingRadiusId(null);
    setEditingRadius('');
  };

  const handleSaveRadius = async (locationId: string) => {
    try {
      const radiusValue = parseFloat(editingRadius);
      
      if (isNaN(radiusValue) || radiusValue < 10 || radiusValue > 10000) {
        setError('半径は10〜10000メートルの範囲で指定してください');
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
          radius: radiusValue,
        }),
      });

      if (response.ok) {
        setSuccess('半径を更新しました');
        setEditingRadiusId(null);
        setEditingRadius('');
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
                    className="input-field"
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
                    className="input-field"
                    required
                    placeholder="例: 139.7671"
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
                  className="p-4 bg-gray-50 rounded-lg flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
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
                    <p className="text-sm text-gray-600">
                      緯度: {location.latitude}, 経度: {location.longitude}
                    </p>
                    {editingRadiusId === location.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-sm text-gray-600">半径:</label>
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={editingRadius}
                          onChange={(e) => setEditingRadius(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="100"
                        />
                        <span className="text-sm text-gray-600">m</span>
                        <button
                          onClick={() => handleSaveRadius(location.id)}
                          className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEditRadius}
                          className="px-2 py-1 rounded text-xs bg-gray-300 text-gray-700 hover:bg-gray-400"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">半径: {location.radius}m</p>
                        <button
                          onClick={() => handleStartEditRadius(location)}
                          className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          変更
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleEnabled(location)}
                      className={`px-3 py-1 rounded text-sm ${
                        location.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {location.enabled ? '無効化' : '有効化'}
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="px-3 py-1 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

