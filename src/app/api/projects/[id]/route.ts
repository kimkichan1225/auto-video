import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";

// 프로젝트 메타/타임라인 저장
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("projects")
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.timeline !== undefined && { timeline: body.timeline }),
      ...(body.width !== undefined && { width: body.width }),
      ...(body.height !== undefined && { height: body.height }),
      ...(body.fps !== undefined && { fps: body.fps }),
    })
    .eq("id", params.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 프로젝트 삭제 — DB와 Storage 양쪽에서 관련 파일을 모두 제거
// 1) assets 테이블에서 storage_path 목록 조회 후 assets 버킷의 파일 삭제
// 2) renders 테이블에서 output_path 목록 조회 후 renders 버킷의 파일 삭제
// 3) projects 테이블의 행 삭제 (FK ON DELETE CASCADE로 assets/renders 행도 함께 삭제)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseAdmin();

  const [{ data: assets }, { data: renders }] = await Promise.all([
    supabase.from("assets").select("storage_path").eq("project_id", params.id),
    supabase.from("renders").select("output_path").eq("project_id", params.id),
  ]);

  const assetPaths = (assets ?? []).map((a) => a.storage_path).filter(Boolean);
  const renderPaths = (renders ?? [])
    .map((r) => r.output_path as string | null)
    .filter((p): p is string => !!p);

  if (assetPaths.length) {
    await supabase.storage.from(STORAGE_BUCKETS.assets).remove(assetPaths);
  }
  if (renderPaths.length) {
    await supabase.storage.from(STORAGE_BUCKETS.renders).remove(renderPaths);
  }

  const { error } = await supabase.from("projects").delete().eq("id", params.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
