import OpenAI from "openai";

// Whisper STT 래퍼 — 단어 단위 타임스탬프 반환
export interface WordTimestamp {
  word: string;
  start: number; // 초
  end: number;
}

export async function transcribeWithTimestamps(
  fileBuffer: Buffer,
  filename: string,
): Promise<{ text: string; words: WordTimestamp[]; duration: number }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const file = new File([fileBuffer], filename, { type: "audio/mpeg" });

  const res = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
    language: "ko",
  });

  const words: WordTimestamp[] =
    (res as any).words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    })) ?? [];

  // 오디오 전체 길이 (Whisper가 verbose_json에서 duration 필드로 반환)
  const duration: number =
    (res as any).duration ?? (words.length ? words[words.length - 1].end : 0);

  return { text: (res as any).text ?? "", words, duration };
}

// 단어 타임스탬프 → 자막 클립으로 그룹핑
// 브루처럼 1줄에 ~12자/2~3어절 단위로 묶음
export function groupWordsIntoSubtitles(
  words: WordTimestamp[],
  opts: { maxCharsPerLine?: number; maxDurationSec?: number } = {},
): Array<{ text: string; start: number; end: number }> {
  const maxChars = opts.maxCharsPerLine ?? 14;
  const maxDur = opts.maxDurationSec ?? 4;
  const lines: Array<{ text: string; start: number; end: number }> = [];
  let buf: WordTimestamp[] = [];

  const flush = () => {
    if (!buf.length) return;
    const text = buf.map((w) => w.word).join(" ").replace(/\s+/g, " ").trim();
    lines.push({ text, start: buf[0].start, end: buf[buf.length - 1].end });
    buf = [];
  };

  for (const w of words) {
    const wouldLen = buf.map((b) => b.word).join(" ").length + 1 + w.word.length;
    const wouldDur = buf.length ? w.end - buf[0].start : 0;
    if (buf.length && (wouldLen > maxChars || wouldDur > maxDur)) flush();
    buf.push(w);
  }
  flush();
  return lines;
}
