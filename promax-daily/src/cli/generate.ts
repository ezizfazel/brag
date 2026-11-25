/**
 * npm run generate            → final Reels: output/daily/<date>/promax-part-NN.mp4 + thumbnails + quality-report.json
 * npm run preview             → low-res preview of all parts: output/preview/preview.mp4
 * options: --input <xlsx>  --parts 1,2  --concurrency N
 */
import fs from 'node:fs';
import path from 'node:path';
import { planReels, T } from '../shared/plan';
import { modelRuns } from '../shared/voice';
import type { Reel, ReelProps } from '../shared/types';
import { P } from '../pipeline/paths';
import { concat, loadVoice, makeAudio, mixVoice, muxFinal, muxPreview, validateExcel, voiceSchedule } from '../pipeline/steps';
import { renderReelStill, renderReelVideo } from '../pipeline/remotion';
import { dataQC, fileQC, passed, type Check } from '../pipeline/qc';

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const PREVIEW = args.includes('--preview');
const input = path.resolve(opt('--input') || P.latestXlsx);
const onlyParts = opt('--parts')?.split(',').map(Number);
const conc = opt('--concurrency') ? Number(opt('--concurrency')) : undefined;
const log = (...a: unknown[]) => console.log(`[${new Date().toLocaleTimeString('en-GB')}]`, ...a);

if (!fs.existsSync(input)) { console.error(`Excel file not found: ${input}\nUpload one in the dashboard (npm run dev) or copy it to data/uploads/latest.xlsx`); process.exit(1); }

log(`${PREVIEW ? 'PREVIEW' : 'FINAL'} · validating ${path.relative(process.cwd(), input)}`);
const v = await validateExcel(input);
const s = v.stats;
log(`products: ${s.active_valid} active · ${s.rejected} rejected · ${s.inactive} inactive · ${s.missing_images} without image · ${s.errors} errors · ${s.warnings} warnings`);
if (!v.ok) { console.error('No valid active products — nothing to render. See data/validated.json'); process.exit(2); }

const vf = args.includes('--no-voice') ? null : loadVoice(v.settings.update_date);
const base = planReels(v)[0];
const runs = modelRuns(base.groups);
const nScenes = runs.length + 2;
if (vf && vf.segments.length !== nScenes) { console.error(`voice.json has ${vf.segments.length} lines but the reel has ${nScenes} (intro + ${runs.length} models + outro) — regenerate the voice (npm run voice) or pass --no-voice`); process.exit(6); }
const secs = (i: number) => vf ? (vf.segments[i].end - vf.segments[i].start) / vf.tempo + 0.25 : 0;
// a model line spans that model's scenes: share its seconds by colour count
const perGroup = vf ? base.groups.map((g, gi) => {
  const k = runs.findIndex(([a, b]) => gi >= a && gi <= b); const [a, b] = runs[k];
  const tot = base.groups.slice(a, b + 1).reduce((n, x) => n + x.variants.length, 0);
  return (secs(k + 1) * g.variants.length) / tot;
}) : [];
const reels = planReels(v, vf ? { intro: secs(0), groups: perGroup, outro: secs(nScenes - 1) } : undefined);
if (vf) for (const r of reels) r.voice = { file: vf.file, segments: voiceSchedule(r, vf) };
log(vf ? `voice-over: ${path.relative(process.cwd(), vf.file)} (×${vf.tempo})` : 'voice-over: none (music only)');
log(`plan: ${reels.length} reel(s) — ` + reels.map((r) => `part ${r.part}: ${(r.durationInFrames / r.fps).toFixed(1)}s, ${r.groups.reduce((a, g) => a + g.variants.length, 0)} variants`).join(' | '));

const data = await dataQC(v, reels, input);
for (const c of data) log(`QC ${c.status.toUpperCase().padEnd(4)} ${c.check}`);
if (!passed(data)) { console.error('Data QC failed — refusing to render videos with wrong or unverifiable prices. See details above.'); process.exit(3); }
if (!PREVIEW && !v.settings.allow_placeholders && v.products.some((p) => !p.assets.front && !p.assets.back)) {
  console.error('Some products have no verified image and allow_placeholders = no. Add images or enable placeholders.'); process.exit(4);
}

