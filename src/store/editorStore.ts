import { create } from "zustand";
import type { Clip, Timeline, TrackId } from "@/types/timeline";
import { emptyTimeline } from "@/types/timeline";

// 프로젝트별 타임라인 상태 — 현재 열린 에디터의 작업 대상
// 추후 Supabase 도입 시: 프로젝트 로드/저장 시 이 store를 초기화/플러시

interface EditorState {
  // 현재 에디터가 편집 중인 프로젝트 id
  projectId: string | null;
  timeline: Timeline;
  selectedClipId: string | null;

  // 프로젝트 전환/로드
  loadTimeline: (projectId: string, timeline: Timeline) => void;
  resetTimeline: () => void;

  // 클립 조작
  addClips: (clips: Clip[]) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  selectClip: (clipId: string | null) => void;

  // 유틸
  getClip: (clipId: string) => Clip | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  timeline: emptyTimeline(),
  selectedClipId: null,

  loadTimeline: (projectId, timeline) =>
    set({ projectId, timeline, selectedClipId: null }),

  resetTimeline: () =>
    set({ projectId: null, timeline: emptyTimeline(), selectedClipId: null }),

  addClips: (clips) =>
    set((state) => {
      const byTrack = new Map<TrackId, Clip[]>();
      for (const c of clips) {
        const arr = byTrack.get(c.trackId) ?? [];
        arr.push(c);
        byTrack.set(c.trackId, arr);
      }
      const tracks = state.timeline.tracks.map((t) => {
        const added = byTrack.get(t.id);
        if (!added) return t;
        return { ...t, clips: [...t.clips, ...added] };
      });
      // 전체 duration은 최대 end 시점으로 갱신
      const allClips = tracks.flatMap((t) => t.clips);
      const maxEnd = allClips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
      return {
        timeline: {
          tracks,
          durationSeconds: Math.max(state.timeline.durationSeconds, maxEnd),
        },
      };
    }),

  removeClip: (clipId) =>
    set((state) => {
      const tracks = state.timeline.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));
      const allClips = tracks.flatMap((t) => t.clips);
      const maxEnd = allClips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
      return {
        timeline: { tracks, durationSeconds: maxEnd },
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
      };
    }),

  updateClip: (clipId, patch) =>
    set((state) => {
      const tracks = state.timeline.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === clipId ? ({ ...c, ...patch } as Clip) : c
        ),
      }));
      const allClips = tracks.flatMap((t) => t.clips);
      const maxEnd = allClips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
      return {
        timeline: {
          tracks,
          durationSeconds: Math.max(state.timeline.durationSeconds, maxEnd),
        },
      };
    }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  getClip: (clipId) => {
    for (const t of get().timeline.tracks) {
      const c = t.clips.find((c) => c.id === clipId);
      if (c) return c;
    }
    return undefined;
  },
}));
