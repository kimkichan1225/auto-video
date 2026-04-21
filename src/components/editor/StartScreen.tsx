"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { generateMockScript } from "@/lib/mockScriptGenerator";
import { mockVoices } from "@/lib/mockVoices";
import ChooseStep from "./start/ChooseStep";
import ProductInputStep from "./start/ProductInputStep";
import ScriptReviewStep from "./start/ScriptReviewStep";
import GeneratingStep from "./start/GeneratingStep";

export type StartMode = "ai" | "empty";

export interface StartAiPayload {
  productName: string;
  description: string;
  script: string;
  voiceId: string;
  referenceVideoNames: string[]; // File 객체는 이후 처리 흐름에서만 쓰고, 상위로는 이름만 넘김
}

type Step = "choose" | "product-input" | "script-review" | "generating";

interface Props {
  onChoose: (mode: StartMode, payload?: StartAiPayload) => void;
}

export default function StartScreen({ onChoose }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [mounted, setMounted] = useState(false);

  // 각 단계 입력 상태
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState(mockVoices[0].id);
  const [referenceVideos, setReferenceVideos] = useState<File[]>([]);

  // 최초 마운트 애니메이션 트리거
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Step 2 → Step 3: 가짜 대본 생성
  const handleGenerateScript = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    setScript(generateMockScript(productName, description));
    setStep("script-review");
  };

  // Step 3 → Step 4: 실제 생성 진행 화면으로
  const handleStartGenerating = () => {
    setStep("generating");
  };

  // Step 4 완료 → 에디터 진입
  const handleGenerateComplete = () => {
    onChoose("ai", {
      productName,
      description,
      script,
      voiceId,
      referenceVideoNames: referenceVideos.map((f) => f.name),
    });
  };

  const stepOrder: Step[] = ["choose", "product-input", "script-review", "generating"];

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0f1115] p-6">
      <StepLayer step="choose" currentStep={step} stepOrder={stepOrder} initialMounted={mounted}>
        <ChooseStep
          mounted={mounted && step === "choose"}
          onChooseAi={() => setStep("product-input")}
          onChooseEmpty={() => onChoose("empty")}
        />
      </StepLayer>

      <StepLayer step="product-input" currentStep={step} stepOrder={stepOrder}>
        <ProductInputStep
          visible={step === "product-input"}
          productName={productName}
          description={description}
          onProductNameChange={setProductName}
          onDescriptionChange={setDescription}
          onBack={() => setStep("choose")}
          onNext={handleGenerateScript}
        />
      </StepLayer>

      <StepLayer step="script-review" currentStep={step} stepOrder={stepOrder}>
        <ScriptReviewStep
          script={script}
          voiceId={voiceId}
          referenceVideos={referenceVideos}
          onScriptChange={setScript}
          onVoiceChange={setVoiceId}
          onVideosChange={setReferenceVideos}
          onBack={() => setStep("product-input")}
          onGenerate={handleStartGenerating}
        />
      </StepLayer>

      <StepLayer step="generating" currentStep={step} stepOrder={stepOrder}>
        <GeneratingStep
          visible={step === "generating"}
          hasReferenceVideos={referenceVideos.length > 0}
          onComplete={handleGenerateComplete}
        />
      </StepLayer>
    </div>
  );
}

// 개별 단계 레이어: 현재 단계를 기준으로 좌/우 슬라이드 방향 결정
function StepLayer({
  step,
  currentStep,
  stepOrder,
  initialMounted = true,
  children,
}: {
  step: Step;
  currentStep: Step;
  stepOrder: Step[];
  initialMounted?: boolean;
  children: React.ReactNode;
}) {
  const visible = step === currentStep;
  const selfIdx = stepOrder.indexOf(step);
  const currentIdx = stepOrder.indexOf(currentStep);

  // 보이는 단계: 초기 마운트 전엔 살짝 아래(choose의 fade-up 효과 유지)
  let classes: string;
  if (visible) {
    classes = initialMounted ? "opacity-100 translate-x-0 translate-y-0" : "opacity-0 translate-y-4";
  } else if (selfIdx < currentIdx) {
    // 과거 단계: 왼쪽으로 빠짐
    classes = "pointer-events-none opacity-0 -translate-x-8";
  } else {
    // 미래 단계: 오른쪽에서 대기
    classes = "pointer-events-none opacity-0 translate-x-8";
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center p-6 transition-all duration-500 ease-out",
        classes
      )}
    >
      {children}
    </div>
  );
}
