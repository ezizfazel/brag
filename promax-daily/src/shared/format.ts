import type { Settings } from './types';

const FA = '۰۱۲۳۴۵۶۷۸۹';
export const toFa = (s: string | number) => String(s).replace(/[0-9]/g, (d) => FA[+d]);

/** 645000 -> "۶۴۵,۰۰۰" (grouping exactly as the number, no rounding) */
export const faNumber = (n: number) => toFa(Math.round(n).toLocaleString('en-US'));

export const unitLabel = (s: Pick<Settings, 'price_unit' | 'currency'>) =>
  s.price_unit === 'thousand_toman' ? `هزار ${s.currency || 'تومان'}` : s.currency || 'تومان';

/** The exact string the video shows for a price (used by QC too). */
export const priceText = (n: number) => faNumber(n);

// ---- Gregorian -> Jalali (algorithmic, no deps) ----
export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}
const JM = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const WD = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
export function faDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const [jy, jm, jd] = toJalali(y, m, d);
  const wd = WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { short: toFa(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`), long: `${wd} ${toFa(jd)} ${JM[jm - 1]} ${toFa(jy)}` };
}

export const faPart = (p: number, n: number) => `قسمت ${toFa(p)} از ${toFa(n)}`;
