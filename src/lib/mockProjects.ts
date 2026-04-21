import type { Project } from "@/types/project";

// Phase 2 목업 데이터 — Phase 3에서 Supabase 쿼리로 교체
export const mockProjects: Project[] = [
  {
    id: "1",
    name: "주식 초보 가이드 1편",
    aspectRatio: "landscape",
    thumbnailUrl: null,
    durationSeconds: 92,
    initialized: true,
    createdAt: "2026-04-15T10:30:00Z",
    updatedAt: "2026-04-18T15:22:00Z",
  },
  {
    id: "2",
    name: "부동산 시장 분석",
    aspectRatio: "landscape",
    thumbnailUrl: null,
    durationSeconds: 215,
    initialized: true,
    createdAt: "2026-04-10T09:00:00Z",
    updatedAt: "2026-04-19T11:45:00Z",
  },
  {
    id: "3",
    name: "쇼츠 테스트",
    aspectRatio: "portrait",
    thumbnailUrl: null,
    durationSeconds: 43,
    initialized: true,
    createdAt: "2026-04-20T08:15:00Z",
    updatedAt: "2026-04-20T08:15:00Z",
  },
];
