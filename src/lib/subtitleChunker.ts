// 단어 단위 타임스탬프를 받아 숏폼 자막에 맞는 짧은 줄로 묶음
// 숏폼 스타일: 1줄에 1-5 어절, 짧은 호흡

import type { Word } from "./openai-stt";

export interface SubtitleChunk {
  text: string;
  start: number; // 초 (오디오 내부 상대 시간)
  end: number;
}

interface ChunkOptions {
  maxWords?: number; // 한 줄 최대 어절 수 (기본 5)
  maxDuration?: number; // 한 줄 최대 지속 시간 (기본 2.0초)
  minGap?: number; // 줄 분할을 트리거하는 단어 간 공백 (기본 0.25초)
}

// 문장 종결 기호 — 뒤에서 강제 분할
const SENTENCE_END = /[.!?。！？]$/;
// 쉼표/중간 휴지 — 선호 분할 지점 (최소 2어절 이상일 때)
const SOFT_BREAK = /[,，、·…]$/;

export function chunkWords(words: Word[], options: ChunkOptions = {}): SubtitleChunk[] {
  const maxWords = options.maxWords ?? 5;
  const maxDuration = options.maxDuration ?? 2.0;
  const minGap = options.minGap ?? 0.25;

  const chunks: SubtitleChunk[] = [];
  let current: Word[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const text = current
      .map((w) => w.word.trim())
      .filter(Boolean)
      .join(" ");
    if (text) {
      chunks.push({
        text,
        start: current[0].start,
        end: current[current.length - 1].end,
      });
    }
    current = [];
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    current.push(w);

    const isLast = i === words.length - 1;
    const nextGap = !isLast ? words[i + 1].start - w.end : 0;
    const duration = current[current.length - 1].end - current[0].start;

    const hardBreak =
      isLast ||
      current.length >= maxWords ||
      duration >= maxDuration ||
      SENTENCE_END.test(w.word);

    // 선호 분할 — 2어절 이상이면서 쉼표나 큰 휴지
    const softBreak =
      current.length >= 2 && (SOFT_BREAK.test(w.word) || nextGap >= minGap);

    if (hardBreak || softBreak) {
      flush();
    }
  }

  flush();
  return chunks;
}
