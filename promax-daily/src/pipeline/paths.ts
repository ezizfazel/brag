import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const P = {
  assets: path.join(ROOT, 'assets'),
  data: path.join(ROOT, 'data'),
  uploads: path.join(ROOT, 'data', 'uploads'),
  latestXlsx: path.join(ROOT, 'data', 'uploads', 'latest.xlsx'),
  validated: path.join(ROOT, 'data', 'validated.json'),
  output: path.join(ROOT, 'output'),
  daily: path.join(ROOT, 'output', 'daily'),
  preview: path.join(ROOT, 'output', 'preview'),
  exportDir: path.join(ROOT, 'output', 'export'),
  templates: path.join(ROOT, 'templates'),
  python: path.join(ROOT, 'python'),
  tmp: path.join(ROOT, 'output', '.tmp'),
};
