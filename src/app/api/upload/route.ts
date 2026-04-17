import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";

// 파일 업로드 엔드포인트
// - multipart/form-data로 file, projectId 수신
// - Supabase Storage(assets 버킷)에 저장
// - assets 테이블에 메타 insert
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectId = form.get("projectId") as string | null;
  if (!file || !projectId) {
    return NextResponse.json({ message: "file/projectId 필요" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKETS.assets)
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ message: upErr.message }, { status: 500 });

  const type = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : null;
  if (!type) {
    return NextResponse.json({ message: "지원하지 않는 파일 형식" }, { status: 400 });
  }

  const { data: asset, error: dbErr } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      type,
      name: file.name,
      storage_path: path,
    })
    .select("*")
    .single();
  if (dbErr || !asset) {
    return NextResponse.json({ message: dbErr?.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.assets)
    .getPublicUrl(path);

  return NextResponse.json({
    asset: {
      id: asset.id,
      projectId: asset.project_id,
      type: asset.type,
      name: asset.name,
      storagePath: asset.storage_path,
      url: urlData.publicUrl,
    },
  });
}
