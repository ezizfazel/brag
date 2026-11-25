import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import type { Reel, Validated } from '../shared/types';
import { cuesFor } from '../shared/plan';
import { P, ROOT } from './paths';

const run = promisify(execFile);
const PY = process.env.PYTHON || 'python3';

export async function validateExcel(xlsx: string, out = P.validated): Promise<Validated> {
  try { await run(PY, [path.join(P.python, 'promax_excel.py'), 'validate', xlsx, '--out', out, '--assets', P.assets], { maxBuffer: 1 << 26 }); }
  catch (e: unknown) { const err = e as { code?: number; stderr?: string }; if (err.code !== 2) throw new Error('Excel validation crashed: ' + (err.stderr || String(e))); }
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

/** independent second read of the Excel file — used by QC to cross-check every displayed value */
export async function dumpExcel(xlsx: string): Promise<Record<string, { model: string; color: string; storage: string; part_number: string; price: number | null; active: boolean }>> {
  const { stdout } = await run(PY, [path.join(P.python, 'promax_excel.py'), 'dump', xlsx], { maxBuffer: 1 << 26 });
  return JSON.parse(stdout);
}

export async function makeAudio(reel: Reel, out: string, musicSetting: string) {
  const cues = { duration: reel.durationInFrames / reel.fps, cues: cuesFor(reel) };
  const cj = out.replace(/\.wav$/, '.cues.json');
  fs.writeFileSync(cj, JSON.stringify(cues, null, 1));
  const args = [path.join(P.python, 'promax_audio.py'), cj, out];
  if (musicSetting && musicSetting !== 'auto') args.push('--music', path.join(P.assets, musicSetting));
  await run(PY, args, { maxBuffer: 1 << 26 });
  return { wav: out, cues };
}

/**
 * Mux silent H.264 render + score, master loudness (-14 LUFS / -1.5 dBTP) and bake the
 * poster as frame 0 (replacing it, so duration and sync are unchanged).
 */
export async function muxFinal(video: string, wav: string, poster: string | null, out: string, crf = 17) {
  const vf = poster ? ['-loop', '1', '-i', poster] : [];
  const fc = poster ? '[2:v]scale=1080:1920,format=yuv420p[p];[0:v][p]overlay=enable=\'eq(n,0)\':shortest=1[v]' : '[0:v]null[v]';
  const scaleFix = poster ? fc : fc;
  await run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-i', wav, ...vf, '-filter_complex', `${scaleFix};[1:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { maxBuffer: 1 << 26 });
  return out;
}

export async function muxPreview(video: string, wav: string, out: string) {
  await run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-i', wav, '-filter_complex', '[1:a]loudnorm=I=-14:TP=-1.5[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', out]);
  return out;
}

export async function concat(files: string[], out: string) {
  const list = out + '.txt';
  fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
  await run('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  fs.rmSync(list);
  return out;
}

export async function probe(file: string) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,bit_rate:stream=codec_type,codec_name,profile,width,height,r_frame_rate,pix_fmt,nb_frames,sample_rate,channels', '-of', 'json', file]);
  return JSON.parse(stdout) as { format: { duration: string; bit_rate: string }; streams: Record<string, string | number>[] };
}

export async function loudness(file: string) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { maxBuffer: 1 << 26 }).catch((e) => e);
  const s = String(r.stderr || '');
  const tail = s.slice(s.lastIndexOf('Summary:'));
  const I = parseFloat((tail.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1]);
  const TP = parseFloat((tail.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1]);
  return { integrated_lufs: I, true_peak_dbtp: TP };
}

export type VoiceFile = { file: string; tempo: number; segments: { start: number; end: number }[] };

/** voice.json for a date (made by python/promax_voice.py from an ElevenLabs take), if present */
export function loadVoice(date: string): VoiceFile | null {
  const j = path.join(ROOT, 'data', 'voice', date, 'voice.json');
  if (!fs.existsSync(j)) return null;
  const v: VoiceFile = JSON.parse(fs.readFileSync(j, 'utf8'));
  if (!path.isAbsolute(v.file)) v.file = path.join(ROOT, v.file);
  return fs.existsSync(v.file) ? v : null;
}

/** where each voice segment starts (seconds): intro, each group, outro — a beat after its scene cut */
export function voiceSchedule(reel: Reel, vf: VoiceFile) {
  const starts = [0.25, ...reel.groups.map((g) => g.from / reel.fps + 0.2), (reel.durationInFrames - reel.outro) / reel.fps + 0.2];
  const scenes = ['intro', ...reel.groups.map((_, i) => `g${i}`), 'outro'];
  return vf.segments.map((s, i) => ({ scene: scenes[i], start: s.start, end: s.end, at: +starts[i].toFixed(3) }));
}

/**
 * Lay each narration segment on its scene and mix it over the score; the music ducks
 * (sidechain) under the voice so every price is clearly heard.
 */
export async function mixVoice(reel: Reel, vf: VoiceFile, score: string, out: string) {
  const sched = voiceSchedule(reel, vf);
  const parts = sched.map((s, i) => `[1:a]atrim=${s.start}:${s.end},asetpts=PTS-STARTPTS,atempo=${vf.tempo},aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.03,adelay=${Math.round(s.at * 1000)}:all=1[v${i}]`);
  const fc = [...parts,
    `${sched.map((_, i) => `[v${i}]`).join('')}amix=inputs=${sched.length}:normalize=0,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=2.2,apad,asplit=2[vo][sc]`,
    `[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.55[mu]`,
    `[mu][sc]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[duck]`,
    `[duck][vo]amix=inputs=2:normalize=0:duration=first[a]`].join(';');
  await run('ffmpeg', ['-y', '-v', 'error', '-i', score, '-i', vf.file, '-filter_complex', fc, '-map', '[a]', '-ar', '48000', out], { maxBuffer: 1 << 26 });
  return { wav: out, schedule: sched };
}
