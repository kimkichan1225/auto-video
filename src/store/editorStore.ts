"use client";

import { create } from "zustand";
import type { Asset, Clip, Project, Track } from "@/types/project";
import { uid } from "@/lib/utils";

// 에디터 전역 상태 관리 (Zustand)
// - 프로젝트 데이터(타임라인)
// - 현재 선택 상태
// - 재생 상태

interface EditorState {
  project: Project | null;
  selectedClipId: string | null;
  currentFrame: number;
  isPlaying: boolean;

  // ----- 프로젝트 -----
  setProject: (project: Project) => void;
  renameProject: (name: string) => void;
  setAspect: (preset: "landscape" | "shorts") => void;

  // ----- 에셋 -----
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;

  // ----- 트랙 -----
  addTrack: (type: Track["type"]) => string;
  removeTrack: (trackId: string) => void;

  // ----- 클립 -----
  addClip: (trackId: string, clip: Clip) => void;
  updateClip: (clipId: string, patch: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;

  // ----- 선택/재생 -----
  selectClip: (clipId: string | null) => void;
  setCurrentFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
}

function findClip(tracks: Track[], clipId: string) {
  for (const t of tracks) {
    const c = t.clips.find((c) => c.id === clipId);
    if (c) return { track: t, clip: c };
  }
  return null;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  selectedClipId: null,
  currentFrame: 0,
  isPlaying: false,

  setProject: (project) => set({ project, selectedClipId: null, currentFrame: 0 }),

  renameProject: (name) =>
    set((s) => (s.project ? { project: { ...s.project, name } } : s)),

  setAspect: (preset) =>
    set((s) => {
      if (!s.project) return s;
      const dims =
        preset === "shorts"
          ? { width: 1080, height: 1920 }
          : { width: 1920, height: 1080 };
      return { project: { ...s.project, meta: { ...s.project.meta, ...dims } } };
    }),

  addAsset: (asset) =>
    set((s) =>
      s.project ? { project: { ...s.project, assets: [...s.project.assets, asset] } } : s,
    ),

  removeAsset: (assetId) =>
    set((s) =>
      s.project
        ? {
            project: {
              ...s.project,
              assets: s.project.assets.filter((a) => a.id !== assetId),
            },
          }
        : s,
    ),

  addTrack: (type) => {
    const newId = uid();
    set((s) => {
      if (!s.project) return s;
      const newTrack: Track = {
        id: newId,
        type,
        name: `${type} 트랙`,
        clips: [],
      };
      return { project: { ...s.project, tracks: [...s.project.tracks, newTrack] } };
    });
    return newId;
  },

  removeTrack: (trackId) =>
    set((s) =>
      s.project
        ? {
            project: {
              ...s.project,
              tracks: s.project.tracks.filter((t) => t.id !== trackId),
            },
          }
        : s,
    ),

  addClip: (trackId, clip) =>
    set((s) =>
      s.project
        ? {
            project: {
              ...s.project,
              tracks: s.project.tracks.map((t) =>
                t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t,
              ),
            },
          }
        : s,
    ),

  updateClip: (clipId, patch) =>
    set((s) => {
      if (!s.project) return s;
      return {
        project: {
          ...s.project,
          tracks: s.project.tracks.map((t) => ({
            ...t,
            clips: t.clips.map((c) =>
              c.id === clipId ? ({ ...c, ...patch } as Clip) : c,
            ),
          })),
        },
      };
    }),

  removeClip: (clipId) =>
    set((s) => {
      if (!s.project) return s;
      return {
        project: {
          ...s.project,
          tracks: s.project.tracks.map((t) => ({
            ...t,
            clips: t.clips.filter((c) => c.id !== clipId),
          })),
        },
        selectedClipId: s.selectedClipId === clipId ? null : s.selectedClipId,
      };
    }),

  moveClip: (clipId, newStart, newTrackId) =>
    set((s) => {
      if (!s.project) return s;
      const found = findClip(s.project.tracks, clipId);
      if (!found) return s;
      const { track: fromTrack, clip } = found;
      const updatedClip = { ...clip, start: Math.max(0, newStart) };
      const targetTrackId = newTrackId ?? fromTrack.id;
      return {
        project: {
          ...s.project,
          tracks: s.project.tracks.map((t) => {
            if (t.id === fromTrack.id && t.id === targetTrackId) {
              return {
                ...t,
                clips: t.clips.map((c) => (c.id === clipId ? updatedClip : c)),
              };
            }
            if (t.id === fromTrack.id) {
              return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
            }
            if (t.id === targetTrackId) {
              return { ...t, clips: [...t.clips, updatedClip] };
            }
            return t;
          }),
        },
      };
    }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, frame) }),
  setPlaying: (playing) => set({ isPlaying: playing }),
}));

// 선택된 클립 헬퍼 셀렉터
export function useSelectedClip() {
  return useEditorStore((s) => {
    if (!s.project || !s.selectedClipId) return null;
    for (const t of s.project.tracks) {
      const c = t.clips.find((c) => c.id === s.selectedClipId);
      if (c) return c;
    }
    return null;
  });
}
