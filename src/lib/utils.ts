import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function framesToSeconds(frames: number, fps: number) {
  return frames / fps;
}

export function secondsToFrames(seconds: number, fps: number) {
  return Math.round(seconds * fps);
}

export function formatTimecode(frames: number, fps: number) {
  const totalSec = frames / fps;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const f = Math.floor(frames % fps);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(f).padStart(2, "0")}`;
}

export function uid() {
  return crypto.randomUUID();
}

// 서버/클라이언트 양쪽에서 동일한 결과를 보장하는 날짜 포맷터
// toLocaleString은 Node ICU와 브라우저 간 미묘한 차이(PM vs 오후)로 hydration 에러를 유발
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
