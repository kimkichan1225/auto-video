import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";
import {
  deleteGeminiFile,
  matchSubtitlesToVideos,
  uploadVideoToGemini,
  type MatchResult,
} from "@/lib/gemini";

// 참고 영상들을 Gemini에 업로드하고, 프로젝트의 자막 라인별로 매칭되는 영상 구간을 찾아
// 타임라인의 영상 트랙에 VideoClip으로 배치한다.
export async function POST(req: Request) {
  const { projectId, videoAssetIds } = (await req.json()) as {
    projectId: string;
    videoAssetIds?: string[];
  };
  if (!projectId) {
    return NextResponse.json({ message: "projectId 필요" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // 1) 프로젝트 + 에셋 로드
  const [{ data: project }, { data: assetRows }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("assets").select("*").eq("project_id", projectId).eq("type", "video"),
  ]);
  if (!project) {
    return NextResponse.json({ message: "프로젝트 없음" }, { status: 404 });
  }

  // 사용할 참고 영상 필터 (지정 없으면 프로젝트의 모든 영상 에셋 사용)
  const refs = (assetRows ?? []).filter(
    (a) => !videoAssetIds || videoAssetIds.includes(a.id),
  );
  if (refs.length === 0) {
    return NextResponse.json(
      { message: "참고 영상이 없습니다. 먼저 영상을 업로드하세요." },
      { status: 400 },
    );
  }

  // 2) 자막 라인 추출 (프레임 → 초 변환)
  const fps: number = project.fps;
  const timeline = (project.timeline as { tracks?: any[] }) ?? { tracks: [] };
  const textTracks = (timeline.tracks ?? []).filter((t: any) => t.type === "text");
  const subtitleClips = textTracks.flatMap((t: any) => t.clips ?? []);
  if (subtitleClips.length === 0) {
    return NextResponse.json(
      { message: "자막이 없습니다. 먼저 자막을 생성하세요." },
      { status: 400 },
    );
  }

  const subtitlesForMatch = subtitleClips.map((c: any, i: number) => ({
    index: i,
    clipId: c.id,
    startSec: c.start / fps,
    endSec: (c.start + c.duration) / fps,
    text: c.text ?? "",
  }));

  // 3) 참고 영상 Supabase → 로컬 tmp → Gemini 업로드
  const tmpFiles: string[] = [];
  const geminiFileNames: string[] = [];
  const uploadedVideos: Array<{
    fileUri: string;
    mimeType: string;
    displayName: string;
    assetId: string;
  }> = [];

  try {
    for (const asset of refs) {
      const { data: fileData, error } = await supabase.storage
        .from(STORAGE_BUCKETS.assets)
        .download(asset.storage_path);
      if (error || !fileData) {
        throw new Error(`에셋 다운로드 실패: ${asset.name}`);
      }
      const buf = Buffer.from(await fileData.arrayBuffer());
      const ext = path.extname(asset.name) || ".mp4";
      const tmpPath = path.join(os.tmpdir(), `ref_${randomUUID()}${ext}`);
      await fs.writeFile(tmpPath, buf);
      tmpFiles.push(tmpPath);

      const mimeType = guessMime(asset.name);
      const uploaded = await uploadVideoToGemini(tmpPath, mimeType, asset.name);
      geminiFileNames.push(uploaded.name);
      uploadedVideos.push({
        fileUri: uploaded.fileUri,
        mimeType,
        displayName: asset.name,
        assetId: asset.id,
      });
    }

    // 4) Gemini에게 매칭 요청 — 실패(특히 429 quota) 시 순차 분배 fallback으로 전환
    let matches: MatchResult[];
    let fallbackUsed = false;
    try {
      matches = await matchSubtitlesToVideos(
        uploadedVideos.map((v) => ({
          fileUri: v.fileUri,
          mimeType: v.mimeType,
          displayName: v.displayName,
        })),
        subtitlesForMatch.map((s) => ({
          index: s.index,
          startSec: s.startSec,
          endSec: s.endSec,
          text: s.text,
        })),
      );
    } catch (geminiErr: any) {
      console.warn(
        "[match-videos] Gemini 매칭 실패 — 순차 분배 fallback으로 진행:",
        geminiErr?.status ?? geminiErr?.message,
      );
      fallbackUsed = true;
      matches = sequentialDistribute(subtitlesForMatch, uploadedVideos.length);
    }

    // 5) 매칭 결과 → VideoClip 생성
    // 클립 간 이음매에서 검정 플래시가 생기지 않도록 뒤 클립과 살짝 겹치게 처리
    const sortedMatches = [...matches].sort((a, b) => {
      const subA = subtitlesForMatch.find((s) => s.index === a.subtitleIndex);
      const subB = subtitlesForMatch.find((s) => s.index === b.subtitleIndex);
      return (subA?.startSec ?? 0) - (subB?.startSec ?? 0);
    });
    const OVERLAP_FRAMES = 2;
    const videoClipsByMatch = sortedMatches
      .map((m, i) =>
        buildVideoClip(
          m,
          subtitlesForMatch,
          uploadedVideos,
          fps,
          // 마지막 클립이 아니면 2프레임 연장
          i < sortedMatches.length - 1 ? OVERLAP_FRAMES : 0,
        ),
      )
      .filter(Boolean) as any[];

    // 6) 기존 타임라인에서 video 트랙을 찾거나 새로 만들고 클립 삽입
    // Composition은 tracks 배열을 역순 렌더해서 "첫 번째 = 최상위"가 되므로,
    // 영상 트랙은 배열 "끝"에 넣어야 실제 화면에서 자막 아래에 깔린다.
    const newTracks = [...(timeline.tracks ?? [])];
    let videoTrack = newTracks.find((t: any) => t.type === "video");
    if (!videoTrack) {
      videoTrack = {
        id: randomUUID(),
        type: "video",
        name: "영상",
        clips: [],
      };
      newTracks.push(videoTrack);
    }
    videoTrack.clips = [...(videoTrack.clips ?? []), ...videoClipsByMatch];

    await supabase
      .from("projects")
      .update({ timeline: { tracks: newTracks } })
      .eq("id", projectId);

    return NextResponse.json({
      ok: true,
      matched: videoClipsByMatch.length,
      fallback: fallbackUsed,
    });
  } catch (e: any) {
    console.error("[match-videos] 에러:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  } finally {
    // 정리
    await Promise.all(tmpFiles.map((p) => fs.unlink(p).catch(() => {})));
    await Promise.all(geminiFileNames.map((n) => deleteGeminiFile(n)));
  }
}

// Gemini가 불가능할 때 쓰는 단순 매칭 전략:
// - 자막을 순서대로 영상에 round-robin 분배
// - 같은 영상이 여러 번 쓰이면 직전 사용 끝 지점부터 이어서 잘라 사용 (반복 최소화)
function sequentialDistribute(
  subtitles: Array<{ index: number; startSec: number; endSec: number }>,
  videoCount: number,
): MatchResult[] {
  if (videoCount === 0) return [];
  const cursor = new Map<number, number>(); // videoIndex → 다음 시작 초
  return subtitles.map((s, i) => {
    const videoIndex = i % videoCount;
    const duration = s.endSec - s.startSec;
    const startSec = cursor.get(videoIndex) ?? 0;
    cursor.set(videoIndex, startSec + duration);
    return {
      subtitleIndex: s.index,
      videoIndex,
      startSec,
      endSec: startSec + duration,
    };
  });
}

function guessMime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mkv") return "video/x-matroska";
  return "video/mp4";
}

function buildVideoClip(
  m: MatchResult,
  subtitles: Array<{ index: number; clipId: string; startSec: number; endSec: number }>,
  videos: Array<{ assetId: string }>,
  fps: number,
  overlapFrames: number,
) {
  const sub = subtitles.find((s) => s.index === m.subtitleIndex);
  const vid = videos[m.videoIndex];
  if (!sub || !vid) return null;

  const subStart = sub.startSec;
  const subDuration = sub.endSec - sub.startSec;
  // Gemini가 길이를 정확히 못 맞춘 경우 자막 길이에 강제 정렬
  const trimStart = Math.max(0, m.startSec);
  const overlapSec = overlapFrames / fps;
  const trimEnd = Math.max(trimStart + 0.1, trimStart + subDuration + overlapSec);

  return {
    id: randomUUID(),
    kind: "video",
    assetId: vid.assetId,
    start: Math.round(subStart * fps),
    // 다음 클립과 overlapFrames만큼 겹치게 해서 OffthreadVideo 로드 지연 시 검정 플래시 방지
    duration: Math.round(subDuration * fps) + overlapFrames,
    trimStartSeconds: trimStart,
    trimEndSeconds: trimEnd,
    volume: 0, // 참고 영상의 원본 오디오는 끄고 TTS를 살린다
    transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
  };
}
