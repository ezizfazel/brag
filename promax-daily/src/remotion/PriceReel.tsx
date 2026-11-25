import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { ReelProps } from '../shared/types';
import { useFonts } from './Fonts';
import { Background, GroupScene, Hud, Intro, Outro } from './components/Scenes';

export const PriceReel: React.FC<ReelProps> = ({ reel, settings }) => {
  useFonts();
  const outroAt = reel.durationInFrames - reel.outro;
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Background />
      <Sequence durationInFrames={reel.intro + 4} name="Intro"><Intro reel={reel} settings={settings} /></Sequence>
      {reel.groups.map((g) => (
        <Sequence key={g.key} from={g.from} durationInFrames={g.durationInFrames} name={`${g.model} ${g.part_number}`}>
          <GroupScene group={g} reel={reel} settings={settings} />
        </Sequence>
      ))}
      <Hud reel={reel} settings={settings} />
      <Sequence from={outroAt} durationInFrames={reel.outro} name="Outro"><Outro settings={settings} /></Sequence>
    </AbsoluteFill>
  );
};
