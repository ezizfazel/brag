/** npm run validate [-- --input file.xlsx] — validate the Excel file and product assets */
import path from 'node:path';
import { P } from '../pipeline/paths';
import { validateExcel } from '../pipeline/steps';
import { planReels } from '../shared/plan';
import { dataQC } from '../pipeline/qc';
const i = process.argv.indexOf('--input');
const input = path.resolve(i >= 0 ? process.argv[i + 1] : P.latestXlsx);
const v = await validateExcel(input);
const icon = { error: '✖', warning: '⚠', info: 'ℹ' } as const;
console.log(`\nPROMAX DAILY PRICE · ${path.relative(process.cwd(), input)}`);
console.log(`active & valid: ${v.stats.active_valid} · rejected: ${v.stats.rejected} · inactive: ${v.stats.inactive} · brands: ${v.stats.brands.join(', ')}`);
console.log(`missing images: ${v.stats.missing_images} · invalid prices: ${v.stats.invalid_prices} · errors: ${v.stats.errors} · warnings: ${v.stats.warnings}\n`);
for (const is of v.issues) if (is.level !== 'info') console.log(`${icon[is.level]} [${is.code}] ${is.message}`);
if (v.ok) {
  const reels = planReels(v);
  console.log(`\nplan: ${reels.length} reel(s): ` + reels.map((r) => `part ${r.part} ${(r.durationInFrames / 30).toFixed(1)}s (${r.groups.map((g) => g.model + (g.part_number ? ' ' + g.part_number : '') + ' ×' + g.variants.length).join(', ')})`).join(' | '));
  const qc = await dataQC(v, reels, input);
  for (const c of qc) console.log(`QC ${c.status.toUpperCase().padEnd(4)} ${c.check}`);
}
process.exit(v.ok && v.stats.errors === 0 ? 0 : 1);
