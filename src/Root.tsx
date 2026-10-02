import { Composition } from "remotion";
import { TEMPLATE_DURATION, Template } from "./videos/Template/Template";
// @new-video:import

const FPS = 60;
const SIZE = { "16x9": [1920, 1080], "9x16": [1080, 1920] } as const;

// Every film is registered once per format (<Name>-16x9, <Name>-9x16) from ONE component: the
// component lays itself out per aspect (src/kit/format.tsx), nothing is cropped.
// `tempo` = the music's BPM after tools/music-bars.py; the film's 120 BPM grid plays at tempo/120.
const film = (id: string, component: React.FC<{ tempo?: number }>, duration: number, tempo = 120) =>
  (Object.keys(SIZE) as (keyof typeof SIZE)[]).map((f) => (
    <Composition
      key={`${id}-${f}`}
      id={`${id}-${f}`}
      component={component}
      defaultProps={{ tempo }}
      durationInFrames={Math.round(((duration * 120) / tempo) * FPS)}
      fps={FPS}
      width={SIZE[f][0]}
      height={SIZE[f][1]}
    />
  ));

export const RemotionRoot: React.FC = () => (
  <>
    {/* Starting point for new films (tools/new-video.sh copies it) */}
    {film("Template", Template, TEMPLATE_DURATION)}
    {/* @new-video:register */}
  </>
);
