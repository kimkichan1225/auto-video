"use client";

import { useEffect, useState } from "react";
import type { AspectRatio } from "@/types/project";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; aspectRatio: AspectRatio }) => void;
}

export default function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("새 프로젝트");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("landscape");

  // 모달이 열릴 때마다 초기값으로 리셋
  useEffect(() => {
    if (open) {
      setName("새 프로젝트");
      setAspectRatio("landscape");
    }
  }, [open]);

  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, aspectRatio });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">새 프로젝트</h2>
        <p className="mt-1 text-sm text-gray-400">프로젝트 이름과 영상 비율을 선택하세요.</p>

        {/* 이름 입력 */}
        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            프로젝트 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-sm text-white outline-none transition focus:border-accent"
          />
        </div>

        {/* 영상 비율 선택 */}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-medium text-gray-400">영상 비율</label>
          <div className="grid grid-cols-2 gap-3">
            <RatioOption
              selected={aspectRatio === "landscape"}
              onClick={() => setAspectRatio("landscape")}
              label="가로"
              sub="유튜브·일반 영상"
              boxClass="w-16 h-9"
            />
            <RatioOption
              selected={aspectRatio === "portrait"}
              onClick={() => setAspectRatio("portrait")}
              label="세로"
              sub="쇼츠·릴스·틱톡"
              boxClass="w-9 h-16"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-300 transition hover:bg-panelAlt"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}

interface RatioOptionProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  boxClass: string;
}

function RatioOption({ selected, onClick, label, sub, boxClass }: RatioOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center rounded-lg border p-4 transition",
        selected
          ? "border-accent bg-accent/10"
          : "border-border bg-panelAlt hover:border-gray-500"
      )}
    >
      {/* 고정 높이 영역으로 박스 정렬 */}
      <div className="flex h-16 items-center justify-center">
        <div
          className={cn(
            "rounded border-2",
            boxClass,
            selected ? "border-accent bg-accent/20" : "border-gray-500"
          )}
        />
      </div>
      <div className="mt-3 text-center">
        <div className={cn("text-sm font-medium", selected ? "text-white" : "text-gray-300")}>
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>
      </div>
    </button>
  );
}
