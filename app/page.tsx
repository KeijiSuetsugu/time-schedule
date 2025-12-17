'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 既にログインしている場合はダッシュボードにリダイレクト
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'パスワードの再設定に失敗しました');
      }

      setSuccess('パスワードを再設定しました。新しいパスワードでログインしてください。');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3秒後にログイン画面に戻る
      setTimeout(() => {
        setIsResetPassword(false);
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email,
          password,
          ...(isLogin ? {} : { name, department }),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'エラーが発生しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `サーバーエラー (${response.status})`;
        } catch {
          errorMessage = `サーバーエラー (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.token || !data.user) {
        throw new Error('レスポンスデータが不正です');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = 'エラーが発生しました';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'ネットワークエラー: サーバーに接続できません。インターネット接続を確認してください。';
      } else {
        errorMessage = `エラー: ${err.toString()}`;
      }
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
            タイムカードシステム
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {isResetPassword ? 'パスワード再設定' : isLogin ? 'ログイン' : '新規登録'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* パスワード再設定フォーム */}
          {isResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  登録済みメールアドレス
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                  placeholder="example@company.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={6}
                  placeholder="6文字以上"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={6}
                  placeholder="もう一度入力"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '処理中...' : 'パスワードを再設定'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setError('');
                    setSuccess('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  ← ログインに戻る
                </button>
              </div>
            </form>
          ) : (
            /* ログイン・新規登録フォーム */
            <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    お名前
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    required
                    placeholder="山田 太郎"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    部署
                  </label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="医師">医師</option>
                    <option value="看護師">看護師</option>
                    <option value="クラーク">クラーク</option>
                    <option value="放射線科">放射線科</option>
                    <option value="リハビリ">リハビリ</option>
                    <option value="リハ助手">リハ助手</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                placeholder="example@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                minLength={6}
                placeholder="6文字以上"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '処理中...' : isLogin ? 'ログイン' : '登録'}
            </button>
          </form>
          )}

          {!isResetPassword && (
            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium block w-full"
              >
                {isLogin ? '新規登録はこちら' : '既にアカウントをお持ちの方はこちら'}
              </button>
              
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm block w-full"
                >
                  パスワードを忘れた方はこちら
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

