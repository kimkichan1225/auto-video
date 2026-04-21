"use client";

import { useParams } from "next/navigation";
import EditorHeader from "@/components/editor/EditorHeader";
import AssetPanel from "@/components/editor/AssetPanel";
import PreviewPanel from "@/components/editor/PreviewPanel";
import PropertyPanel from "@/components/editor/PropertyPanel";
import TimelinePanel from "@/components/editor/TimelinePanel";
import StartScreen, { type StartMode } from "@/components/editor/StartScreen";
import { useProjectsStore } from "@/store/projectsStore";

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectsStore((s) => s.getProject(params.id));
  const updateProject = useProjectsStore((s) => s.updateProject);

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <p>프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleStartChoice = (mode: StartMode) => {
    updateProject(project.id, { initialized: true });
    if (mode === "ai") {
      // Phase 7에서 대본 입력 모달/패널 열기
      console.log("AI로 시작 — Phase 7에서 대본 입력 연결 예정");
    }
  };

  // 아직 시작 방식을 선택 안 한 경우: 헤더 + 시작 화면
  if (!project.initialized) {
    return (
      <div className="flex h-full flex-col">
        <EditorHeader projectName={project.name} />
        <StartScreen onChoose={handleStartChoice} />
      </div>
    );
  }

  // 기본 에디터 레이아웃
  return (
    <div className="flex h-full flex-col">
      <EditorHeader projectName={project.name} />

      <div className="flex flex-1 overflow-hidden">
        <AssetPanel />

        <div className="flex flex-1 flex-col overflow-hidden">
          <PreviewPanel aspectRatio={project.aspectRatio} />
          <TimelinePanel />
        </div>

        <PropertyPanel />
      </div>
    </div>
  );
}
