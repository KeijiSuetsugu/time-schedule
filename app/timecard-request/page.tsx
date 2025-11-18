'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TimeCardRequest {
  id: string;
  requestType: string;
  requestedTime: string;
  reason: string;
  status: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

export default function TimeCardRequestPage() {
  const router = useRouter();
  const [requestType, setRequestType] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [myRequests, setMyRequests] = useState<TimeCardRequest[]>([]);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/timecard-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyRequests(data.requests);
      }
    } catch (error) {
      console.error('申請一覧取得エラー:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      // 理由を決定
      const finalReason = selectedReason === 'その他' ? customReason : selectedReason;
      if (!finalReason) {
        setMessage('❌ 理由を選択または入力してください');
        setLoading(false);
        return;
      }

      // 日付と時刻を結合してISO形式に変換
      const requestedDateTime = new Date(`${requestedDate}T${requestedTime}`);

      const response = await fetch('/api/timecard-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestType,
          requestedTime: requestedDateTime.toISOString(),
          reason: finalReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ 打刻申請を送信しました');
        setSelectedReason('');
        setCustomReason('');
        setRequestedDate('');
        setRequestedTime('');
        loadMyRequests(); // 申請一覧を再読み込み
      } else {
        setMessage(`❌ ${data.error || '申請に失敗しました'}`);
      }
    } catch (error) {
      console.error('申請エラー:', error);
      setMessage('❌ サーバーエラーが発生しました');
    } finally {
      setLoading(false);
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
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← ダッシュボードに戻る
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6">打刻漏れ申請</h1>

          {message && (
            <div className={`mb-4 p-4 rounded ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                打刻種別
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="clock_in"
                    checked={requestType === 'clock_in'}
                    onChange={(e) => setRequestType(e.target.value as 'clock_in')}
                    className="mr-2"
                  />
                  出勤
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="clock_out"
                    checked={requestType === 'clock_out'}
                    onChange={(e) => setRequestType(e.target.value as 'clock_out')}
                    className="mr-2"
                  />
                  退勤
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付
              </label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時刻
              </label>
              <input
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                理由
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              >
                <option value="">選択してください</option>
                <option value="打刻漏れのため">打刻漏れのため</option>
                <option value="その他">その他</option>
              </select>
              {selectedReason === 'その他' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="理由を入力してください"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '送信中...' : '申請する'}
            </button>
          </form>
        </div>

        {/* 申請履歴 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">申請履歴</h2>
          {myRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">申請履歴がありません</p>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div key={req.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">
                        {req.requestType === 'clock_in' ? '出勤' : '退勤'}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {new Date(req.requestedTime).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(req.status)}`}>
                      {getStatusText(req.status)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">理由: {req.reason}</p>
                  {req.reviewComment && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      管理者コメント: {req.reviewComment}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    申請日時: {new Date(req.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

