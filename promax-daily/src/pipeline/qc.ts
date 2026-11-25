import fs from 'node:fs';
import path from 'node:path';
import type { Reel, Validated } from '../shared/types';
import { T, cuesFor, groupFrames } from '../shared/plan';
import { enNumber, multiplier, priceText } from '../shared/format';
import { LAYOUT, SAFE } from '../remotion/theme';
import { P } from './paths';
import { resolveVisual } from '../shared/catalog';
import { dumpExcel, loudness, probe } from './steps';

export type Check = { check: string; status: 'pass' | 'fail' | 'warn'; details?: unknown };

/** Data checks that must pass BEFORE anything is rendered (no fabricated or mismatched prices). */
export async function dataQC(v: Validated, reels: Reel[], xlsx: string): Promise<Check[]> {
  const raw = await dumpExcel(xlsx);
  const checks: Check[] = [];
  const shown = reels.flatMap((r) => r.groups.flatMap((g) => g.variants.map((p) => ({ part: r.part, group: g, p }))));
  // every active+valid product appears exactly once
  const ids = shown.map((s) => s.p.product_id);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const missing = v.products.filter((p) => !ids.includes(p.product_id)).map((p) => p.product_id);
  const extra = ids.filter((id) => !v.products.find((p) => p.product_id === id));
  checks.push({ check: 'all active variants accounted for', status: dup.length || missing.length || extra.length ? 'fail' : 'pass', details: { shown: ids.length, active_valid: v.products.length, duplicates: dup, missing, not_in_excel: extra } });
  // prices / part numbers / models / colours vs an independent read of the Excel file
  const mism: unknown[] = [];
  for (const { part, group, p } of shown) {
    const r = raw[p.product_id];
    if (!r) { mism.push({ product_id: p.product_id, reason: 'not found in Excel' }); continue; }
    const want = r.price == null ? null : enNumber(r.price * multiplier(v.settings));
    const got = priceText(p.price, v.settings);
    if (want !== got || r.price !== p.price) mism.push({ product_id: p.product_id, part, field: 'price', excel: r.price, displayed: got });
    if (r.model !== p.model || r.model !== group.model) mism.push({ product_id: p.product_id, field: 'model', excel: r.model, displayed: group.model });
    if (r.color !== p.color) mism.push({ product_id: p.product_id, field: 'color', excel: r.color, displayed: p.color });
    if (r.part_number !== p.part_number) mism.push({ product_id: p.product_id, field: 'part_number', excel: r.part_number, displayed: p.part_number });
    if (r.storage !== p.storage) mism.push({ product_id: p.product_id, field: 'storage', excel: r.storage, displayed: p.storage });
    if (!r.active) mism.push({ product_id: p.product_id, field: 'active', reason: 'inactive product scheduled for display' });
  }
  checks.push({ check: 'prices, models, colours, storage, part numbers match Excel', status: mism.length ? 'fail' : 'pass', details: mism.length ? mism : `${shown.length} variants verified` });
  const badPart = shown.filter((s) => s.p.part_number && !/^[A-Z]{1,3}\/[A-Z]$/.test(s.p.part_number));
  checks.push({ check: 'part number format', status: badPart.length ? 'fail' : 'pass', details: badPart.map((b) => b.p.product_id) });
  const normalized = v.issues.filter((i) => i.code === 'price_normalized');
  checks.push({ check: 'prices typed with separators (please confirm)', status: normalized.length ? 'warn' : 'pass', details: normalized.map((i) => i.message) });
  checks.push({ check: 'rows rejected by validation (not shown in the videos)', status: v.rejected.length ? 'warn' : 'pass', details: v.rejected.map((r) => ({ product_id: r.product_id, row: r.row, errors: r.errors })) });
  // Persian RTL / typography
  const badFmt = shown.filter((s) => !/^\d{1,3}(,\d{3})+$|^\d{1,3}$/.test(priceText(s.p.price, v.settings)));
  checks.push({ check: `prices shown in full Toman (×${multiplier(v.settings)}), Latin digits`, status: badFmt.length ? 'fail' : 'pass', details: shown.slice(0, 3).map((s) => `${s.p.price_raw} → ${priceText(s.p.price, v.settings)}`) });
  const fonts = ['Alexandria-800-arabic.woff2', 'Outfit-800-latin.woff2'].filter((f) => !fs.existsSync(path.join(P.assets, 'fonts', f)));
  checks.push({ check: 'fonts bundled (Alexandria + Outfit)', status: fonts.length ? 'fail' : 'pass', details: fonts });
  // safe zones (layout constants)
  const cardBottom = LAYOUT.card.bottom;
  const cardRight = LAYOUT.card.left + LAYOUT.card.width;
  const safeOk = LAYOUT.hud >= SAFE.top && cardBottom <= SAFE.bottom && cardRight <= 1080 - SAFE.rightLowerHalf;
  checks.push({ check: 'Instagram safe zones', status: safeOk ? 'pass' : 'fail', details: { top: LAYOUT.hud, cardBottom, cardRight, limits: SAFE } });
  // images
  const lowRes = v.issues.filter((i) => i.code === 'low_resolution');
  checks.push({ check: 'image resolution', status: lowRes.length ? 'warn' : 'pass', details: lowRes.map((i) => i.message) });
  const vis = shown.map((s) => ({ id: s.p.product_id, v: resolveVisual(s.p) }));
  const noImg = vis.filter((x) => x.v.source === 'none' || x.v.source === '3d').map((x) => `${x.id} (${x.v.source === '3d' ? '3D model' : 'placeholder'})`);
  checks.push({ check: 'image source per variant', status: 'pass', details: Object.fromEntries(['official', 'excel', '3d', 'none'].map((k) => [k, vis.filter((x) => x.v.source === k).length])) });
  checks.push({ check: 'product images', status: noImg.length ? (v.settings.allow_placeholders ? 'warn' : 'fail') : 'pass',
    details: noImg.length ? { not_official: noImg, note: 'add the official colour to assets/official or an image in Excel' } : 'all variants use official manufacturer images' });
  // timing
  for (const r of reels) {
    const sum = r.intro + r.outro + r.groups.reduce((a, g) => a + g.durationInFrames, 0);
    const ok = sum === r.durationInFrames && r.durationInFrames <= (r.voice ? 60 : T.MAX_SECONDS) * r.fps + 1 && r.groups.every((g) => g.durationInFrames === groupFrames(g.variants.length, g.per ?? r.per));
    checks.push({ check: `single reel 15–${r.voice ? 60 : 45} s (${(r.durationInFrames / r.fps).toFixed(1)} s, ${(r.per / r.fps).toFixed(2)} s per colour)`, status: ok ? 'pass' : 'fail', details: { seconds: r.durationInFrames / r.fps, per_colour_s: r.per / r.fps } });
  }
  return checks;
}

