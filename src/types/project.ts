// 영상 편집기 핵심 타입 정의
// 타임라인은 멀티트랙 구조이며, 모든 시간 단위는 "프레임"으로 관리한다
// (Remotion과 일관되게 다루기 위함. 초 = 프레임 / fps)

export type AssetType = "image" | "video" | "audio";

export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  name: string;
  url: string; // 공개 URL 또는 signed URL
  storagePath: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

export type TrackType = "video" | "image" | "audio" | "text";

export type ClipKind = "image" | "video" | "audio" | "text";

// 공통 변형 속성 (이미지/영상/텍스트)
export interface Transform {
  x: number; // 캔버스 중심 기준 px 오프셋
  y: number;
  scale: number; // 1 = 원본
  rotation: number; // 도(degree)
  opacity: number; // 0~1
}

export interface ClipAnimation {
  in?: "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown";
  out?: "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown";
  kenBurns?: "none" | "zoomIn" | "zoomOut" | "panLeft" | "panRight";
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  align: "left" | "center" | "right";
}

interface BaseClip {
  id: string;
  start: number; // 시작 프레임
  duration: number; // 길이 프레임
}

export interface ImageClip extends BaseClip {
  kind: "image";
  assetId: string;
  transform: Transform;
  animation?: ClipAnimation;
}

export interface VideoClip extends BaseClip {
  kind: "video";
  assetId: string;
  transform: Transform;
  // 원본 영상에서 잘라낼 구간 (초 단위)
  trimStartSeconds: number;
  trimEndSeconds: number;
  volume: number; // 0~1
  animation?: ClipAnimation;
}

export interface AudioClip extends BaseClip {
  kind: "audio";
  assetId: string;
  volume: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export interface TextClip extends BaseClip {
  kind: "text";
  text: string;
  style: TextStyle;
  transform: Transform;
  animation?: ClipAnimation;
}

export type Clip = ImageClip | VideoClip | AudioClip | TextClip;

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  muted?: boolean;
  hidden?: boolean;
  clips: Clip[];
}

export interface ProjectMeta {
  fps: number;
  width: number;
  height: number;
  durationFrames: number;
}

export interface Project {
  id: string;
  name: string;
  meta: ProjectMeta;
  tracks: Track[];
  assets: Asset[];
  createdAt?: string;
  updatedAt?: string;
}

// Remotion Composition에 넘길 Props
export interface CompositionProps {
  tracks: Track[];
  assets: Asset[];
  meta: ProjectMeta;
}
