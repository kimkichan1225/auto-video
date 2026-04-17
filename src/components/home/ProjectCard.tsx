"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  updatedAt: string;
}

// 메인 페이지 프로젝트 카드 + 삭제 버튼
export default function ProjectCard({ id, name, updatedAt }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    // Link 내부에 있으므로 기본 내비게이션 차단
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${name}" 프로젝트를 삭제하시겠어요?\n업로드된 파일과 렌더 결과도 모두 삭제됩니다.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "삭제 실패");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link
      href={`/editor/${id}`}
      className="group relative block rounded-lg border border-border bg-panel p-4 transition hover:border-accent"
    >
      <div className="truncate pr-8 text-base font-medium">{name}</div>
      <div className="mt-1 text-xs text-gray-400">수정: {formatDateTime(updatedAt)}</div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="삭제"
        aria-label="프로젝트 삭제"
        className="absolute right-2 top-2 rounded-md p-1.5 text-gray-500 opacity-0 transition hover:bg-red-950/40 hover:text-red-300 group-hover:opacity-100 disabled:opacity-50"
      >
        {deleting ? (
          <span className="text-xs">...</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        )}
      </button>
    </Link>
  );
}
