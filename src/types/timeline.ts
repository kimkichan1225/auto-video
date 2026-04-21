// 타임라인 데이터 모델 — 프로젝트별 클립/트랙 구조
// 시간 단위: 초(seconds). 나중에 Remotion 렌더로 넘길 때 fps 곱해서 frame 변환

export type ClipType = "video" | "image" | "audio" | "subtitle";

export type TrackId = "video" | "image" | "audio" | "subtitle";

// 모든 클립이 공유하는 공통 필드
interface BaseClip {
  id: string;
  trackId: TrackId;
  start: number; // 타임라인 상 시작 (초)
  duration: number; // 지속 시간 (초)
}

export interface VideoClip extends BaseClip {
  type: "video";
  trackId: "video";
  sourceUrl: string | null; // 원본 영상 경로 (목업은 null)
  sourceName: string; // 원본 파일명 (표시용)
  trimStart?: number; // 원본 영상 내에서의 시작 오프셋 (초)
}

export interface ImageClip extends BaseClip {
  type: "image";
  trackId: "image";
  sourceUrl: string | null;
  sourceName: string;
}

export interface AudioClip extends BaseClip {
  type: "audio";
  trackId: "audio";
  sourceUrl: string | null;
  sourceName: string;
  // TTS로 만든 경우 원본 스크립트 저장 (재생성 시 활용)
  script?: string;
  voiceId?: string;
}

export interface SubtitleClip extends BaseClip {
  type: "subtitle";
  trackId: "subtitle";
  text: string;
}

export type Clip = VideoClip | ImageClip | AudioClip | SubtitleClip;

export interface Track {
  id: TrackId;
  label: string;
  clips: Clip[];
}

export interface Timeline {
  tracks: Track[];
  durationSeconds: number; // 타임라인 전체 길이 (표시/확장 기준)
}

// 빈 타임라인
export function emptyTimeline(): Timeline {
  return {
    durationSeconds: 0,
    tracks: [
      { id: "video", label: "영상", clips: [] },
      { id: "image", label: "이미지", clips: [] },
      { id: "audio", label: "오디오", clips: [] },
      { id: "subtitle", label: "자막", clips: [] },
    ],
  };
}
