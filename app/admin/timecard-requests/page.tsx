'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface TimeCardRequest {
  id: string;
  requestType: string;
  requestedTime: string;
  reason: string;
  status: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
  user: User;
}

export default function AdminTimeCardRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<TimeCardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewComment, setReviewComment] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAdminAndLoadRequests();
  }, []);

  const checkAdminAndLoadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('ログインが必要です');
        setLoading(false);
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      const userResponse = await fetch('/api/auth', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        setError('認証に失敗しました');
        setLoading(false);
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      const userData = await userResponse.json();
      if (userData.user.role !== 'admin') {
        setError('管理者権限が必要です');
        setLoading(false);
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      loadRequests();
    } catch (error) {
      console.error('認証エラー:', error);
      setError(`エラーが発生しました: ${error}`);
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timecard-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'サーバーエラー' }));
        setError(`申請一覧の取得に失敗しました: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('申請一覧取得エラー:', error);
      setError(`申請一覧の取得に失敗しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewComment[requestId]) {
      alert('却下理由を入力してください');
      return;
    }

    const confirmMessage = action === 'approve' 
      ? 'この申請を承認しますか？承認すると、タイムカードが自動的に作成されます。'
      : 'この申請を却下しますか？';

    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessingId(requestId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timecard-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          action,
          comment: reviewComment[requestId] || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        loadRequests(); // 申請一覧を再読み込み
        setReviewComment({ ...reviewComment, [requestId]: '' }); // コメントをクリア
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch (error) {
      console.error('承認/却下エラー:', error);
      alert('サーバーエラーが発生しました');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '承認待ち';
      case 'approved':
        return '承認済み';
      case 'rejected':
        return '却下';
      case 'cancelled':
        return '取り下げ済み';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-500 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
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
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← ダッシュボードに戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">打刻申請管理</h1>

          {/* フィルター */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全て ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              承認待ち ({requests.filter((r) => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              承認済み ({requests.filter((r) => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterStatus === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              却下 ({requests.filter((r) => r.status === 'rejected').length})
            </button>
          </div>

          {/* 申請一覧 */}
          {filteredRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {filterStatus === 'all' ? '申請がありません' : `${getStatusText(filterStatus)}の申請がありません`}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div key={req.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{req.user.name}</h3>
                      <p className="text-sm text-gray-600">{req.user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(req.status)}`}>
                      {getStatusText(req.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-600">打刻種別:</span>
                      <span className="ml-2 font-semibold">
                        {req.requestType === 'clock_in' ? '出勤' : '退勤'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">申請時刻:</span>
                      <span className="ml-2 font-semibold">
                        {new Date(req.requestedTime).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-gray-600">理由:</span>
                    <p className="mt-1 p-3 bg-gray-50 rounded">{req.reason}</p>
                  </div>

                  {req.reviewComment && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">管理者コメント:</span>
                      <p className="mt-1 p-3 bg-blue-50 rounded">{req.reviewComment}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mb-3">
                    申請日時: {new Date(req.createdAt).toLocaleString('ja-JP')}
                  </p>

                  {req.status === 'pending' && (
                    <div className="border-t pt-3">
                      <textarea
                        placeholder="コメント（却下の場合は必須）"
                        value={reviewComment[req.id] || ''}
                        onChange={(e) =>
                          setReviewComment({ ...reviewComment, [req.id]: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(req.id, 'approve')}
                          disabled={processingId === req.id}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingId === req.id ? '処理中...' : '承認'}
                        </button>
                        <button
                          onClick={() => handleReview(req.id, 'reject')}
                          disabled={processingId === req.id}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingId === req.id ? '処理中...' : '却下'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

