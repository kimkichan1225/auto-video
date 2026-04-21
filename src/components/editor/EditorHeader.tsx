"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsButton from "@/components/settings/SettingsButton";
import SettingsModal from "@/components/settings/SettingsModal";

interface Props {
  projectName: string;
}

export default function EditorHeader({ projectName }: Props) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-panel px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-panelAlt hover:text-white"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <input
          type="text"
          defaultValue={projectName}
          className="bg-transparent text-sm font-semibold text-white outline-none focus:bg-panelAlt focus:px-2 focus:py-1 focus:rounded"
        />
      </div>

      <div className="flex items-center gap-2">
        <SettingsButton onClick={() => setSettingsOpen(true)} />
        <button className="rounded-md px-3 py-1.5 text-sm text-gray-300 transition hover:bg-panelAlt hover:text-white">
          저장
        </button>
        <button className="rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-accentHover">
          내보내기
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
