import React from 'react';
import { Img, interpolate, Easing, staticFile } from 'remotion';
import type { Product } from '../../shared/types';
import { T } from '../../shared/plan';
import { C } from '../theme';

/**
 * 2.5D product showcase built from the shop's verified front/back product images.
 * This is NOT a true 3D model: two image faces + an extruded silhouette edge, rotated in
 * CSS 3D with rim light, light sweep, reflection, shadow and horizontal motion blur.
 * (A .glb model, when supplied in the Assets sheet, is rendered by ProductModel3D instead.)
 */
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export function poseAt(f: number, n: number) {
  // rotation in degrees: 180 = rear, 360 = front
  let rot: number;
  if (f < 14) rot = 200;
  else if (f < 34) rot = interpolate(f, [14, 34], [200, 360], { ...clamp, easing: ease });
  else if (f < T.ENTER) rot = interpolate(f, [34, T.ENTER], [360, 352], clamp);
  else {
    rot = interpolate(f, [T.ENTER, T.ENTER + 12], [352, 520], { ...clamp, easing: ease });
    for (let v = 1; v < n; v++) {
      const b = T.ENTER + v * T.PER_VARIANT;
      rot += interpolate(f, [b - 8, b + 8], [0, 360], { ...clamp, easing: ease });
    }
  }
  let idx = 0;
  for (let v = 1; v < n; v++) if (f >= T.ENTER + v * T.PER_VARIANT) idx = v;
  const enter = interpolate(f, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const end = T.ENTER + n * T.PER_VARIANT;
  const exit = interpolate(f, [end, end + T.EXIT], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sway = Math.sin(f / 22) * 4 * enter * (1 - exit);
  return { rot: rot + sway, idx, enter, exit };
}

const Face: React.FC<{ src?: string; side: 'front' | 'back'; w: number; h: number; hex: string; sweep: number }> = ({ src, side, w, h, hex, sweep }) => {
  const url = src ? staticFile(src) : undefined;
  const style: React.CSSProperties = {
    position: 'absolute', left: 0, top: 0, width: w, height: h, backfaceVisibility: 'hidden',
    transform: `${side === 'back' ? 'rotateY(180deg) ' : ''}translateZ(15px)`,
  };
  const mask: React.CSSProperties = url ? { WebkitMaskImage: `url(${url})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } : { borderRadius: 64 };
  return (
    <div style={style}>
      {url ? <Img src={url} style={{ width: w, height: h, objectFit: 'contain' }} /> : <Placeholder side={side} w={w} h={h} hex={hex} />}
      {/* travelling blue light */}
      <div style={{ position: 'absolute', inset: 0, ...mask, pointerEvents: 'none',
        background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep - 18}%, rgba(120,190,255,.55) ${sweep - 4}%, rgba(255,255,255,.75) ${sweep}%, rgba(120,190,255,.45) ${sweep + 4}%, rgba(255,255,255,0) ${sweep + 18}%)` }} />
    </div>
  );
};

const Placeholder: React.FC<{ side: 'front' | 'back'; w: number; h: number; hex: string }> = ({ side, w, h, hex }) => (
  <div style={{ width: w, height: h, borderRadius: 64, overflow: 'hidden', position: 'relative',
    background: side === 'back'
      ? `linear-gradient(150deg, ${hex} 0%, color-mix(in srgb, ${hex} 70%, #000) 55%, color-mix(in srgb, ${hex} 80%, #fff) 100%)`
      : 'linear-gradient(160deg,#0b1830,#02050b 60%)',
    boxShadow: `inset 0 0 0 6px color-mix(in srgb, ${hex} 60%, #C8D3E0), inset 0 0 40px rgba(0,0,0,.35)` }}>
    {side === 'front' && <div style={{ position: 'absolute', inset: 14, borderRadius: 52, background: 'radial-gradient(120% 70% at 70% 10%, #1a5fd6 0%, #071a3d 45%, #02050b 80%)' }} />}
    <Img src={staticFile('logos/promax-logo.png')} style={{ position: 'absolute', left: '50%', top: side === 'back' ? '46%' : '40%', width: w * 0.36, transform: 'translate(-50%,-50%)',
      opacity: side === 'back' ? 0.28 : 0.85, filter: side === 'back' ? 'grayscale(1) brightness(1.6)' : 'drop-shadow(0 0 18px #168BFF)' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.18) 45%, rgba(255,255,255,0) 56%)' }} />
  </div>
);

