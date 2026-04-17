import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";
import path from "path";
import fs from "fs/promises";
import os from "os";

// Remotion 서버 렌더링
// Vercel 서버리스 환경에서는 동작하지 않음 (헤드리스 Chrome + ffmpeg 필요,
// 번들 크기/실행 시간 제한). 배포 시에는 별도 렌더 서버(Railway 등)가 필요.
// 로컬 개발 환경에서만 실제 렌더가 동작하도록 가드.
export async function POST(req: Request) {
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        message:
          "MP4 내보내기는 현재 로컬 환경에서만 지원됩니다. 배포 서버에서는 별도 렌더 서비스(Railway 등)가 필요합니다.",
      },
      { status: 501 },
    );
  }

  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ message: "projectId 필요" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();

    // 1) 렌더 작업 레코드 생성
    const { data: render } = await supabase
      .from("renders")
      .insert({ project_id: projectId, status: "rendering", progress: 0 })
      .select("*")
      .single();

    // 2) 프로젝트 + 에셋 로드
    const [{ data: project }, { data: assetRows }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("assets").select("*").eq("project_id", projectId),
    ]);
    if (!project) {
      return NextResponse.json({ message: "프로젝트 없음" }, { status: 404 });
    }

    const assets = (assetRows ?? []).map((a) => {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.assets)
        .getPublicUrl(a.storage_path);
      return {
        id: a.id,
        projectId: a.project_id,
        type: a.type,
        name: a.name,
        storagePath: a.storage_path,
        url: data.publicUrl,
        durationSeconds: a.duration_seconds ?? undefined,
      };
    });

    const timeline = (project.timeline as { tracks?: any[] }) ?? { tracks: [] };
    const totalFrames = Math.max(
      project.duration_frames,
      (timeline.tracks ?? []).reduce(
        (m: number, t: any) =>
          Math.max(
            m,
            (t.clips ?? []).reduce(
              (mm: number, c: any) => Math.max(mm, c.start + c.duration),
              0,
            ),
          ),
        0,
      ),
    );

    // 3) Remotion 렌더 실행 (런타임 import로 번들 최소화)
    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, selectComposition } = await import("@remotion/renderer");

    const bundled = await bundle({
      entryPoint: path.resolve(process.cwd(), "src/remotion/index.ts"),
      webpackOverride: (c) => c,
    });

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "Main",
      inputProps: {
        tracks: timeline.tracks ?? [],
        assets,
        meta: {
          fps: project.fps,
          width: project.width,
          height: project.height,
          durationFrames: totalFrames,
        },
      },
    });

    const outFile = path.join(os.tmpdir(), `render_${Date.now()}.mp4`);

    await renderMedia({
      codec: "h264",
      composition: { ...composition, durationInFrames: totalFrames },
      serveUrl: bundled,
      outputLocation: outFile,
      inputProps: {
        tracks: timeline.tracks ?? [],
        assets,
        meta: {
          fps: project.fps,
          width: project.width,
          height: project.height,
          durationFrames: totalFrames,
        },
      },
      onProgress: async ({ progress }) => {
        if (render) {
          await supabase.from("renders").update({ progress }).eq("id", render.id);
        }
      },
    });

    // 4) 결과 MP4를 Storage에 업로드
    const mp4 = await fs.readFile(outFile);
    const outPath = `${projectId}/render_${Date.now()}.mp4`;
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKETS.renders)
      .upload(outPath, mp4, { contentType: "video/mp4" });
    if (upErr) throw upErr;
    await fs.unlink(outFile).catch(() => {});

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.renders)
      .getPublicUrl(outPath);

    if (render) {
      await supabase
        .from("renders")
        .update({ status: "done", progress: 1, output_path: outPath })
        .eq("id", render.id);
    }

    return NextResponse.json({ ok: true, url: urlData.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
