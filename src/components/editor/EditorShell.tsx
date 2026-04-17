"use client";

import { useEffect } from "react";
import type { Project } from "@/types/project";
import { useEditorStore } from "@/store/editorStore";
import Toolbar from "./Toolbar";
import AssetPanel from "./AssetPanel";
import PropertyPanel from "./PropertyPanel";
import Preview from "./Preview";
import Timeline from "./Timeline";

interface Props {
  initialProject: Project;
}

// 에디터 메인 레이아웃
// ┌────────────────────────────────────────────┐
// │                  Toolbar                    │
// ├──────────┬──────────────────┬──────────────┤
// │  Asset   │     Preview      │   Property   │
// │  Panel   │                  │    Panel     │
// │          │                  │              │
// ├──────────┴──────────────────┴──────────────┤
// │                  Timeline                   │
// └────────────────────────────────────────────┘
export default function EditorShell({ initialProject }: Props) {
  const setProject = useEditorStore((s) => s.setProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject, setProject]);

  return (
    <div className="flex h-screen flex-col bg-[#16181d] text-gray-100">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <AssetPanel />
        <div className="flex min-w-0 flex-1 flex-col">
          <Preview />
        </div>
        <PropertyPanel />
      </div>
      <Timeline />
    </div>
  );
}
