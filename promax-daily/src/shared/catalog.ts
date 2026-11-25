// Resolves an Excel product to the permanent PROMAX image library (assets/official/catalog.json).
import catalog from '../../assets/official/catalog.json';

export type CatColor = { name: string; hex: string; slug: string; official: { hero?: string; back?: string; front?: string }; preview3d: string; glb: string };
export type CatModel = { id: string; name: string; brand: string; series: string; colors: CatColor[] };
export const MODELS = (catalog as unknown as { models: CatModel[] }).models;

const norm = (s: string) => s.toLowerCase().replace(/^(apple|samsung)\s+/, '').replace(/galaxy\s+/, 'galaxy ').replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, ' ').trim();
export function findModel(model: string): CatModel | undefined {
  const n = norm(model);
  return MODELS.find((m) => norm(m.name) === n) || MODELS.find((m) => norm(m.name).replace(/^galaxy /, '') === n.replace(/^galaxy /, ''));
}
export function findColor(m: CatModel | undefined, color: string): CatColor | undefined {
  if (!m) return undefined;
  const n = color.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return m.colors.find((c) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === n);
}

import type { Product } from './types';
export type Visual = { mode: 'pair' | 'flip' | 'back' | '3d' | 'placeholder'; hero?: string; back?: string; front?: string; source: 'excel' | 'official' | '3d' | 'none' };
/** Excel images win; otherwise the permanent official library; then the 3D library preview; then a branded placeholder. */
export function resolveVisual(p: Product): Visual {
  if (p.assets.front || p.assets.back) {
    const back = p.assets.back?.path, front = p.assets.front?.path;
    return { mode: back && front ? 'flip' : 'back', back: back ?? front, front, source: 'excel' };
  }
  const c = findColor(findModel(p.model), p.color);
  if (c?.official.hero) return { mode: 'pair', hero: c.official.hero, source: 'official' };
  if (c?.official.back) return { mode: c.official.front ? 'flip' : 'back', back: c.official.back, front: c.official.front, source: 'official' };
  if (c?.preview3d) return { mode: '3d', back: c.preview3d, source: '3d' };
  return { mode: 'placeholder', source: 'none' };
}
