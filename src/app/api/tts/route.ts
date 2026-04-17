import { NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase";
import { typecastSynthesize } from "@/lib/typecast";

// Typecast TTS 생성 → Storage 업로드 → assets 테이블 insert
export async function POST(req: Request) {
  const { projectId, text, voiceId } = await req.json();
  if (!projectId || !text) {
    return NextResponse.json({ message: "projectId/text 필요" }, { status: 400 });
  }

  try {
    const audio = await typecastSynthesize({ text, voiceId });
    const supabase = supabaseAdmin();
    const path = `${projectId}/tts_${Date.now()}.mp3`;

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKETS.assets)
      .upload(path, Buffer.from(audio), { contentType: "audio/mpeg" });
    if (upErr) return NextResponse.json({ message: upErr.message }, { status: 500 });

    const { data: asset, error: dbErr } = await supabase
      .from("assets")
      .insert({
        project_id: projectId,
        type: "audio",
        name: `TTS_${new Date().toISOString().slice(0, 19)}.mp3`,
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
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
