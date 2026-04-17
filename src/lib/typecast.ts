// Typecast Developer API 래퍼 (v1)
// 공식 문서: https://typecast.ai/docs/api-reference/text-to-speech/text-to-speech
// 인증: X-API-KEY 헤더 / 응답: 바이너리 오디오

const BASE = process.env.TYPECAST_API_BASE ?? "https://api.typecast.ai/v1";
const API_KEY = process.env.TYPECAST_API_KEY!;
const DEFAULT_VOICE_ID = process.env.TYPECAST_ACTOR_ID; // 변수명은 그대로, 값은 voice_id

export type TypecastModel = "ssfm-v30" | "ssfm-v21";
export type AudioFormat = "wav" | "mp3";
export type EmotionPreset =
  | "normal"
  | "happy"
  | "sad"
  | "angry"
  | "whisper"
  | "toneup"
  | "tonedown";

export interface SpeakParams {
  text: string;
  voiceId?: string; // tc_로 시작 (예: tc_672c5f5ce59fac2a48faeaee)
  model?: TypecastModel;
  language?: string; // "kor" | "eng" | "jpn" 등 ISO 639-3
  audioFormat?: AudioFormat;
  volume?: number; // 0~200
  audioPitch?: number; // -12~12
  audioTempo?: number; // 0.5~2.0
  emotionPreset?: EmotionPreset;
  emotionIntensity?: number; // 0.0~2.0
  seed?: number;
}

export async function typecastSynthesize(params: SpeakParams): Promise<ArrayBuffer> {
  if (!API_KEY) throw new Error("TYPECAST_API_KEY가 .env.local에 없습니다.");
  const voiceId = params.voiceId ?? DEFAULT_VOICE_ID;
  if (!voiceId) {
    throw new Error(
      "TYPECAST_ACTOR_ID(voice_id)가 설정되지 않았습니다.\n" +
        "https://typecast.ai/developers/api/voices 에서 voice_id (tc_...) 복사 후 .env.local에 추가하세요.",
    );
  }

  const body: Record<string, unknown> = {
    text: params.text,
    voice_id: voiceId,
    model: params.model ?? "ssfm-v30",
    output: {
      audio_format: params.audioFormat ?? "mp3",
      volume: params.volume ?? 100,
      audio_pitch: params.audioPitch ?? 0,
      audio_tempo: params.audioTempo ?? 1.0,
    },
  };
  if (params.language) body.language = params.language;
  if (params.emotionPreset) {
    body.prompt = {
      emotion_type: "preset",
      emotion_preset: params.emotionPreset,
      emotion_intensity: params.emotionIntensity ?? 1.0,
    };
  }
  if (params.seed !== undefined) body.seed = params.seed;

  const res = await fetch(`${BASE}/text-to-speech`, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Typecast] /text-to-speech 실패:", res.status, errText);
    const hints: Record<number, string> = {
      400: "요청 파라미터 오류 (voice_id 형식/text 길이/model 값 확인)",
      401: "API 키 인증 실패 (https://typecast.ai/developers 에서 키 재발급)",
      402: "크레딧 부족 (계정 잔액 확인)",
      404: "voice_id를 찾을 수 없음 (ID 오타 또는 해당 음성 미사용 가능)",
    };
    throw new Error(
      `Typecast ${res.status}: ${hints[res.status] ?? "알 수 없는 오류"} — ${errText.slice(0, 200)}`,
    );
  }

  return await res.arrayBuffer();
}
