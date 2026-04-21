"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settingsStore";
import {
  GEMINI_MODELS,
  OPENAI_SCRIPT_MODELS,
  OPENAI_STT_MODELS,
  TYPECAST_MODELS,
} from "@/types/settings";
import { testGemini, testOpenAI, type TestResult } from "@/lib/apiTest";

interface Props {
  open: boolean;
  onClose: () => void;
}

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: TestResult };

export default function SettingsModal({ open, onClose }: Props) {
  const openai = useSettingsStore((s) => s.openai);
  const gemini = useSettingsStore((s) => s.gemini);
  const typecast = useSettingsStore((s) => s.typecast);
  const updateOpenAI = useSettingsStore((s) => s.updateOpenAI);
  const updateGemini = useSettingsStore((s) => s.updateGemini);
  const updateTypecast = useSettingsStore((s) => s.updateTypecast);

  const [openaiTest, setOpenaiTest] = useState<TestState>({ status: "idle" });
  const [geminiTest, setGeminiTest] = useState<TestState>({ status: "idle" });

  // 키 변경 시 테스트 결과 리셋
  useEffect(() => setOpenaiTest({ status: "idle" }), [openai.apiKey]);
  useEffect(() => setGeminiTest({ status: "idle" }), [gemini.apiKey]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const runOpenAITest = async () => {
    setOpenaiTest({ status: "loading" });
    const result = await testOpenAI(openai.apiKey);
    setOpenaiTest({ status: "done", result });
  };

  const runGeminiTest = async () => {
    setGeminiTest({ status: "loading" });
    const result = await testGemini(gemini.apiKey);
    setGeminiTest({ status: "done", result });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel shadow-2xl scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-white">설정</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-panelAlt hover:text-white"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-xs text-gray-500">
            API 키는 브라우저에 로컬 저장되며 서버로 전송되지 않습니다. 공용 기기에서는 주의하세요.
          </p>

          {/* OpenAI */}
          <Section title="OpenAI" description="대본 생성(GPT) · 자막 생성(Whisper)">
            <Field label="API Key" required>
              <SecretInput
                value={openai.apiKey}
                onChange={(v) => updateOpenAI({ apiKey: v })}
                placeholder="sk-..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="대본 모델">
                <Select
                  value={openai.scriptModel}
                  onChange={(v) => updateOpenAI({ scriptModel: v })}
                  options={OPENAI_SCRIPT_MODELS}
                />
              </Field>
              <Field label="자막 모델">
                <Select
                  value={openai.sttModel}
                  onChange={(v) => updateOpenAI({ sttModel: v })}
                  options={OPENAI_STT_MODELS}
                />
              </Field>
            </div>

            <TestRow
              state={openaiTest}
              onClick={runOpenAITest}
              disabled={!openai.apiKey.trim()}
            />
          </Section>

          {/* Gemini */}
          <Section title="Gemini" description="참고 영상 분석 및 매칭">
            <Field label="API Key" required>
              <SecretInput
                value={gemini.apiKey}
                onChange={(v) => updateGemini({ apiKey: v })}
                placeholder="AIza..."
              />
            </Field>

            <Field label="모델">
              <Select
                value={gemini.model}
                onChange={(v) => updateGemini({ model: v })}
                options={GEMINI_MODELS}
              />
            </Field>

            <TestRow
              state={geminiTest}
              onClick={runGeminiTest}
              disabled={!gemini.apiKey.trim()}
            />
          </Section>

          {/* Typecast */}
          <Section title="Typecast" description="음성 생성 (TTS)">
            <Field label="API Key" required>
              <SecretInput
                value={typecast.apiKey}
                onChange={(v) => updateTypecast({ apiKey: v })}
                placeholder="typecast-..."
              />
            </Field>

            <Field label={`Voice ID ("직접 입력" 보이스 선택 시 사용)`}>
              <input
                type="text"
                value={typecast.voiceId}
                onChange={(e) => updateTypecast({ voiceId: e.target.value })}
                placeholder="tc_xxxxxxxxxxxxxxxxxxxxxxxx"
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-accent font-mono"
              />
              <p className="mt-1.5 text-[11px] text-gray-500">
                Typecast 대시보드 &gt; Voices 에서 복사 (
                <a
                  href="https://typecast.ai/developers/api/voices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  링크
                </a>
                )
              </p>
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="모델">
                <Select
                  value={typecast.model}
                  onChange={(v) => updateTypecast({ model: v })}
                  options={TYPECAST_MODELS}
                />
              </Field>
              <Field label="API Base URL">
                <input
                  type="text"
                  value={typecast.apiBase}
                  onChange={(e) => updateTypecast({ apiBase: e.target.value })}
                  placeholder="https://api.typecast.ai/v1"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-accent font-mono"
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accentHover"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-panelAlt/50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-panel px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-accent font-mono"
        spellCheck={false}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-gray-400 transition hover:text-white"
        aria-label={visible ? "숨기기" : "표시"}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none transition focus:border-accent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function TestRow({
  state,
  onClick,
  disabled,
}: {
  state: TestState;
  onClick: () => void;
  disabled: boolean;
}) {
  const statusText =
    state.status === "idle"
      ? ""
      : state.status === "loading"
        ? "테스트 중..."
        : state.result.message;
  const statusColor =
    state.status === "done"
      ? state.result.ok
        ? "text-green-400"
        : "text-red-400"
      : "text-gray-400";

  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || state.status === "loading"}
        className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        연결 테스트
      </button>
      {statusText && (
        <span className={cn("flex items-center gap-1.5 text-xs", statusColor)}>
          {state.status === "loading" && (
            <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
          )}
          {state.status === "done" && state.result.ok && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {state.status === "done" && !state.result.ok && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )}
          {statusText}
        </span>
      )}
    </div>
  );
}
