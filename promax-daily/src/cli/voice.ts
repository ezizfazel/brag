/**
 * npm run voice  → writes data/voice/<date>/script.txt (the narration built from the validated sheet).
 * With ELEVENLABS_API_KEY set it also generates the take with the Javid voice and splits it into
 * scenes (voice.json), so the next `npm run generate` puts the narration on the reel.
 * options: --input <xlsx>  --tempo 1.2   env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { planReels } from '../shared/plan';
import { buildScript, scriptPrompt } from '../shared/voice';
import { P, ROOT } from '../pipeline/paths';
import { validateExcel } from '../pipeline/steps';

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const input = path.resolve(opt('--input') || P.latestXlsx);
const tempo = opt('--tempo') || '1.2';
const VOICE = process.env.ELEVENLABS_VOICE_ID || 'TXoBVQ9S1J8PyUCOfL3s'; // "Javid – Natural Multilingual Persian"
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_v3';

const v = await validateExcel(input);
const reel = planReels(v)[0];
const segs = buildScript(reel, v.settings);
const dir = path.join(P.data, 'voice', v.settings.update_date);
fs.mkdirSync(dir, { recursive: true });
const prompt = scriptPrompt(segs);
fs.writeFileSync(path.join(dir, 'script.txt'), prompt + '\n');
console.log(`script (${prompt.length} characters, ${segs.length} scenes) → ${path.relative(ROOT, dir)}/script.txt\n\n${prompt}\n`);

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.log('ELEVENLABS_API_KEY not set — generate the take yourself, save it as take.mp3 in that folder and run:\n  python3 python/promax_voice.py <take.mp3> ' + segs.length + ' <folder>/voice.json --tempo ' + tempo); process.exit(0); }
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
  method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
  body: JSON.stringify({ text: prompt, model_id: MODEL }),
});
if (!res.ok) { console.error(`ElevenLabs error ${res.status}: ${await res.text()}`); process.exit(1); }
const take = path.join(dir, 'take.mp3');
fs.writeFileSync(take, Buffer.from(await res.arrayBuffer()));
execFileSync('python3', [path.join(P.python, 'promax_voice.py'), path.relative(ROOT, take), String(segs.length), path.join(dir, 'voice.json'), '--tempo', tempo], { cwd: ROOT, stdio: 'inherit' });
console.log('voice ready — run npm run generate');
