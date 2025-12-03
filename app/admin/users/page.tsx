'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'admin') {
      alert('管理者権限が必要です');
      router.push('/dashboard');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    const action = newRole === 'admin' ? '管理者に昇格' : 'スタッフに変更';
    
    if (!confirm(`このユーザーを${action}しますか？`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        setSuccess(`ユーザーを${action}しました`);
        await loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || '更新に失敗しました');
      }
    } catch (error: any) {
      setError(error.message);
      setTimeout(() => setError(''), 3000);
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

  const admins = users.filter(u => u.role === 'admin');
  const employees = users.filter(u => u.role === 'employee');

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">ユーザー管理</h1>
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

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">総ユーザー数</p>
                <p className="text-3xl font-bold text-gray-800">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">管理者</p>
                <p className="text-3xl font-bold text-gray-800">{admins.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">スタッフ</p>
                <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 管理者一覧 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👑 管理者一覧</h2>
          {admins.length === 0 ? (
            <p className="text-gray-500">管理者はいません</p>
          ) : (
            <div className="space-y-3">
              {admins.map((user) => (
                <div key={user.id} className="p-4 bg-purple-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.department && (
                      <p className="text-xs text-gray-500">{user.department}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    スタッフに変更
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* スタッフ一覧 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 スタッフ一覧</h2>
          {employees.length === 0 ? (
            <p className="text-gray-500">スタッフはいません</p>
          ) : (
            <div className="space-y-3">
              {employees.map((user) => (
                <div key={user.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.department && (
                      <p className="text-xs text-gray-500">{user.department}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleRole(user.id, user.role)}
                    className="px-3 py-1 rounded text-sm bg-purple-100 text-purple-800 hover:bg-purple-200"
                  >
                    管理者に昇格
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
