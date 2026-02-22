import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { getCutoffPeriod, getCutoffPeriodByYearMonth, getYearPeriod } from '@/lib/cutoff';
import ExcelJS from 'exceljs';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TimeCardRecord {
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  workTime: string;
  workMinutes: number;
  isLeave?: boolean;
  overtimeStart?: string;
  overtimeEnd?: string;
  overtimeHours?: string;
}

// 打刻履歴のエクスポート（Excel/PDF）- 管理者のみ
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザー情報を取得して管理者権限をチェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 管理者権限チェック
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'excel' or 'pdf'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const targetUserId = searchParams.get('userId'); // 管理者が他のユーザーのデータを取得する場合
    const department = searchParams.get('department'); // 部署フィルター
    const periodType = searchParams.get('periodType') || 'monthly'; // 'monthly' or 'yearly'

    // 期間を計算
    let period;
    if (periodType === 'yearly' && year) {
      // 年間データ
      period = getYearPeriod(year);
    } else if (year && month) {
      // 15日締めの月次データ
      period = getCutoffPeriodByYearMonth(year, month);
    } else {
      // 現在の15日締め期間
      period = getCutoffPeriod();
    }

    // 対象ユーザーを決定
    let targetUsers: Array<{ id: string; name: string; department?: string | null }> = [];
    
    if (targetUserId) {
      // 特定のユーザーが指定されている場合
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, department: true },
      });
      if (targetUser) {
        targetUsers = [targetUser];
      }
    } else if (department) {
      // 部署が指定されている場合、その部署の全ユーザー
      targetUsers = await prisma.user.findMany({
        where: { department },
        select: { id: true, name: true, department: true },
        orderBy: { name: 'asc' },
      });
    } else {
      // どちらも指定されていない場合は、全ユーザー（管理者権限）
      targetUsers = await prisma.user.findMany({
        select: { id: true, name: true, department: true },
        orderBy: [
          { department: 'asc' },
          { name: 'asc' },
        ],
      });
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: '対象ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('Target users:', targetUsers.length);
    console.log('Target users list:', targetUsers.map(u => ({ name: u.name, department: u.department })));
    console.log('Period:', period);

    // 全ユーザーの打刻履歴を取得して処理
    const allRecords: Array<{ userName: string; userDepartment: string; records: TimeCardRecord[] }> = [];

    for (const targetUser of targetUsers) {
      console.log('Processing user:', targetUser.name, 'Department:', targetUser.department);
      // 打刻履歴を取得
      const timeCards = await prisma.timeCard.findMany({
        where: {
          userId: targetUser.id,
          timestamp: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
        orderBy: { timestamp: 'asc' },
        include: {
          location: true,
        },
      });

      // 時間外業務届を取得（承認済みのみ）
      const overtimeRequests = await prisma.overtimeRequest.findMany({
        where: {
          userId: targetUser.id,
          status: 'approved',
          overtimeDate: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
        orderBy: { overtimeDate: 'asc' },
      });

      // 有給申請を取得（承認済みのみ）
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          userId: targetUser.id,
          status: 'approved',
          startDate: { lte: period.endDate },
          endDate: { gte: period.startDate },
        },
        orderBy: { startDate: 'asc' },
      });

      // 有給日セット（JST日付文字列 "YYYY-MM-DD"）を構築
      const leaveDateSet = new Set<string>();
      for (const leave of leaveRequests) {
        const leaveStartJST = new Date(leave.startDate.getTime() + 9 * 60 * 60 * 1000);
        const leaveEndJST = new Date(leave.endDate.getTime() + 9 * 60 * 60 * 1000);
        const periodStartJST = new Date(period.startDate.getTime() + 9 * 60 * 60 * 1000);
        const periodEndJST = new Date(period.endDate.getTime() + 9 * 60 * 60 * 1000);

        const effectiveStart = leaveStartJST < periodStartJST ? periodStartJST : leaveStartJST;
        const effectiveEnd = leaveEndJST > periodEndJST ? periodEndJST : leaveEndJST;

        const current = new Date(
          Date.UTC(effectiveStart.getUTCFullYear(), effectiveStart.getUTCMonth(), effectiveStart.getUTCDate())
        );
        const end = new Date(
          Date.UTC(effectiveEnd.getUTCFullYear(), effectiveEnd.getUTCMonth(), effectiveEnd.getUTCDate())
        );

        while (current <= end) {
          leaveDateSet.add(current.toISOString().slice(0, 10));
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }

      // 出勤・退勤をペアにして勤務時間を計算
      const records: TimeCardRecord[] = [];
      const timeCardDateSet = new Set<string>();
      let clockIn: typeof timeCards[0] | null = null;

      for (const timeCard of timeCards) {
        if (timeCard.type === 'clock_in') {
          clockIn = timeCard;
        } else if (timeCard.type === 'clock_out' && clockIn) {
          const workTime = (timeCard.timestamp.getTime() - clockIn.timestamp.getTime()) / (1000 * 60); // 分
          const hours = Math.floor(workTime / 60);
          const minutes = Math.floor(workTime % 60);

          // タイムカードがある日付を記録（JST）
          const clockInJST = new Date(clockIn.timestamp.getTime() + 9 * 60 * 60 * 1000);
          const dateKey = clockInJST.toISOString().slice(0, 10);
          timeCardDateSet.add(dateKey);

          // この日付の時間外業務を探す
          const clockInDate = new Date(clockIn.timestamp);
          clockInDate.setHours(0, 0, 0, 0);
          const overtimeForDay = overtimeRequests.find(ot => {
            const otDate = new Date(ot.overtimeDate);
            otDate.setHours(0, 0, 0, 0);
            return otDate.getTime() === clockInDate.getTime();
          });

          let overtimeStart: string | undefined;
          let overtimeEnd: string | undefined;
          let overtimeHours: string | undefined;

          if (overtimeForDay) {
            const startDate = new Date(overtimeForDay.startTime);
            const endDate = new Date(overtimeForDay.endTime);
            const overtimeMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
            const otHours = Math.floor(overtimeMinutes / 60);
            const otMinutes = Math.floor(overtimeMinutes % 60);

            overtimeStart = `${String(startDate.getUTCHours()).padStart(2, '0')}:${String(startDate.getUTCMinutes()).padStart(2, '0')}`;
            overtimeEnd = `${String(endDate.getUTCHours()).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`;
            overtimeHours = `${otHours}:${String(otMinutes).padStart(2, '0')}`;
          }

          records.push({
            date: clockIn.timestamp,
            clockIn: clockIn.timestamp,
            clockOut: timeCard.timestamp,
            workTime: `${hours}:${String(minutes).padStart(2, '0')}`,
            workMinutes: workTime,
            overtimeStart,
            overtimeEnd,
            overtimeHours,
          });

          clockIn = null;
        }
      }

      // 退勤漏れ処理：ループ後にclockInが残っていれば退勤なしレコードを追加
      if (clockIn !== null) {
        const clockInJST = new Date(clockIn.timestamp.getTime() + 9 * 60 * 60 * 1000);
        const dateKey = clockInJST.toISOString().slice(0, 10);
        timeCardDateSet.add(dateKey);
        records.push({
          date: clockIn.timestamp,
          clockIn: clockIn.timestamp,
          clockOut: undefined,
          workTime: '',
          workMinutes: 0,
        });
      }

      // 有給レコード追加：タイムカードのない有給日を行として追加
      for (const dateStr of leaveDateSet) {
        if (!timeCardDateSet.has(dateStr)) {
          records.push({
            date: new Date(dateStr + 'T00:00:00Z'),
            isLeave: true,
            workTime: '',
            workMinutes: 0,
          });
        }
      }

      // 日付でソート
      records.sort((a, b) => a.date.getTime() - b.date.getTime());

      // データがなくてもユーザー情報は追加
      allRecords.push({
        userName: targetUser.name,
        userDepartment: targetUser.department || '部署未設定',
        records,
      });
      
      console.log(`User ${targetUser.name} has ${records.length} records`);
    }

    console.log('All records processed:', allRecords.length);

    // データチェック：全ユーザーがデータ0件の場合も許可
    const totalRecordsCount = allRecords.reduce((sum, r) => sum + r.records.length, 0);
    console.log('Total timecard records:', totalRecordsCount);

    // 表示名を決定
    const displayName = department 
      ? `${department}` 
      : targetUsers.length === 1 
        ? targetUsers[0].name 
        : '全職員';

    console.log('Display name:', displayName);
    console.log('All records count:', allRecords.length);
    console.log('Format:', format);

    if (format === 'excel') {
      console.log('Generating Excel...');
      try {
        return await generateExcelMultiUser(displayName, period.periodLabel, allRecords);
      } catch (excelError) {
        console.error('Excel generation error:', excelError);
        throw new Error(`Excel生成エラー: ${excelError instanceof Error ? excelError.message : 'Unknown'}`);
      }
    } else {
      return NextResponse.json({
        period: period.periodLabel,
        users: allRecords.map(u => ({
          userName: u.userName,
          userDepartment: u.userDepartment,
          records: u.records.map(r => ({
            date: r.date.toISOString(),
            clockIn: r.clockIn?.toISOString() || null,
            clockOut: r.clockOut?.toISOString() || null,
            workTime: r.workTime,
            overtimeStart: r.overtimeStart,
            overtimeEnd: r.overtimeEnd,
            overtimeHours: r.overtimeHours,
          })),
        })),
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    
    // より詳細なエラー情報を取得
    let errorInfo = 'エラー情報なし';
    try {
      errorInfo = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error('Full error:', errorInfo);
    } catch (e) {
      console.error('Failed to stringify error');
    }
    
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました',
        message: errorMessage,
        details: errorStack || errorInfo,
        type: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function generateExcelMultiUser(
  displayName: string,
  periodLabel: string,
  allRecords: Array<{ userName: string; userDepartment: string; records: TimeCardRecord[] }>
) {
  try {
    console.log('generateExcelMultiUser called with:', { displayName, periodLabel, recordsCount: allRecords.length });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('打刻履歴');

  // タイトル行を追加
  worksheet.addRow([`${displayName} - 打刻履歴 (${periodLabel})`]);
  worksheet.mergeCells(1, 1, 1, 8);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.addRow([]); // 空行

  // 各ユーザーのデータを追加
  for (const userRecord of allRecords) {
    // ユーザー名と部署
    const userRow = worksheet.addRow([`${userRecord.userName} (${userRecord.userDepartment})`]);
    userRow.font = { bold: true, size: 12 };
    worksheet.mergeCells(userRow.number, 1, userRow.number, 8);
    userRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAD3' },
    };

    // ヘッダー行
    const headerRow = worksheet.addRow(['日付', '出勤時刻', '退勤時刻', '勤務時間', '時間外開始', '時間外終了', '時間外総時間']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // データ行
    if (userRecord.records.length === 0) {
      // データがない場合
      worksheet.addRow(['データなし', '', '', '0:00', '', '', '']);
    } else {
      userRecord.records.forEach((record) => {
        const dateStr = record.date.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

        // 有給行：出勤時刻欄に「有休」、他は空欄
        if (record.isLeave) {
          worksheet.addRow([dateStr, '有休', '', '', '', '', '']);
          return;
        }

        // 日本時間として表示（UTCからJST +9時間）
        const clockInJST = new Date(record.clockIn!.getTime() + 9 * 60 * 60 * 1000);
        const clockInTime = `${String(clockInJST.getUTCHours()).padStart(2, '0')}:${String(clockInJST.getUTCMinutes()).padStart(2, '0')}`;

        // 退勤漏れ：clockOutがなければ空欄
        let clockOutTime = '';
        if (record.clockOut) {
          const clockOutJST = new Date(record.clockOut.getTime() + 9 * 60 * 60 * 1000);
          clockOutTime = `${String(clockOutJST.getUTCHours()).padStart(2, '0')}:${String(clockOutJST.getUTCMinutes()).padStart(2, '0')}`;
        }

        worksheet.addRow([
          dateStr,
          clockInTime,
          clockOutTime,
          record.workTime,
          record.overtimeStart || '',
          record.overtimeEnd || '',
          record.overtimeHours || '',
        ]);
      });
    }

    // 合計行
    const totalMinutes = userRecord.records.reduce((sum, r) => sum + r.workMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = Math.floor(totalMinutes % 60);
    const totalRow = worksheet.addRow(['合計', '', '', `${totalHours}:${String(totalMins).padStart(2, '0')}`, '', '', '']);
    totalRow.font = { bold: true };

    // 空行を追加
    worksheet.addRow([]);
  }

  // 列幅を設定
  worksheet.columns = [
    { width: 12 },  // 日付
    { width: 12 },  // 出勤時刻
    { width: 12 },  // 退勤時刻
    { width: 12 },  // 勤務時間
    { width: 14 },  // 時間外開始
    { width: 14 },  // 時間外終了
    { width: 14 },  // 時間外総時間
  ];

    // バッファに書き込み
    console.log('Writing Excel buffer...');
    const excelBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(excelBuffer);
    console.log('Excel buffer created, size:', buffer.length);

    // ファイル名を生成
    const fileName = `打刻履歴_${displayName}_${periodLabel}.xlsx`;
    console.log('Excel file name:', fileName);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('Error in generateExcelMultiUser:', error);
    throw error;
  }
}

