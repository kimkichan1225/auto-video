// API 키 연결 테스트 — 가벼운 호출(모델 목록 조회)로 인증 상태만 확인
// 브라우저에서 직접 호출해도 CORS 허용됨

export interface TestResult {
  ok: boolean;
  message: string;
}

export async function testOpenAI(apiKey: string): Promise<TestResult> {
  if (!apiKey.trim()) return { ok: false, message: "API 키를 입력하세요." };
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (res.ok) return { ok: true, message: "연결 정상" };
    if (res.status === 401) return { ok: false, message: "인증 실패 (키 확인)" };
    return { ok: false, message: `오류 ${res.status}` };
  } catch (e) {
    return { ok: false, message: "네트워크 오류" };
  }
}

export async function testGemini(apiKey: string): Promise<TestResult> {
  if (!apiKey.trim()) return { ok: false, message: "API 키를 입력하세요." };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`
    );
    if (res.ok) return { ok: true, message: "연결 정상" };
    if (res.status === 400 || res.status === 403)
      return { ok: false, message: "인증 실패 (키 확인)" };
    return { ok: false, message: `오류 ${res.status}` };
  } catch (e) {
    return { ok: false, message: "네트워크 오류" };
  }
}
