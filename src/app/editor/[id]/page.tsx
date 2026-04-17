import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import EditorShell from "@/components/editor/EditorShell";
import type { Project } from "@/types/project";

export const dynamic = "force-dynamic";

// 에디터 메인 페이지
// 서버에서 프로젝트 + 에셋 로드 후 클라이언트 에디터 Shell에 초기 상태 전달
export default async function EditorPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!projectRow) notFound();

  const { data: assetRows } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", params.id);

  // Supabase Storage public URL 계산
  const assets = (assetRows ?? []).map((a) => {
    const { data } = supabase.storage.from("assets").getPublicUrl(a.storage_path);
    return {
      id: a.id,
      projectId: a.project_id,
      type: a.type,
      name: a.name,
      storagePath: a.storage_path,
      url: data.publicUrl,
      durationSeconds: a.duration_seconds ?? undefined,
      width: a.width ?? undefined,
      height: a.height ?? undefined,
    };
  });

  const timeline = (projectRow.timeline as { tracks?: Project["tracks"] }) ?? {
    tracks: [],
  };

  const initial: Project = {
    id: projectRow.id,
    name: projectRow.name,
    meta: {
      fps: projectRow.fps,
      width: projectRow.width,
      height: projectRow.height,
      durationFrames: projectRow.duration_frames,
    },
    tracks: timeline.tracks ?? [],
    assets,
  };

  return <EditorShell initialProject={initial} />;
}
