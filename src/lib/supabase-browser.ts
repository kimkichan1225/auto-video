// 브라우저(클라이언트 컴포넌트) 전용 Supabase 헬퍼
// next/headers 같은 서버 전용 API가 포함되면 안 됨 — 그렇게 되면 클라이언트 번들에서 빌드 에러
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabaseBrowser() {
  return createBrowserClient(url, anonKey);
}

export const STORAGE_BUCKETS = {
  assets: "assets",
  renders: "renders",
} as const;
