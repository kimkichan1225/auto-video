"use client";

import { useRef, useState } from "react";
import { mockVoices, type Voice } from "@/lib/mockVoices";
import { cn } from "@/lib/utils";

interface Props {
  script: string;
  voiceId: string;
  referenceVideos: File[];
  onScriptChange: (value: string) => void;
  onVoiceChange: (id: string) => void;
  onVideosChange: (files: File[]) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export default function ScriptReviewStep({
  script,
  voiceId,
  referenceVideos,
  onScriptChange,
  onVoiceChange,
  onVideosChange,
  onBack,
  onGenerate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const canGenerate = script.trim().length > 0 && voiceId.length > 0;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const videos = Array.from(list).filter((f) => f.type.startsWith("video/"));
    if (videos.length === 0) return;
    onVideosChange([...referenceVideos, ...videos]);
  };

  const removeFile = (index: number) => {
    onVideosChange(referenceVideos.filter((_, i) => i !== index));
  };

  return (
    <div className="max-h-full w-full max-w-3xl overflow-y-auto scrollbar-thin">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        뒤로
      </button>

      <h2 className="text-2xl font-bold text-white">대본을 검토해주세요</h2>
      <p className="mt-2 text-sm text-gray-400">
        AI가 작성한 대본을 확인하고 필요하면 수정하세요. 보이스를 선택하고, 참고 영상이 있으면 업로드하세요.
      </p>

      {/* 대본 */}
      <section className="mt-6">
        <label className="mb-2 block text-xs font-medium text-gray-400">대본</label>
        <textarea
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-border bg-panel p-4 text-sm leading-relaxed text-white outline-none transition focus:border-accent resize-none"
        />
        <div className="mt-1 text-right text-xs text-gray-500">{script.length}자</div>
      </section>

      {/* 보이스 선택 */}
      <section className="mt-5">
        <label className="mb-2 block text-xs font-medium text-gray-400">보이스 선택</label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {mockVoices.map((v) => (
            <VoiceCard
              key={v.id}
              voice={v}
              selected={voiceId === v.id}
              onClick={() => onVoiceChange(v.id)}
            />
          ))}
        </div>
      </section>

      {/* 참고 영상 업로드 */}
      <section className="mt-5">
        <label className="mb-2 block text-xs font-medium text-gray-400">
          참고 영상 <span className="text-gray-600">(선택)</span>
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragging) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-lg border-2 border-dashed p-4 transition",
            dragging ? "border-accent bg-accent/5" : "border-border bg-panel/60"
          )}
        >
          {referenceVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center text-xs text-gray-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p>영상을 이곳으로 드래그하거나</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-md bg-panelAlt px-3 py-1.5 text-xs text-gray-300 transition hover:bg-border hover:text-white"
              >
                영상 선택
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {referenceVideos.map((file, i) => (
                <VideoChip
                  key={`${file.name}-${i}`}
                  file={file}
                  onRemove={() => removeFile(i)}
                />
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded-md border border-dashed border-border bg-transparent px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-500 hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                추가
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // 같은 파일 재선택 가능
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-600">
          업로드한 영상은 Gemini가 분석해서 대본 자막과 어울리는 부분을 찾아 자동 배치합니다.
        </p>
      </section>

      {/* 생성 버튼 */}
      <section className="mt-6 flex justify-end pb-2">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18.5 18.5 22 17 15l5-5-7-1z" />
          </svg>
          AI 생성
        </button>
      </section>
    </div>
  );
}

function VoiceCard({
  voice,
  selected,
  onClick,
}: {
  voice: Voice;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-lg border p-3 text-left transition",
        selected
          ? "border-accent bg-accent/10"
          : "border-border bg-panel hover:border-gray-500"
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
            voice.gender === "male"
              ? "bg-blue-500/20 text-blue-300"
              : "bg-pink-500/20 text-pink-300"
          )}
        >
          {voice.gender === "male" ? "♂" : "♀"}
        </div>
        <span className={cn("text-sm font-semibold", selected ? "text-white" : "text-gray-200")}>
          {voice.name}
        </span>
      </div>
      <span className="mt-1.5 text-[11px] text-gray-500">{voice.tone}</span>
    </button>
  );
}

function VideoChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const mb = (file.size / (1024 * 1024)).toFixed(1);
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-panelAlt px-3 py-1.5 text-xs">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
      </svg>
      <span className="max-w-[160px] truncate text-gray-200">{file.name}</span>
      <span className="text-gray-500">{mb}MB</span>
      <button
        onClick={onRemove}
        aria-label="제거"
        className="ml-1 text-gray-500 transition hover:text-red-400"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

