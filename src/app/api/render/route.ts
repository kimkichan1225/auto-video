import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";
import path from "path";
import fs from "fs/promises";
import os from "os";

// Remotion 서버 렌더링
// 주의: @remotion/renderer는 헤드리스 Chrome을 실행하므로 개발 초기엔
// 로컬에서만 동작 가능. 프로덕션은 Remotion Lambda / 별도 워커 서비스 권장.
export async function POST(req: Request) {
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
          await supabase
            .from("renders")
            .update({ progress })
            .eq("id", render.id);
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
