import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition, type ChromiumOptions } from '@remotion/renderer';
import type { ReelProps } from '../shared/types';
import { ROOT } from './paths';

const CANDIDATES = [
  process.env.PROMAX_CHROME,
  '/opt/pw-browsers/chromium_headless_shell',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean) as string[];
// null = let Remotion download its own chrome-headless-shell
export const browserExecutable = CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
// three.js needs WebGL; "swangle" = SwiftShader via ANGLE (works headless without a GPU)
const chromiumOptions: ChromiumOptions = { gl: (process.env.PROMAX_GL as ChromiumOptions['gl']) || 'swangle' };

let serveUrl: string | null = null;
export async function getBundle(log = console.log) {
  if (serveUrl) return serveUrl;
  log('· bundling Remotion project…');
  serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/remotion/index.ts'), publicDir: path.join(ROOT, 'assets'), webpackOverride: (c) => c });
  return serveUrl;
}

async function comp(props: ReelProps) {
  const url = await getBundle();
  const composition = await selectComposition({ serveUrl: url, id: 'PriceReel', inputProps: props as unknown as Record<string, unknown>, browserExecutable, chromiumOptions });
  return { url, composition };
}

export async function renderReelVideo(props: ReelProps, out: string, opts: { scale?: number; crf?: number; onProgress?: (p: number) => void; concurrency?: number } = {}) {
  const { url, composition } = await comp(props);
  await renderMedia({
    serveUrl: url, composition, inputProps: props as unknown as Record<string, unknown>, codec: 'h264', outputLocation: out,
    crf: opts.crf ?? 16, pixelFormat: 'yuv420p', muted: true, scale: opts.scale ?? 1, browserExecutable, chromiumOptions,
    concurrency: opts.concurrency ?? Math.max(1, Math.min(4, (await import('node:os')).cpus().length)),
    onProgress: ({ progress }) => opts.onProgress?.(progress), timeoutInMilliseconds: 120000,
  });
  return out;
}

export async function renderReelStill(props: ReelProps, frame: number, out: string, scale = 1) {
  const { url, composition } = await comp(props);
  await renderStill({ serveUrl: url, composition, inputProps: props as unknown as Record<string, unknown>, frame, output: out, imageFormat: out.endsWith('.png') ? 'png' : 'jpeg', jpegQuality: 92, scale, browserExecutable, chromiumOptions, timeoutInMilliseconds: 120000 });
  return out;
}
