// Typecast 클라이언트 helper — /api/tts 라우트 호출
// 반환: Blob + 재생시간(초)

export interface SynthesizeOptions {
  text: string;
  voiceId: string; // tc_로 시작하는 실제 ID
  apiKey: string; // Typecast API 키 (x-typecast-key 헤더)
  apiBase?: string; // 기본 https://api.typecast.ai/v1
  model?: string;
  audioFormat?: "mp3" | "wav";
}

export interface SynthesizeResult {
  blob: Blob;
  blobUrl: string;
  durationSeconds: number;
}

export async function synthesizeSpeech(
  opts: SynthesizeOptions
): Promise<SynthesizeResult> {
  if (!opts.text.trim()) throw new Error("빈 텍스트");
  if (!opts.voiceId.trim()) throw new Error("voice_id가 비어있습니다.");
  if (!opts.apiKey.trim()) throw new Error("Typecast API 키가 없습니다.");

  const payload: Record<string, unknown> = {
    text: opts.text.trim(),
    voiceId: opts.voiceId.trim(),
    audioFormat: opts.audioFormat ?? "mp3",
  };
  // model은 설정값이 있을 때만 전달 — 없으면 서버 라우트가 디폴트 적용
  if (opts.model?.trim()) payload.model = opts.model.trim();

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-typecast-key": opts.apiKey.trim(),
      ...(opts.apiBase ? { "x-typecast-base": opts.apiBase.trim() } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const base = err.error ?? `Typecast 호출 실패 (${res.status})`;
    const detail = err.detail ? ` — ${err.detail}` : "";
    throw new Error(`${base}${detail}`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const durationSeconds = await measureAudioDuration(blobUrl);
  return { blob, blobUrl, durationSeconds };
}

// 오디오 메타데이터에서 재생 시간만 읽음
function measureAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onError = () => {
      cleanup();
      resolve(0);
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = url;
  });
}
