/** npm run dev → PROMAX DAILY PRICE dashboard on http://localhost:3000 */
import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { P, ROOT } from '../pipeline/paths';
import { validateExcel } from '../pipeline/steps';
import { planReels } from '../shared/plan';
import type { Validated } from '../shared/types';

const app = express();
const PORT = Number(process.env.PORT || 3000);
fs.mkdirSync(P.uploads, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({ destination: P.uploads, filename: (_r, _f, cb) => cb(null, `upload-${Date.now()}.xlsx`) }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(null, /\.xlsx$/i.test(f.originalname)),
});

let validated: Validated | null = fs.existsSync(P.validated) ? JSON.parse(fs.readFileSync(P.validated, 'utf8')) : null;
let lastUpload: { name: string; at: string } | null = null;

type Job = { kind: string; status: 'running' | 'done' | 'failed'; started: string; ended?: string; log: string[]; code?: number | null };
let job: Job | null = null;
let child: ChildProcess | null = null;

function outputs() {
  const list: { group: string; files: { name: string; url: string; size: number }[] ; report?: unknown }[] = [];
  const add = (dir: string, group: string) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => /\.(mp4|jpg|json)$/.test(f)).sort()
      .map((f) => ({ name: f, url: '/files/' + path.relative(P.output, path.join(dir, f)).split(path.sep).join('/'), size: fs.statSync(path.join(dir, f)).size }));
    const rp = path.join(dir, 'quality-report.json');
    if (files.length) list.push({ group, files, report: fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, 'utf8')).status : undefined });
  };
  add(P.preview, 'preview');
  if (fs.existsSync(P.daily)) for (const d of fs.readdirSync(P.daily).sort().reverse()) add(path.join(P.daily, d), 'daily/' + d);
  if (fs.existsSync(P.exportDir)) for (const d of fs.readdirSync(P.exportDir).sort().reverse()) add(path.join(P.exportDir, d), 'export/' + d);
  return list;
}

function state() {
  const plan = validated?.ok ? planReels(validated).map((r) => ({ part: r.part, seconds: r.durationInFrames / r.fps, groups: r.groups.map((g) => ({ model: g.model, part_number: g.part_number, variants: g.variants.length })) })) : [];
  return {
    hasExcel: fs.existsSync(P.latestXlsx), lastUpload, validated, plan,
    job: job && { ...job, log: job.log.slice(-200) }, outputs: outputs(),
  };
}

app.use(express.json());
app.use('/', express.static(path.join(ROOT, 'src/server/public')));
app.use('/assets', express.static(P.assets));
app.use('/files', express.static(P.output));
app.use('/templates', express.static(P.templates));

app.get('/api/state', (_q, r) => r.json(state()));

app.post('/api/upload', upload.single('file'), async (q, r) => {
  if (!q.file) return r.status(400).json({ error: 'Please upload an .xlsx file' });
  fs.copyFileSync(q.file.path, P.latestXlsx);
  lastUpload = { name: q.file.originalname, at: new Date().toISOString() };
  try { validated = await validateExcel(P.latestXlsx); r.json(state()); }
  catch (e) { r.status(500).json({ error: String(e) }); }
});

app.post('/api/paste', express.text({ type: '*/*', limit: '1mb' }), async (q, r) => {
  // paste the daily price list as text (WhatsApp/Telegram format) → Excel → validation
  const txt = typeof q.body === 'string' ? q.body : String(q.body?.text || '');
  if (!txt.trim()) return r.status(400).json({ error: 'Empty list' });
  const src = path.join(P.uploads, `paste-${Date.now()}.txt`); fs.writeFileSync(src, txt);
  const py = spawn(process.env.PYTHON || 'python3', [path.join(P.python, 'promax_text.py'), src, '--out', P.latestXlsx]);
  let out = ''; py.stdout.on('data', (d) => (out += d)); py.stderr.on('data', (d) => (out += d));
  py.on('close', async () => {
    let parsed: unknown = null; try { parsed = JSON.parse(out); } catch { return r.status(500).json({ error: out.slice(-800) }); }
    lastUpload = { name: 'متن چسبانده‌شده', at: new Date().toISOString() };
    try { validated = await validateExcel(P.latestXlsx); r.json({ ...state(), paste: parsed }); } catch (e) { r.status(500).json({ error: String(e) }); }
  });
});

app.post('/api/validate', async (_q, r) => {
  if (!fs.existsSync(P.latestXlsx)) return r.status(400).json({ error: 'No Excel uploaded yet' });
  try { validated = await validateExcel(P.latestXlsx); r.json(state()); } catch (e) { r.status(500).json({ error: String(e) }); }
});

app.post('/api/job', (q, r) => {
  const kind = String(q.body?.kind || '');
  const scripts: Record<string, string[]> = { preview: ['src/cli/generate.ts', '--preview'], generate: ['src/cli/generate.ts'], export: ['src/cli/export.ts'] };
  if (!scripts[kind]) return r.status(400).json({ error: 'unknown job' });
  if (job?.status === 'running') return r.status(409).json({ error: 'A job is already running' });
  job = { kind, status: 'running', started: new Date().toISOString(), log: [] };
  const tsx = path.join(ROOT, 'node_modules/.bin/tsx');
  child = spawn(tsx, scripts[kind], { cwd: ROOT, env: process.env });
  const push = (b: Buffer) => { for (const line of b.toString().split('\n')) if (line.trim() && !/memory|docker run|Using the lower/i.test(line)) job!.log.push(line); };
  child.stdout?.on('data', push); child.stderr?.on('data', push);
  child.on('close', (code) => { job!.status = code === 0 ? 'done' : 'failed'; job!.code = code; job!.ended = new Date().toISOString(); child = null; });
  r.json(state());
});

app.post('/api/template', async (_q, r) => {
  // regenerate the downloadable template (never overwrites the uploaded price list)
  const py = spawn(process.env.PYTHON || 'python3', [path.join(P.python, 'promax_excel.py'), 'template']);
  py.on('close', (code) => r.json({ ok: code === 0, url: '/templates/PROMAX-DAILY-PRICES.xlsx' }));
});

app.listen(PORT, () => console.log(`PROMAX DAILY PRICE dashboard → http://localhost:${PORT}`));
