'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

interface TimeCard {
  id: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

interface PendingCounts {
  timecardRequests: number;
  leaveRequests: number;
  overtimeRequests: number;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [timeCards, setTimeCards] = useState<TimeCard[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'in' | 'out' | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string; department?: string }>>([]);
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    timecardRequests: 0,
    leaveRequests: 0,
    overtimeRequests: 0,
    total: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);
    loadTimeCards();
    checkCurrentStatus();
    
    // 管理者の場合は職員一覧と未承認件数を取得
    if (userData.role === 'admin') {
      loadEmployees();
      loadPendingCounts();
    }
  }, [router]);

  // 定期的に未承認件数を更新（管理者のみ）
  useEffect(() => {
    if (user?.role === 'admin') {
      const interval = setInterval(() => {
        loadPendingCounts();
      }, 30000); // 30秒ごとに更新

      return () => clearInterval(interval);
    }
  }, [user]);

  // ページが表示された時に件数を更新（管理画面から戻った時用）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.role === 'admin') {
        loadPendingCounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Load employees error:', error);
    }
  };

  const loadPendingCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pending-counts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCounts(data);
      }
    } catch (error) {
      console.error('Load pending counts error:', error);
    }
  };

  const checkCurrentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timecard?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.timeCards && data.timeCards.length > 0) {
          setCurrentStatus(data.timeCards[0].type === 'clock_in' ? 'in' : 'out');
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timecard?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimeCards(data.timeCards || []);
      }
    } catch (error) {
      console.error('Load timecards error:', error);
    }
  };

  const handleClock = async (type: 'clock_in' | 'clock_out') => {
    setClockingIn(true);
    setLocationError('');
    setGettingLocation(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // 位置情報を取得（必須）
      let latitude: number;
      let longitude: number;
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve, 
            reject, 
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        setGettingLocation(false);
      } catch (geoError: any) {
        setGettingLocation(false);
        const errorMessage = geoError.code === 1 
          ? '位置情報の取得が拒否されました。ブラウザの設定で位置情報の許可を有効にしてください。'
          : geoError.code === 2
          ? '位置情報を取得できませんでした。GPSが有効か確認してください。'
          : '位置情報の取得に時間がかかりすぎました。もう一度お試しください。';
        setLocationError(errorMessage);
        setClockingIn(false);
        return;
      }

      const response = await fetch('/api/timecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        let errorMessage = '打刻に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `サーバーエラー (${response.status})`;
          // 位置情報エラーの詳細を表示
          if (errorData.allowedLocations && errorData.allowedLocations.length > 0) {
            const locationsInfo = errorData.allowedLocations
              .map((loc: any) => `${loc.name} (半径${loc.radius}m)`)
              .join('\n');
            errorMessage = `${errorMessage}\n\n許可された場所:\n${locationsInfo}`;
          }
        } catch {
          errorMessage = `サーバーエラー (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // 状態を更新
      setCurrentStatus(type === 'clock_in' ? 'in' : 'out');
      await loadTimeCards();
      
      const locationName = data.timeCard?.locationName ? ` (${data.timeCard.locationName})` : '';
      alert(`${type === 'clock_in' ? '出勤' : '退勤'}打刻が完了しました${locationName}`);
    } catch (error: any) {
      let errorMessage = '打刻に失敗しました';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message && error.message.includes('fetch')) {
        errorMessage = 'ネットワークエラー: サーバーに接続できません。インターネット接続を確認してください。';
      } else {
        errorMessage = `エラー: ${error.toString()}`;
      }
      setLocationError(errorMessage);
      alert(errorMessage);
      console.error('Clock error:', error);
    } finally {
      setClockingIn(false);
      setGettingLocation(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleExport = async () => {
    const format = 'excel';
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/timecard/export?format=${format}&periodType=${periodType}&year=${selectedYear}`;
      
      if (periodType === 'monthly') {
        url += `&month=${selectedMonth}`;
      }
      
      if (selectedEmployeeId) {
        url += `&userId=${selectedEmployeeId}`;
      }
      
      if (selectedDepartment) {
        url += `&department=${encodeURIComponent(selectedDepartment)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'エクスポートに失敗しました';
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `サーバーエラー (${response.status})`;
          errorDetails = errorData.details || '';
          // 詳細なエラー情報をコンソールに出力
          console.error('Export API error:', errorData);
          console.error('Error details:', errorDetails);
          
          // エラーの詳細をアラートに表示
          if (errorDetails) {
            errorMessage += `\n\n詳細: ${errorDetails}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `サーバーエラー (${response.status})`;
          // レスポンステキストを取得
          try {
            const text = await response.text();
            console.error('Response text:', text);
            if (text) {
              errorMessage += `\n\n${text.substring(0, 200)}`;
            }
          } catch {
            // テキスト取得失敗
          }
        }
        throw new Error(errorMessage);
      }

      // ファイルをダウンロード
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `打刻履歴.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      alert('Excelファイルをダウンロードしました');
    } catch (error: any) {
      let errorMessage = 'エクスポートに失敗しました';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message && error.message.includes('fetch')) {
        errorMessage = 'ネットワークエラー: サーバーに接続できません。インターネット接続を確認してください。';
      } else {
        errorMessage = `エラー: ${error.toString()}`;
      }
      alert(errorMessage);
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  // 年と月の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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

  return (
    <div className="min-h-screen pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">タイムカード</h1>
            <p className="text-sm text-gray-600">{user?.name}さん</p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin/locations')}
                className="text-sm text-primary-600 hover:text-primary-700 px-3 py-1 rounded"
              >
                場所設定
              </button>
            )}
            <button
              onClick={() => router.push('/profile')}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded font-semibold"
            >
              ⚙️ 設定
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ユーザー情報 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              {user?.department && (
                <p className="text-sm text-gray-600 mt-1">部署: {user.department}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">現在の時刻</p>
              <p className="text-2xl font-bold text-gray-900">
                {format(new Date(), 'HH:mm:ss', { locale: ja })}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(), 'yyyy年MM月dd日(E)', { locale: ja })}
              </p>
            </div>
          </div>
        </div>

        {/* 打刻ボタン */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">打刻</h2>
          
          {gettingLocation && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                📍 位置情報を取得しています...
              </p>
            </div>
          )}
          
          {locationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 whitespace-pre-line">
                {locationError}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => handleClock('clock_in')}
              disabled={clockingIn || currentStatus === 'in' || gettingLocation}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                currentStatus === 'in' || gettingLocation
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
              }`}
            >
              {gettingLocation ? '位置情報取得中...' : clockingIn ? '処理中...' : '出勤'}
            </button>

            <button
              onClick={() => handleClock('clock_out')}
              disabled={clockingIn || currentStatus === 'out' || gettingLocation}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                currentStatus === 'out' || gettingLocation
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
              }`}
            >
              {gettingLocation ? '位置情報取得中...' : clockingIn ? '処理中...' : '退勤'}
            </button>
          </div>

          {currentStatus && (
            <p className="mt-4 text-sm text-center text-gray-600">
              現在の状態: {currentStatus === 'in' ? '出勤中' : '退勤済み'}
            </p>
          )}
        </div>

        {/* 履歴 */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">打刻履歴</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showHistory ? '閉じる' : '詳細を見る'}
            </button>
          </div>

          {showHistory && (
            <div className="space-y-2">
              {timeCards.length === 0 ? (
                <p className="text-gray-500 text-center py-4">打刻履歴がありません</p>
              ) : (
                timeCards.map((timeCard) => (
                  <div
                    key={timeCard.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${
                          timeCard.type === 'clock_in'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {timeCard.type === 'clock_in' ? '出勤' : '退勤'}
                      </span>
                      <span className="text-sm text-gray-700">
                        {format(new Date(timeCard.timestamp), 'MM/dd HH:mm', { locale: ja })}
                        {timeCard.locationName && ` - ${timeCard.locationName}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 打刻申請 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">打刻漏れ申請</h2>
          <p className="text-sm text-gray-600 mb-4">
            打刻を忘れた場合は、こちらから申請してください。管理者が承認すると打刻履歴に反映されます。
          </p>
          <button
            onClick={() => router.push('/timecard-request')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            打刻漏れを申請する
          </button>
        </div>

        {/* 有給申請 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">有給申請</h2>
          <p className="text-sm text-gray-600 mb-4">
            休暇や欠勤の申請を行います。管理者が承認します。
          </p>
          <button
            onClick={() => router.push('/leave-request')}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            有給を申請する
          </button>
        </div>

        {/* プロフィール設定 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">⚙️ プロフィール設定</h2>
          <p className="text-sm text-gray-600 mb-4">
            メールアドレスやパスワードを変更できます。
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
          >
            設定を変更する
          </button>
        </div>

        {/* 時間外業務届 */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">時間外業務届</h2>
          <p className="text-sm text-gray-600 mb-4">
            時間外業務の申請を行います。管理者が承認します。
          </p>
          <button
            onClick={() => router.push('/overtime-request')}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            時間外業務届を申請する
          </button>
        </div>

        {/* 管理者用：申請管理 */}
        {user?.role === 'admin' && (
          <>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">👥 ユーザー管理</h2>
              <p className="text-sm text-gray-600 mb-4">
                管理者権限の付与・削除を行えます。
              </p>
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-orange-500/50"
              >
                ユーザーを管理する
              </button>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">打刻申請管理</h2>
              <p className="text-sm text-gray-600 mb-4">
                職員からの打刻漏れ申請を確認・承認できます。
              </p>
              <button
                onClick={() => {
                  router.push('/admin/timecard-requests');
                  loadPendingCounts(); // 画面遷移後に件数を更新
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/50 relative"
              >
                申請を管理する
                {pendingCounts.timecardRequests > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                    {pendingCounts.timecardRequests}
                  </span>
                )}
            </button>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">有給申請管理</h2>
            <p className="text-sm text-gray-600 mb-4">
              職員からの有給申請を確認・承認できます。
            </p>
            <button
              onClick={() => {
                router.push('/admin/leave-requests');
                loadPendingCounts(); // 画面遷移後に件数を更新
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-pink-500/50 relative"
            >
              有給申請を管理する
              {pendingCounts.leaveRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                  {pendingCounts.leaveRequests}
                </span>
              )}
            </button>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">時間外業務届管理</h2>
            <p className="text-sm text-gray-600 mb-4">
              職員からの時間外業務届を確認・承認できます。
            </p>
            <button
              onClick={() => {
                router.push('/admin/overtime-requests');
                loadPendingCounts(); // 画面遷移後に件数を更新
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-purple-500/50 relative"
            >
              時間外業務届を管理する
              {pendingCounts.overtimeRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                  {pendingCounts.overtimeRequests}
                </span>
              )}
            </button>
          </div>
          </>
        )}

        {/* エクスポート */}
        {user?.role === 'admin' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">打刻履歴のエクスポート</h2>
            <p className="text-sm text-gray-600 mb-4">
              部署または職員を選択して、月次または年間の打刻データをExcel形式でダウンロードできます。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>📋 エクスポート方法:</strong><br/>
                • <strong>全職員</strong>: 部署も職員も選択せずにダウンロード<br/>
                • <strong>特定の部署</strong>: 部署のみ選択してダウンロード<br/>
                • <strong>特定の職員</strong>: 職員を選択してダウンロード<br/>
                <br/>
                ※ Excel形式（.xlsx）でダウンロードされます
              </p>
            </div>

            <div className="space-y-4">
              {/* 部署選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  部署でフィルター
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedEmployeeId(''); // 部署を変更したら職員選択をリセット
                  }}
                  className="input-field"
                >
                  <option value="">全部署</option>
                  <option value="看護師">看護師</option>
                  <option value="クラーク">クラーク</option>
                  <option value="放射線科">放射線科</option>
                  <option value="リハビリ">リハビリ</option>
                  <option value="リハ助手">リハ助手</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              {/* 職員選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  職員を選択
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="input-field"
                >
                  <option value="">
                    {selectedDepartment ? `${selectedDepartment}の全職員` : '全職員'}
                  </option>
                  {employees
                    .filter((employee) => !selectedDepartment || employee.department === selectedDepartment)
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.department || '部署未設定'})
                      </option>
                    ))}
                </select>
              </div>

              {/* 期間タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期間タイプ
                </label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'yearly')}
                  className="input-field"
                >
                  <option value="monthly">15日締め月次</option>
                  <option value="yearly">年間</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="input-field"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                </div>

                {periodType === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      月
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}月
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>処理中...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Excelでダウンロード</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

