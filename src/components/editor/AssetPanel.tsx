"use client";

export default function AssetPanel() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        에셋
      </div>

      <div className="flex gap-1 border-b border-border p-2 text-xs">
        <button className="rounded bg-accent px-2 py-1 text-white">전체</button>
        <button className="rounded px-2 py-1 text-gray-400 hover:bg-panelAlt">이미지</button>
        <button className="rounded px-2 py-1 text-gray-400 hover:bg-panelAlt">영상</button>
        <button className="rounded px-2 py-1 text-gray-400 hover:bg-panelAlt">오디오</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="flex h-full flex-col items-center justify-center text-center text-xs text-gray-500">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>파일을 여기로 드래그하거나</p>
          <button className="mt-2 rounded bg-panelAlt px-3 py-1 text-gray-300 hover:bg-border">
            업로드
          </button>
        </div>
      </div>
    </aside>
  );
}
