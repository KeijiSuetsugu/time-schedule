import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { getCutoffPeriod, getCutoffPeriodByYearMonth, getYearPeriod } from '@/lib/cutoff';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TimeCardRecord {
  date: Date;
  clockIn: Date;
  clockOut: Date;
  workTime: string;
  workMinutes: number;
  location: string;
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
      });
    } else {
      // どちらも指定されていない場合は、ログインユーザー自身
      targetUsers = [{ id: userId, name: user.name, department: user.department }];
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: '対象ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 全ユーザーの打刻履歴を取得して処理
    const allRecords: Array<{ userName: string; userDepartment: string; records: TimeCardRecord[] }> = [];

    for (const targetUser of targetUsers) {
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

      // 出勤・退勤をペアにして勤務時間を計算
      const records: TimeCardRecord[] = [];
      let clockIn: typeof timeCards[0] | null = null;

      for (const timeCard of timeCards) {
        if (timeCard.type === 'clock_in') {
          clockIn = timeCard;
        } else if (timeCard.type === 'clock_out' && clockIn) {
          const workTime = (timeCard.timestamp.getTime() - clockIn.timestamp.getTime()) / (1000 * 60); // 分
          const hours = Math.floor(workTime / 60);
          const minutes = Math.floor(workTime % 60);

          records.push({
            date: clockIn.timestamp,
            clockIn: clockIn.timestamp,
            clockOut: timeCard.timestamp,
            workTime: `${hours}:${String(minutes).padStart(2, '0')}`,
            workMinutes: workTime,
            location: clockIn.location?.name || '-',
          });

          clockIn = null;
        }
      }

      allRecords.push({
        userName: targetUser.name,
        userDepartment: targetUser.department || '部署未設定',
        records,
      });
    }

    // 表示名を決定
    const displayName = department 
      ? `${department}` 
      : targetUsers.length === 1 
        ? targetUsers[0].name 
        : '全職員';

    if (format === 'excel') {
      return generateExcelMultiUser(displayName, period.periodLabel, allRecords);
    } else if (format === 'pdf') {
      return generatePDFMultiUser(displayName, period.periodLabel, allRecords);
    } else {
      return NextResponse.json({
        period: period.periodLabel,
        users: allRecords.map(u => ({
          userName: u.userName,
          userDepartment: u.userDepartment,
          records: u.records.map(r => ({
            date: r.date.toISOString(),
            clockIn: r.clockIn.toISOString(),
            clockOut: r.clockOut.toISOString(),
            workTime: r.workTime,
            location: r.location,
          })),
        })),
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

async function generateExcelMultiUser(
  displayName: string,
  periodLabel: string,
  allRecords: Array<{ userName: string; userDepartment: string; records: TimeCardRecord[] }>
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('打刻履歴');

  // タイトル行を追加
  worksheet.addRow([`${displayName} - 打刻履歴 (${periodLabel})`]);
  worksheet.mergeCells(1, 1, 1, 6);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.addRow([]); // 空行

  // 各ユーザーのデータを追加
  for (const userRecord of allRecords) {
    // ユーザー名と部署
    const userRow = worksheet.addRow([`${userRecord.userName} (${userRecord.userDepartment})`]);
    userRow.font = { bold: true, size: 12 };
    worksheet.mergeCells(userRow.number, 1, userRow.number, 6);
    userRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAD3' },
    };

    // ヘッダー行
    const headerRow = worksheet.addRow(['日付', '出勤時刻', '退勤時刻', '勤務時間', '場所']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // データ行
    userRecord.records.forEach((record) => {
      worksheet.addRow([
        record.date.toLocaleDateString('ja-JP'),
        record.clockIn.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        record.clockOut.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        record.workTime,
        record.location,
      ]);
    });

    // 合計行
    const totalMinutes = userRecord.records.reduce((sum, r) => sum + r.workMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = Math.floor(totalMinutes % 60);
    const totalRow = worksheet.addRow(['合計', '', '', `${totalHours}:${String(totalMins).padStart(2, '0')}`, '']);
    totalRow.font = { bold: true };

    // 空行を追加
    worksheet.addRow([]);
  }

  // 列幅を設定
  worksheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
  ];

  // バッファに書き込み
  const buffer = await workbook.xlsx.writeBuffer();

  // ファイル名を生成
  const fileName = `打刻履歴_${displayName}_${periodLabel}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}

async function generateExcel(userName: string, periodLabel: string, records: TimeCardRecord[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('打刻履歴');

  // タイトル行を追加
  worksheet.addRow([`${userName} - 打刻履歴 (${periodLabel})`]);
  worksheet.mergeCells(1, 1, 1, 5);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.addRow([]); // 空行

  // ヘッダー行
  const headerRow = worksheet.addRow(['日付', '出勤時刻', '退勤時刻', '勤務時間', '場所']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // データ行
  records.forEach((record) => {
    worksheet.addRow([
      record.date.toLocaleDateString('ja-JP'),
      record.clockIn.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      record.clockOut.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      record.workTime,
      record.location,
    ]);
  });

  // 合計行
  const totalMinutes = records.reduce((sum, r) => sum + r.workMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.floor(totalMinutes % 60);
  const totalRow = worksheet.addRow(['合計', '', '', `${totalHours}:${String(totalMins).padStart(2, '0')}`, '']);
  totalRow.font = { bold: true };

  // 列幅を設定
  worksheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
  ];

  // バッファに書き込み
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="打刻履歴_${periodLabel.replace(/\s/g, '_')}.xlsx"`,
    },
  });
}

async function generatePDFMultiUser(
  displayName: string,
  periodLabel: string,
  allRecords: Array<{ userName: string; userDepartment: string; records: TimeCardRecord[] }>
): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const fileName = `打刻履歴_${displayName}_${periodLabel}.pdf`;
      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          },
        })
      );
    });
    doc.on('error', reject);

    // タイトル
    doc.fontSize(16).font('Helvetica-Bold').text(`${displayName} - 打刻履歴`, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`期間: ${periodLabel}`, { align: 'center' });
    doc.moveDown();

    // 各ユーザーのデータを追加
    for (const userRecord of allRecords) {
      // ユーザー名と部署
      doc.fontSize(14).font('Helvetica-Bold').text(`${userRecord.userName} (${userRecord.userDepartment})`);
      doc.moveDown(0.5);

      // テーブルヘッダー
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('日付', 50, tableTop);
      doc.text('出勤', 120, tableTop);
      doc.text('退勤', 180, tableTop);
      doc.text('勤務時間', 240, tableTop);
      doc.text('場所', 310, tableTop);

      // データ行
      let y = tableTop + 20;
      doc.font('Helvetica');
      userRecord.records.forEach((record) => {
        doc.fontSize(9);
        doc.text(record.date.toLocaleDateString('ja-JP'), 50, y);
        doc.text(record.clockIn.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), 120, y);
        doc.text(record.clockOut.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), 180, y);
        doc.text(record.workTime, 240, y);
        doc.text(record.location, 310, y);
        y += 20;

        // ページが足りなくなったら新しいページを追加
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // 合計行
      const totalMinutes = userRecord.records.reduce((sum, r) => sum + r.workMinutes, 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalMins = Math.floor(totalMinutes % 60);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('合計', 50, y);
      doc.text(`${totalHours}:${String(totalMins).padStart(2, '0')}`, 240, y);

      // 次のユーザーのために改ページ
      if (allRecords.indexOf(userRecord) < allRecords.length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  });
}

