"use client";

import type { Project } from "@/types/project";
import { formatDate, formatDuration } from "@/lib/utils";

interface Props {
  project: Project;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function ProjectCard({ project, onDelete, onOpen }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) {
      onDelete(project.id);
    }
  };

  return (
    <div
      onClick={() => onOpen(project.id)}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-panel transition hover:border-accent"
    >
      {/* 썸네일 영역 */}
      <div className="relative aspect-video w-full bg-panelAlt">
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-600">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m10 8 6 4-6 4V8Z" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* 영상 길이 뱃지 */}
        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(project.durationSeconds)}
        </div>

        {/* 삭제 버튼 (hover 시 노출) */}
        <button
          onClick={handleDelete}
          className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-gray-300 opacity-0 transition hover:bg-red-500/80 hover:text-white group-hover:opacity-100"
          aria-label="삭제"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* 메타 정보 */}
      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
        <div className="mt-1.5 flex justify-between text-xs text-gray-500">
          <span>생성 {formatDate(project.createdAt)}</span>
          <span>수정 {formatDate(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
