// Persian voice-over script, built from the reel plan (one segment per scene, so the audio can be
// split on the [pause]s and laid exactly on its scene). Prices come only from the validated sheet.
import type { Group, Reel, Settings } from './types';
import { faDate, multiplier, toFa } from './format';

const FA_MODEL: Record<string, string> = {
  'iPhone Duo': 'آیفون دوئو', 'iPhone Air': 'آیفون ایر',
  'Galaxy S26': 'گلکسی اس ۲۶', 'Galaxy S26+': 'گلکسی اس ۲۶ پلاس', 'Galaxy S26 Ultra': 'گلکسی اس ۲۶ اولترا', 'Galaxy S26 FE': 'گلکسی اس ۲۶ اف‌ای',
};
const faModel = (m: string) => FA_MODEL[m] ?? toFa(m.replace(/^iPhone\s+/i, 'آیفون ').replace(/Pro Max/i, 'پرو مکس').replace(/Pro/i, 'پرو').replace(/Plus/i, 'پلاس').replace(/(\d+)e\b/, '$1 ای'));
const FA_COLOR: Record<string, string> = {
  Black: 'مشکی', White: 'سفید', Silver: 'سیلور', Burgundy: 'برگاندی', Glacier: 'گلیشر', 'Deep Blue': 'دیپ بلو', 'Cosmic Orange': 'نارنجی',
  'Night Sky': 'نایت اسکای', 'Star White': 'سفید', Lavender: 'یاسی', Sage: 'سبز', 'Mist Blue': 'آبی', 'Cobalt Violet': 'بنفش', 'Sky Blue': 'آبی', 'Pink Gold': 'صورتی', 'Silver Shadow': 'نقره‌ای',
};
const storageFa = (s: string) => toFa(s.replace(/GB$/i, ' گیگ').replace(/TB$/i, ' ترابایت'));
/** 485500 (thousand Toman) → "۴۸۵ و نیم میلیون" style; keeps exact value, spoken in millions */
function millions(price: number, s: Settings) {
  const t = price * multiplier(s);
  const m = t / 1_000_000;
  const txt = Number.isInteger(m) ? String(m) : m.toFixed(1).replace(/\.0$/, '');
  return toFa(txt).replace('.', '٫') + ' میلیون';
}

export type Segment = { id: string; text: string; scene: 'intro' | 'group' | 'outro'; group?: number };

export function groupLine(g: Group, s: Settings, prevModel?: string): string {
  const head = g.model === prevModel ? '' : `${faModel(g.model)}، `;
  const st = storageFa(g.storage);
  const cond = g.condition?.replace(/\s*·\s*eSIM/i, '') || '';
  const prices = g.variants.map((v) => v.price).sort((a, b) => a - b);
  const lo = prices[0], hi = prices[prices.length - 1];
  if (g.variants.length === 1) {
    const c = FA_COLOR[g.variants[0].color] ?? g.variants[0].color;
    return `${head}${st}${cond ? ' ' + cond : ''}، ${c}: ${millions(lo, s)} تومان.`;
  }
  const range = lo === hi ? `${millions(lo, s)} تومان` : `از ${millions(lo, s).replace(' میلیون', '')} تا ${millions(hi, s)} تومان`;
  return `${head}${st}${cond ? ' ' + cond : ''}، ${range}.`;
}

export function buildScript(reel: Reel, s: Settings): Segment[] {
  const d = faDate(s.update_date);
  const segs: Segment[] = [{ id: 'intro', scene: 'intro', text: `[warmly] قیمت روز موبایل پرومکس، ${d.long.split(' ').slice(0, 3).join(' ')}.` }];
  reel.groups.forEach((g, i) => segs.push({ id: `g${i}`, scene: 'group', group: i, text: groupLine(g, s, i > 0 ? reel.groups[i - 1].model : undefined) }));
  segs.push({ id: 'outro', scene: 'outro', text: 'برای خرید و قیمت هر روز، پیج پرومکس رو دنبال کن!' });
  return segs;
}

/** one prompt for a single generation; [pause] between scenes so the take can be split on silence */
export const scriptPrompt = (segs: Segment[]) => segs.map((x) => x.text).join(' [pause] ');
