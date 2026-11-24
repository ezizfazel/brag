import React, { useRef } from 'react';
import { AbsoluteFill, Img, interpolate, Easing, staticFile, useCurrentFrame } from 'remotion';
import type { Group, Settings } from '../../shared/types';
import { T } from '../../shared/plan';
import { faDate, faPart, toFa } from '../../shared/format';
import { C, FONT_EN, FONT_FA, LAYOUT } from '../theme';
import { useGsapTimeline } from '../useGsap';
import { SmartphoneShowcase, poseAt } from './SmartphoneShowcase';
import { PriceCard } from './PriceCard';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const LogoTile: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: 'linear-gradient(160deg,#ffffff,#e6efff)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 0 2px rgba(255,255,255,.45), 0 ${size * 0.1}px ${size * 0.3}px rgba(0,0,0,.6), 0 0 ${size * 0.45}px rgba(22,139,255,.8)` }}>
    <Img src={staticFile('logos/promax-logo.png')} style={{ width: size * 0.8, height: size * 0.8 }} />
  </div>
);

// ------------------------------------------------------------------ INTRO
export const Intro: React.FC<{ settings: Settings; part: number; parts: number }> = ({ settings, part, parts }) => {
  const f = useCurrentFrame();
  const tile = useRef<HTMLDivElement>(null), word = useRef<HTMLDivElement>(null), sub = useRef<HTMLDivElement>(null), streak = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null);
  useGsapTimeline((tl) => {
    const s = (x: number) => x / 30;
    tl.fromTo(streak.current, { scaleX: 0, opacity: 1 }, { scaleX: 1.6, opacity: 0, duration: s(22), ease: 'expo.out' }, s(2));
    tl.fromTo(tile.current, { scale: 0.2, rotateY: -160, opacity: 0, filter: 'blur(20px)' }, { scale: 1, rotateY: 0, opacity: 1, filter: 'blur(0px)', duration: s(24), ease: 'expo.out' }, s(4));
    tl.fromTo(ring.current, { scale: 0.4, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: s(30), ease: 'power2.out' }, s(8));
    tl.fromTo(word.current!.children, { y: 50, opacity: 0, filter: 'blur(12px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: s(14), stagger: s(1.2), ease: 'power3.out' }, s(16));
    tl.fromTo(sub.current!.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: s(12), stagger: s(4), ease: 'power3.out' }, s(28));
    tl.to([tile.current, word.current, sub.current], { y: -90, opacity: 0, filter: 'blur(14px)', duration: s(10), ease: 'power2.in' }, s(T.INTRO - 10));
  });
  const d = faDate(settings.update_date);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div ref={streak} style={{ position: 'absolute', top: 640, left: 0, width: 1080, height: 4, background: 'linear-gradient(90deg, rgba(22,139,255,0), #9fd0ff, rgba(22,139,255,0))', boxShadow: '0 0 30px #168BFF' }} />
      <div ref={ring} style={{ position: 'absolute', top: 540, left: 440, width: 200, height: 200, borderRadius: '50%', border: '3px solid #5DB2FF', boxShadow: '0 0 40px #168BFF' }} />
      <div style={{ position: 'absolute', top: 520, left: 0, right: 0, display: 'flex', justifyContent: 'center', perspective: 1200 }}><div ref={tile}><LogoTile size={240} /></div></div>
      <div ref={word} style={{ position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 104, letterSpacing: 10, color: '#fff' }}>
        {'PROMAX'.split('').map((c, i) => <span key={i} style={{ display: 'inline-block' }}>{c}</span>)}
      </div>
      <div ref={sub} style={{ position: 'absolute', top: 950, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_EN, fontWeight: 800, fontSize: 34, letterSpacing: 30, paddingLeft: 30, color: C.blue }}>MOBILE</div>
        <div style={{ marginTop: 40, fontFamily: FONT_FA, fontWeight: 900, fontSize: 76, color: '#fff', direction: 'rtl', textShadow: '0 0 30px rgba(22,139,255,.7)' }}>قیمت روز</div>
        <div style={{ marginTop: 10, fontFamily: FONT_FA, fontWeight: 600, fontSize: 38, color: C.silver, direction: 'rtl' }}>{d.long}{parts > 1 ? ` · ${faPart(part, parts)}` : ''}</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: interpolate(f, [0, 6], [1, 0], clamp), pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ OUTRO
export const Outro: React.FC<{ settings: Settings }> = ({ settings }) => {
  const tile = useRef<HTMLDivElement>(null), lines = useRef<HTMLDivElement>(null), btn = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null);
  useGsapTimeline((tl) => {
    const s = (x: number) => x / 30;
    tl.fromTo(tile.current, { scale: 0.3, rotateY: 180, opacity: 0, filter: 'blur(16px)' }, { scale: 1, rotateY: 0, opacity: 1, filter: 'blur(0px)', duration: s(22), ease: 'expo.out' }, s(4));
    tl.fromTo(ring.current, { scale: 0.5, opacity: 1 }, { scale: 3.4, opacity: 0, duration: s(34), ease: 'power2.out' }, s(8));
    tl.fromTo(lines.current!.children, { y: 40, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: s(14), stagger: s(5), ease: 'power3.out' }, s(16));
    tl.fromTo(btn.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: s(14), ease: 'back.out(2)' }, s(36));
    tl.to(btn.current, { scale: 1.06, duration: s(8), yoyo: true, repeat: 3, ease: 'sine.inOut' }, s(52));
  });
  const d = faDate(settings.update_date);
  return (
    <AbsoluteFill>
      <div ref={ring} style={{ position: 'absolute', top: 470, left: 430, width: 220, height: 220, borderRadius: '50%', border: '3px solid #5DB2FF', boxShadow: '0 0 40px #168BFF' }} />
      <div style={{ position: 'absolute', top: 440, left: 0, right: 0, display: 'flex', justifyContent: 'center', perspective: 1200 }}><div ref={tile}><LogoTile size={280} /></div></div>
      <div ref={lines} style={{ position: 'absolute', top: 780, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_EN, fontWeight: 900, fontSize: 80, letterSpacing: 6, color: '#fff', paddingLeft: 6, whiteSpace: 'nowrap' }}>PROMAX <span style={{ color: C.blue }}>MOBILE</span></div>
        <div style={{ marginTop: 30, fontFamily: FONT_FA, fontWeight: 700, fontSize: 40, color: C.silver, direction: 'rtl' }}>قیمت‌ها به‌روز شده در {d.long}</div>
        <div style={{ marginTop: 26, fontFamily: FONT_FA, fontWeight: 900, fontSize: 50, color: '#fff', direction: 'rtl', textShadow: '0 0 30px rgba(22,139,255,.6)' }}>برای قیمت روز، پرومکس رو دنبال کن</div>
      </div>
      <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div ref={btn} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 46px', borderRadius: 60, direction: 'ltr',
          background: 'linear-gradient(160deg,#3aa0ff,#168BFF 55%,#0b4fb3)', boxShadow: '0 0 50px rgba(22,139,255,.8), inset 0 1px 0 rgba(255,255,255,.4)' }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1.1" fill="#fff" stroke="none" /></svg>
          <span style={{ fontFamily: FONT_EN, fontWeight: 800, fontSize: 48, color: '#fff' }}>{settings.instagram_username}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ PRODUCT GROUP
