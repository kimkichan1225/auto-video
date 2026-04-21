import { create } from "zustand";
import type { Project } from "@/types/project";
import { mockProjects } from "@/lib/mockProjects";

// Phase 4의 임시 전역 store — 홈과 에디터가 동일 데이터를 참조
// 추후 Supabase 도입 시: 초기값을 fetch 결과로 교체하고, add/remove/update를 API 호출로 래핑

interface ProjectsState {
  projects: Project[];
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: mockProjects,
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
  updateProject: (id, patch) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p
      ),
    })),
  getProject: (id) => get().projects.find((p) => p.id === id),
}));
