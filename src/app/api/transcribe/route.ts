import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";
import { transcribeWithTimestamps, groupWordsIntoSubtitles } from "@/lib/whisper";
import { randomUUID } from "crypto";

export const maxDuration = 60;

// 오디오 에셋 → Whisper STT → 자막 클립으로 변환 → 프로젝트 timeline에 추가
export async function POST(req: Request) {
  const { projectId, assetId } = await req.json();
  if (!projectId || !assetId) {
    return NextResponse.json({ message: "projectId/assetId 필요" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();

    // 1) 프로젝트 + 에셋 조회
    const [{ data: project }, { data: asset }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("assets").select("*").eq("id", assetId).single(),
    ]);
    if (!project || !asset) {
      return NextResponse.json({ message: "프로젝트/에셋 없음" }, { status: 404 });
    }

    // 2) Storage에서 오디오 다운로드
    const { data: fileData, error: dlErr } = await supabase.storage
      .from(STORAGE_BUCKETS.assets)
      .download(asset.storage_path);
    if (dlErr || !fileData) {
      return NextResponse.json({ message: dlErr?.message }, { status: 500 });
    }
    const buf = Buffer.from(await fileData.arrayBuffer());

    // 3) Whisper 호출
    const { words, duration } = await transcribeWithTimestamps(buf, asset.name);
    const rawLines = groupWordsIntoSubtitles(words);

    // 자막-영상 매칭의 빈틈을 없애기 위해 각 자막을 "다음 자막 시작"까지 연장
    // 첫 자막은 0초부터, 마지막 자막은 오디오 끝까지
    const lines = rawLines.map((l, i) => {
      const start = i === 0 ? 0 : l.start;
      const end =
        i === rawLines.length - 1
          ? Math.max(l.end, duration || l.end)
          : rawLines[i + 1].start;
      return { ...l, start, end };
    });

    // 에셋의 실제 재생 길이 저장
    if (duration > 0) {
      await supabase
        .from("assets")
        .update({ duration_seconds: duration })
        .eq("id", assetId);
    }

    // 4) 자막 트랙을 프로젝트 timeline에 추가 + 이 오디오 클립의 길이 실측값으로 보정
    const fps: number = project.fps;
    const timeline = (project.timeline as { tracks?: any[] }) ?? { tracks: [] };
    const tracks = (timeline.tracks ?? []).map((t: any) => {
      if (t.type !== "audio") return t;
      return {
        ...t,
        clips: (t.clips ?? []).map((c: any) =>
          c.assetId === assetId && duration > 0
            ? { ...c, duration: Math.round(duration * fps) }
            : c,
        ),
      };
    });

    let textTrack = tracks.find((t: any) => t.type === "text");
    if (!textTrack) {
      textTrack = { id: randomUUID(), type: "text", name: "자막", clips: [] };
      tracks.push(textTrack);
    }

    for (const line of lines) {
      textTrack.clips.push({
        id: randomUUID(),
        kind: "text",
        start: Math.round(line.start * fps),
        duration: Math.max(fps, Math.round((line.end - line.start) * fps)),
        text: line.text,
        style: {
          fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
          fontSize: 72,
          fontWeight: 700,
          color: "#ffffff",
          strokeColor: "#000000",
          strokeWidth: 3,
          align: "center",
        },
        transform: { x: 0, y: 300, scale: 1, rotation: 0, opacity: 1 },
        animation: { in: "fade", out: "fade" },
      });
    }

    await supabase
      .from("projects")
      .update({ timeline: { tracks } })
      .eq("id", projectId);

    return NextResponse.json({ ok: true, lines: lines.length });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
