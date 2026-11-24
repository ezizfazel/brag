import { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import gsap from 'gsap';

/**
 * Deterministic GSAP for Remotion: the timeline is built paused once and then
 * seeked to the current frame on every render, so any frame renders identically
 * regardless of render order or concurrency.
 */
export function useGsapTimeline(build: (tl: gsap.core.Timeline) => void, deps: unknown[] = []) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = useRef<gsap.core.Timeline | null>(null);
  useLayoutEffect(() => {
    const t = gsap.timeline({ paused: true });
    build(t);
    tl.current = t;
    t.seek(frame / fps, false);
    return () => { t.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useLayoutEffect(() => { tl.current?.seek(frame / fps, false); }, [frame, fps]);
}