async function generatePDF(userName: string, periodLabel: string, records: TimeCardRecord[]): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="打刻履歴_${periodLabel.replace(/\s/g, '_')}.pdf"`,
          },
        })
      );
    });
    doc.on('error', reject);

    // タイトル
    doc.fontSize(16).font('Helvetica-Bold').text(`${userName} - 打刻履歴`, { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`期間: ${periodLabel}`, { align: 'center' });
    doc.moveDown();

    // テーブルヘッダー
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('日付', 50, tableTop);
    doc.text('出勤', 120, tableTop);
    doc.text('退勤', 180, tableTop);
    doc.text('勤務時間', 240, tableTop);
    doc.text('場所', 310, tableTop);

    // データ行
    let y = tableTop + 20;
    doc.font('Helvetica');
    records.forEach((record) => {
      doc.fontSize(9);
      doc.text(record.date.toLocaleDateString('ja-JP'), 50, y);
      doc.text(record.clockIn.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), 120, y);
      doc.text(record.clockOut.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), 180, y);
      doc.text(record.workTime, 240, y);
      doc.text(record.location, 310, y);
      y += 20;

      // ページ分割
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // 合計
    const totalMinutes = records.reduce((sum, r) => sum + r.workMinutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = Math.floor(totalMinutes % 60);
    doc.font('Helvetica-Bold');
    doc.text('合計', 50, y);
    doc.text(`${totalHours}:${String(totalMins).padStart(2, '0')}`, 240, y);

    doc.end();
  });
}

