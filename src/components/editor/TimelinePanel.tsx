"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { cn, formatDuration } from "@/lib/utils";
import type { Clip, Track, TrackId } from "@/types/timeline";

// 트랙 색상 — 클립 바에 사용
const TRACK_COLORS: Record<TrackId, { bg: string; border: string; text: string }> = {
  video: { bg: "bg-blue-500/25", border: "border-blue-400/60", text: "text-blue-100" },
  image: { bg: "bg-purple-500/25", border: "border-purple-400/60", text: "text-purple-100" },
  audio: { bg: "bg-green-500/25", border: "border-green-400/60", text: "text-green-100" },
  subtitle: { bg: "bg-yellow-500/25", border: "border-yellow-400/60", text: "text-yellow-100" },
};

// px per second — 확대/축소 가능
const DEFAULT_PX_PER_SEC = 40;
const MIN_PX_PER_SEC = 10;
const MAX_PX_PER_SEC = 200;

export default function TimelinePanel() {
  const timeline = useEditorStore((s) => s.timeline);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const selectClip = useEditorStore((s) => s.selectClip);
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC);

  // 눈금자 구성 — 최소 60초 or 전체 길이 + 5초 중 큰 값
  const rulerDuration = useMemo(() => {
    return Math.max(60, Math.ceil(timeline.durationSeconds + 5));
  }, [timeline.durationSeconds]);

  const secondMarks = Array.from({ length: rulerDuration }, (_, i) => i);
  const trackAreaWidth = rulerDuration * pxPerSec;

  const zoomIn = () =>
    setPxPerSec((v) => Math.min(MAX_PX_PER_SEC, Math.round(v * 1.25)));
  const zoomOut = () =>
    setPxPerSec((v) => Math.max(MIN_PX_PER_SEC, Math.round(v / 1.25)));

  return (
    <section className="flex h-64 shrink-0 flex-col border-t border-border bg-panel">
      {/* 헤더 */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider">타임라인</span>
          <span className="text-gray-500 font-mono">
            {formatDuration(timeline.durationSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-panelAlt hover:text-white"
            aria-label="축소"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="w-10 text-center text-[11px] text-gray-500 font-mono">
            {pxPerSec}
          </span>
          <button
            onClick={zoomIn}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-panelAlt hover:text-white"
            aria-label="확대"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* 스크롤 영역 (가로) */}
      <div className="flex flex-1 overflow-auto scrollbar-thin" onClick={() => selectClip(null)}>
        {/* 트랙 라벨 (좌측 고정 열) */}
        <div className="sticky left-0 z-10 flex shrink-0 flex-col border-r border-border bg-panel">
          <div className="h-6 border-b border-border bg-panelAlt" />
          {timeline.tracks.map((t) => (
            <div
              key={t.id}
              className="flex h-12 w-24 items-center border-b border-border/50 bg-panelAlt px-3 text-xs text-gray-300"
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* 눈금자 + 트랙 컨텐츠 */}
        <div className="flex flex-col" style={{ width: trackAreaWidth }}>
          {/* 눈금자 */}
          <div className="relative flex h-6 shrink-0 border-b border-border bg-panelAlt">
            {secondMarks.map((s) => (
              <div
                key={s}
                className="relative shrink-0 border-l border-border/40 first:border-l-0"
                style={{ width: pxPerSec }}
              >
                <span className="absolute left-1 top-0 text-[10px] leading-[1.4] text-gray-500">
                  {s}s
                </span>
              </div>
            ))}
          </div>

          {/* 트랙 영역 */}
          {timeline.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              pxPerSec={pxPerSec}
              selectedClipId={selectedClipId}
              onSelect={selectClip}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TrackRowProps {
  track: Track;
  pxPerSec: number;
  selectedClipId: string | null;
  onSelect: (id: string | null) => void;
}

function TrackRow({ track, pxPerSec, selectedClipId, onSelect }: TrackRowProps) {
  return (
    <div className="relative h-12 border-b border-border/50 bg-[#1a1c21]">
      {track.clips.map((clip) => (
        <ClipBar
          key={clip.id}
          clip={clip}
          pxPerSec={pxPerSec}
          selected={selectedClipId === clip.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface ClipBarProps {
  clip: Clip;
  pxPerSec: number;
  selected: boolean;
  onSelect: (id: string) => void;
}

function ClipBar({ clip, pxPerSec, selected, onSelect }: ClipBarProps) {
  const colors = TRACK_COLORS[clip.trackId];
  const left = clip.start * pxPerSec;
  const width = clip.duration * pxPerSec;

  const label =
    clip.type === "subtitle"
      ? clip.text
      : clip.type === "audio" || clip.type === "video" || clip.type === "image"
        ? clip.sourceName
        : "";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(clip.id);
      }}
      style={{ left, width }}
      className={cn(
        "absolute top-1 bottom-1 flex items-center overflow-hidden rounded border px-2 text-[11px] font-medium transition",
        colors.bg,
        colors.border,
        colors.text,
        selected && "ring-2 ring-white ring-offset-1 ring-offset-[#1a1c21]"
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
