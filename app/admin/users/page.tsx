'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  department: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        setError('管理者権限が必要です');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'staff') => {
    try {
      setUpdatingUserId(userId);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '権限の更新に失敗しました');
      }

      setSuccessMessage(data.message);
      
      // ユーザー一覧を再取得
      await fetchUsers();

      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const confirmRoleChange = (user: User, newRole: 'admin' | 'staff') => {
    const action = newRole === 'admin' ? '管理者に設定' : '管理者権限を削除';
    const message = `${user.name}（${user.email}）を${action}しますか？`;
    
    if (window.confirm(message)) {
      updateUserRole(user.id, newRole);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const adminUsers = users.filter(u => u.role === 'admin');
  const staffUsers = users.filter(u => u.role === 'staff');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                👥 ユーザー管理
              </h1>
              <p className="text-gray-600">
                管理者権限の付与・削除を行えます
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              ← ダッシュボードに戻る
            </button>
          </div>
        </div>

        {/* エラー・成功メッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-semibold">❌ {error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-semibold">✅ {successMessage}</p>
          </div>
        )}

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <p className="text-3xl font-bold text-purple-600">{adminUsers.length}</p>
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
                <p className="text-3xl font-bold text-green-600">{staffUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 管理者一覧 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👑</span>
            管理者一覧
            <span className="ml-3 text-lg text-gray-500">({adminUsers.length}人)</span>
          </h2>
          
          {adminUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">管理者が登録されていません</p>
          ) : (
            <div className="space-y-4">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-purple-200 rounded-lg p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">👑</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="ml-11 flex items-center space-x-4 text-sm text-gray-600">
                        <span>📁 {user.department || '未設定'}</span>
                        <span>📅 {new Date(user.createdAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => confirmRoleChange(user, 'staff')}
                      disabled={updatingUserId === user.id}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingUserId === user.id ? '処理中...' : '権限を削除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* スタッフ一覧 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👤</span>
            スタッフ一覧
            <span className="ml-3 text-lg text-gray-500">({staffUsers.length}人)</span>
          </h2>
          
          {staffUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">スタッフが登録されていません</p>
          ) : (
            <div className="space-y-4">
              {staffUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">👤</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
                          <p className="text-gray-600 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="ml-11 flex items-center space-x-4 text-sm text-gray-600">
                        <span>📁 {user.department || '未設定'}</span>
                        <span>📅 {new Date(user.createdAt).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => confirmRoleChange(user, 'admin')}
                      disabled={updatingUserId === user.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50"
                    >
                      {updatingUserId === user.id ? '処理中...' : '管理者に設定'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使い方ガイド */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            使い方
          </h3>
          <ul className="space-y-2 text-blue-700 text-sm">
            <li>• <strong>管理者に設定</strong>: スタッフの「管理者に設定」ボタンをクリック</li>
            <li>• <strong>権限を削除</strong>: 管理者の「権限を削除」ボタンをクリック</li>
            <li>• 自分自身の管理者権限は削除できません</li>
            <li>• 管理者は打刻申請管理、有給申請管理、時間外業務届管理、エクスポート機能にアクセスできます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



