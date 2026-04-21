// OpenAI Whisper 클라이언트 helper — /api/stt 라우트 호출
// 입력: 오디오 Blob → 출력: 단어 단위 타임스탬프

export interface Word {
  word: string;
  start: number; // 초 (오디오 내부 상대 시간)
  end: number;
}

export interface TranscribeOptions {
  audio: Blob;
  apiKey: string;
  model?: string;
  language?: string; // ISO 639-1 (ko, en, ja...)
}

export interface TranscribeResult {
  text: string;
  words: Word[];
  durationSeconds: number;
}

export async function transcribeAudio(
  opts: TranscribeOptions
): Promise<TranscribeResult> {
  if (!opts.apiKey.trim()) throw new Error("OpenAI API 키가 없습니다.");

  const form = new FormData();
  form.append("file", opts.audio, "audio.mp3");
  if (opts.language) form.append("language", opts.language);

  const res = await fetch("/api/stt", {
    method: "POST",
    headers: {
      "x-openai-key": opts.apiKey.trim(),
      ...(opts.model ? { "x-openai-model": opts.model } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const base = err.error ?? `Whisper 호출 실패 (${res.status})`;
    const detail = err.detail ? ` — ${err.detail}` : "";
    throw new Error(`${base}${detail}`);
  }

  const data = await res.json();
  const words: Word[] = Array.isArray(data.words)
    ? data.words.map((w: { word?: string; start?: number; end?: number }) => ({
        word: (w.word ?? "").trim(),
        start: Number(w.start ?? 0),
        end: Number(w.end ?? 0),
      }))
    : [];
  return {
    text: typeof data.text === "string" ? data.text : "",
    words,
    durationSeconds: Number(data.duration ?? 0),
  };
}
