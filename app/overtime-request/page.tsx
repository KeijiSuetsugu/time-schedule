'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OvertimeRequest {
  id: string;
  department: string;
  employeeName: string;
  content: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reviewComment?: string;
  cancelledAt?: string;
  createdAt: string;
}

// 部署オプション
const DEPARTMENT_OPTIONS = [
  '医師',
  '看護師',
  'クラーク',
  '放射線科',
  'リハビリ',
  'リハ助手',
  'その他',
];

export default function OvertimeRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [content, setContent] = useState('');
  const [overtimeDate, setOvertimeDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string; department: string | null; managedDepartment: string | null }>>([]);
  const [myRequests, setMyRequests] = useState<OvertimeRequest[]>([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [message, setMessage] = useState('');

  // ユーザー情報を取得して自動入力
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch('/api/auth', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setDepartment(data.user.department || '');
            setEmployeeName(data.user.name || '');
            loadAllManagers(token);
          }
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗:', error);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadAllManagers = async (token: string) => {
    try {
      // 部署パラメータを指定せずに全管理者を取得
      const response = await fetch('/api/department-managers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers || []);
        if (data.managers && data.managers.length > 0 && !selectedManagerId) {
          setSelectedManagerId(data.managers[0].id);
        }
      }
    } catch (error) {
      console.error('管理者取得エラー:', error);
    }
  };

  // 自分の申請履歴を取得
  const fetchMyRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/overtime-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyRequests(data);
        setShowMyRequests(true);
      }
    } catch (error) {
      console.error('申請履歴の取得に失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインしてください');
      router.push('/');
      return;
    }

    if (!selectedManagerId) {
      alert('承認者を選択してください');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/overtime-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          department,
          employeeName,
          content,
          overtimeDate,
          startTime,
          endTime,
          assignedDepartmentManagerId: selectedManagerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '申請に失敗しました');
      }

      setMessage('✅ 時間外業務届を提出しました');

      // フォームをリセット
      setContent('');
      setOvertimeDate('');
      setStartTime('');
      setEndTime('');

      // 申請履歴を再取得
      fetchMyRequests();
    } catch (error: any) {
      setMessage(`❌ ${error.message || '時間外業務届の提出に失敗しました'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (req: OvertimeRequest) => {
    if (!confirm('この申請を取り下げますか？\n取り下げ後、旧内容をフォームに転記します。')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/overtime-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel', requestId: req.id }),
      });

      if (response.ok) {
        // 旧値をフォームに転記
        setDepartment(req.department);
        setEmployeeName(req.employeeName);
        setContent(req.content);
        setOvertimeDate(formatDate(req.overtimeDate).replace(/\//g, '-'));
        setStartTime(formatTime(req.startTime));
        setEndTime(formatTime(req.endTime));
        setMessage('✅ 取り下げました。内容を修正して再申請してください。');
        fetchMyRequests();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error || '取り下げに失敗しました'}`);
      }
    } catch (error) {
      console.error('取り下げエラー:', error);
      setMessage('❌ サーバーエラーが発生しました');
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

  // ステータスの表示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">承認待ち</span>;
      case 'approved':
        return <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">承認済み</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">却下</span>;
      case 'cancelled':
        return <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600">取り下げ済み</span>;
      default:
        return <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">時間外業務届</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← ダッシュボードへ
          </button>
        </div>

        {/* 申請フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">新規申請</h2>
          {message && (
            <div className={`mb-4 p-4 rounded ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 所属 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属 <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* 氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>

            {/* 時間外の内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時間外の内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: カルテ整理、会議準備など"
              />
            </div>

            {/* 日付 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={overtimeDate}
                onChange={(e) => setOvertimeDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 開始時刻・終了時刻 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 申請先（各部署の管理者） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申請先（各部署の管理者） <span className="text-red-500">*</span>
              </label>
              {managers.length === 0 ? (
                <p className="text-sm text-gray-500">管理者を読み込み中...</p>
              ) : (
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                      {manager.managedDepartment 
                        ? ` - ${manager.managedDepartment}管理者` 
                        : ' - 全管理者（全部署を管理）'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '送信中...' : '申請する'}
              </button>
              
              <button
                type="button"
                onClick={fetchMyRequests}
                className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-medium"
              >
                申請履歴を見る
              </button>
            </div>
          </form>
        </div>

        {/* 申請履歴 */}
        {showMyRequests && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900">申請履歴</h2>
              <button
                onClick={() => setShowMyRequests(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ 閉じる
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">※ 一度提出した申請の内容は変更できません。間違いがある場合は「取り下げて再申請」してください。</p>

            {myRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">申請履歴がありません</p>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${request.status === 'cancelled' ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{request.employeeName}</p>
                        <p className="text-sm text-gray-600">{request.department}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">日付:</span> {formatDate(request.overtimeDate)}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">時間:</span> {formatTime(request.startTime)} 〜 {formatTime(request.endTime)}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">内容:</span> {request.content}
                      </p>
                      {request.reviewComment && (
                        <p className="text-gray-700 bg-gray-50 p-2 rounded">
                          <span className="font-medium">管理者コメント:</span> {request.reviewComment}
                        </p>
                      )}
                      {request.cancelledAt && (
                        <p className="text-xs text-gray-400">
                          取り下げ日時: {formatDateTime(request.cancelledAt)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        申請日時: {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(request)}
                        className="mt-3 px-4 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        取り下げて再申請
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

