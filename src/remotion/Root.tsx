import { Composition } from "remotion";
import { MainComposition } from "./Composition";
import type { CompositionProps } from "@/types/project";

// Remotion Studio / 서버 렌더링 진입점
const defaultProps: CompositionProps = {
  tracks: [],
  assets: [],
  meta: { fps: 30, width: 1920, height: 1080, durationFrames: 300 },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MainComposition as any}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
