import React from 'react';
import { interpolate, Easing } from 'remotion';
import type { Product, Settings } from '../../shared/types';
import { T } from '../../shared/plan';
import { priceText, unitLabel } from '../../shared/format';
import { C, EN, FA, LAYOUT } from '../theme';
import { Swatch } from './Device';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Each digit rolls up into place — every intermediate glyph is the final digit, so no wrong price is ever shown. */
const RollingPrice: React.FC<{ text: string; f: number; size: number }> = ({ text, f, size }) => (
  <div style={{ display: 'flex', direction: 'ltr', fontFamily: EN, fontWeight: 800, fontSize: size, lineHeight: 1, color: C.navy, letterSpacing: -1.5, height: size * 1.05, overflow: 'hidden' }}>
    {text.split('').map((ch, i) => {
      const k = interpolate(f - i * 0.6, [0, 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      return <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - k) * size * 0.9}px)`, opacity: k, filter: `blur(${(1 - k) * 6}px)`, minWidth: ch === ',' ? size * 0.24 : undefined }}>{ch}</span>;
    })}
  </div>
);

export const PricePanel: React.FC<{ variants: Product[]; f: number; per: number; idx: number; settings: Settings; storage: string; part: string; hexes: string[] }> = ({ variants, f, per, idx, settings, storage, part, hexes }) => {
  const n = variants.length;
  const rowH = n > 4 ? 50 : 56;
  const heroH = 178;
  const h = heroH + 26 + n * rowH + 26;
  const end = T.ENTER + n * per;
  const enter = interpolate(f, [8, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.exp) });
  const exit = interpolate(f, [end, end + T.EXIT], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const v = variants[idx];
  const segStart = T.ENTER + idx * per;
  const local = Math.max(0, f - Math.max(segStart, 18));
  const unit = unitLabel(settings);
  const L = LAYOUT.card;
  const swap = interpolate(f - segStart, [0, 8], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: L.left, width: L.width, top: L.bottom - h, height: h, opacity: enter * (1 - exit),
      transform: `translateY(${(1 - enter) * 120 + exit * 80}px) scale(${0.96 + 0.04 * enter})`, filter: `blur(${(1 - enter) * 14 + exit * 10}px)` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 40, background: 'linear-gradient(180deg, rgba(255,255,255,.92), rgba(246,250,255,.86))', backdropFilter: 'blur(24px)',
        boxShadow: '0 30px 70px rgba(14,60,130,.16), 0 2px 0 rgba(255,255,255,.9) inset, 0 0 0 1.5px rgba(22,139,255,.14)' }} />
      {/* accent bar */}
      <div style={{ position: 'absolute', right: 0, top: 34, width: 6, height: heroH - 60, borderRadius: 3, background: `linear-gradient(${C.blue}, ${C.blueDeep})` }} />
      {/* hero: colour line + big price */}
      <div style={{ position: 'absolute', left: 36, right: 44, top: 24, direction: 'rtl', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ transform: `scale(${0.8 + 0.2 * swap})` }}><Swatch hex={hexes[idx]} size={46} on /></div>
        <div style={{ fontFamily: EN, fontWeight: 700, fontSize: 36, color: C.navy, whiteSpace: 'nowrap', opacity: swap, transform: `translateX(${(1 - swap) * -20}px)`, direction: /[a-z]/i.test(v.color) ? 'ltr' : 'rtl' }}>{v.color}</div>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 10, direction: 'ltr' }}>
          {[settings.show_storage ? storage : null, settings.show_part_number && part ? part : null].filter(Boolean).map((t) => (
            <span key={t as string} style={{ fontFamily: EN, fontWeight: 600, fontSize: 22, color: C.blueDeep, background: C.sky, padding: '5px 14px', borderRadius: 10 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 36, right: 44, top: 88, height: 96, direction: 'rtl', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div data-pid={v.product_id} data-price={priceText(v.price, settings)}><RollingPrice text={priceText(v.price, settings)} f={local} size={92} /></div>
        <div style={{ fontFamily: FA, fontWeight: 600, fontSize: 34, color: C.blue, marginTop: 14 }}>{unit}</div>
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, top: heroH + 30, height: 1.5, background: `linear-gradient(90deg, rgba(22,139,255,0), ${C.line} 15%, ${C.line} 85%, rgba(22,139,255,0))` }} />
      {/* all colours */}
      <div style={{ position: 'absolute', left: 24, right: 24, top: heroH + 42, direction: 'rtl' }}>
        {variants.map((p, i) => {
          const on = i === idx && f >= T.ENTER - 2;
          const k = interpolate(f, [14 + i * 3, 26 + i * 3], [0, 1], clamp);
          return (
            <div key={p.product_id} style={{ height: rowH, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', borderRadius: 16, opacity: k, transform: `translateX(${(1 - k) * 40}px)`,
              background: on ? 'linear-gradient(270deg, rgba(22,139,255,.14), rgba(22,139,255,.03))' : 'transparent', boxShadow: on ? 'inset 0 0 0 1.5px rgba(22,139,255,.35)' : 'none' }}>
              <Swatch hex={hexes[i]} size={26} on={on} />
              <div style={{ fontFamily: EN, fontWeight: on ? 700 : 500, fontSize: 28, color: on ? C.navy : C.ink, whiteSpace: 'nowrap', direction: /[a-z]/i.test(p.color) ? 'ltr' : 'rtl' }}>{p.color}</div>
              {settings.show_part_number && p.part_number && p.part_number !== part ? <span style={{ fontFamily: EN, fontWeight: 600, fontSize: 18, color: C.muted }}>{p.part_number}</span> : null}
              <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: EN, fontWeight: on ? 800 : 600, fontSize: 32, color: on ? C.blueDeep : C.navy, direction: 'ltr' }}>{priceText(p.price, settings)}</span>
                <span style={{ fontFamily: FA, fontWeight: 500, fontSize: 20, color: C.muted }}>{unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
