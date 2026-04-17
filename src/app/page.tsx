import { supabaseServer } from "@/lib/supabase";
import ProjectCard from "@/components/home/ProjectCard";

export const dynamic = "force-dynamic";

// 프로젝트 목록 페이지
export default async function HomePage() {
  const supabase = supabaseServer();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto flex h-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto-Videos</h1>
          <p className="text-sm text-gray-400">AI 영상 자동 편집 에디터</p>
        </div>
        <div className="flex gap-2">
          <form action="/api/projects" method="post">
            <input type="hidden" name="preset" value="landscape" />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium hover:bg-accentHover"
            >
              <span className="inline-block h-4 w-6 rounded-sm border border-white/60" />
              + 영상 (16:9)
            </button>
          </form>
          <form action="/api/projects" method="post">
            <input type="hidden" name="preset" value="shorts" />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              <span className="inline-block h-5 w-3 rounded-sm border border-accent" />
              + 쇼츠 (9:16)
            </button>
          </form>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          Supabase 연결에 실패했습니다. `.env.local` 설정을 확인하세요.
          <br />
          <span className="text-xs opacity-70">{error.message}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map((p) => (
          <ProjectCard
            key={p.id}
            id={p.id}
            name={p.name}
            updatedAt={p.updated_at}
          />
        ))}
        {(projects ?? []).length === 0 && !error && (
          <div className="col-span-full rounded-md border border-dashed border-border p-8 text-center text-sm text-gray-400">
            아직 프로젝트가 없습니다. 오른쪽 상단에서 새로 만들어보세요.
          </div>
        )}
      </section>
    </main>
  );
}
