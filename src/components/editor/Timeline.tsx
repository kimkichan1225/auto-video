"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { Clip, Track } from "@/types/project";
import { cn, formatTimecode, uid } from "@/lib/utils";

// 하단 타임라인
// - 프레임당 픽셀 값으로 스케일 관리
// - 각 트랙을 행으로 표시, 클립은 drag로 이동(가로) / 경계 드래그로 리사이즈
// - 플레이헤드 표시 및 클릭으로 seek
const PX_PER_FRAME_BASE = 4;

export default function Timeline() {
  const project = useEditorStore((s) => s.project);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const addTrack = useEditorStore((s) => s.addTrack);
  const addClip = useEditorStore((s) => s.addClip);
  const [zoom, setZoom] = useState(1);
  const rulerRef = useRef<HTMLDivElement>(null);

  const pxPerFrame = PX_PER_FRAME_BASE * zoom;

  // 재생 중 플레이헤드가 스크롤 영역을 벗어나면 자동 스크롤
  useEffect(() => {
    if (!isPlaying) return;
    const el = rulerRef.current;
    if (!el) return;
    const playheadX = currentFrame * pxPerFrame;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    // 오른쪽 끝에 닿으면 한 화면 넘긴다 (영상 편집기 표준 UX)
    if (playheadX > viewRight - 60) {
      el.scrollLeft = playheadX - 60;
    } else if (playheadX < viewLeft) {
      el.scrollLeft = playheadX - 60;
    }
  }, [currentFrame, isPlaying, pxPerFrame]);

  const totalFrames = useMemo(() => {
    if (!project) return 300;
    const maxClipEnd = project.tracks.reduce((m, t) => {
      for (const c of t.clips) m = Math.max(m, c.start + c.duration);
      return m;
    }, 0);
    return Math.max(project.meta.durationFrames, maxClipEnd + 60);
  }, [project]);

  const fps = project?.meta.fps ?? 30;
  const timelineWidth = totalFrames * pxPerFrame;

  function handleRulerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + rulerRef.current.scrollLeft;
    setCurrentFrame(Math.round(x / pxPerFrame));
  }

  function handleAddTextClip() {
    if (!project) return;
    let track = project.tracks.find((t) => t.type === "text");
    const trackId = track?.id ?? addTrack("text");
    const clip: Clip = {
      id: uid(),
      kind: "text",
      start: currentFrame,
      duration: fps * 3,
      text: "여기에 텍스트",
      style: {
        fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
        fontSize: 72,
        fontWeight: 700,
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 3,
        align: "center",
      },
      transform: { x: 0, y: 300, scale: 1, rotation: 0, opacity: 1 },
      animation: { in: "fade", out: "fade" },
    };
    addClip(trackId, clip);
  }

  if (!project) return null;

  return (
    <section className="flex h-64 flex-col border-t border-border bg-panel">
      {/* 타임라인 상단 바 */}
      <div className="flex h-8 items-center justify-between border-b border-border px-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddTextClip}
            className="rounded border border-border px-2 py-0.5 hover:bg-panelAlt"
          >
            + 텍스트
          </button>
          <button
            onClick={() => addTrack("image")}
            className="rounded border border-border px-2 py-0.5 hover:bg-panelAlt"
          >
            + 이미지 트랙
          </button>
          <button
            onClick={() => addTrack("video")}
            className="rounded border border-border px-2 py-0.5 hover:bg-panelAlt"
          >
            + 영상 트랙
          </button>
          <button
            onClick={() => addTrack("audio")}
            className="rounded border border-border px-2 py-0.5 hover:bg-panelAlt"
          >
            + 오디오 트랙
          </button>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <span>{formatTimecode(currentFrame, fps)}</span>
          <div className="flex items-center gap-1">
            <span>확대</span>
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <span>{zoom.toFixed(2)}×</span>
          </div>
        </div>
      </div>

      {/* 타임라인 본문 */}
      <div className="flex min-h-0 flex-1">
        {/* 좌측 트랙 헤더 */}
        <div className="w-32 shrink-0 border-r border-border">
          <div className="h-6 border-b border-border bg-panelAlt" />
          {project.tracks.map((t) => (
            <div
              key={t.id}
              className="flex h-12 items-center border-b border-border px-3 text-[11px] text-gray-300"
            >
              <span className="truncate">{t.name}</span>
            </div>
          ))}
          {project.tracks.length === 0 && (
            <div className="p-3 text-[11px] text-gray-500">
              상단에서 트랙을 추가하세요
            </div>
          )}
        </div>

        {/* 우측 트랙 영역 */}
        <div
          ref={rulerRef}
          className="scrollbar-thin relative min-w-0 flex-1 overflow-x-auto overflow-y-auto"
        >
          <div style={{ width: timelineWidth, position: "relative" }}>
            {/* 눈금자 */}
            <div
              onClick={handleRulerClick}
              className="sticky top-0 z-10 h-6 cursor-pointer border-b border-border bg-panelAlt"
            >
              {Array.from({
                length: Math.ceil(totalFrames / fps) + 1,
              }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-border text-[10px] text-gray-400"
                  style={{ left: i * fps * pxPerFrame }}
                >
                  <span className="ml-1">{i}s</span>
                </div>
              ))}
            </div>

            {/* 트랙 */}
            {project.tracks.map((track) => (
              <TimelineTrack
                key={track.id}
                track={track}
                pxPerFrame={pxPerFrame}
                totalFrames={totalFrames}
              />
            ))}

            {/* 플레이헤드 */}
            <div
              className="pointer-events-none absolute top-0 z-20 h-full w-0.5 bg-red-500"
              style={{ left: currentFrame * pxPerFrame }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineTrack({
  track,
  pxPerFrame,
  totalFrames,
}: {
  track: Track;
  pxPerFrame: number;
  totalFrames: number;
}) {
  return (
    <div
      className="relative h-12 border-b border-border"
      style={{ width: totalFrames * pxPerFrame }}
    >
      {track.clips.map((clip) => (
        <TimelineClip key={clip.id} clip={clip} pxPerFrame={pxPerFrame} />
      ))}
    </div>
  );
}

function TimelineClip({ clip, pxPerFrame }: { clip: Clip; pxPerFrame: number }) {
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectClip = useEditorStore((s) => s.selectClip);
  const moveClip = useEditorStore((s) => s.moveClip);
  const updateClip = useEditorStore((s) => s.updateClip);
  const isSelected = selectedClipId === clip.id;

  const dragRef = useRef<{
    mode: "move" | "resize-l" | "resize-r";
    startX: number;
    startStart: number;
    startDuration: number;
  } | null>(null);

  function onMouseDown(
    e: React.MouseEvent<HTMLDivElement>,
    mode: "move" | "resize-l" | "resize-r",
  ) {
    e.stopPropagation();
    selectClip(clip.id);
    dragRef.current = {
      mode,
      startX: e.clientX,
      startStart: clip.start,
      startDuration: clip.duration,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp, { once: true });
  }

  function onMouseMove(e: MouseEvent) {
    const d = dragRef.current;
    if (!d) return;
    const deltaFrames = Math.round((e.clientX - d.startX) / pxPerFrame);
    if (d.mode === "move") {
      moveClip(clip.id, d.startStart + deltaFrames);
    } else if (d.mode === "resize-l") {
      const newStart = Math.max(0, d.startStart + deltaFrames);
      const newDuration = Math.max(1, d.startDuration - deltaFrames);
      updateClip(clip.id, { start: newStart, duration: newDuration });
    } else if (d.mode === "resize-r") {
      const newDuration = Math.max(1, d.startDuration + deltaFrames);
      updateClip(clip.id, { duration: newDuration });
    }
  }

  function onMouseUp() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onMouseMove);
  }

  const colorMap: Record<string, string> = {
    image: "bg-emerald-700/70 border-emerald-500",
    video: "bg-blue-700/70 border-blue-500",
    audio: "bg-amber-700/70 border-amber-500",
    text: "bg-purple-700/70 border-purple-500",
  };

  const label =
    clip.kind === "text"
      ? clip.text.slice(0, 20)
      : clip.kind.toUpperCase();

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, "move")}
      onClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id);
      }}
      className={cn(
        "absolute top-1 flex h-10 cursor-grab items-center overflow-hidden rounded border text-[11px] text-white active:cursor-grabbing",
        colorMap[clip.kind] ?? "bg-gray-700",
        isSelected ? "ring-2 ring-accent" : "",
      )}
      style={{
        left: clip.start * pxPerFrame,
        width: Math.max(8, clip.duration * pxPerFrame),
      }}
    >
      <div
        onMouseDown={(e) => onMouseDown(e, "resize-l")}
        className="h-full w-1.5 shrink-0 cursor-ew-resize bg-white/20 hover:bg-white/40"
      />
      <span className="truncate px-2">{label}</span>
      <div className="flex-1" />
      <div
        onMouseDown={(e) => onMouseDown(e, "resize-r")}
        className="h-full w-1.5 shrink-0 cursor-ew-resize bg-white/20 hover:bg-white/40"
      />
    </div>
  );
}
