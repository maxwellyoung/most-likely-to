import { Composition } from 'remotion';
import { GambitPromo } from './GambitPromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GambitPromo"
        component={GambitPromo}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
