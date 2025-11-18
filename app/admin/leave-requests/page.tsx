'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
}

interface LeaveRequest {
  id: string;
  userId: string;
  user: User;
  leaveType: string;
  absenceType: string;
  department: string;
  employeeName: string;
  reason: string;
  startDate: string;
  endDate: string;
  days: number;
  hours: number;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

// 日時を日本時間でフォーマット（タイムゾーン変換なし）
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export default function AdminLeaveRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');

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

    setUser(userData);
    loadRequests(token, filterStatus);
  }, [router, filterStatus]);

  const loadRequests = async (token: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leave-requests?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('申請の取得に失敗しました');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインが必要です');
      router.push('/');
      return;
    }

    const confirmMessage = action === 'approve' 
      ? 'この申請を承認しますか？' 
      : 'この申請を却下しますか？';

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: requestId,
          action,
          comment: reviewComment || null,
        }),
      });

      if (response.ok) {
        alert(action === 'approve' ? '申請を承認しました' : '申請を却下しました');
        setReviewComment('');
        setReviewingRequest(null);
        loadRequests(token, filterStatus);
      } else {
        const data = await response.json();
        alert(data.error || '処理に失敗しました');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">承認待ち</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">承認済み</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">却下</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{status}</span>;
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">有給申請管理</h1>
              <p className="text-sm text-gray-600 mt-1">管理者用ページ</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← 戻る
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ステータスで絞り込み
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認待ち
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              承認済み
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              却下
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              すべて
            </button>
          </div>
        </div>

        {/* 申請一覧 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            申請一覧 ({requests.length}件)
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">申請はありません</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  {/* 申請者情報 */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.employeeName}（{request.department}）
                      </h3>
                      <p className="text-sm text-gray-600">{request.user.email}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* 申請内容 */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">届出の種類:</span>
                        <span className="ml-2 font-medium">{request.leaveType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">休暇/欠勤:</span>
                        <span className="ml-2 font-medium">{request.absenceType}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">理由:</span>
                      <span className="ml-2">{request.reason}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">期間:</span>
                      <span className="ml-2">
                        {formatDateTime(request.startDate)} 〜 {formatDateTime(request.endDate)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">日数・時間:</span>
                      <span className="ml-2 font-medium">
                        {request.days}日間（{request.hours}時間）
                      </span>
                    </div>
                  </div>

                  {/* 申請日時 */}
                  <p className="text-xs text-gray-400 mb-3">
                    申請日: {formatDateTime(request.createdAt)}
                  </p>

                  {/* 承認待ちの場合のアクション */}
                  {request.status === 'pending' && (
                    <div className="border-t pt-3">
                      {reviewingRequest === request.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="コメント（任意）"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(request.id, 'approve')}
                              disabled={loading}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400"
                            >
                              承認
                            </button>
                            <button
                              onClick={() => handleReview(request.id, 'reject')}
                              disabled={loading}
                              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
                            >
                              却下
                            </button>
                            <button
                              onClick={() => {
                                setReviewingRequest(null);
                                setReviewComment('');
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewingRequest(request.id)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          審査する
                        </button>
                      )}
                    </div>
                  )}

                  {/* 承認済み・却下の場合の情報 */}
                  {request.status !== 'pending' && request.reviewedAt && (
                    <div className="border-t pt-3 text-sm text-gray-600">
                      <p>
                        {request.status === 'approved' ? '承認' : '却下'}日時: {formatDateTime(request.reviewedAt)}
                      </p>
                      {request.reviewComment && (
                        <p className="mt-1">
                          コメント: {request.reviewComment}
                        </p>
                      )}
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