export const GroupScene: React.FC<{ group: Group; settings: Settings; preview?: boolean }> = ({ group, settings, preview }) => {
  const f = useCurrentFrame();
  const n = group.variants.length;
  const v0 = group.variants[0].assets;
  const { idx } = poseAt(f, n, !!v0.front || (!v0.back && !v0.front));
  const head = useRef<HTMLDivElement>(null);
  useGsapTimeline((tl) => {
    const s = (x: number) => x / 30;
    tl.fromTo(head.current!.children, { y: -40, opacity: 0, filter: 'blur(12px)', letterSpacing: '18px' }, { y: 0, opacity: 1, filter: 'blur(0px)', letterSpacing: '0px', duration: s(16), stagger: s(4), ease: 'expo.out' }, s(6));
    tl.to(head.current, { y: -40, opacity: 0, filter: 'blur(10px)', duration: s(T.EXIT), ease: 'power2.in' }, s(T.ENTER + n * T.PER_VARIANT));
  }, [n]);
  const noImage = group.variants.some((v) => !v.assets.front && !v.assets.back);
  const brandLine = group.brand === 'Apple' ? 'APPLE' : 'SAMSUNG';
  const chips = [settings.show_storage ? group.storage : null, settings.show_part_number && group.part_number ? group.part_number : null].filter(Boolean) as string[];
  return (
    <AbsoluteFill>
      <div ref={head} style={{ position: 'absolute', top: LAYOUT.header, left: 60, right: 60, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_EN, fontWeight: 800, fontSize: 24, letterSpacing: 8, color: C.blue }}>{brandLine} · {group.series.toUpperCase()}</div>
        <div style={{ fontFamily: FONT_EN, fontWeight: 900, fontSize: group.model.length > 16 ? 76 : 88, color: '#fff', lineHeight: 1.08, marginTop: 6, textShadow: '0 0 40px rgba(22,139,255,.45)' }}>{group.model}</div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 14, direction: 'ltr' }}>
          {chips.map((c) => <span key={c} style={{ fontFamily: FONT_EN, fontWeight: 700, fontSize: 26, color: '#fff', padding: '6px 18px', borderRadius: 30, border: '1.5px solid rgba(93,178,255,.7)', background: 'rgba(22,139,255,.14)' }}>{c}</span>)}
          {group.condition ? <span style={{ fontFamily: FONT_FA, fontWeight: 700, fontSize: 26, color: C.silver, padding: '6px 18px', borderRadius: 30, border: '1.5px solid rgba(200,211,224,.4)', direction: 'rtl' }}>{group.condition}</span> : null}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: LAYOUT.stageCenterY - LAYOUT.stageHeight / 2 - 50 }}>
        <SmartphoneShowcase variants={group.variants} f={f} height={LAYOUT.stageHeight} />
      </div>
      {preview && noImage ? (
        <div style={{ position: 'absolute', top: 1050, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_FA, fontSize: 24, color: '#ffb84d', direction: 'rtl' }}>پیش‌نمایش · تصویر این محصول هنوز اضافه نشده</div>
      ) : null}
      <PriceCard variants={group.variants} f={f} idx={idx} settings={settings} model={group.model} storage={group.storage} part={group.part_number} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ HUD + transitions
