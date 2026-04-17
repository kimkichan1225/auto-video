import { NextResponse } from "next/server";

// 신버전 Typecast Developer API는 별도 voices 조회 엔드포인트를 이 래퍼에서 지원하지 않는다.
// 음성 목록은 https://typecast.ai/developers/api/voices 페이지에서 확인.
export async function GET() {
  return NextResponse.json(
    {
      message:
        "음성 목록은 https://typecast.ai/developers/api/voices 에서 확인하세요. 복사한 voice_id(tc_...)를 .env.local의 TYPECAST_ACTOR_ID 에 넣습니다.",
    },
    { status: 410 },
  );
}
