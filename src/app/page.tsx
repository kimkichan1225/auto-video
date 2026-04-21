"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "@/components/home/ProjectCard";
import NewProjectModal from "@/components/home/NewProjectModal";
import { useProjectsStore } from "@/store/projectsStore";
import type { AspectRatio, Project } from "@/types/project";

export default function HomePage() {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);
  const addProject = useProjectsStore((s) => s.addProject);
  const removeProject = useProjectsStore((s) => s.removeProject);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = (payload: { name: string; aspectRatio: AspectRatio }) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: payload.name,
      aspectRatio: payload.aspectRatio,
      thumbnailUrl: null,
      durationSeconds: 0,
      initialized: false,
      createdAt: now,
      updatedAt: now,
    };
    addProject(newProject);
    setModalOpen(false);
    router.push(`/editor/${newProject.id}`);
  };

  const handleOpen = (id: string) => {
    router.push(`/editor/${id}`);
  };

  return (
    <main className="h-full overflow-y-auto">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-border bg-[#16181d]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold text-white">Booggum Tool</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white transition hover:bg-accentHover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            새 프로젝트
          </button>
        </div>
      </header>

      {/* 본문 */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        {projects.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <p className="text-gray-400">아직 프로젝트가 없습니다.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accentHover"
            >
              새 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={removeProject}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </section>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}
