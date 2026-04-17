import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 프리셋별 해상도 (둘 다 30fps, 10초 기본)
const PRESETS = {
  landscape: { width: 1920, height: 1080, name: "새 영상" },
  shorts: { width: 1080, height: 1920, name: "새 쇼츠" },
} as const;

// 새 프로젝트 생성
// form-data의 "preset" 값에 따라 가로형/세로형 선택
export async function POST(req: Request) {
  const form = await req.formData();
  const presetKey = (form.get("preset") as string | null) ?? "landscape";
  const preset = PRESETS[presetKey as keyof typeof PRESETS] ?? PRESETS.landscape;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: preset.name,
      width: preset.width,
      height: preset.height,
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ message: error?.message }, { status: 500 });
  }
  // 배포 환경에서도 올바른 도메인으로 리다이렉트하도록 요청 자체의 origin 사용
  return NextResponse.redirect(new URL(`/editor/${data.id}`, req.url), 303);
}