const date = v.settings.update_date;
const outDir = PREVIEW ? P.preview : path.join(P.daily, date);
const tmp = path.join(P.tmp, `${PREVIEW ? 'preview' : date}-${Date.now()}`);
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(tmp, { recursive: true });
if (!PREVIEW) for (const f of fs.readdirSync(outDir)) if (/^(promax-part-\d+\.mp4|thumbnail-\d+\.jpg|quality-report\.json)$/.test(f)) fs.rmSync(path.join(outDir, f)); // stale files from an earlier run

/** strongest settled frame: first price of the first group, fully revealed */
const posterFrame = (r: Reel) => r.groups[0].from + T.ENTER + 22;

const report: { generated_at: string; mode: string; source: string; update_date: string; data_checks: Check[]; reels: unknown[]; status?: string } = {
  generated_at: new Date().toISOString(), mode: PREVIEW ? 'preview' : 'final', source: input, update_date: date, data_checks: data, reels: [],
};
const previewParts: string[] = [];
let allOk = passed(data);
for (const reel of reels) {
  if (onlyParts && !onlyParts.includes(reel.part)) continue;
  const nn = String(reel.part).padStart(2, '0');
  const props: ReelProps = { reel, settings: v.settings, preview: PREVIEW };
  log(`part ${reel.part}/${reel.parts}: rendering video…`);
  let last = -1;
  const silent = await renderReelVideo(props, path.join(tmp, `part-${nn}.silent.mp4`), {
    scale: PREVIEW ? 0.5 : 1, crf: PREVIEW ? 26 : 14, concurrency: conc,
    onProgress: (p) => { const k = Math.floor(p * 10); if (k !== last) { last = k; log(`part ${reel.part}: ${Math.round(p * 100)}%`); } },
  });
  log(`part ${reel.part}: sound design…`);
  const score = await makeAudio(reel, path.join(tmp, `part-${nn}.wav`), v.settings.background_music);
  const cues = score.cues;
  const wav = vf ? (await mixVoice(reel, vf, score.wav, path.join(tmp, `part-${nn}.vo.wav`))).wav : score.wav;
  if (PREVIEW) {
    previewParts.push(await muxPreview(silent, wav, path.join(tmp, `preview-${nn}.mp4`)));
    continue;
  }
  const thumb = path.join(outDir, `thumbnail-${nn}.jpg`);
  await renderReelStill(props, posterFrame(reel), thumb);
  const out = path.join(outDir, `promax-part-${nn}.mp4`);
  log(`part ${reel.part}: mastering + encoding…`);
  await muxFinal(silent, wav, thumb, out);
  const fq = await fileQC(reel, out);
  for (const c of fq) log(`QC ${c.status.toUpperCase().padEnd(4)} part ${reel.part}: ${c.check}`);
  allOk = allOk && passed(fq);
  report.reels.push({ part: reel.part, file: path.relative(outDir, out), thumbnail: path.relative(outDir, thumb), poster_frame: posterFrame(reel), seconds: reel.durationInFrames / reel.fps,
    groups: reel.groups.map((g) => ({ model: g.model, storage: g.storage, part_number: g.part_number, from_s: g.from / reel.fps, variants: g.variants.map((p) => ({ product_id: p.product_id, color: p.color, price: p.price })) })),
    audio_cues: cues.cues.length, checks: fq });
}

if (PREVIEW) {
  const out = path.join(P.preview, 'preview.mp4');
  await concat(previewParts, out);
  log(`preview ready → ${path.relative(process.cwd(), out)}`);
} else {
  report.status = allOk ? 'pass' : 'fail';
  fs.writeFileSync(path.join(outDir, 'quality-report.json'), JSON.stringify(report, null, 2));
  if (!allOk) {
    const failed = path.join(outDir, '_failed'); fs.mkdirSync(failed, { recursive: true });
    for (const f of fs.readdirSync(outDir)) if (f.endsWith('.mp4')) fs.renameSync(path.join(outDir, f), path.join(failed, f));
    console.error('QC failed — videos moved to _failed/. See quality-report.json'); process.exit(5);
  }
  log(`done → ${path.relative(process.cwd(), outDir)} (quality-report.json: PASS)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(0);
