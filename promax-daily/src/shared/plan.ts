import type { Cue, Group, Product, Reel, Settings, Validated } from './types';

// ---- timing (frames @ 30 fps). One place, used by the composition, the audio cues and QC.
export const T = {
  INTRO: 66, // 2.2 s
  OUTRO: 84, // 2.8 s
  ENTER: 30, // device + title arrive
  EXIT: 12,
  PER_MIN: 21, // 0.7 s spotlight per colour minimum (the full list stays on screen all scene)
  PER_MAX: 66, // 2.2 s
  MIN_SECONDS: 15,
  MAX_SECONDS: 45,
};
export const groupFrames = (n: number, per: number) => T.ENTER + n * per + T.EXIT;
const keyOf = (p: Product) => [p.brand, p.series, p.model, p.storage, p.part_number, p.condition].join('|');

export function buildGroups(products: Product[]): Omit<Group, 'from'>[] {
  const map = new Map<string, Omit<Group, 'from'>>();
  for (const p of products) {
    const k = keyOf(p);
    if (!map.has(k)) map.set(k, { key: k, brand: p.brand, series: p.series, model: p.model, storage: p.storage, part_number: p.part_number, condition: p.condition, variants: [], durationInFrames: 0 });
    map.get(k)!.variants.push(p);
  }
  const groups = [...map.values()];
  
  return groups; // already in display_order (products are sorted by the validator)
}

/**
 * ONE reel for the whole list (15–45 s). The spotlight time per colour is computed so that
 * every model and colour fits; the full colour list of a model is visible for its whole scene.
 */
/** seconds of voice per scene (intro, each group, outro); scenes stretch so the narrator is never cut off */
export type VoiceTiming = { intro: number; groups: number[]; outro: number };

export function planReels(v: Pick<Validated, 'products' | 'settings'>, voice?: VoiceTiming): Reel[] {
  const s: Settings = v.settings;
  const fps = s.fps || 30;
  const maxF = Math.min(T.MAX_SECONDS, Math.max(T.MIN_SECONDS, s.reel_duration || T.MAX_SECONDS)) * fps;
  const groups = buildGroups(v.products);
  const nV = groups.reduce((a, g) => a + g.variants.length, 0);
  const fixed = T.INTRO + T.OUTRO + groups.length * (T.ENTER + T.EXIT);
  let per = Math.floor((maxF - fixed) / Math.max(1, nV));
  per = Math.max(T.PER_MIN, Math.min(T.PER_MAX, per));
  // reach the 15 s minimum for very short lists
  while (fixed + nV * per < T.MIN_SECONDS * fps && per < 90) per++;
  const pad = Math.round(0.35 * fps);
  const intro = voice ? Math.max(T.INTRO, Math.ceil(voice.intro * fps) + pad) : T.INTRO;
  const outro = voice ? Math.max(T.OUTRO, Math.ceil(voice.outro * fps) + pad) : T.OUTRO;
  let at = intro;
  const gs: Group[] = groups.map((g, i) => {
    let gp = per;
    if (voice?.groups[i] != null) {
      // the scene lasts at least as long as its voice line; spread the extra time over the colours
      const need = Math.ceil(voice.groups[i] * fps) + T.EXIT;
      gp = Math.max(per, Math.ceil((need - T.ENTER - T.EXIT) / g.variants.length));
    }
    const d = groupFrames(g.variants.length, gp);
    const r = { ...g, durationInFrames: d, from: at, per: gp }; at += d; return r;
  });
  return [{ part: 1, parts: 1, fps, intro, outro, per, groups: gs, durationInFrames: at + outro }];
}

/** Sound-design cues (seconds) in sync with the composition. */
export function cuesFor(reel: Reel): Cue[] {
  const f = (fr: number) => fr / reel.fps;
  const c: Cue[] = [{ t: f(4), type: 'logo' }, { t: f(30), type: 'glitch' }];
  reel.groups.forEach((g, gi) => {
    c.push({ t: f(g.from - 4), type: 'transition', group: gi });
    c.push({ t: f(g.from + 6), type: 'enter', group: gi });
    g.variants.forEach((_, vi) => {
      const at = g.from + T.ENTER + vi * (g.per ?? reel.per);
      if (vi > 0) c.push({ t: f(at - 6), type: 'rotate', group: gi });
      c.push({ t: f(at + 4), type: 'price', group: gi });
    });
  });
  const o = reel.durationInFrames - reel.outro;
  c.push({ t: f(o - 4), type: 'transition' }, { t: f(o + 10), type: 'signature' });
  return c.sort((a, b) => a.t - b.t);
}
