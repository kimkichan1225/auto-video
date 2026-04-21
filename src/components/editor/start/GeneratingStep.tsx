"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { synthesizeSpeech } from "@/lib/typecast";
import { transcribeAudio } from "@/lib/openai-stt";
import { chunkWords, type SubtitleChunk } from "@/lib/subtitleChunker";
import { resolveVoiceId } from "@/lib/mockVoices";
import { useSettingsStore } from "@/store/settingsStore";

export interface GeneratedParagraphAudio {
  text: string;
  audioUrl: string;
  audioDuration: number;
  voiceId: string;
}

// 타임라인 전체 기준(절대 시간)으로 변환된 자막 한 줄
export interface TimelineSubtitle {
  text: string;
  start: number;
  end: number;
}

export interface GenerationResult {
  audio: GeneratedParagraphAudio[];
  subtitles: TimelineSubtitle[];
}

interface Props {
  visible: boolean;
  script: string;
  voiceInternalId: string;
  hasReferenceVideos: boolean;
  onComplete: (result: GenerationResult) => void;
  onBack: () => void;
}

type StageStatus = "pending" | "active" | "done";

function splitIntoParagraphs(script: string): string[] {
  const byBlank = script
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBlank.length >= 2) return byBlank;
  return script
    .split(/\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GeneratingStep({
  visible,
  script,
  voiceInternalId,
  hasReferenceVideos,
  onComplete,
  onBack,
}: Props) {
  const [ttsStatus, setTtsStatus] = useState<StageStatus>("pending");
  const [ttsProgress, setTtsProgress] = useState<{ current: number; total: number } | null>(null);
  const [subtitleStatus, setSubtitleStatus] = useState<StageStatus>("pending");
  const [subtitleProgress, setSubtitleProgress] = useState<{ current: number; total: number } | null>(null);
  const [videoStatus, setVideoStatus] = useState<StageStatus>("pending");
  const [error, setError] = useState<string | null>(null);

  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 단계 상태 리셋
  const resetStages = () => {
    setTtsStatus("pending");
    setTtsProgress(null);
    setSubtitleStatus("pending");
    setSubtitleProgress(null);
    setVideoStatus("pending");
    setError(null);
  };

  useEffect(() => {
    if (!visible) {
      // 보이지 않게 되면 다음 진입 시 재실행 가능하도록 리셋
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;
    resetStages();
    void runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const runPipeline = async () => {
    try {
      const settings = useSettingsStore.getState();

      // Stage 1: TTS
      setTtsStatus("active");
      const paragraphs = splitIntoParagraphs(script);
      if (paragraphs.length === 0) throw new Error("대본이 비어있습니다.");

      if (!settings.typecast.apiKey.trim())
        throw new Error("Typecast API 키가 설정되어 있지 않습니다. 설정에서 입력하세요.");
      const resolvedVoiceId = resolveVoiceId(voiceInternalId, settings.typecast.voiceId);
      if (!resolvedVoiceId)
        throw new Error("voice_id가 비어있습니다. 설정에서 입력하거나 프리셋 voice_id를 등록하세요.");

      setTtsProgress({ current: 0, total: paragraphs.length });
      const audio: GeneratedParagraphAudio[] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        if (!mountedRef.current) return;
        const result = await synthesizeSpeech({
          text: paragraphs[i],
          voiceId: resolvedVoiceId,
          apiKey: settings.typecast.apiKey,
          apiBase: settings.typecast.apiBase,
          model: settings.typecast.model,
        });
        audio.push({
          text: paragraphs[i],
          audioUrl: result.blobUrl,
          audioDuration: result.durationSeconds,
          voiceId: resolvedVoiceId,
        });
        if (mountedRef.current) {
          setTtsProgress({ current: i + 1, total: paragraphs.length });
        }
      }
      if (!mountedRef.current) return;
      setTtsStatus("done");
      setTtsProgress(null);

      // Stage 2: 자막 (실제 Whisper)
      setSubtitleStatus("active");
      if (!settings.openai.apiKey.trim())
        throw new Error("OpenAI API 키가 설정되어 있지 않습니다. (Whisper 자막 생성에 필요)");

      setSubtitleProgress({ current: 0, total: audio.length });
      const subtitles: TimelineSubtitle[] = [];
      let paragraphOffset = 0; // 절대 시간 누적 오프셋

      for (let i = 0; i < audio.length; i++) {
        if (!mountedRef.current) return;
        const seg = audio[i];
        // blob URL에서 다시 Blob 객체로 읽어옴
        const audioBlob = await fetch(seg.audioUrl).then((r) => r.blob());
        const stt = await transcribeAudio({
          audio: audioBlob,
          apiKey: settings.openai.apiKey,
          model: settings.openai.sttModel,
          language: "ko",
        });
        const chunks = chunkWords(stt.words);
        for (const c of chunks) {
          subtitles.push({
            text: c.text,
            start: paragraphOffset + c.start,
            end: paragraphOffset + c.end,
          });
        }
        paragraphOffset += seg.audioDuration;
        if (mountedRef.current) {
          setSubtitleProgress({ current: i + 1, total: audio.length });
        }
      }
      if (!mountedRef.current) return;
      setSubtitleStatus("done");
      setSubtitleProgress(null);

      // Stage 3: 영상 매칭 (Phase 10 — 참고 영상 있을 때만, 현재는 가짜)
      if (hasReferenceVideos) {
        setVideoStatus("active");
        await delay(1500);
        if (!mountedRef.current) return;
        setVideoStatus("done");
      }

      await delay(300);
      if (!mountedRef.current) return;
      onComplete({ audio, subtitles });
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "생성 중 오류가 발생했습니다.");
    }
  };

  const retry = () => {
    resetStages();
    startedRef.current = true;
    void runPipeline();
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white">
          {error ? "생성에 실패했습니다" : "영상을 만들고 있어요"}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          {error ? "아래 오류를 확인하고 다시 시도하거나 돌아가세요." : "잠시만 기다려주세요."}
        </p>
      </div>

      <div className="space-y-3">
        <StageRow
          label="음성 생성"
          status={ttsStatus}
          suffix={
            ttsProgress && ttsStatus === "active"
              ? ` (${ttsProgress.current}/${ttsProgress.total})`
              : undefined
          }
        />
        <StageRow
          label="자막 생성"
          status={subtitleStatus}
          suffix={
            subtitleProgress && subtitleStatus === "active"
              ? ` (${subtitleProgress.current}/${subtitleProgress.total})`
              : undefined
          }
        />
        {hasReferenceVideos && <StageRow label="영상 매칭" status={videoStatus} />}
      </div>

      {error && (
        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="leading-relaxed">{error}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 rounded-md border border-border bg-panel px-4 py-2 text-sm text-gray-300 transition hover:border-gray-500 hover:text-white"
            >
              돌아가기
            </button>
            <button
              onClick={retry}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accentHover"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StageRow({
  label,
  status,
  suffix,
}: {
  label: string;
  status: StageStatus;
  suffix?: string;
}) {
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
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
        {status === "active" && <span className="ml-1 text-gray-400">중...{suffix ?? ""}</span>}
      </span>
    </div>
  );
}
