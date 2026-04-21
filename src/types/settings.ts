// 사용자가 UI에서 직접 입력하는 API 설정값들
// Phase 8에서 Typecast 섹션 활성화

export interface OpenAISettings {
  apiKey: string;
  scriptModel: string; // 대본 생성 모델
  sttModel: string; // Whisper 모델
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
}

export interface TypecastSettings {
  apiKey: string;
  voiceId: string;
  apiBase: string;
  model: string; // ssfm-v21 | ssfm-v30 — voice마다 지원 모델 다름
}

export interface AppSettings {
  openai: OpenAISettings;
  gemini: GeminiSettings;
  typecast: TypecastSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  openai: {
    apiKey: "",
    scriptModel: "gpt-4o-mini",
    sttModel: "whisper-1",
  },
  gemini: {
    apiKey: "",
    model: "gemini-2.0-flash",
  },
  typecast: {
    apiKey: "",
    voiceId: "",
    apiBase: "https://api.typecast.ai/v1",
    model: "ssfm-v21",
  },
};

export const TYPECAST_MODELS = [
  { value: "ssfm-v21", label: "ssfm-v21 (기본·대부분의 voice 호환)" },
  { value: "ssfm-v30", label: "ssfm-v30 (최신·일부 voice만 호환)" },
];

// 모델 선택 옵션
export const OPENAI_SCRIPT_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini (빠름·저렴)" },
  { value: "gpt-4o", label: "GPT-4o (품질 우선)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

export const OPENAI_STT_MODELS = [{ value: "whisper-1", label: "Whisper-1" }];

export const GEMINI_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (무료 할당량)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];
