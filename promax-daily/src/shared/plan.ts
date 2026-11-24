import type { Cue, Group, Product, Reel, Settings, Validated } from './types';

// ---- timing (frames @ 30 fps). One place, used by the composition, the audio cues and QC.
export const T = {
  INTRO: 72, // 2.4 s logo reveal
  OUTRO: 90, // 3.0 s branding
  ENTER: 48, // device enters, rotates back → side → front, light sweep, card in
  PER_VARIANT: 36, // 1.2 s spotlight per colour (the full colour list stays on screen the whole scene)
  EXIT: 12,
};
export const groupFrames = (n: number) => T.ENTER + n * T.PER_VARIANT + T.EXIT;

const keyOf = (p: Product) => [p.brand, p.series, p.model, p.storage, p.part_number].join('|');

export function buildGroups(products: Product[]): Omit<Group, 'from'>[] {
  const map = new Map<string, Omit<Group, 'from'>>();
  for (const p of products) {
    const k = keyOf(p);
    if (!map.has(k)) map.set(k, { key: k, brand: p.brand, series: p.series, model: p.model, storage: p.storage, part_number: p.part_number, condition: p.condition, variants: [], durationInFrames: 0 });
    map.get(k)!.variants.push(p);
  }
  const groups = [...map.values()];
  for (const g of groups) g.durationInFrames = groupFrames(g.variants.length);
  return groups; // already in display_order (products are sorted by the validator)
}

/**
 * Pack groups into reels of ≤ maxSeconds, keeping a series (family) together whenever it fits,
 * never dropping a variant. A group that alone would not fit is split across reels by variants.
 */
export function planReels(v: Pick<Validated, 'products' | 'settings'>): Reel[] {
  const s: Settings = v.settings;
  const fps = s.fps || 30;
  const max = Math.min(30, s.reel_duration || 30) * fps;
  const cap = max - T.INTRO - T.OUTRO;
  const maxVariantsPerGroup = Math.floor((cap - T.ENTER - T.EXIT) / T.PER_VARIANT);

  // split oversize groups first
  let groups: Omit<Group, 'from'>[] = [];
  for (const g of buildGroups(v.products)) {
    if (g.variants.length <= maxVariantsPerGroup) groups.push(g);
    else for (let i = 0; i < g.variants.length; i += maxVariantsPerGroup) {
      const vs = g.variants.slice(i, i + maxVariantsPerGroup);
      groups.push({ ...g, key: g.key + '#' + i, variants: vs, durationInFrames: groupFrames(vs.length) });
    }
  }
  // families in order of first appearance
  const families: Omit<Group, 'from'>[][] = [];
  for (const g of groups) {
    const last = families[families.length - 1];
    if (last && last[0].series === g.series) last.push(g); else families.push([g]);
  }
  const bins: Omit<Group, 'from'>[][] = [];
  let cur: Omit<Group, 'from'>[] = [], used = 0;
  const flush = () => { if (cur.length) bins.push(cur); cur = []; used = 0; };
  for (const fam of families) {
    const famLen = fam.reduce((a, g) => a + g.durationInFrames, 0);
    if (used + famLen <= cap) { cur.push(...fam); used += famLen; continue; }
    if (famLen <= cap) { flush(); cur.push(...fam); used = famLen; continue; }
    for (const g of fam) { // family bigger than one reel: split at group boundaries
      if (used + g.durationInFrames > cap) flush();
      cur.push(g); used += g.durationInFrames;
    }
  }
  flush();
  return bins.map((b, i) => {
    let at = T.INTRO;
    const gs: Group[] = b.map((g) => { const r = { ...g, from: at }; at += g.durationInFrames; return r; });
    return { part: i + 1, parts: bins.length, fps, intro: T.INTRO, outro: T.OUTRO, groups: gs, durationInFrames: at + T.OUTRO };
  });
}

/** Sound-design cues (seconds) in sync with the composition. */
export function cuesFor(reel: Reel): Cue[] {
  const f = (fr: number) => fr / reel.fps;
  const c: Cue[] = [{ t: f(6), type: 'logo' }, { t: f(40), type: 'glitch' }];
  reel.groups.forEach((g, gi) => {
    c.push({ t: f(g.from - 6), type: 'transition', group: gi });
    c.push({ t: f(g.from + 4), type: 'enter', group: gi });
    c.push({ t: f(g.from + 12), type: 'rotate', group: gi });
    c.push({ t: f(g.from + 30), type: 'sweep', group: gi });
    g.variants.forEach((_, vi) => {
      const at = g.from + T.ENTER + vi * T.PER_VARIANT;
      if (vi > 0) c.push({ t: f(at - 4), type: 'sweep', group: gi });
      c.push({ t: f(at + 6), type: 'price', group: gi });
    });
  });
  const o = reel.durationInFrames - reel.outro;
  c.push({ t: f(o - 6), type: 'transition' }, { t: f(o + 8), type: 'signature' });
  return c.sort((a, b) => a.t - b.t);
}
