"use client";

import { cn } from "@/lib/utils";

interface Props {
  mounted: boolean;
  onChooseAi: () => void;
  onChooseEmpty: () => void;
}

export default function ChooseStep({ mounted, onChooseAi, onChooseEmpty }: Props) {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-white">어떻게 시작할까요?</h2>
        <p className="mt-2 text-sm text-gray-400">
          AI가 영상을 자동으로 만들어주거나, 빈 프로젝트에서 직접 편집할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          onClick={onChooseAi}
          accent
          delay={120}
          mounted={mounted}
          iconAnimClass="group-hover:scale-110 group-hover:rotate-12"
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18.5 18.5 22 17 15l5-5-7-1z" />
            </svg>
          }
          title="AI로 시작"
          description="상품명과 설명만 입력하면 대본·음성·자막·영상까지 자동으로 생성합니다."
          badge="추천"
        />
        <Card
          onClick={onChooseEmpty}
          delay={220}
          mounted={mounted}
          iconAnimClass="group-hover:-translate-y-1"
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          }
          title="빈 프로젝트로 시작"
          description="직접 파일을 업로드하고 타임라인에서 편집합니다."
        />
      </div>
    </div>
  );
}

interface CardProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
  badge?: string;
  delay: number;
  mounted: boolean;
  iconAnimClass?: string;
}

function Card({
  onClick,
  icon,
  title,
  description,
  accent,
  badge,
  delay,
  mounted,
  iconAnimClass,
}: CardProps) {
  return (
    <button
      onClick={onClick}
      style={{ transitionDelay: mounted ? `${delay}ms` : "0ms" }}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-xl border p-6 text-left transition-all duration-500 ease-out",
        mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        "hover:-translate-y-1",
        accent
          ? "border-accent/40 bg-accent/5 hover:border-accent hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/20"
          : "border-border bg-panel hover:border-gray-500 hover:bg-panelAlt hover:shadow-lg hover:shadow-black/40"
      )}
    >
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          {badge}
        </span>
      )}
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
          iconAnimClass,
          accent
            ? "bg-accent/20 text-accent group-hover:bg-accent group-hover:text-white"
            : "bg-panelAlt text-gray-300 group-hover:bg-border"
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">{description}</p>
      </div>
    </button>
  );
}
