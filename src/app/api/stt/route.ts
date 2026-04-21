// POST /api/stt — OpenAI Whisper 프록시
// multipart/form-data로 오디오 파일 받아 단어 단위 타임스탬프 반환

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-openai-key")?.trim();
  const model = req.headers.get("x-openai-model")?.trim() || "whisper-1";

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API 키가 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "multipart 본문 파싱 실패" },
      { status: 400 }
    );
  }

  const file = incoming.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "file 필드가 비어있거나 올바르지 않습니다." },
      { status: 400 }
    );
  }
  const language = (incoming.get("language") as string | null)?.trim() || "ko";

  // Whisper에 그대로 전달
  const openaiForm = new FormData();
  openaiForm.append("file", file, "audio.mp3");
  openaiForm.append("model", model);
  openaiForm.append("response_format", "verbose_json");
  openaiForm.append("timestamp_granularities[]", "word");
  if (language) openaiForm.append("language", language);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Whisper 요청 실패 (네트워크)", detail: String(e) },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[Whisper] ${res.status}`, errText.slice(0, 500));
    return NextResponse.json(
      {
        error: `Whisper ${res.status}`,
        detail: errText.slice(0, 500),
      },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
