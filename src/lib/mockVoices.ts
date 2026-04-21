// 목업 보이스 목록 — Phase 8에서 Typecast voice_id 매핑으로 교체
export type VoiceGender = "male" | "female";

export interface Voice {
  id: string;
  name: string;
  gender: VoiceGender;
  tone: string; // 톤 설명
}

export const mockVoices: Voice[] = [
  { id: "v1", name: "서진", gender: "male", tone: "차분하고 신뢰감 있는" },
  { id: "v2", name: "지우", gender: "female", tone: "밝고 경쾌한" },
  { id: "v3", name: "민호", gender: "male", tone: "젊고 에너지 넘치는" },
  { id: "v4", name: "수아", gender: "female", tone: "친근하고 따뜻한" },
];
