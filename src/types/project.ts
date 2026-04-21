// 프로젝트 기본 타입 — Phase 2에서는 목업용 필드만 우선 정의
// Phase 3에서 Supabase 연결 시 타임라인/에셋 등 확장

export type AspectRatio = "landscape" | "portrait";

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  thumbnailUrl: string | null;
  durationSeconds: number;
  // 시작 화면(AI로 시작 / 빈 프로젝트) 선택 완료 여부
  initialized: boolean;
  createdAt: string; // ISO 문자열
  updatedAt: string;
}
