import { AbsoluteFill, OffthreadVideo, useVideoConfig } from "remotion";
import type { Asset, VideoClip } from "@/types/project";

interface Props {
  clip: VideoClip;
  asset?: Asset;
}

export function VideoClipView({ clip, asset }: Props) {
  const { fps } = useVideoConfig();
  if (!asset) return null;
  const { transform, trimStartSeconds, trimEndSeconds, volume } = clip;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: transform.opacity,
      }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <OffthreadVideo
          src={asset.url}
          startFrom={Math.round(trimStartSeconds * fps)}
          endAt={Math.round(trimEndSeconds * fps)}
          volume={volume}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
}
