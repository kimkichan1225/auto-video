// Typecast 보이스 목록
// 프리셋 4개는 UI에 항상 보이고, "직접 입력" 옵션은 설정의 voiceId를 사용
// 실제 voice_id는 사용자가 Typecast 대시보드에서 복사 후 아래 placeholder를 교체
export type VoiceGender = "male" | "female";

export interface Voice {
  id: string; // 내부 UI 키
  name: string;
  gender: VoiceGender;
  tone: string;
  voiceId: string; // Typecast tc_... — 빈 문자열이면 미설정
  isCustom?: boolean; // "직접 입력" 옵션이면 true (voice_id는 runtime에 설정에서 가져옴)
}

export const PRESET_VOICES: Voice[] = [
  {
    id: "v1",
    name: "서진",
    gender: "male",
    tone: "차분하고 신뢰감 있는",
    voiceId: "", // TODO: 실제 Typecast voice_id로 교체
  },
  {
    id: "v2",
    name: "지우",
    gender: "female",
    tone: "밝고 경쾌한",
    voiceId: "",
  },
  {
    id: "v3",
    name: "민호",
    gender: "male",
    tone: "젊고 에너지 넘치는",
    voiceId: "",
  },
  {
    id: "v4",
    name: "수아",
    gender: "female",
    tone: "친근하고 따뜻한",
    voiceId: "",
  },
];

export const CUSTOM_VOICE: Voice = {
  id: "custom",
  name: "직접 입력",
  gender: "male", // 표시용, 색상은 회색 계열로
  tone: "설정에서 입력한 voice_id 사용",
  voiceId: "",
  isCustom: true,
};

// 기존 mockVoices 이름 유지 (import 경로 호환)
export const mockVoices: Voice[] = [...PRESET_VOICES, CUSTOM_VOICE];

// 보이스 id로 실제 Typecast voice_id 찾기
// isCustom이면 fallbackVoiceId(설정값) 사용
export function resolveVoiceId(
  voiceInternalId: string,
  fallbackVoiceId: string
): string {
  const voice = mockVoices.find((v) => v.id === voiceInternalId);
  if (!voice) return "";
  if (voice.isCustom) return fallbackVoiceId.trim();
  return voice.voiceId.trim();
}
