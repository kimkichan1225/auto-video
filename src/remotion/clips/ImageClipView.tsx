import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { Asset, ImageClip } from "@/types/project";

interface Props {
  clip: ImageClip;
  asset?: Asset;
}

export function ImageClipView({ clip, asset }: Props) {
  const frame = useCurrentFrame();
  if (!asset) return null;

  const { transform, animation, duration } = clip;

  // 페이드 인/아웃 처리
  const fadeInFrames = 15;
  const fadeOutFrames = 15;
  let opacity = transform.opacity;
  if (animation?.in === "fade") {
    opacity *= interpolate(frame, [0, fadeInFrames], [0, 1], {
      extrapolateRight: "clamp",
    });
  }
  if (animation?.out === "fade") {
    opacity *= interpolate(
      frame,
      [duration - fadeOutFrames, duration],
      [1, 0],
      { extrapolateLeft: "clamp" },
    );
  }

  // Ken Burns 효과
  let extraScale = 1;
  let extraX = 0;
  if (animation?.kenBurns === "zoomIn") {
    extraScale = interpolate(frame, [0, duration], [1, 1.15]);
  } else if (animation?.kenBurns === "zoomOut") {
    extraScale = interpolate(frame, [0, duration], [1.15, 1]);
  } else if (animation?.kenBurns === "panLeft") {
    extraX = interpolate(frame, [0, duration], [50, -50]);
  } else if (animation?.kenBurns === "panRight") {
    extraX = interpolate(frame, [0, duration], [-50, 50]);
  }

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <img
        src={asset.url}
        alt=""
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          transform: `translate(${transform.x + extraX}px, ${transform.y}px) scale(${transform.scale * extraScale}) rotate(${transform.rotation}deg)`,
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
}
