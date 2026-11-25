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
/** 485500 (thousand Toman) → "۴۸۵ و نیم میلیون" style; keeps exact value, spoken in millions */
function millions(price: number, s: Settings) {
  const t = price * multiplier(s);
  const m = t / 1_000_000;
  const txt = Number.isInteger(m) ? String(m) : m.toFixed(1).replace(/\.0$/, '');
  return toFa(txt).replace('.', '٫') + ' میلیون';
}

export type Segment = { id: string; text: string; scene: 'intro' | 'model' | 'outro'; groups?: [number, number] };

/** consecutive groups of the same model → one narration line each: [first, last] group index */
export function modelRuns(groups: Group[]): [number, number][] {
  const runs: [number, number][] = [];
  groups.forEach((g, i) => { const r = runs[runs.length - 1]; if (r && groups[r[1]].model === g.model) r[1] = i; else runs.push([i, i]); });
  return runs;
}

/** "آیفون ۱۸ پرو مکس، از ۴۴۴ تا ۵۳۱ میلیون" — the screen shows every storage, part and colour */
export function modelLine(gs: Group[], s: Settings, first: boolean): string {
  const vs = gs.flatMap((g) => g.variants);
  const prices = vs.map((v) => v.price).sort((a, b) => a - b);
  const lo = prices[0], hi = prices[prices.length - 1];
  const unit = first ? ' تومان' : '';
  const body = vs.length === 1 ? `${FA_COLOR[vs[0].color] ?? vs[0].color}، ${millions(lo, s)}${unit}`
    : lo === hi ? `${millions(lo, s)}${unit}` : `از ${millions(lo, s).replace(' میلیون', '')} تا ${millions(hi, s)}${unit}`;
  return `${faModel(gs[0].model)}، ${body}.`;
}

export function buildScript(reel: Reel, s: Settings): Segment[] {
  const d = faDate(s.update_date);
  const segs: Segment[] = [{ id: 'intro', scene: 'intro', text: `[warmly] قیمت روز پرومکس، ${d.long.split(' ').slice(0, 3).join(' ')}.` }];
  modelRuns(reel.groups).forEach(([i, j], k) => segs.push({ id: `m${k}`, scene: 'model', groups: [i, j], text: modelLine(reel.groups.slice(i, j + 1), s, k === 0) }));
  segs.push({ id: 'outro', scene: 'outro', text: 'برای قیمت هر روز، پیج پرومکس رو دنبال کن!' });
  return segs;
}

/** one prompt for a single generation; [pause] between scenes so the take can be split on silence */
export const scriptPrompt = (segs: Segment[]) => segs.map((x) => x.text).join(' [pause] ');
