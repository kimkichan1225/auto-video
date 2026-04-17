// 서버(서버 컴포넌트 / 라우트 핸들러) 전용 Supabase 헬퍼
// 브라우저 클라이언트가 필요하면 `@/lib/supabase-browser`의 supabaseBrowser를 사용할 것
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서버 컴포넌트/라우트 핸들러 전용 (쿠키 기반)
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  });
}

// 서버 측 관리자 작업용 (service_role) — 절대 클라이언트에 노출 금지
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// 호환을 위해 Storage 버킷 상수 재노출 (브라우저 파일에서 정의)
export { STORAGE_BUCKETS } from "./supabase-browser";
