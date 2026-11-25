import React from 'react';
import { Img, interpolate, Easing, staticFile } from 'remotion';
import type { Visual } from '../../shared/catalog';
import { T } from '../../shared/plan';
import { C } from '../theme';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * Official product image with real-feeling motion (2.5D — official photos are flat; nothing here
 * claims to be a 3D scan): entrance swing, idle sway + float, a full spin on every colour change
 * (image swaps when edge-on), back→front flips where the maker publishes both sides,
 * light sweep, contact shadow and floor reflection.
 */
export function devicePose(f: number, n: number, per: number) {
  const enter = interpolate(f, [0, T.ENTER], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const end = T.ENTER + n * per;
  const exit = interpolate(f, [end, end + T.EXIT], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  let idx = 0, spin = 0;
  for (let v = 1; v < n; v++) {
    const b = T.ENTER + v * per;
    if (f >= b) idx = v;
    if (f >= b - 9 && f < b) spin = interpolate(f, [b - 9, b], [0, 90], { ...clamp, easing: Easing.in(Easing.cubic) });
    if (f >= b && f < b + 9) spin = interpolate(f, [b, b + 9], [-90, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  }
  const sway = Math.sin(f / 26) * 7;
  const rotY = interpolate(enter, [0, 1], [62, 0]) + sway * enter + spin - exit * 55;
  const segStart = T.ENTER + idx * per;
  return { enter, exit, idx, spin, rotY, segStart };
}

const Placeholder: React.FC<{ hex: string; h: number }> = ({ hex, h }) => (
  <div style={{ width: h * 0.49, height: h, borderRadius: h * 0.08, background: `linear-gradient(150deg, ${hex}, color-mix(in srgb, ${hex} 75%, #000))`,
    boxShadow: `inset 0 0 0 6px color-mix(in srgb, ${hex} 60%, #fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Img src={staticFile('logos/promax-logo.png')} style={{ width: h * 0.18, opacity: 0.5, filter: 'grayscale(1) brightness(1.8)' }} />
  </div>
);

export const Device: React.FC<{ visuals: Visual[]; hexes: string[]; f: number; per: number; height: number }> = ({ visuals, hexes, f, per, height }) => {
  const n = visuals.length;
  const { enter, exit, idx, rotY, segStart } = devicePose(f, n, per);
  const v = visuals[idx];
  // Samsung-style back/front: flip to the front half-way through the colour's spotlight (when there is time)
  const canFlip = v.mode === 'flip' && !!v.front && per >= 33;
  const flipAt = segStart + Math.round(per * 0.5);
  const flip = canFlip ? interpolate(f, [flipAt - 6, flipAt + 6], [0, 180], { ...clamp, easing: inOut }) : 0;
  const showFront = canFlip && flip >= 90;
  const src = v.mode === 'pair' ? v.hero : showFront ? v.front : v.back;
  const totalRot = rotY + (flip >= 90 ? flip - 180 : flip);
  const prev = devicePose(f - 1, n, per).rotY;
  const blur = Math.min(14, Math.abs(rotY - prev) * 0.7);
  const float = Math.sin(f / 22) * 8 * enter;
  const tx = interpolate(enter, [0, 1], [620, 0]) + interpolate(exit, [0, 1], [0, -760]);
  const sc = interpolate(enter, [0, 1], [0.82, 1]);
  const sweepK = ((f - segStart) % Math.max(per, 1)) / Math.max(per, 1);
  const sweep = interpolate(sweepK, [0.05, 0.55], [-40, 140], clamp);
  const maxW = 900;
  const imgStyle: React.CSSProperties = { maxHeight: height, maxWidth: maxW, height, width: 'auto', objectFit: 'contain', display: 'block' };
  const mask = src ? { WebkitMaskImage: `url(${staticFile(src)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } : {};
  const fid = `mbv-${Math.round(blur * 10)}`;
  const body = (
    <div style={{ position: 'relative', height, display: 'flex', justifyContent: 'center' }}>
      {src ? <Img src={staticFile(src)} style={imgStyle} /> : <Placeholder hex={hexes[idx]} h={height} />}
      {src ? <div style={{ position: 'absolute', inset: 0, ...mask, background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep - 16}%, rgba(255,255,255,.55) ${sweep}%, rgba(255,255,255,0) ${sweep + 16}%)` }} /> : null}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height + 120, perspective: 2000 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}><filter id={fid}><feGaussianBlur stdDeviation={`${blur} 0`} /></filter></svg>
      {/* contact shadow */}
      <div style={{ position: 'absolute', left: '50%', top: height - 10, width: 520, height: 60, marginLeft: -260, borderRadius: '50%', transform: `translateX(${tx}px) scaleX(${0.6 + 0.4 * Math.abs(Math.cos((totalRot * Math.PI) / 180))})`,
        background: 'radial-gradient(closest-side, rgba(6,20,38,.28), rgba(6,20,38,0))', opacity: enter * (1 - exit) }} />
      {/* reflection */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: height + 6, height: height * 0.32, overflow: 'hidden', opacity: 0.18 * enter * (1 - exit),
        WebkitMaskImage: 'linear-gradient(rgba(0,0,0,.8), rgba(0,0,0,0) 80%)' }}>
        <div style={{ perspective: 2000 }}>
          <div style={{ transform: `translateX(${tx}px) translateY(${float}px) scale(${sc}) rotateY(${totalRot}deg) scaleY(-1)` }}>{body}</div>
        </div>
      </div>
      {/* device */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transformStyle: 'preserve-3d', opacity: enter * (1 - exit),
        transform: `translateX(${tx}px) translateY(${-float}px) scale(${sc}) rotateY(${totalRot}deg)`, filter: `drop-shadow(0 30px 40px rgba(6,20,38,.18)) url(#${fid})` }}>
        {body}
      </div>
    </div>
  );
};

export const Swatch: React.FC<{ hex: string; size: number; on?: boolean }> = ({ hex, size, on }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flex: 'none',
    background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${hex} 55%, #fff) 0%, ${hex} 50%, color-mix(in srgb, ${hex} 80%, #000) 100%)`,
    boxShadow: on ? `0 0 0 3px #fff, 0 0 0 5px ${C.blue}, 0 6px 16px rgba(22,139,255,.35)` : '0 0 0 2px #fff, 0 0 0 3px #d5deea' }} />
);
