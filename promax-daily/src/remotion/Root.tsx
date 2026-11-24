import React from 'react';
import { Composition } from 'remotion';
import { PriceReel } from './PriceReel';
import type { ReelProps } from '../shared/types';
import sample from './sample-props.json';

export const Root: React.FC = () => (
  <Composition
    id="PriceReel"
    component={PriceReel as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={900}
    defaultProps={sample as unknown as Record<string, unknown>}
    calculateMetadata={({ props }) => {
      const p = props as unknown as ReelProps;
      return { durationInFrames: p.reel.durationInFrames, fps: p.reel.fps };
    }}
  />
);
