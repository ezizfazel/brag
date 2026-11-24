import React from 'react';
import { AbsoluteFill, Img, interpolate, Easing, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Group, Reel, Settings } from '../../shared/types';
import { T } from '../../shared/plan';
import { enDate, faDate } from '../../shared/format';
import { resolveVisual, findColor, findModel } from '../../shared/catalog';
import { C, EN, FA, LAYOUT } from '../theme';
import { Device, devicePose } from './Device';
import { PricePanel } from './PricePanel';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const out = Easing.out(Easing.cubic);
const hexOf = (p: Group['variants'][number]) => p.color_hex || findColor(findModel(p.model), p.color)?.hex || '#9aa6b8';

// ---------------------------------------------------------------- background
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, #FFFFFF 45%, ${C.bg2} 100%)` }}>
      <div style={{ position: 'absolute', left: -260 + Math.sin(t * 0.35) * 80, top: 380 + Math.cos(t * 0.3) * 60, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(22,139,255,.20), rgba(22,139,255,0))' }} />
      <div style={{ position: 'absolute', right: -300 + Math.cos(t * 0.28) * 90, top: 1050 + Math.sin(t * 0.33) * 70, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(120,190,255,.22), rgba(120,190,255,0))' }} />
      {/* dot grid */}
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(22,80,160,.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `0 ${(t * 8) % 36}px`,
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 45%, #000 30%, transparent 80%)' }} />
      {/* soft light streak */}
      <div style={{ position: 'absolute', left: ((t * 220) % 2400) - 700, top: -200, width: 260, height: 2400, transform: 'rotate(24deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))' }} />
    </AbsoluteFill>
  );
};

const LogoTile: React.FC<{ size: number; glow?: number }> = ({ size, glow = 1 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.27, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 ${size * 0.12}px ${size * 0.35}px rgba(14,60,130,${0.18 * glow}), 0 0 0 1.5px rgba(22,139,255,.15)` }}>
    <Img src={staticFile('logos/promax-logo.png')} style={{ width: size * 0.78, height: size * 0.78 }} />
  </div>
);

// ---------------------------------------------------------------- HUD + progress
export const Hud: React.FC<{ reel: Reel; settings: Settings }> = ({ reel, settings }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [reel.intro - 6, reel.intro + 8, reel.durationInFrames - reel.outro - 6, reel.durationInFrames - reel.outro + 4], [0, 1, 1, 0], clamp);
  const gi = reel.groups.findIndex((g) => f >= g.from && f < g.from + g.durationInFrames);
  return (
    <div style={{ position: 'absolute', top: LAYOUT.hud - 6, left: 60, right: 60, opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoTile size={44} glow={0.6} />
          <span style={{ fontFamily: EN, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.navy }}>PROMAX</span>
          <span style={{ fontFamily: EN, fontWeight: 500, fontSize: 18, letterSpacing: 4, color: C.blue }}>DAILY PRICE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl' }}>
          <span style={{ fontFamily: FA, fontWeight: 500, fontSize: 22, color: C.muted }}>قیمت امروز</span>
          <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 24, color: C.navy }}>{enDate(settings.update_date)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 16, direction: 'ltr' }}>
        {reel.groups.map((g, i) => {
          const p = i < gi ? 1 : i === gi ? interpolate(f, [g.from, g.from + g.durationInFrames], [0, 1], clamp) : 0;
          return <div key={g.key} style={{ flex: g.variants.length, height: 4, borderRadius: 2, background: C.line, overflow: 'hidden' }}><div style={{ width: `${p * 100}%`, height: '100%', background: C.blue }} /></div>;
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- INTRO
export const Intro: React.FC<{ reel: Reel; settings: Settings }> = ({ reel, settings }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = spring({ frame: f - 2, fps, config: { damping: 14, stiffness: 120 } });
  const ring = interpolate(f, [4, 36], [0, 1], { ...clamp, easing: out });
  const word = (i: number) => interpolate(f, [12 + i * 1.6, 24 + i * 1.6], [0, 1], { ...clamp, easing: out });
  const line = (d: number) => interpolate(f, [d, d + 12], [0, 1], { ...clamp, easing: out });
  const exit = interpolate(f, [reel.intro - 10, reel.intro], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const d = faDate(settings.update_date);
  // fan of real devices from today's list
  const firsts = reel.groups.slice(0, 3).map((g) => resolveVisual(g.variants[0])).filter((v) => v.hero || v.back);
  return (
    <AbsoluteFill style={{ opacity: 1 - exit, transform: `translateY(${-exit * 80}px)`, filter: `blur(${exit * 10}px)` }}>
      <div style={{ position: 'absolute', left: 540 - 260, top: 520 - 260 + 20, width: 520, height: 520, borderRadius: '50%', border: `3px solid ${C.blue}`, opacity: (1 - ring) * 0.8, transform: `scale(${0.4 + ring * 1.4})` }} />
      <div style={{ position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${tile}) rotate(${(1 - tile) * -20}deg)` }}><LogoTile size={230} /></div>
      <div style={{ position: 'absolute', top: 680, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontFamily: EN, fontWeight: 900, fontSize: 112, letterSpacing: 14, color: C.navy, paddingLeft: 14 }}>
        {'PROMAX'.split('').map((c, i) => <span key={i} style={{ display: 'inline-block', opacity: word(i), transform: `translateY(${(1 - word(i)) * 40}px)` }}>{c}</span>)}
      </div>
      <div style={{ position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', fontFamily: EN, fontWeight: 600, fontSize: 30, letterSpacing: 26, paddingLeft: 26, color: C.blue, opacity: line(20) }}>MOBILE</div>
      <div style={{ position: 'absolute', top: 905, left: 0, right: 0, textAlign: 'center', direction: 'rtl', opacity: line(26), transform: `translateY(${(1 - line(26)) * 30}px)` }}>
        <div style={{ fontFamily: FA, fontWeight: 800, fontSize: 68, color: C.navy }}>قیمت روز موبایل</div>
        <div style={{ marginTop: 14, fontFamily: FA, fontWeight: 500, fontSize: 30, color: C.muted }}>{d.long.replace(/[۰-۹]+/g, (m) => String(+m.replace(/[۰-۹]/g, (x) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)))))}</div>
      </div>
      {firsts.map((v, i) => {
        const k = interpolate(f, [18 + i * 5, 40 + i * 5], [0, 1], { ...clamp, easing: out });
        const x = [-300, 0, 300][i] ?? 0, r = [-12, 0, 12][i] ?? 0;
        return <Img key={i} src={staticFile((v.hero || v.back)!)} style={{ position: 'absolute', left: 540 - 170 + x, top: 1120 + (1 - k) * 260 + Math.abs(x) * 0.12, height: 400, width: 340, objectFit: 'contain', opacity: k,
          transform: `rotate(${r}deg)`, filter: 'drop-shadow(0 30px 30px rgba(6,20,38,.18))', zIndex: i === 1 ? 2 : 1 }} />;
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- OUTRO
export const Outro: React.FC<{ settings: Settings }> = ({ settings }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = spring({ frame: f - 4, fps, config: { damping: 13, stiffness: 110 } });
  const line = (d: number) => interpolate(f, [d, d + 12], [0, 1], { ...clamp, easing: out });
  const ring = interpolate(f, [8, 42], [0, 1], { ...clamp, easing: out });
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, f - 40) / 4);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 540 - 300, top: 600 - 300, width: 600, height: 600, borderRadius: '50%', border: `3px solid ${C.blue}`, opacity: (1 - ring) * 0.7, transform: `scale(${0.3 + ring * 1.5})` }} />
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${tile})` }}><LogoTile size={260} /></div>
      <div style={{ position: 'absolute', top: 790, left: 0, right: 0, textAlign: 'center', opacity: line(12), transform: `translateY(${(1 - line(12)) * 30}px)` }}>
        <span style={{ fontFamily: EN, fontWeight: 900, fontSize: 92, letterSpacing: 8, color: C.navy }}>PROMAX </span><span style={{ fontFamily: EN, fontWeight: 300, fontSize: 92, letterSpacing: 8, color: C.blue }}>MOBILE</span>
      </div>
      <div style={{ position: 'absolute', top: 930, left: 60, right: 60, textAlign: 'center', direction: 'rtl', opacity: line(20), transform: `translateY(${(1 - line(20)) * 30}px)` }}>
        <div style={{ fontFamily: FA, fontWeight: 700, fontSize: 50, color: C.navy }}>برای قیمت روز، پرومکس رو دنبال کن</div>
        <div style={{ marginTop: 16, fontFamily: FA, fontWeight: 500, fontSize: 28, color: C.muted }}>قیمت‌ها به‌روز شده در <span style={{ fontFamily: EN, fontWeight: 700, color: C.navy }}>{enDate(settings.update_date)}</span></div>
      </div>
      <div style={{ position: 'absolute', top: 1160, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: line(30) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 44px', borderRadius: 60, background: `linear-gradient(135deg, #3AA2FF, ${C.blue} 50%, ${C.blueDeep})`, boxShadow: '0 20px 50px rgba(22,139,255,.4)', transform: `scale(${pulse})`, direction: 'ltr' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1.1" fill="#fff" stroke="none" /></svg>
          <span style={{ fontFamily: EN, fontWeight: 700, fontSize: 46, color: '#fff' }}>{settings.instagram_username}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- MODEL SCENE
const short = (m: string) => m.replace(/^iPhone\s+/i, '').replace(/^Galaxy\s+/i, '').toUpperCase();

export const GroupScene: React.FC<{ group: Group; reel: Reel; settings: Settings }> = ({ group, reel, settings }) => {
  const f = useCurrentFrame();
  const n = group.variants.length, per = reel.per;
  const { idx } = devicePose(f, n, per);
  const visuals = group.variants.map(resolveVisual);
  const hexes = group.variants.map(hexOf);
  const end = T.ENTER + n * per;
  const tIn = interpolate(f, [2, 20], [0, 1], { ...clamp, easing: out });
  const tOut = interpolate(f, [end, end + T.EXIT], [0, 1], clamp);
  const ghostX = interpolate(f, [0, group.durationInFrames], [120, -120]);
  const chips = [group.brand.toUpperCase(), group.series].join('  ·  ');
  // the stage gets the space the price panel leaves free
  const rows = n > 4 ? 50 : 56, panelH = 178 + 26 + n * rows + 26;
  const stageH = Math.min(LAYOUT.stageH, LAYOUT.card.bottom - panelH - 40 - LAYOUT.stageTop);
  return (
    <AbsoluteFill>
      {/* giant ghost model name */}
      <div style={{ position: 'absolute', top: LAYOUT.stageTop + stageH * 0.18, left: 0, right: 0, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: EN, fontWeight: 900, fontSize: short(group.model).length > 9 ? 190 : 250,
        letterSpacing: -6, color: 'transparent', WebkitTextStroke: '2px rgba(22,139,255,.16)', transform: `translateX(${ghostX}px)`, opacity: tIn * (1 - tOut) }}>{short(group.model)}</div>
      {/* title */}
      <div style={{ position: 'absolute', top: LAYOUT.title, left: 60, right: 60, textAlign: 'center', opacity: tIn * (1 - tOut), transform: `translateY(${(1 - tIn) * -30}px)` }}>
        <div style={{ fontFamily: EN, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: C.blue }}>{chips.toUpperCase()}</div>
        <div style={{ fontFamily: EN, fontWeight: 800, fontSize: group.model.length > 17 ? 78 : 90, color: C.navy, lineHeight: 1.1, marginTop: 4, letterSpacing: -1 }}>{group.model}</div>
        {group.condition ? <div style={{ marginTop: 10, display: 'inline-block', fontFamily: FA, fontWeight: 500, fontSize: 22, color: C.muted, padding: '4px 16px', borderRadius: 20, border: `1.5px solid ${C.line}`, direction: 'rtl' }}>{group.condition}</div> : null}
      </div>
      {/* device */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: LAYOUT.stageTop + 40 }}>
        <Device visuals={visuals} hexes={hexes} f={f} per={per} height={stageH - 40} />
      </div>
      {/* colour dots under the device */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: LAYOUT.stageTop + stageH + 14, display: 'flex', justifyContent: 'center', gap: 14, opacity: tIn * (1 - tOut) }}>
        {hexes.map((h, i) => <div key={i} style={{ width: i === idx ? 34 : 14, height: 14, borderRadius: 7, background: h, boxShadow: `0 0 0 2px #fff, 0 0 0 ${i === idx ? 3.5 : 2.5}px ${i === idx ? C.blue : C.line}` }} />)}
      </div>
      <PricePanel variants={group.variants} f={f} per={per} idx={idx} settings={settings} storage={group.storage} part={group.part_number} hexes={hexes} />
    </AbsoluteFill>
  );
};
