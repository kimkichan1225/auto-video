import OpenAI from "openai";

// 상품 정보 → 홍보 영상 대본을 GPT로 생성
// 한국어 친화적 프롬프트 + 길이/톤 파라미터

export type ScriptTone = "friendly" | "professional" | "energetic" | "calm";
export type ScriptLength = "short" | "medium" | "long"; // 15s / 30s / 60s

const TONE_GUIDE: Record<ScriptTone, string> = {
  friendly: "친근하고 부드러운 반말 느낌이되 공손한",
  professional: "전문적이고 신뢰감 있는",
  energetic: "에너제틱하고 재미있고 유쾌한",
  calm: "차분하고 감성적인",
};

const LENGTH_GUIDE: Record<ScriptLength, { seconds: number; chars: number }> = {
  short: { seconds: 15, chars: 90 },
  medium: { seconds: 30, chars: 180 },
  long: { seconds: 60, chars: 360 },
};

export interface GenerateScriptInput {
  productName: string;
  description?: string;
  tone: ScriptTone;
  length: ScriptLength;
}

export async function generateScript({
  productName,
  description,
  tone,
  length,
}: GenerateScriptInput): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const l = LENGTH_GUIDE[length];

  const system = `당신은 한국어 쇼트폼 홍보 영상 대본을 전문으로 작성하는 카피라이터입니다.
- TTS로 낭독될 대본이므로 자연스러운 구어체로 작성합니다.
- 특수기호, 이모지, 괄호 설명, 대괄호 지문은 절대 포함하지 마세요.
- 문장은 짧게 끊어 리듬감 있게 작성합니다.
- 결과는 대본 텍스트만 반환합니다. 제목이나 설명 없이.`;

  const user = `아래 상품에 대한 홍보 영상 대본을 작성해주세요.

상품명: ${productName}
${description ? `추가 설명: ${description}` : ""}
톤: ${TONE_GUIDE[tone]}
목표 길이: 약 ${l.seconds}초 분량 (한국어 ${l.chars}자 내외)

구성:
1. 훅 (시선을 끄는 첫 문장)
2. 상품 가치 제안 (2~3문장)
3. 행동 유도 (CTA, 1문장)`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
}
