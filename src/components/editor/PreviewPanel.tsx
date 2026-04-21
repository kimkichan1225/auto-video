"use client";

import { cn } from "@/lib/utils";
import type { AspectRatio } from "@/types/project";

interface Props {
  aspectRatio: AspectRatio;
}

export default function PreviewPanel({ aspectRatio }: Props) {
  // 가로는 폭 기준으로, 세로는 높이 기준으로 프리뷰 박스 크기 결정
  const boxClass =
    aspectRatio === "portrait"
      ? "aspect-[9/16] h-full max-h-[560px]"
      : "aspect-video w-full max-w-3xl";

  return (
    <section className="flex h-full flex-1 flex-col bg-[#0f1115]">
      <div className="flex h-10 shrink-0 items-center justify-center border-b border-border text-xs text-gray-500">
        프리뷰 · {aspectRatio === "portrait" ? "세로 9:16" : "가로 16:9"}
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div
          className={cn(
            "flex items-center justify-center rounded-md border border-border bg-black",
            boxClass
          )}
        >
          <span className="text-xs text-gray-600">Remotion Player (Phase 11)</span>
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center justify-center gap-3 border-t border-border bg-panel">
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-panelAlt hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white hover:bg-accentHover">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-panelAlt hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <span className="ml-2 text-xs text-gray-500 font-mono">00:00 / 00:00</span>
      </div>
    </section>
  );
}
