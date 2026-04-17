import { AbsoluteFill, Sequence } from "remotion";
import type { CompositionProps } from "@/types/project";
import { ImageClipView } from "./clips/ImageClipView";
import { VideoClipView } from "./clips/VideoClipView";
import { AudioClipView } from "./clips/AudioClipView";
import { TextClipView } from "./clips/TextClipView";

// 영상 최종 합성 컴포넌트
// - tracks 배열을 역순으로 그려서 첫 번째 트랙이 최상위(위쪽)에 오도록 한다
// - 각 클립은 Sequence로 start/duration을 적용
export function MainComposition({ tracks, assets }: CompositionProps) {
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {[...tracks].reverse().map((track) => (
        <AbsoluteFill key={track.id} style={{ display: track.hidden ? "none" : "block" }}>
          {track.clips.map((clip) => (
            <Sequence
              key={clip.id}
              from={clip.start}
              durationInFrames={Math.max(1, clip.duration)}
              layout="none"
            >
              {clip.kind === "image" && (
                <ImageClipView clip={clip} asset={assetMap.get(clip.assetId)} />
              )}
              {clip.kind === "video" && (
                <VideoClipView clip={clip} asset={assetMap.get(clip.assetId)} />
              )}
              {clip.kind === "audio" && !track.muted && (
                <AudioClipView clip={clip} asset={assetMap.get(clip.assetId)} />
              )}
              {clip.kind === "text" && <TextClipView clip={clip} />}
            </Sequence>
          ))}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
}
