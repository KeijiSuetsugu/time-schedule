'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OvertimeRequest {
  id: string;
  userId: string;
  department: string;
  employeeName: string;
  content: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
}

export default function AdminOvertimeRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  // 管理者確認と申請データの読み込み
  const checkAdminAndLoadRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // 管理者権限の確認
      const authResponse = await fetch('/api/auth', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!authResponse.ok) {
        setError('認証に失敗しました');
        setLoading(false);
        return;
      }

      const authData = await authResponse.json();
      if (authData.user?.role !== 'admin') {
        setError('管理者権限が必要です');
        setLoading(false);
        return;
      }

      // 申請データの取得
      await loadRequests(token);
    } catch (error) {
      console.error('Error:', error);
      setError('データの読み込みに失敗しました');
      setLoading(false);
    }
  };

  // 申請データを読み込む
  const loadRequests = async (token?: string) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    try {
      const url = filter === 'all' 
        ? '/api/overtime-requests' 
        : `/api/overtime-requests?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('申請データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setError('申請データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminAndLoadRequests();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      loadRequests();
    }
  }, [filter]);

  // 承認/却下処理
  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('認証が必要です');
      router.push('/');
      return;
    }

    const confirmMessage = action === 'approve' 
      ? 'この時間外業務届を承認しますか？' 
      : 'この時間外業務届を却下しますか？';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/overtime-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          action,
          comment: reviewComment || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '処理に失敗しました');
      }

      alert(action === 'approve' ? '承認しました' : '却下しました');
      setReviewingId(null);
      setReviewComment('');
      
      // データを再読み込み
      await loadRequests();
    } catch (error: any) {
      alert(error.message || '処理に失敗しました');
    }
  };

  // 時間のみをフォーマット（UTCとして保存された日時から時間部分を取得）
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 日付のみをフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 日時を日本時間でフォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">承認待ち</span>;
      case 'approved':
        return <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">承認済み</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">却下</span>;
      default:
        return <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setError('');
                  setLoading(true);
                  checkAdminAndLoadRequests();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                ダッシュボードへ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">時間外業務届管理</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← ダッシュボードへ
          </button>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認待ち
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認済み
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              却下
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              すべて
            </button>
          </div>
        </div>

        {/* 申請一覧 */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">申請がありません</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.employeeName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {request.department} | {request.user.email}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500 mb-1">日付</p>
                      <p className="font-medium">{formatDate(request.overtimeDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500 mb-1">時間</p>
                      <p className="font-medium">
                        {formatTime(request.startTime)} 〜 {formatTime(request.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500 mb-1">時間外の内容</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{request.content}</p>
                  </div>

                  {request.reviewComment && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-xs text-blue-600 mb-1">管理者コメント</p>
                      <p className="text-gray-800">{request.reviewComment}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    申請日時: {formatDateTime(request.createdAt)}
                  </p>
                </div>

                {/* 承認/却下ボタン */}
                {request.status === 'pending' && (
                  <div className="border-t pt-4">
                    {reviewingId === request.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="コメント（任意）"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(request.id, 'approve')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                          >
                            ✓ 承認
                          </button>
                          <button
                            onClick={() => handleReview(request.id, 'reject')}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
                          >
                            ✕ 却下
                          </button>
                          <button
                            onClick={() => {
                              setReviewingId(null);
                              setReviewComment('');
                            }}
                            className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(request.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        承認/却下する
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

