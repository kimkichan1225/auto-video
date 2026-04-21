"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StageDef {
  id: string;
  label: string;
  duration: number; // ms (목업 타이머)
}

interface Props {
  visible: boolean;
  hasReferenceVideos: boolean;
  onComplete: () => void;
}

type StageStatus = "pending" | "active" | "done";

const BASE_STAGES: StageDef[] = [
  { id: "tts", label: "음성 생성", duration: 1800 },
  { id: "subtitle", label: "자막 생성", duration: 1500 },
  { id: "video", label: "영상 매칭", duration: 2200 },
];

export default function GeneratingStep({ visible, hasReferenceVideos, onComplete }: Props) {
  // 참고 영상이 없으면 영상 매칭 단계 제외
  const stages = hasReferenceVideos ? BASE_STAGES : BASE_STAGES.slice(0, 2);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // visible 전이면 타이머 실행하지 않음
    if (!visible) return;
    // 모든 단계 완료
    if (currentIdx >= stages.length) {
      const t = setTimeout(onComplete, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrentIdx((i) => i + 1), stages[currentIdx].duration);
    return () => clearTimeout(t);
  }, [visible, currentIdx, stages, onComplete]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white">영상을 만들고 있어요</h2>
        <p className="mt-2 text-sm text-gray-400">잠시만 기다려주세요.</p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, i) => {
          const status: StageStatus =
            i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
          return <StageRow key={stage.id} label={stage.label} status={status} />;
        })}
      </div>
    </div>
  );
}

function StageRow({ label, status }: { label: string; status: StageStatus }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300",
        status === "done" && "border-green-500/30 bg-green-500/5",
        status === "active" && "border-accent bg-accent/10",
        status === "pending" && "border-border bg-panel opacity-50"
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {status === "done" && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {status === "active" && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
        {status === "pending" && (
          <div className="h-2 w-2 rounded-full bg-gray-600" />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          status === "active"
            ? "font-medium text-white"
            : status === "done"
              ? "text-green-400"
              : "text-gray-400"
        )}
      >
        {label}
        {status === "active" && <span className="ml-1 text-gray-400">중...</span>}
      </span>
    </div>
  );
}
