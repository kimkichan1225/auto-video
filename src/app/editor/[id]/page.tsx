"use client";

import { useEffect } from "react";
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
import { useEditorStore } from "@/store/editorStore";
import { emptyTimeline } from "@/types/timeline";
import { buildTimelineFromAudio } from "@/lib/mockAiGenerator";

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const project = useProjectsStore((s) => s.getProject(params.id));
  const updateProject = useProjectsStore((s) => s.updateProject);
  const loadTimeline = useEditorStore((s) => s.loadTimeline);
  const resetTimeline = useEditorStore((s) => s.resetTimeline);
  const editorProjectId = useEditorStore((s) => s.projectId);

  // 프로젝트 전환 시 editorStore 초기화 (아직 내용 없으면 빈 타임라인으로)
  useEffect(() => {
    if (!project) return;
    if (editorProjectId !== project.id) {
      loadTimeline(project.id, emptyTimeline());
    }
  }, [project, editorProjectId, loadTimeline]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      resetTimeline();
    };
  }, [resetTimeline]);

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-400">
        <p>프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleStartChoice = (mode: StartMode, payload?: StartAiPayload) => {
    const patch: Parameters<typeof updateProject>[1] = { initialized: true };
    if (payload?.productName && project.name === "새 프로젝트") {
      patch.name = payload.productName;
    }

    // AI 선택 시 실제 TTS 오디오 + Whisper 자막으로 타임라인 구성
    if (mode === "ai" && payload) {
      const timeline = buildTimelineFromAudio({
        audio: payload.audio,
        subtitles: payload.subtitles,
        referenceVideoNames: payload.referenceVideoNames,
      });
      loadTimeline(project.id, timeline);
      patch.durationSeconds = Math.ceil(timeline.durationSeconds);
    }

    updateProject(project.id, patch);
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
