import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저(클라이언트 컴포넌트) 전용
export function supabaseBrowser() {
  return createBrowserClient(url, anonKey);
}

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

export const STORAGE_BUCKETS = {
  assets: "assets",
  renders: "renders",
} as const;
