import {
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

// Gemini 2.0 Flash로 참고 영상을 분석하고 자막 라인별로 가장 어울리는 구간을 매칭한다.
// 영상은 Gemini Files API에 업로드한 뒤 fileUri로 참조한다.

const apiKey = process.env.GEMINI_API_KEY!;
// 기본 모델: gemini-2.0-flash (영상 이해 성능 ↑). 무료 할당량 문제 시 env로 교체
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// 로컬 파일을 Gemini Files API에 업로드하고 ACTIVE 상태가 될 때까지 대기
export async function uploadVideoToGemini(
  localPath: string,
  mimeType: string,
  displayName: string,
): Promise<{ fileUri: string; mimeType: string; name: string }> {
  if (!apiKey) throw new Error("GEMINI_API_KEY가 .env.local에 없습니다.");

  const upload = await fileManager.uploadFile(localPath, {
    mimeType,
    displayName,
  });

  // Gemini는 영상을 전처리해야 "ACTIVE" 상태가 된다. 그전에 쓰면 400 에러.
  let file = await fileManager.getFile(upload.file.name);
  let elapsed = 0;
  while (file.state === FileState.PROCESSING) {
    if (elapsed > 120) throw new Error("Gemini 영상 처리 타임아웃");
    await new Promise((r) => setTimeout(r, 3000));
    elapsed += 3;
    file = await fileManager.getFile(upload.file.name);
  }
  if (file.state !== FileState.ACTIVE) {
    throw new Error(`Gemini 영상 처리 실패: state=${file.state}`);
  }
  return { fileUri: file.uri, mimeType, name: file.name };
}

// 이후 정리를 위한 파일 삭제
export async function deleteGeminiFile(name: string) {
  try {
    await fileManager.deleteFile(name);
  } catch {
    // 파일은 48시간 후 자동 삭제되므로 실패해도 무시
  }
}

export interface SubtitleForMatch {
  index: number;
  startSec: number;
  endSec: number;
  text: string;
}

export interface VideoRef {
  fileUri: string;
  mimeType: string;
  displayName: string; // 프롬프트 안에서 사람이 읽기 쉬운 라벨
}

export interface MatchResult {
  subtitleIndex: number;
  videoIndex: number;
  startSec: number;
  endSec: number;
}

// 여러 영상 + 자막 목록 → 각 자막에 매칭되는 영상 구간 반환
export async function matchSubtitlesToVideos(
  videos: VideoRef[],
  subtitles: SubtitleForMatch[],
): Promise<MatchResult[]> {
  if (!videos.length) return [];
  if (!subtitles.length) return [];

  const subtitleLines = subtitles
    .map(
      (s) =>
        `[${s.index}] ${s.startSec.toFixed(2)}s ~ ${s.endSec.toFixed(2)}s ` +
        `(길이 ${(s.endSec - s.startSec).toFixed(2)}s): "${s.text}"`,
    )
    .join("\n");

  const videoDescriptions = videos
    .map((v, i) => `videoIndex ${i}: ${v.displayName}`)
    .join("\n");

  const prompt = `당신은 숏폼 영상 편집 AI입니다. 주어진 참고 영상들을 모두 분석하고, 자막 목록을 보고 각 자막에 가장 어울리는 영상 구간을 한 개씩 선택해주세요.

참고 영상 목록:
${videoDescriptions}

자막 목록:
${subtitleLines}

규칙:
1. 각 자막마다 반드시 하나의 매칭을 반환 (subtitleIndex 기준 0부터 끝까지 모두).
2. 선택한 영상 구간의 길이(endSec - startSec)는 자막 길이와 "정확히 같게" 맞춘다.
3. 자막 의미와 시각적으로 가장 잘 맞는 장면을 선택한다.
4. 가능하면 서로 다른 영상을 고르게 사용하고, 동일 영상이라면 다른 구간을 선택한다.
5. 영상의 실제 러닝타임을 벗어나지 않도록 startSec, endSec를 설정한다.
6. videoIndex는 0부터 시작하며, 위 참고 영상 목록 순서를 따른다.

JSON 배열만 반환하세요.`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            subtitleIndex: { type: SchemaType.INTEGER },
            videoIndex: { type: SchemaType.INTEGER },
            startSec: { type: SchemaType.NUMBER },
            endSec: { type: SchemaType.NUMBER },
          },
          required: ["subtitleIndex", "videoIndex", "startSec", "endSec"],
        },
      },
    },
  });

  const parts: any[] = videos.map((v) => ({
    fileData: { fileUri: v.fileUri, mimeType: v.mimeType },
  }));
  parts.push({ text: prompt });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  const raw = result.response.text();
  let parsed: MatchResult[];
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("[Gemini] JSON 파싱 실패:", raw);
    throw new Error("Gemini 응답 JSON 파싱 실패");
  }
  return parsed;
}
