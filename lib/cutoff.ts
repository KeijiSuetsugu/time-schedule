import { startOfMonth, endOfMonth, subMonths, addMonths, format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';

/**
 * 15日締めの期間を計算
 * @param date 基準日
 * @returns { startDate: Date, endDate: Date, periodLabel: string }
 */
export function getCutoffPeriod(date: Date = new Date()) {
  const day = date.getDate();
  
  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (day <= 15) {
    // 1-15日の場合: 前月16日〜当月15日
    const lastMonth = subMonths(date, 1);
    startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 16);
    endDate = new Date(date.getFullYear(), date.getMonth(), 15);
    periodLabel = `${format(startDate, 'yyyy年MM月', { locale: ja })}16日 〜 ${format(endDate, 'yyyy年MM月', { locale: ja })}15日`;
  } else {
    // 16-31日の場合: 当月16日〜翌月15日
    startDate = new Date(date.getFullYear(), date.getMonth(), 16);
    const nextMonth = addMonths(date, 1);
    endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15);
    periodLabel = `${format(startDate, 'yyyy年MM月', { locale: ja })}16日 〜 ${format(endDate, 'yyyy年MM月', { locale: ja })}15日`;
  }

  // 時刻を00:00:00に設定
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate, periodLabel };
}

/**
 * 指定された年月の15日締め期間を取得
 * @param year 年
 * @param month 月（1-12）
 * @returns { startDate: Date, endDate: Date, periodLabel: string }
 */
export function getCutoffPeriodByYearMonth(year: number, month: number) {
  // 15日を基準日として期間を計算
  const date = new Date(year, month - 1, 15);
  return getCutoffPeriod(date);
}

/**
 * 年間の期間を計算
 * @param year 年
 * @returns { startDate: Date, endDate: Date, periodLabel: string }
 */
export function getYearPeriod(year: number) {
  const startDate = new Date(year, 0, 1); // 1月1日
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // 12月31日

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate,
    endDate,
    periodLabel: `${year}年1月1日 〜 ${year}年12月31日`,
  };
}
