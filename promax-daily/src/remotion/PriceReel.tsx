import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import type { ReelProps } from '../shared/types';
import { useFonts } from './Fonts';
import { Stage3D } from './components/Stage3D';
import { GroupScene, Hud, Intro, Outro, SweepTransition } from './components/Scenes';

export const PriceReel: React.FC<ReelProps> = ({ reel, settings, preview }) => {
  useFonts();
  const f = useCurrentFrame();
  const outroAt = reel.durationInFrames - reel.outro;
  const energy = interpolate(f, [0, 20, reel.intro, reel.intro + 20, outroAt - 10, outroAt + 10], [1.4, 1.1, 1.1, 0.75, 0.75, 1.3], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#03070F' }}>
      <Stage3D energy={energy} />
      {/* cinematic vignette + top/bottom grade */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.65) 100%)' }} />
      <Sequence durationInFrames={reel.intro} name="Intro"><Intro settings={settings} part={reel.part} parts={reel.parts} /></Sequence>
      {reel.groups.map((g) => (
        <Sequence key={g.key} from={g.from} durationInFrames={g.durationInFrames} name={`${g.model} ${g.part_number}`}>
          <GroupScene group={g} settings={settings} preview={preview} />
        </Sequence>
      ))}
      <Hud settings={settings} part={reel.part} parts={reel.parts} from={reel.intro} to={outroAt} />
      {reel.groups.map((g) => <SweepTransition key={'t' + g.key} at={g.from} />)}
      <SweepTransition at={outroAt} />
      <Sequence from={outroAt} durationInFrames={reel.outro} name="Outro"><Outro settings={settings} /></Sequence>
    </AbsoluteFill>
  );
};
