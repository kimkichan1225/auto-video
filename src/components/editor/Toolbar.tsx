"use client";

import { useEditorStore } from "@/store/editorStore";
import { useState } from "react";

// 상단 툴바: 프로젝트명, 저장, 렌더(내보내기)
export default function Toolbar() {
  const project = useEditorStore((s) => s.project);
  const renameProject = useEditorStore((s) => s.renameProject);
  const setAspect = useEditorStore((s) => s.setAspect);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);

  if (!project) return null;

  async function handleSave() {
    if (!project) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          timeline: { tracks: project.tracks },
          width: project.meta.width,
          height: project.meta.height,
          fps: project.meta.fps,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRender() {
    if (!project) return;
    setRendering(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
      else alert(data.message ?? "렌더 요청이 접수되었습니다.");
    } finally {
      setRendering(false);
    }
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-panel px-4">
      <div className="flex items-center gap-3">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-200">
          ← 목록
        </a>
        <input
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          className="rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-border focus:border-accent focus:outline-none"
        />
        <div className="flex items-center gap-1 rounded-md border border-border bg-panelAlt p-0.5 text-xs">
          <button
            onClick={() => setAspect("landscape")}
            className={`rounded px-2 py-0.5 ${project.meta.width >= project.meta.height ? "bg-accent text-white" : "text-gray-400"}`}
          >
            영상 16:9
          </button>
          <button
            onClick={() => setAspect("shorts")}
            className={`rounded px-2 py-0.5 ${project.meta.height > project.meta.width ? "bg-accent text-white" : "text-gray-400"}`}
          >
            쇼츠 9:16
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {project.meta.width} × {project.meta.height} @ {project.meta.fps}fps
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-panelAlt disabled:opacity-50"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={handleRender}
          disabled={rendering}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium hover:bg-accentHover disabled:opacity-50"
        >
          {rendering ? "렌더 중..." : "내보내기 (MP4)"}
        </button>
      </div>
    </header>
  );
}
