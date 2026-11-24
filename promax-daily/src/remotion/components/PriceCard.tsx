import React, { useRef } from 'react';
import { interpolate, Easing } from 'remotion';
import type { Product, Settings } from '../../shared/types';
import { T } from '../../shared/plan';
import { faNumber, priceText, unitLabel } from '../../shared/format';
import { C, FONT_EN, FONT_FA, LAYOUT } from '../theme';
import { useGsapTimeline } from '../useGsap';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Swatch: React.FC<{ hex: string; size: number; glow?: boolean }> = ({ hex, size, glow }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flex: 'none',
    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${hex} 60%, #fff) 0%, ${hex} 45%, color-mix(in srgb, ${hex} 70%, #000) 100%)`,
    boxShadow: `0 0 0 2px rgba(255,255,255,.85), 0 0 0 5px ${glow ? 'rgba(22,139,255,.9)' : 'rgba(22,139,255,.0)'}, 0 0 ${glow ? 22 : 0}px rgba(22,139,255,.9)` }} />
);

/**
 * Premium glass price panel + ColorShowcase list.
 * Hero = the spotlighted colour (model, storage, colour, part number, price);
 * list = every active colour of this model with its exact price, visible for the whole scene.
 */
export const PriceCard: React.FC<{ variants: Product[]; f: number; idx: number; settings: Settings; model: string; storage: string; part: string }> = ({ variants, f, idx, settings, model, storage, part }) => {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  const border = useRef<HTMLDivElement>(null);
  const showPart = settings.show_part_number;
  const end = T.ENTER + variants.length * T.PER_VARIANT;

  useGsapTimeline((tl) => {
    const s = (fr: number) => fr / 30;
    tl.fromTo(root.current, { y: 140, opacity: 0, filter: 'blur(18px)', scale: 0.94 }, { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, duration: s(16), ease: 'expo.out' }, s(30));
    tl.fromTo(border.current, { '--ang': '0deg' } as gsap.TweenVars, { '--ang': '720deg', duration: s(end), ease: 'none' } as gsap.TweenVars, s(30));
    tl.fromTo(hero.current!.children, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: s(12), stagger: s(3), ease: 'power3.out' }, s(36));
    tl.fromTo(rows.current!.children, { x: 80, opacity: 0, filter: 'blur(8px)' }, { x: 0, opacity: 1, filter: 'blur(0px)', duration: s(12), stagger: s(3), ease: 'power3.out' }, s(40));
    tl.to(root.current, { y: 120, opacity: 0, filter: 'blur(14px)', duration: s(T.EXIT), ease: 'power2.in' }, s(end));
  }, [variants.length]);

  const v = variants[idx];
  // spotlight change: quick digital sweep + count-up that always settles on the exact Excel price
  const segStart = T.ENTER + idx * T.PER_VARIANT;
  const k = interpolate(f, [segStart, segStart + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shown = f < T.ENTER || k >= 0.55 ? v.price : Math.round(v.price * (0.965 + 0.035 * k / 0.55));
  const settled = f >= segStart + 14 || f < T.ENTER;
  const priceStr = settled ? priceText(v.price) : faNumber(shown);
  const flash = interpolate(f - segStart, [0, 4, 16], [0, 1, 0], clamp);
  const unit = unitLabel(settings);
  const L = LAYOUT.card;
  const rowH = variants.length > 3 ? 50 : 58;
  const cardH = 214 + variants.length * rowH + 22;

  return (
    <div ref={root} style={{ position: 'absolute', left: L.left, top: L.top, width: L.width, height: cardH, opacity: 0 }}>
      {/* animated light border */}
      <div ref={border} style={{ position: 'absolute', inset: -2, borderRadius: 40, padding: 2,
        background: 'conic-gradient(from var(--ang, 0deg), rgba(22,139,255,0) 0deg, rgba(93,178,255,.95) 50deg, rgba(22,139,255,0) 120deg, rgba(200,211,224,.5) 220deg, rgba(22,139,255,0) 300deg)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' } as React.CSSProperties} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: 38, overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(10,28,56,.82) 0%, rgba(4,12,26,.88) 100%)', backdropFilter: 'blur(22px)',
        boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12), 0 0 60px rgba(22,139,255,.25)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, rgba(22,139,255,0) 30%, rgba(93,178,255,${0.28 * flash}) 50%, rgba(22,139,255,0) 70%)` }} />
        {/* hero */}
        <div ref={hero} style={{ position: 'absolute', left: 34, right: 34, top: 26, height: 150, direction: 'rtl', display: 'flex', alignItems: 'center', gap: 22 }}>
          <Swatch hex={v.color_hex || '#888'} size={58} glow />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            {settings.show_color && <div style={{ fontFamily: FONT_FA, fontWeight: 800, fontSize: 44, color: C.white, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{v.color}</div>}
            <div style={{ fontFamily: FONT_EN, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: C.silver, direction: 'ltr', textAlign: 'right' }}>
              {[settings.show_storage ? storage : null, showPart && part ? part : null].filter(Boolean).join('  |  ')}
            </div>
          </div>
          <div style={{ marginRight: 'auto', textAlign: 'left', direction: 'rtl' }}>
            <div data-price={v.price} data-pid={v.product_id} style={{ fontFamily: FONT_FA, fontWeight: 900, fontSize: 92, lineHeight: 1, color: C.white, letterSpacing: -1, filter: settled ? 'none' : `blur(${k < 0.55 ? 18 : (1 - k) * 16}px)`,
              textShadow: '0 0 28px rgba(22,139,255,.75), 0 0 70px rgba(22,139,255,.35)' }}>{priceStr}</div>
            <div style={{ fontFamily: FONT_FA, fontWeight: 700, fontSize: 28, color: C.blueSoft, marginTop: 6, textAlign: 'left' }}>{unit}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 34, right: 34, top: 186, height: 2, background: 'linear-gradient(90deg, rgba(22,139,255,0), rgba(22,139,255,.8), rgba(22,139,255,0))' }} />
        {/* colour list (ColorShowcase) */}
        <div ref={rows} style={{ position: 'absolute', left: 26, right: 26, top: 200, direction: 'rtl' }}>
          {variants.map((p, i) => {
            const on = i === idx && f >= T.ENTER - 2;
            return (
              <div key={p.product_id} style={{ height: rowH, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', borderRadius: 16,
                background: on ? 'linear-gradient(270deg, rgba(22,139,255,.32), rgba(22,139,255,.06))' : 'transparent',
                boxShadow: on ? 'inset 0 0 0 1.5px rgba(93,178,255,.7)' : 'none' }}>
                <Swatch hex={p.color_hex || '#888'} size={28} glow={on} />
                <div style={{ fontFamily: FONT_FA, fontWeight: on ? 800 : 600, fontSize: 32, color: on ? '#fff' : 'rgba(255,255,255,.82)', whiteSpace: 'nowrap' }}>{p.color}</div>
                {p.part_number !== part && showPart && p.part_number ? <div style={{ fontFamily: FONT_EN, fontWeight: 700, fontSize: 20, color: C.silver }}>{p.part_number}</div> : null}
                <div style={{ marginRight: 'auto', fontFamily: FONT_FA, fontWeight: on ? 900 : 700, fontSize: 36, color: on ? '#fff' : 'rgba(255,255,255,.9)' }}>
                  {priceText(p.price)} <span style={{ fontSize: 22, fontWeight: 600, color: C.blueSoft }}>{unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
