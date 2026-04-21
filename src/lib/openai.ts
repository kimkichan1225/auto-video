// OpenAI 클라이언트 호출 모음 — 브라우저에서 직접 fetch
// 사용자가 설정한 API 키를 받아서 호출

export interface GenerateScriptOptions {
  productName: string;
  description: string;
  apiKey: string;
  model: string;
}

const SCRIPT_SYSTEM_PROMPT = `당신은 한국어 숏폼(쇼츠·릴스·틱톡) 광고 대본 작가입니다. 20-40초 분량의 상품 소개 영상 대본을 작성합니다.

출력 형식:
- 3-5 문단 구성. 문단 사이는 빈 줄(\\n\\n)로 구분.
- 각 문단은 1-2 문장. 쉼표로 자연스러운 숨쉬는 리듬을 만듦.
- 상품명/제목/서론 없이 바로 훅 문단부터 시작. (자막 쪼개기는 이후 단계에서 처리됨)
- 마크다운·번호·"*"·"#" 등 기호 금지. 순수한 대본 텍스트만 출력.

문단별 역할:
- 첫 문단: 타겟/상황/훅 ("X한 분 이거 보세요", "아침으로 ~ 먹고 싶은데")
- 중간 문단들: 제품 특징 — 맛/구성/소재/성분 등
- 마지막 문단: 구체 수치(칼로리·용량·가격·시간 등) + 감정 한 마디 ("진짜 맛있어요")

내용 규칙:
- 구체적인 숫자는 사용자가 준 "추가 설명"에 있는 값만 사용. 모르는 수치는 만들어내지 말고 생략.
- 과한 존댓말·접속사·긴 부연 최소화. 짧고 리듬감 있는 광고 카피 톤.
- 사실 기반의 매력적인 서술. 과장 광고 문구 지양.

예시 — 상품명 "프로틴바", 추가 설명 "다크/쿠키앤크림/화이트/그릭요거트 맛, 글루텐프리 락토프리, 단백질 12g, 145kcal"

아침으로 프로틴바 먹고 싶은데 칼로리 걱정됐던 분 이거 보세요

다크,쿠키앤크림,화이트에 신상 그릭요거트 맛까지 4가지인데 글루텐프리 락토프리라 한국인한테 딱인 거 있죠

단백질 12g에 145kcal밖에 안 돼서 하나만 먹어도 포만감 좋은데 진짜 맛있어요

위 예시의 문단 구조, 쉼표 리듬, 훅/특징/수치+감정 흐름을 참고하세요.`;

export async function generateScript(opts: GenerateScriptOptions): Promise<string> {
  const userPrompt = `상품명: ${opts.productName}
추가 설명: ${opts.description.trim() || "(없음)"}

위 정보를 바탕으로 영상 대본을 작성해주세요.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: SCRIPT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("OpenAI 인증 실패 — 설정에서 API 키를 확인하세요.");
    }
    if (res.status === 429) {
      throw new Error("OpenAI 사용 한도 초과 — 잠시 후 다시 시도하세요.");
    }
    const errText = await res.text().catch(() => "");
    throw new Error(
      `OpenAI 오류 (${res.status})${errText ? `: ${errText.slice(0, 150)}` : ""}`
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI 응답에서 대본을 찾을 수 없습니다.");
  }
  return content.trim();
}
