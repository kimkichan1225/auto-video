"use client";

import { useParams } from "next/navigation";
import EditorHeader from "@/components/editor/EditorHeader";
import AssetPanel from "@/components/editor/AssetPanel";
import PreviewPanel from "@/components/editor/PreviewPanel";
import PropertyPanel from "@/components/editor/PropertyPanel";
import TimelinePanel from "@/components/editor/TimelinePanel";
import StartScreen, {
  type StartAiPayload,
  type StartMode,
} from "@/components/editor/StartScreen";
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

  const handleStartChoice = (mode: StartMode, payload?: StartAiPayload) => {
    const patch: Parameters<typeof updateProject>[1] = { initialized: true };
    // 상품명을 프로젝트 이름으로 반영 (기본명인 경우에만)
    if (payload?.productName && project.name === "새 프로젝트") {
      patch.name = payload.productName;
    }
    updateProject(project.id, patch);

    if (mode === "ai" && payload) {
      // Phase 7~10에서 실제 파이프라인 연결 지점
      console.log("AI 생성 payload:", payload);
    }
  };

  if (!project.initialized) {
    return (
      <div className="flex h-full flex-col">
        <EditorHeader projectName={project.name} />
        <StartScreen onChoose={handleStartChoice} />
      </div>
    );
  }

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
