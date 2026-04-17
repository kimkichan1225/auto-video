import { Audio } from "remotion";
import type { Asset, AudioClip } from "@/types/project";

interface Props {
  clip: AudioClip;
  asset?: Asset;
}

export function AudioClipView({ clip, asset }: Props) {
  if (!asset) return null;
  return <Audio src={asset.url} volume={clip.volume} />;
}
