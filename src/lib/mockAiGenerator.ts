// AI 생성 결과로부터 타임라인 구성
// - audio: 문단별 TTS 오디오 클립 (각 오디오 한 덩어리)
// - subtitles: Whisper로 단어 타이밍 받아 짧은 줄로 묶은 자막 (절대 시간)
// - 영상 매칭은 Phase 10에서 Gemini로 교체 (현재는 참고 영상 순환 배치)

import type { Clip, Timeline } from "@/types/timeline";
import { emptyTimeline } from "@/types/timeline";

interface AudioSegment {
  text: string;
  audioUrl: string;
  audioDuration: number;
  voiceId: string;
}

interface SubtitleSegment {
  text: string;
  start: number; // 타임라인 전체 기준 절대 시간
  end: number;
}

export interface BuildTimelineInput {
  audio: AudioSegment[];
  subtitles: SubtitleSegment[];
  referenceVideoNames: string[];
}

export function buildTimelineFromAudio(input: BuildTimelineInput): Timeline {
  const timeline = emptyTimeline();
  if (input.audio.length === 0) return timeline;

  const clips: Clip[] = [];
  let cursor = 0;
  const hasVideos = input.referenceVideoNames.length > 0;
  const now = Date.now();

  // 1) 오디오 + 영상(참고) 트랙 — 문단 단위
  for (let i = 0; i < input.audio.length; i++) {
    const seg = input.audio[i];
    const duration =
      seg.audioDuration > 0.1
        ? seg.audioDuration
        : Math.max(1.5, Math.round((seg.text.length / 4.5) * 10) / 10);

    clips.push({
      id: `audio-${i}-${now}`,
      type: "audio",
      trackId: "audio",
      start: cursor,
      duration,
      sourceUrl: seg.audioUrl,
      sourceName: `음성 ${i + 1}`,
      script: seg.text,
      voiceId: seg.voiceId,
    });

    if (hasVideos) {
      const videoName =
        input.referenceVideoNames[i % input.referenceVideoNames.length];
      clips.push({
        id: `video-${i}-${now}`,
        type: "video",
        trackId: "video",
        start: cursor,
        duration,
        sourceUrl: null,
        sourceName: videoName,
        trimStart: 0,
      });
    }

    cursor += duration;
  }

  // 2) 자막 트랙 — 짧은 줄 단위
  for (let i = 0; i < input.subtitles.length; i++) {
    const sub = input.subtitles[i];
    const duration = Math.max(0.2, sub.end - sub.start);
    clips.push({
      id: `subtitle-${i}-${now}`,
      type: "subtitle",
      trackId: "subtitle",
      start: sub.start,
      duration,
      text: sub.text,
    });
  }

  const byTrack = new Map<string, Clip[]>();
  for (const c of clips) {
    const arr = byTrack.get(c.trackId) ?? [];
    arr.push(c);
    byTrack.set(c.trackId, arr);
  }
  timeline.tracks = timeline.tracks.map((t) => ({
    ...t,
    clips: byTrack.get(t.id) ?? [],
  }));
  timeline.durationSeconds = cursor;
  return timeline;
}
