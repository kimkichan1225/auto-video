import { NextResponse } from "next/server";
import { generateScript } from "@/lib/scriptgen";

export const maxDuration = 60;

// 상품 정보 → 대본 생성
export async function POST(req: Request) {
  try {
    const { productName, description, tone, length } = await req.json();
    if (!productName) {
      return NextResponse.json({ message: "productName 필요" }, { status: 400 });
    }
    const script = await generateScript({
      productName,
      description,
      tone: tone ?? "friendly",
      length: length ?? "medium",
    });
    return NextResponse.json({ script });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
