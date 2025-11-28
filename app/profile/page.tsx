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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // フォームの状態
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 変更検出
  const [emailChanged, setEmailChanged] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setEmailChanged(email !== user.email);
    }
  }, [email, user]);

  useEffect(() => {
    setPasswordChanged(newPassword.length > 0 || confirmPassword.length > 0);
  }, [newPassword, confirmPassword]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('プロフィールの取得に失敗しました');
      }

      const data = await response.json();
      setUser(data.user);
      setEmail(data.user.email);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // バリデーション
    if (!emailChanged && !passwordChanged) {
      setError('変更する項目がありません');
      return;
    }

    if (passwordChanged) {
      if (!currentPassword) {
        setError('現在のパスワードを入力してください');
        return;
      }

      if (!newPassword) {
        setError('新しいパスワードを入力してください');
        return;
      }

      if (newPassword.length < 6) {
        setError('パスワードは6文字以上である必要があります');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('新しいパスワードと確認用パスワードが一致しません');
        return;
      }
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const requestBody: any = {};

      if (emailChanged) {
        requestBody.email = email;
      }

      if (passwordChanged) {
        requestBody.currentPassword = currentPassword;
        requestBody.newPassword = newPassword;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新に失敗しました');
      }

      setSuccessMessage(data.message);
      
      // ユーザー情報を更新
      setUser(data.user);
      setEmail(data.user.email);

      // パスワードフィールドをクリア
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // localStorageのユーザー情報を更新
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, email: data.user.email }));

      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEmail(user.email);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                ⚙️ プロフィール設定
              </h1>
              <p className="text-gray-600">
                メールアドレスとパスワードを変更できます
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              ← 戻る
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

        {/* ユーザー情報カード */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 基本情報</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-gray-600 w-24">名前:</span>
              <span className="font-semibold text-gray-800">{user?.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">部署:</span>
              <span className="font-semibold text-gray-800">{user?.department || '未設定'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">役割:</span>
              <span className={`font-semibold ${user?.role === 'admin' ? 'text-purple-600' : 'text-green-600'}`}>
                {user?.role === 'admin' ? '👑 管理者' : '👤 スタッフ'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">登録日:</span>
              <span className="font-semibold text-gray-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 変更フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🔐 アカウント設定の変更</h2>

          {/* メールアドレス変更 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📧 メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
              required
            />
            {emailChanged && (
              <p className="text-sm text-blue-600 mt-1">
                ℹ️ メールアドレスが変更されます
              </p>
            )}
          </div>

          {/* パスワード変更 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔒 パスワード変更</h3>
            <p className="text-sm text-gray-600 mb-4">
              パスワードを変更する場合のみ入力してください
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="現在のパスワードを入力"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="新しいパスワード（6文字以上）"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="新しいパスワードを再入力"
                  minLength={6}
                />
              </div>

              {passwordChanged && newPassword && confirmPassword && (
                <div>
                  {newPassword === confirmPassword ? (
                    <p className="text-sm text-green-600">
                      ✅ パスワードが一致しています
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      ❌ パスワードが一致しません
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-4 mt-8">
            <button
              type="submit"
              disabled={saving || (!emailChanged && !passwordChanged)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '変更を保存'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          </div>
        </form>

        {/* 注意事項 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            注意事項
          </h3>
          <ul className="space-y-2 text-yellow-700 text-sm">
            <li>• メールアドレスを変更した場合、次回ログイン時は新しいメールアドレスを使用してください</li>
            <li>• パスワードを変更した場合、次回ログイン時は新しいパスワードを使用してください</li>
            <li>• パスワードは6文字以上である必要があります</li>
            <li>• 他のユーザーが既に使用しているメールアドレスには変更できません</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

