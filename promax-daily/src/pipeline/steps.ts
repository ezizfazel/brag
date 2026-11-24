import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import type { Reel, Validated } from '../shared/types';
import { cuesFor } from '../shared/plan';
import { P } from './paths';

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
