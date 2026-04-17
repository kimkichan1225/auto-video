"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { supabaseBrowser } from "@/lib/supabase";
import type { Asset, AudioClip, Clip, Track } from "@/types/project";
import { uid } from "@/lib/utils";

// 좌측 에셋 패널
// - 업로드 (이미지/영상/오디오)
// - TTS 생성 (Typecast)
// - 자동 자막 (Whisper)
// - 에셋을 타임라인에 추가
export default function AssetPanel() {
  const project = useEditorStore((s) => s.project);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addTrack = useEditorStore((s) => s.addTrack);
  const addClip = useEditorStore((s) => s.addClip);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"ai" | "media" | "tts" | "subtitle">("ai");

  if (!project) return null;

  // 브라우저에서 Supabase Storage로 직접 업로드 (Vercel 4.5MB 요청 바디 제한 우회)
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!project) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = supabaseBrowser();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${project.id}/${Date.now()}_${safeName}`;

      // 1) Storage 업로드
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      // 2) assets 테이블에 메타 insert
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : null;
      if (!type) throw new Error("지원하지 않는 파일 형식");

      const { data: asset, error: dbErr } = await supabase
        .from("assets")
        .insert({
          project_id: project.id,
          type,
          name: file.name,
          storage_path: path,
        })
        .select("*")
        .single();
      if (dbErr || !asset) throw dbErr ?? new Error("DB 저장 실패");

      // 3) 공개 URL
      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(path);

      addAsset({
        id: asset.id,
        projectId: asset.project_id,
        type: asset.type,
        name: asset.name,
        storagePath: asset.storage_path,
        url: urlData.publicUrl,
      });
    } catch (err: any) {
      alert(`업로드 실패: ${err.message ?? err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // 에셋을 적절한 트랙에 삽입 (현재 플레이헤드 위치 기준)
  function handleAddToTimeline(asset: Asset) {
    if (!project) return;
    const fps = project.meta.fps;
    const defaultImageDuration = fps * 3; // 3초
    const start = useEditorStore.getState().currentFrame;

    const trackType: Track["type"] =
      asset.type === "image" ? "image" : asset.type === "video" ? "video" : "audio";

    // 해당 타입 트랙이 없으면 새로 생성
    let track = project.tracks.find((t) => t.type === trackType);
    let trackId = track?.id;
    if (!trackId) trackId = addTrack(trackType);

    let clip: Clip;
    if (asset.type === "image") {
      clip = {
        id: uid(),
        kind: "image",
        assetId: asset.id,
        start,
        duration: defaultImageDuration,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
        animation: { in: "fade", out: "fade", kenBurns: "none" },
      };
    } else if (asset.type === "video") {
      const dur = Math.round((asset.durationSeconds ?? 5) * fps);
      clip = {
        id: uid(),
        kind: "video",
        assetId: asset.id,
        start,
        duration: dur,
        trimStartSeconds: 0,
        trimEndSeconds: asset.durationSeconds ?? 5,
        volume: 1,
        transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      };
    } else {
      const dur = Math.round((asset.durationSeconds ?? 5) * fps);
      clip = {
        id: uid(),
        kind: "audio",
        assetId: asset.id,
        start,
        duration: dur,
        volume: 1,
      };
    }

    addClip(trackId, clip);
  }

  return (
    <aside className="flex w-72 flex-col border-r border-border bg-panel">
      <div className="flex border-b border-border text-xs">
        {(["ai", "media", "tts", "subtitle"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 ${tab === t ? "border-b-2 border-accent text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            {t === "ai"
              ? "AI 제작"
              : t === "media"
                ? "미디어"
                : t === "tts"
                  ? "TTS"
                  : "자막"}
          </button>
        ))}
      </div>

      {tab === "ai" && <AIProducePanel />}

      {tab === "media" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-md border border-dashed border-border px-3 py-4 text-xs text-gray-300 hover:border-accent disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "+ 파일 업로드 (이미지/영상/오디오)"}
            </button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {project.assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAddToTimeline(asset)}
                  title={`${asset.name} — 클릭하여 타임라인에 추가`}
                  className="group flex flex-col overflow-hidden rounded-md border border-border bg-panelAlt hover:border-accent"
                >
                  <div className="flex aspect-video items-center justify-center bg-black/40">
                    {asset.type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {asset.type === "video" && (
                      <span className="text-[10px] text-gray-400">🎬 VIDEO</span>
                    )}
                    {asset.type === "audio" && (
                      <span className="text-[10px] text-gray-400">🎵 AUDIO</span>
                    )}
                  </div>
                  <div className="truncate px-2 py-1 text-[11px] text-gray-300">
                    {asset.name}
                  </div>
                </button>
              ))}
            </div>
            {project.assets.length === 0 && (
              <div className="mt-6 text-center text-xs text-gray-500">
                업로드된 파일이 없습니다
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "tts" && <TTSPanel />}
      {tab === "subtitle" && <SubtitlePanel />}
    </aside>
  );
}