export const SmartphoneShowcase: React.FC<{ variants: Product[]; f: number; height?: number }> = ({ variants, f, height = 600 }) => {
  const { rot, idx, enter, exit } = poseAt(f, variants.length);
  const v = variants[idx];
  const front = v.assets.front, back = v.assets.back;
  const ar = (a?: { width?: number; height?: number }) => (a?.width && a?.height ? a.width / a.height : 0.49);
  const w = Math.round(height * Math.max(ar(front), ar(back), front || back ? 0 : 0.49));
  const h = height;
  const hex = v.color_hex || '#2B3447';
  const prev = poseAt(f - 1, variants.length).rot;
  const vel = Math.abs(rot - prev);
  const blur = Math.min(16, vel * 0.55);
  const sweep = interpolate(f, [28, 46], [-30, 130], clamp) + (f > T.ENTER ? interpolate((f - T.ENTER) % T.PER_VARIANT, [10, 28], [-30, 130], clamp) : 0);
  const edgeMask = back ? staticFile(back.path) : front ? staticFile(front.path) : undefined;
  const layers = Array.from({ length: 11 }, (_, i) => -15 + i * 3);
  const visibleSide = Math.cos((rot * Math.PI) / 180) > 0 ? 'front' : 'back';
  const glowSrc = visibleSide === 'front' ? front?.path ?? back?.path : back?.path ?? front?.path;

  const phone = (
    <div style={{ position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)` }}>
      {/* extruded side frame */}
      {layers.map((z) => (
        <div key={z} style={{ position: 'absolute', inset: 0, transform: `translateZ(${z}px)`,
          background: `linear-gradient(90deg, #6d7686, ${C.silver} 30%, color-mix(in srgb, ${hex} 55%, #9aa6b8) 60%, #3b4250)`,
          ...(edgeMask ? { WebkitMaskImage: `url(${edgeMask})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } : { borderRadius: 64 }) }} />
      ))}
      <Face side="front" src={front?.path} w={w} h={h} hex={hex} sweep={sweep} />
      <Face side="back" src={back?.path} w={w} h={h} hex={hex} sweep={sweep} />
    </div>
  );

  const tx = interpolate(exit, [0, 1], [0, -760]);
  const tz = interpolate(enter, [0, 1], [-900, 0]);
  const filterId = `mb-${Math.round(blur * 10)}`;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h + 260, perspective: 2200 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}><filter id={filterId}><feGaussianBlur stdDeviation={`${blur} 0`} /></filter></svg>
      {/* rim light */}
      <div style={{ position: 'absolute', left: '50%', top: 40, width: w * 1.08, height: h * 1.04, marginLeft: -(w * 1.08) / 2,
        transform: `translateX(${tx}px) scaleX(${Math.max(0.25, Math.abs(Math.cos((rot * Math.PI) / 180)))})`, filter: 'blur(28px)', opacity: 0.8 * enter * (1 - exit) }}>
        <div style={{ position: 'absolute', inset: 0, background: C.blue, ...(glowSrc ? { WebkitMaskImage: `url(${staticFile(glowSrc)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } : { borderRadius: 70 }) }} />
      </div>
      {/* device */}
      <div style={{ position: 'absolute', left: '50%', top: 50, marginLeft: -w / 2, transformStyle: 'preserve-3d',
        transform: `translateX(${tx}px) translateZ(${tz}px) rotateX(${interpolate(enter, [0, 1], [14, 2])}deg) rotateZ(${interpolate(exit, [0, 1], [0, -10])}deg)`,
        opacity: enter * (1 - exit), filter: `brightness(${interpolate(enter, [0, 1], [0.15, 1])}) url(#${filterId})` }}>
        {phone}
      </div>
      {/* reflection */}
      <div style={{ position: 'absolute', left: '50%', top: 50 + h * 2 + 14, marginLeft: -w / 2, transform: `translateX(${tx}px) scaleY(-1)`, transformOrigin: 'top center',
        opacity: 0.14 * enter * (1 - exit), WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,0) 30%)', perspective: 2200, filter: 'blur(2px)' }}>
        <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-2deg)' }}>{phone}</div>
      </div>
      {/* shadow */}
      <div style={{ position: 'absolute', left: '50%', top: 50 + h + 6, width: w * 1.3, height: 50, marginLeft: -(w * 1.3) / 2,
        transform: `translateX(${tx}px)`, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,.75), rgba(0,0,0,0))', opacity: enter * (1 - exit) }} />
    </div>
  );
};
