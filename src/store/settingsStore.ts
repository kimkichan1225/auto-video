import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type GeminiSettings,
  type OpenAISettings,
  type TypecastSettings,
} from "@/types/settings";

// 새로 추가된 필드가 있을 때 기존 localStorage 상태를 덮어쓰지 않고 병합
function mergeWithDefaults(
  persisted: unknown,
  current: AppSettings
): AppSettings {
  const p = (persisted ?? {}) as Partial<AppSettings>;
  return {
    openai: { ...current.openai, ...(p.openai ?? {}) },
    gemini: { ...current.gemini, ...(p.gemini ?? {}) },
    typecast: { ...current.typecast, ...(p.typecast ?? {}) },
  };
}

// localStorage에 저장되는 설정 store
// 주의: 브라우저 로컬에 저장되므로 공용 기기에서는 주의
// 추후 Supabase + 사용자 인증 도입 시 서버 저장으로 전환

interface SettingsState extends AppSettings {
  hydrated: boolean;
  updateOpenAI: (patch: Partial<OpenAISettings>) => void;
  updateGemini: (patch: Partial<GeminiSettings>) => void;
  updateTypecast: (patch: Partial<TypecastSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      hydrated: false,
      updateOpenAI: (patch) =>
        set((state) => ({ openai: { ...state.openai, ...patch } })),
      updateGemini: (patch) =>
        set((state) => ({ gemini: { ...state.gemini, ...patch } })),
      updateTypecast: (patch) =>
        set((state) => ({ typecast: { ...state.typecast, ...patch } })),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "booggum-settings",
      storage: createJSONStorage(() => localStorage),
      // 스키마에 새 필드가 생겼을 때 기존 저장 상태와 얕은 병합 (nested까지)
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...mergeWithDefaults(persistedState, currentState as AppSettings),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

// API 키 유효 여부 편의 selector
export const hasOpenAIKey = (s: SettingsState) => s.openai.apiKey.trim().length > 0;
export const hasGeminiKey = (s: SettingsState) => s.gemini.apiKey.trim().length > 0;