export const Hud: React.FC<{ settings: Settings; part: number; parts: number; from: number; to: number }> = ({ settings, part, parts, from, to }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 12, to - 10, to], [0, 1, 1, 0], clamp);
  const d = faDate(settings.update_date);
  return (
    <div style={{ position: 'absolute', top: LAYOUT.hud - 4, left: 60, right: 60, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Img src={staticFile('logos/promax-logo.png')} style={{ width: 34, height: 34, background: '#fff', borderRadius: 9, padding: 3 }} />
        <span style={{ fontFamily: FONT_EN, fontWeight: 800, fontSize: 22, letterSpacing: 5, color: '#fff' }}>PROMAX <span style={{ color: C.blue }}>DAILY PRICE</span></span>
      </div>
      <span style={{ fontFamily: FONT_FA, fontWeight: 700, fontSize: 24, color: C.silver, direction: 'rtl', unicodeBidi: 'isolate' }}>{d.long}{parts > 1 ? <>{' · '}<span style={{ color: C.blueSoft }}>{faPart(part, parts)}</span></> : null}</span>
    </div>
  );
};

export const SweepTransition: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [at - 8, at + 8], [0, 1], clamp);
  if (k <= 0 || k >= 1) return null;
  const y = interpolate(k, [0, 1], [-200, 2120], { easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y - 120, height: 240, background: 'linear-gradient(180deg, rgba(22,139,255,0), rgba(22,139,255,.35) 45%, rgba(220,240,255,.9) 50%, rgba(22,139,255,.35) 55%, rgba(22,139,255,0))' }} />
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: 'absolute', left: (i * 173) % 1080, width: 260, top: y - 300 + i * 90, height: 6, background: 'rgba(140,200,255,.55)' }} />)}
    </div>
  );
};