/** Checks on the encoded files. */
export async function fileQC(reel: Reel, file: string): Promise<Check[]> {
  const c: Check[] = [];
  const pr = await probe(file);
  const v = pr.streams.find((s) => s.codec_type === 'video')!, a = pr.streams.find((s) => s.codec_type === 'audio');
  const dur = parseFloat(pr.format.duration);
  const expected = reel.durationInFrames / reel.fps;
  const max = reel.voice ? 60 : 45;
  c.push({ check: `duration 15–${max} s`, status: dur <= max + 0.05 && dur >= 14.95 ? 'pass' : 'fail', details: { seconds: +dur.toFixed(3), expected } });
  c.push({ check: 'duration matches timeline', status: Math.abs(dur - expected) < 0.1 ? 'pass' : 'fail' });
  c.push({ check: 'encoding H.264 / yuv420p / 1080×1920 / 30 fps', status: v.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && v.width === 1080 && v.height === 1920 && v.r_frame_rate === '30/1' ? 'pass' : 'fail',
    details: { codec: v.codec_name, profile: v.profile, pix_fmt: v.pix_fmt, size: `${v.width}x${v.height}`, fps: v.r_frame_rate, frames: v.nb_frames, bitrate_kbps: Math.round(+pr.format.bit_rate / 1000) } });
  c.push({ check: 'audio track (AAC 48 kHz stereo)', status: a && a.codec_name === 'aac' && +a.sample_rate === 48000 && a.channels === 2 ? 'pass' : 'fail' });
  const L = await loudness(file);
  c.push({ check: 'loudness ≈ -14 LUFS, no clipping', status: Math.abs(L.integrated_lufs + 14) <= 2 && L.true_peak_dbtp <= -0.5 ? 'pass' : 'warn', details: L });
  const cues = cuesFor(reel);
  c.push({ check: 'sound-effect cues inside the reel', status: cues.every((q) => q.t >= 0 && q.t <= expected) ? 'pass' : 'fail', details: { cues: cues.length } });
  return c;
}

export const passed = (cs: Check[]) => !cs.some((c) => c.status === 'fail');
export { T };