// ----- TTS 패널 -----
function TTSPanel() {
  const project = useEditorStore((s) => s.project);
  const addAsset = useEditorStore((s) => s.addAsset);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!project || !script.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, text: script }),
      });
      const data = await res.json();
      if (data.asset) addAsset(data.asset as Asset);
      else alert(data.message ?? "TTS 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-xs">
      <label className="text-gray-400">대본</label>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        rows={10}
        placeholder="여기에 대본을 입력하세요..."
        className="flex-1 resize-none rounded-md border border-border bg-panelAlt p-2 text-sm focus:border-accent focus:outline-none"
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !script.trim()}
        className="rounded-md bg-accent px-3 py-2 text-sm hover:bg-accentHover disabled:opacity-50"
      >
        {loading ? "생성 중..." : "TTS 오디오 생성 (Typecast)"}
      </button>
    </div>
  );
}

// ----- AI 원클릭 제작 패널 -----
// 상품명 → GPT 대본 → Typecast TTS → Whisper 자막
function AIProducePanel() {
  const project = useEditorStore((s) => s.project);
  const addAsset = useEditorStore((s) => s.addAsset);
  const addTrack = useEditorStore((s) => s.addTrack);
  const addClip = useEditorStore((s) => s.addClip);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<"friendly" | "professional" | "energetic" | "calm">(
    "friendly",
  );
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [script, setScript] = useState("");
  const [autoMatch, setAutoMatch] = useState(true);
  const [stage, setStage] = useState<
    "idle" | "script" | "tts" | "transcribe" | "matching" | "done"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const videoAssets = project?.assets.filter((a) => a.type === "video") ?? [];
  const busy =
    stage === "script" ||
    stage === "tts" ||
    stage === "transcribe" ||
    stage === "matching";

  async function handleGenerateScript() {
    if (!productName.trim()) return;
    setError(null);
    setStage("script");
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, description, tone, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "대본 생성 실패");
      setScript(data.script);
      setStage("idle");
    } catch (e: any) {
      setError(e.message);
      setStage("idle");
    }
  }

  async function handleProduce() {
    if (!project || !script.trim()) return;
    setError(null);

    try {
      // 1) Typecast TTS
      setStage("tts");
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, text: script }),
      });
      const ttsData = await ttsRes.json();
      if (!ttsRes.ok) throw new Error(ttsData.message ?? "TTS 실패");
      const audioAsset = ttsData.asset as Asset;
      addAsset(audioAsset);

      // 2) 오디오를 타임라인 0프레임 위치에 자동 삽입
      let audioTrack = project.tracks.find((t) => t.type === "audio");
      const audioTrackId = audioTrack?.id ?? addTrack("audio");
      const fps = project.meta.fps;
      const durationFrames = Math.round((audioAsset.durationSeconds ?? 30) * fps);
      const clip: AudioClip = {
        id: uid(),
        kind: "audio",
        assetId: audioAsset.id,
        start: 0,
        duration: durationFrames,
        volume: 1,
      };
      addClip(audioTrackId, clip);

      // 2.5) 타임라인을 DB에 즉시 저장 (그래야 뒤이은 transcribe가
      //      오디오 클립이 포함된 최신 timeline을 읽어서 자막만 덧붙이고 저장할 수 있다.
      //      저장 없이 transcribe를 호출하면 서버가 옛 timeline을 덮어써서 오디오 클립이 사라짐)
      const latest = useEditorStore.getState().project;
      if (latest) {
        await fetch(`/api/projects/${latest.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeline: { tracks: latest.tracks } }),
        });
      }

      // 3) Whisper 자막 생성 (서버에서 timeline에 직접 추가 + 오디오 길이 보정)
      setStage("transcribe");
      const trRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, assetId: audioAsset.id }),
      });
      const trData = await trRes.json();
      if (!trRes.ok) throw new Error(trData.message ?? "자막 생성 실패");

      // 4) 참고 영상 자동 매칭 (선택)
      const latestVideos =
        useEditorStore.getState().project?.assets.filter((a) => a.type === "video") ??
        [];
      if (autoMatch && latestVideos.length > 0) {
        setStage("matching");
        const mvRes = await fetch("/api/match-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            videoAssetIds: latestVideos.map((a) => a.id),
          }),
        });
        const mvData = await mvRes.json();
        if (!mvRes.ok) {
          // 매칭 실패해도 자막/오디오는 이미 생성됐으므로 에러만 띄우고 reload
          console.warn("영상 매칭 실패:", mvData);
          setError(`영상 매칭 실패 (자막/오디오는 정상): ${mvData.message}`);
        } else if (mvData.fallback) {
          // Gemini는 실패했지만 순차 분배로 배치 완료
          setError(
            "ℹ️ Gemini 할당량 초과로 순차 분배 fallback 사용 (영상이 자막 순서대로 배치됨)",
          );
        }
      }

      setStage("done");
      // 서버에서 타임라인이 갱신되었으므로 새로고침으로 반영
      setTimeout(() => location.reload(), 800);
    } catch (e: any) {
      setError(e.message);
      setStage("idle");
    }
  }

  return (
    <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 text-xs [&>*]:shrink-0">
      <label className="text-gray-400">상품명</label>
      <input
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="예: 무선 블루투스 이어폰"
        className="rounded-md border border-border bg-panelAlt p-2 text-sm focus:border-accent focus:outline-none"
      />

      <label className="text-gray-400">추가 설명 (선택)</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="핵심 특징, 타겟 고객 등"
        className="min-h-[60px] resize-none rounded-md border border-border bg-panelAlt p-2 text-sm focus:border-accent focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-gray-400">톤</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
            className="w-full rounded-md border border-border bg-panelAlt p-2 focus:border-accent focus:outline-none"
          >
            <option value="friendly">친근함</option>
            <option value="professional">전문적</option>
            <option value="energetic">에너제틱</option>
            <option value="calm">차분함</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-gray-400">길이</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as any)}
            className="w-full rounded-md border border-border bg-panelAlt p-2 focus:border-accent focus:outline-none"
          >
            <option value="short">15초</option>
            <option value="medium">30초</option>
            <option value="long">60초</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerateScript}
        disabled={busy || !productName.trim()}
        className="rounded-md border border-accent bg-accent/10 px-3 py-2 font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
      >
        {stage === "script" ? "대본 생성 중..." : "1️⃣ AI 대본 생성"}
      </button>

      {script && (
        <>
          <label className="mt-2 text-gray-400">대본 (수정 가능)</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            className="min-h-[180px] resize-y rounded-md border border-border bg-panelAlt p-2 text-sm leading-relaxed focus:border-accent focus:outline-none"
          />
          {/* 참고 영상 영역 */}
          <div className="mt-2 rounded-md border border-border bg-panelAlt p-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
                className="accent-accent"
              />
              <span className="font-medium text-gray-200">참고 영상 자동 매칭</span>
            </label>
            <p className="mt-1 text-[11px] text-gray-500">
              미디어 탭에 업로드된 영상을 Gemini가 분석해 자막 의미에 맞는 구간으로
              자동 배치합니다.
            </p>
            {autoMatch && (
              <div className="mt-2">
                {videoAssets.length === 0 ? (
                  <div className="rounded border border-dashed border-border p-2 text-center text-[11px] text-gray-500">
                    📼 참고 영상이 없습니다. 미디어 탭에서 영상을 업로드하세요.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {videoAssets.map((v) => (
                      <li
                        key={v.id}
                        className="truncate rounded bg-black/30 px-2 py-1 text-[11px] text-gray-300"
                      >
                        🎬 {v.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleProduce}
            disabled={busy || !script.trim()}
            className="rounded-md bg-accent px-3 py-2 font-medium text-white hover:bg-accentHover disabled:opacity-50"
          >
            {stage === "tts"
              ? "TTS 생성 중..."
              : stage === "transcribe"
                ? "자막 생성 중..."
                : stage === "matching"
                  ? "영상 매칭 중... (Gemini 분석)"
                  : stage === "done"
                    ? "완료! 페이지 새로고침 중..."
                    : autoMatch && videoAssets.length > 0
                      ? "2️⃣ TTS + 자막 + 영상 자동 편집"
                      : "2️⃣ TTS + 자막 자동 생성"}
          </button>
        </>
      )}

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/30 p-2 text-[11px] text-red-300">
          {error}
        </div>
      )}

      <div className="mt-2 rounded-md border border-dashed border-border p-2 text-[11px] text-gray-500">
        💡 대본 생성 후 검토/수정한 다음 2단계를 누르면 TTS 오디오와 자막이 자동으로 타임라인에 추가됩니다.
      </div>
    </div>
  );
}

// ----- 자막 패널 -----
function SubtitlePanel() {
  const project = useEditorStore((s) => s.project);
  const [loading, setLoading] = useState(false);

  const audioAssets = project?.assets.filter((a) => a.type === "audio") ?? [];

  async function handleTranscribe(assetId: string) {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, assetId }),
      });
      const data = await res.json();
      if (data.ok) {
        // 자막 클립이 서버에서 생성되었다면 새로고침으로 반영
        // (간편 구현 — 추후 store 직접 업데이트로 개선)
        location.reload();
      } else {
        alert(data.message ?? "자막 생성 실패");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-xs">
      <div className="text-gray-400">오디오를 선택하면 Whisper로 자동 자막을 생성합니다.</div>
      {audioAssets.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-4 text-center text-gray-500">
          오디오 파일이 없습니다. TTS 탭에서 생성하거나 미디어 탭에서 업로드하세요.
        </div>
      )}
      {audioAssets.map((a) => (
        <button
          key={a.id}
          onClick={() => handleTranscribe(a.id)}
          disabled={loading}
          className="flex items-center justify-between rounded-md border border-border bg-panelAlt px-3 py-2 text-left hover:border-accent disabled:opacity-50"
        >
          <span className="truncate">{a.name}</span>
          <span className="text-[10px] text-accent">자막 생성</span>
        </button>
      ))}
    </div>
  );
}
