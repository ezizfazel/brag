// dev helper: render stills of a part at given seconds → output/.tmp/stills
import fs from 'node:fs'; import path from 'node:path';
import { planReels } from '../shared/plan';
import { renderReelStill } from '../pipeline/remotion';
import { P } from '../pipeline/paths';
const v = JSON.parse(fs.readFileSync(P.validated, 'utf8'));
const [part, ...secs] = process.argv.slice(2).map(Number);
const reel = planReels(v)[part - 1];
const dir = path.join(P.tmp, 'stills'); fs.mkdirSync(dir, { recursive: true });
for (const s of secs) { const o = path.join(dir, `p${part}_${s.toFixed(2)}.jpg`); await renderReelStill({ reel, settings: v.settings }, Math.min(reel.durationInFrames - 1, Math.round(s * 30)), o, 0.5); console.log(o); }
process.exit(0);
