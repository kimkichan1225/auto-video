// POST /api/tts — Typecast 프록시
// 클라이언트가 설정의 API 키/voice_id/apiBase를 헤더로 전달하면
// 이 라우트가 Typecast /v1/text-to-speech 호출해서 오디오 바이너리를 그대로 돌려줌
//
// 추후 Boostech-AI-backend(Railway)로 이전 시, 이 핸들러 로직을 Express route로 옮기면 됨

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TtsBody {
  text: string;
  voiceId: string;
  model?: string; // ssfm-v30 (default)
  audioFormat?: "mp3" | "wav";
  language?: string;
  volume?: number;
  audioPitch?: number;
  audioTempo?: number;
}

const DEFAULT_BASE = "https://api.typecast.ai/v1";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-typecast-key")?.trim();
  const apiBase = req.headers.get("x-typecast-base")?.trim() || DEFAULT_BASE;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Typecast API 키가 설정되지 않았습니다." },
      { status: 400 }
    );
  }

  let body: TtsBody;
  try {
    body = (await req.json()) as TtsBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text가 비어있습니다." }, { status: 400 });
  }
  if (!body.voiceId?.trim()) {
    return NextResponse.json(
      { error: "voice_id가 비어있습니다." },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    text: body.text,
    voice_id: body.voiceId,
    model: body.model ?? "ssfm-v21",
    language: body.language ?? "kor",
    output: {
      audio_format: body.audioFormat ?? "mp3",
      volume: body.volume ?? 100,
      audio_pitch: body.audioPitch ?? 0,
      audio_tempo: body.audioTempo ?? 1.0,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${apiBase}/text-to-speech`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Typecast 요청 실패 (네트워크)", detail: String(e) },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const hints: Record<number, string> = {
      400: "요청 파라미터 오류 (voice_id 형식/text 길이/model 값 확인)",
      401: "API 키 인증 실패",
      402: "크레딧 부족",
      404: "voice_id를 찾을 수 없음",
      422: "페이로드 검증 실패 (language/model/voice_id 필드 확인)",
    };
    // 서버 터미널에도 찍어서 디버깅 쉽게
    console.error(`[Typecast] ${res.status}`, errText.slice(0, 500));
    return NextResponse.json(
      {
        error: `Typecast ${res.status}: ${hints[res.status] ?? "오류"}`,
        detail: errText.slice(0, 500),
      },
      { status: res.status }
    );
  }

  // 바이너리 오디오를 그대로 pass-through
  const audio = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "audio/mpeg";
  return new Response(audio, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
