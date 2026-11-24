/** npm run export [-- --date YYYY-MM-DD] — copy QC-passed final Reels to output/export/<date>/ */
import fs from 'node:fs';
import path from 'node:path';
import { P } from '../pipeline/paths';
const i = process.argv.indexOf('--date');
const dates = fs.existsSync(P.daily) ? fs.readdirSync(P.daily).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort() : [];
const date = i >= 0 ? process.argv[i + 1] : dates[dates.length - 1];
if (!date) { console.error('Nothing generated yet — run npm run generate first.'); process.exit(1); }
const dir = path.join(P.daily, date);
const rp = path.join(dir, 'quality-report.json');
if (!fs.existsSync(rp)) { console.error(`No quality report in ${dir} — run npm run generate.`); process.exit(1); }
const report = JSON.parse(fs.readFileSync(rp, 'utf8'));
if (report.status !== 'pass') { console.error('Quality report did not pass — export refused.'); process.exit(2); }
const out = path.join(P.exportDir, date); fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => /^(promax-part-\d+\.mp4|thumbnail-\d+\.jpg|quality-report\.json)$/.test(f));
for (const f of files) {
  const dest = f.startsWith('promax-part') ? `PROMAX-${date}-${f.replace('promax-', '')}` : f.startsWith('thumbnail') ? `PROMAX-${date}-${f}` : f;
  fs.copyFileSync(path.join(dir, f), path.join(out, dest)); console.log('✓', path.relative(process.cwd(), path.join(out, dest)));
}
console.log(`\nExported ${files.filter((f) => f.endsWith('.mp4')).length} Reel(s) → ${path.relative(process.cwd(), out)}`);
