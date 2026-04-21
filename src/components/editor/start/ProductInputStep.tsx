"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  visible: boolean;
  productName: string;
  description: string;
  onProductNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBack: () => void;
  onNext: () => Promise<void>;
}

export default function ProductInputStep({
  visible,
  productName,
  description,
  onProductNameChange,
  onDescriptionChange,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // 화면 진입 시 상품명 입력에 포커스
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => nameRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, [visible]);

  // 입력이 바뀌면 이전 에러 지우기
  useEffect(() => {
    if (error) setError(null);
  }, [productName, description]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = productName.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await onNext();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "대본 생성에 실패했습니다. 잠시 후 다시 시도하세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <button
        onClick={onBack}
        disabled={loading}
        className="mb-4 flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-white disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        뒤로
      </button>

      <h2 className="text-2xl font-bold text-white">무엇을 소개할까요?</h2>
      <p className="mt-2 text-sm text-gray-400">
        상품명과 간단한 설명을 입력하면 AI가 대본을 작성합니다.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            상품명 <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) handleSubmit();
            }}
            placeholder="예) 무선 이어폰 프로"
            disabled={loading}
            className="w-full rounded-md border border-border bg-panel px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-accent disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            추가 설명
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="예) 액티브 노이즈 캔슬링, 20시간 배터리, 방수 등 핵심 특징"
            rows={4}
            disabled={loading}
            className="w-full rounded-md border border-border bg-panel px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-accent resize-none disabled:opacity-60"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              대본 생성 중...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18.5 18.5 22 17 15l5-5-7-1z" />
              </svg>
              대본 생성
            </>
          )}
        </button>
      </div>
    </div>
  );
}
