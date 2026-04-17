"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { MainComposition } from "@/remotion/Composition";

// 중앙 미리보기 — Remotion Player 사용 (편집 상태와 실시간 연동)
export default function Preview() {
  const project = useEditorStore((s) => s.project);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const playerRef = useRef<PlayerRef>(null);
  // Player에서 온 프레임 업데이트와 store가 유발하는 seek을 구분하기 위한 플래그
  const fromPlayerRef = useRef(false);

  // Player의 현재 프레임을 항상 폴링해서 store와 동기화
  // (isPlaying 조건을 쓰면 onPlay 이벤트 미발화 시 루프가 시작되지 않음 → 항상 polling이 가장 안정적)
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        const f = p.getCurrentFrame();
        const store = useEditorStore.getState();
        const playing = p.isPlaying();
        if (playing !== store.isPlaying) store.setPlaying(playing);
        if (f !== store.currentFrame) {
          fromPlayerRef.current = true;
          store.setCurrentFrame(f);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 외부 편집(눈금자 클릭 등)으로 currentFrame이 바뀌면 Player seek
  // Player에서 유발된 업데이트는 무시 (피드백 루프 방지)
  useEffect(() => {
    if (fromPlayerRef.current) {
      fromPlayerRef.current = false;
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    const pf = p.getCurrentFrame();
    if (Math.abs(pf - currentFrame) > 1) p.seekTo(currentFrame);
  }, [currentFrame]);

  if (!project) return null;

  const totalDuration = Math.max(
    30,
    project.tracks.reduce((max, t) => {
      const trackEnd = t.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
      return Math.max(max, trackEnd);
    }, project.meta.durationFrames),
  );

  const { width, height } = project.meta;
  const isPortrait = height > width;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-black/60 p-4">
      <div
        className="overflow-hidden rounded-md shadow-2xl"
        style={{
          aspectRatio: `${width} / ${height}`,
          // 가로형: 너비 기준, 세로형: 높이 기준으로 크기 제한
          ...(isPortrait
            ? { height: "100%", maxHeight: "calc(100vh - 16rem)" }
            : { width: "100%", maxWidth: "56rem" }),
        }}
      >
        <Player
          ref={playerRef}
          component={MainComposition as any}
          inputProps={{
            tracks: project.tracks,
            assets: project.assets,
            meta: project.meta,
          }}
          durationInFrames={totalDuration}
          compositionWidth={width}
          compositionHeight={height}
          fps={project.meta.fps}
          controls
          clickToPlay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
