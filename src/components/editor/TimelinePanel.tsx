"use client";

const TRACKS = [
  { id: "video", label: "영상", color: "bg-blue-500/20 border-blue-500/40" },
  { id: "image", label: "이미지", color: "bg-purple-500/20 border-purple-500/40" },
  { id: "audio", label: "오디오", color: "bg-green-500/20 border-green-500/40" },
  { id: "subtitle", label: "자막", color: "bg-yellow-500/20 border-yellow-500/40" },
];

export default function TimelinePanel() {
  return (
    <section className="flex h-64 shrink-0 flex-col border-t border-border bg-panel">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-xs text-gray-400">
        <span className="font-semibold uppercase tracking-wider">타임라인</span>
        <div className="flex items-center gap-2">
          <button className="rounded px-2 py-1 hover:bg-panelAlt">확대 −</button>
          <button className="rounded px-2 py-1 hover:bg-panelAlt">확대 +</button>
        </div>
      </div>

      {/* 눈금자 */}
      <div className="flex h-6 shrink-0 border-b border-border bg-panelAlt">
        <div className="w-24 shrink-0 border-r border-border" />
        <div className="flex flex-1 items-end text-[10px] text-gray-500">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-border/40 pl-1 pb-1 first:border-l-0">
              {i}s
            </div>
          ))}
        </div>
      </div>

      {/* 트랙들 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {TRACKS.map((track) => (
          <div key={track.id} className="flex h-12 border-b border-border/50">
            <div className="flex w-24 shrink-0 items-center border-r border-border bg-panelAlt px-3 text-xs text-gray-300">
              {track.label}
            </div>
            <div className="relative flex-1 bg-[#1a1c21]">
              {/* Phase 6에서 클립 렌더링 */}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
