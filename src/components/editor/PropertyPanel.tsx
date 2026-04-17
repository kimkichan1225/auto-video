"use client";

import { useEditorStore, useSelectedClip } from "@/store/editorStore";
import type { Clip } from "@/types/project";

// 우측 속성 패널 — 선택된 클립의 속성 편집
export default function PropertyPanel() {
  const clip = useSelectedClip();
  const updateClip = useEditorStore((s) => s.updateClip);
  const removeClip = useEditorStore((s) => s.removeClip);

  return (
    <aside className="w-72 border-l border-border bg-panel">
      <div className="border-b border-border p-3 text-xs font-semibold text-gray-300">
        속성
      </div>
      {!clip ? (
        <div className="p-4 text-xs text-gray-500">
          클립을 선택하면 여기에 속성이 표시됩니다.
        </div>
      ) : (
        <div className="scrollbar-thin h-full overflow-y-auto p-3 text-xs">
          <Row label="종류" value={clip.kind} readOnly />
          <Row
            label="시작 프레임"
            type="number"
            value={clip.start}
            onChange={(v) => updateClip(clip.id, { start: Number(v) } as Partial<Clip>)}
          />
          <Row
            label="길이 (프레임)"
            type="number"
            value={clip.duration}
            onChange={(v) =>
              updateClip(clip.id, { duration: Number(v) } as Partial<Clip>)
            }
          />

          {"transform" in clip && clip.transform && (
            <>
              <Divider label="변형" />
              <Row
                label="X"
                type="number"
                value={clip.transform.x}
                onChange={(v) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, x: Number(v) },
                  } as Partial<Clip>)
                }
              />
              <Row
                label="Y"
                type="number"
                value={clip.transform.y}
                onChange={(v) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, y: Number(v) },
                  } as Partial<Clip>)
                }
              />
              <Row
                label="스케일"
                type="number"
                step={0.1}
                value={clip.transform.scale}
                onChange={(v) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, scale: Number(v) },
                  } as Partial<Clip>)
                }
              />
              <Row
                label="회전"
                type="number"
                value={clip.transform.rotation}
                onChange={(v) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, rotation: Number(v) },
                  } as Partial<Clip>)
                }
              />
              <Row
                label="투명도"
                type="number"
                step={0.1}
                value={clip.transform.opacity}
                onChange={(v) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, opacity: Number(v) },
                  } as Partial<Clip>)
                }
              />
            </>
          )}

          {clip.kind === "text" && (
            <>
              <Divider label="텍스트" />
              <div className="mb-2">
                <label className="mb-1 block text-gray-400">내용</label>
                <textarea
                  value={clip.text}
                  onChange={(e) => updateClip(clip.id, { text: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-border bg-panelAlt p-2 focus:border-accent focus:outline-none"
                />
              </div>
              <Row
                label="폰트 크기"
                type="number"
                value={clip.style.fontSize}
                onChange={(v) =>
                  updateClip(clip.id, {
                    style: { ...clip.style, fontSize: Number(v) },
                  } as Partial<Clip>)
                }
              />
              <Row
                label="색상"
                type="color"
                value={clip.style.color}
                onChange={(v) =>
                  updateClip(clip.id, {
                    style: { ...clip.style, color: String(v) },
                  } as Partial<Clip>)
                }
              />
            </>
          )}

          {clip.kind === "image" && (
            <>
              <Divider label="애니메이션" />
              <SelectRow
                label="Ken Burns"
                value={clip.animation?.kenBurns ?? "none"}
                options={["none", "zoomIn", "zoomOut", "panLeft", "panRight"]}
                onChange={(v) =>
                  updateClip(clip.id, {
                    animation: { ...clip.animation, kenBurns: v as any },
                  } as Partial<Clip>)
                }
              />
              <SelectRow
                label="In"
                value={clip.animation?.in ?? "none"}
                options={["none", "fade", "slideLeft", "slideRight", "slideUp", "slideDown"]}
                onChange={(v) =>
                  updateClip(clip.id, {
                    animation: { ...clip.animation, in: v as any },
                  } as Partial<Clip>)
                }
              />
              <SelectRow
                label="Out"
                value={clip.animation?.out ?? "none"}
                options={["none", "fade", "slideLeft", "slideRight", "slideUp", "slideDown"]}
                onChange={(v) =>
                  updateClip(clip.id, {
                    animation: { ...clip.animation, out: v as any },
                  } as Partial<Clip>)
                }
              />
            </>
          )}

          {(clip.kind === "video" || clip.kind === "audio") && (
            <>
              <Divider label="오디오" />
              <Row
                label="볼륨"
                type="number"
                step={0.1}
                value={clip.volume}
                onChange={(v) =>
                  updateClip(clip.id, { volume: Number(v) } as Partial<Clip>)
                }
              />
            </>
          )}

          <button
            onClick={() => removeClip(clip.id)}
            className="mt-4 w-full rounded-md border border-red-900 bg-red-950/30 py-2 text-xs text-red-300 hover:bg-red-950/50"
          >
            클립 삭제
          </button>
        </div>
      )}
    </aside>
  );
}

interface RowProps {
  label: string;
  value: string | number;
  type?: string;
  step?: number;
  readOnly?: boolean;
  onChange?: (v: string | number) => void;
}

function Row({ label, value, type = "text", step, readOnly, onChange }: RowProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <label className="w-20 shrink-0 text-gray-400">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded border border-border bg-panelAlt px-2 py-1 focus:border-accent focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <label className="w-20 shrink-0 text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-border bg-panelAlt px-2 py-1 focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500">
      <div className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
