import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { TextClip } from "@/types/project";

interface Props {
  clip: TextClip;
}

// 한글이 깨지지 않는 외곽선 효과: 8방향 text-shadow로 구현
function buildStrokeShadow(width: number, color: string) {
  const w = Math.max(1, width);
  const offsets = [
    [w, 0], [-w, 0], [0, w], [0, -w],
    [w, w], [w, -w], [-w, w], [-w, -w],
  ];
  return offsets.map(([x, y]) => `${x}px ${y}px 0 ${color}`).join(", ");
}

export function TextClipView({ clip }: Props) {
  const frame = useCurrentFrame();
  const { text, style, transform, animation, duration } = clip;

  const fadeInFrames = 10;
  const fadeOutFrames = 10;
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

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          textAlign: style.align,
          padding: "0 40px",
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: style.color,
            backgroundColor: style.backgroundColor ?? "transparent",
            // 한글 상단 자모가 잘리지 않도록 여유 있는 line-height + padding
            lineHeight: 1.5,
            paddingTop: "0.15em",
            paddingBottom: "0.15em",
            borderRadius: style.backgroundColor ? 8 : 0,
            whiteSpace: "pre-wrap",
            // 스트로크는 text-shadow 8방향으로 구현해 외곽이 깔끔하게 떨어지도록 처리
            // (WebkitTextStroke는 글자 위에 덧그려져 한글 자모를 침범함)
            textShadow:
              style.strokeColor && style.strokeWidth
                ? buildStrokeShadow(style.strokeWidth, style.strokeColor)
                : undefined,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
}
