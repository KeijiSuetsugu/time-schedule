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
  createdAt: string;
}

interface DepartmentManager {
  id: string;
  name: string;
  email: string;
  managedDepartment: string | null;
}

const REASON_OPTIONS = [
  '私事のため',
  '体調不良',
  '家族の看護',
  '通院',
  '冠婚葬祭',
  '育児',
  '介護',
  'リフレッシュ',
  'その他',
];

// 日時を日本時間でフォーマット（UTCとして保存された日時を日本時間として表示）
const formatDateTime = (dateString: string) => {
  // UTCとして保存された日時を取得
  const date = new Date(dateString);
  // UTC時刻を取得して日本時間として表示
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export default function LeaveRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  const [leaveType, setLeaveType] = useState('年次');
  const [absenceType, setAbsenceType] = useState('休暇');
  const [department, setDepartment] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managers, setManagers] = useState<DepartmentManager[]>([]);

  // 過去の申請履歴
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    setDepartment(userData.department || '');
    setEmployeeName(userData.name || '');

    loadMyRequests(token);
    loadAllManagers(token);
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

  // 日数・時間数は手動入力

  const loadMyRequests = async (token: string) => {
    try {
      const response = await fetch('/api/leave-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyRequests(data);
      }
    } catch (error) {
      console.error('申請履歴の取得に失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('ログインが必要です');
      router.push('/');
      return;
    }

    if (!startDate || !endDate || !startTime || !endTime) {
      alert('日時を入力してください');
      return;
    }

    const finalReason = selectedReason === 'その他' ? customReason : selectedReason;
    if (!finalReason) {
      alert('理由を選択または入力してください');
      return;
    }

    if (!selectedManagerId) {
      alert('承認者を選択してください');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leaveType,
          absenceType,
          department,
          employeeName,
          reason: finalReason,
          startDate: `${startDate}T${startTime}`,
          endDate: `${endDate}T${endTime}`,
          days,
          hours,
          assignedDepartmentManagerId: selectedManagerId,
        }),
      });

      if (response.ok) {
        alert('有給申請を提出しました');
        // フォームをリセット
        setSelectedReason('');
        setCustomReason('');
        setStartDate('');
        setEndDate('');
        setStartTime('09:00');
        setEndTime('18:00');
        setDays(0);
        setHours(0);
        // 申請履歴を再読み込み
        loadMyRequests(token);
      } else {
        const data = await response.json();
        alert(data.error || '申請の提出に失敗しました');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('申請の提出に失敗しました');
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
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">有給申請</h1>
              <p className="text-sm text-gray-600 mt-1">{user.name}（{user.department}）</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← 戻る
            </button>
          </div>
        </div>

        {/* 申請フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">新規申請</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 届出の種類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                届出の種類
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="年次">年次</option>
                <option value="病気">病気</option>
                <option value="特別">特別</option>
              </select>
            </div>

            {/* 休暇/欠勤 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                休暇/欠勤
              </label>
              <select
                value={absenceType}
                onChange={(e) => setAbsenceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="休暇">休暇</option>
                <option value="欠勤">欠勤</option>
              </select>
            </div>

            {/* 所属部署 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所属部署
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* 氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* 理由 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                理由
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                required
              >
                <option value="">選択してください</option>
                {REASON_OPTIONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {selectedReason === 'その他' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="理由を入力してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              )}
            </div>

            {/* 開始日時 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時刻
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* 終了日時 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了時刻
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* 日数・時間数（手動入力） */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日間
                </label>
                <input
                  type="number"
                  value={days || ''}
                  onChange={(e) => setDays(e.target.value ? parseFloat(e.target.value) : 0)}
                  step="0.5"
                  min="0"
                  placeholder="例: 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時間
                </label>
                <input
                  type="number"
                  value={hours || ''}
                  onChange={(e) => setHours(e.target.value ? parseFloat(e.target.value) : 0)}
                  step="0.5"
                  min="0"
                  placeholder="例: 8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* 申請先（各部署の管理者） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申請先（各部署の管理者）
              </label>
              {managers.length === 0 ? (
                <p className="text-sm text-gray-500">管理者を読み込み中...</p>
              ) : (
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? '提出中...' : '申請を提出する'}
            </button>
          </form>
        </div>

        {/* 申請履歴 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">申請履歴</h2>
          {myRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">申請履歴はありません</p>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">{request.leaveType}</span>
                      <span className="text-gray-500 mx-2">・</span>
                      <span className="text-gray-700">{request.absenceType}</span>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">理由: {request.reason}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    期間: {formatDateTime(request.startDate)} 〜 {formatDateTime(request.endDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.days}日間（{request.hours}時間）
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    申請日: {formatDateTime(request.createdAt)}
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

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}


    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}


    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}


    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

    </div>
  );
}

