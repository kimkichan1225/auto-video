# Auto-Videos

AI 영상 자동 편집 웹 툴 (Vrew 스타일 + 직접 편집 가능)

## 기술 스택

- **Next.js 14** (App Router, TypeScript)
- **Remotion** — React 기반 영상 합성/렌더링
- **Zustand** — 에디터 상태관리
- **Tailwind CSS** — 스타일링
- **Supabase** — DB + 파일 저장소
- **OpenAI Whisper** — 오디오 → 자막 자동 생성
- **Typecast** — 대본 → TTS 오디오

## 주요 기능

- 🎬 멀티트랙 타임라인 편집 (영상/이미지/오디오/자막)
- 🖼️ 이미지·영상·오디오 업로드 및 드래그로 타임라인 배치
- ✂️ 클립 이동·리사이즈·속성 편집 (위치, 크기, 회전, 투명도)
- 🎤 Typecast TTS로 대본 → MP3 자동 생성
- 📝 Whisper STT로 MP3 → 자동 자막 (단어 단위 타이밍)
- 🎞️ Ken Burns 효과, 페이드 인/아웃 애니메이션
- 📤 Remotion으로 MP4 렌더링 및 다운로드

## 초기 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 준비

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. **SQL Editor** → `supabase/schema.sql` 내용 실행
3. **Storage**에서 버킷 2개 생성 (둘 다 **public** 설정)
   - `assets` — 업로드한 원본 파일
   - `renders` — 렌더된 MP4
4. **Settings → API**에서 아래 3개 값 확인
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 3. 환경변수 설정

`.env.example`을 복사하여 `.env.local` 생성 후 값 채우기:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=sk-...
TYPECAST_API_KEY=...
```

### 4. 개발 서버 실행

```bash
npm run dev
```

→ <http://localhost:3000>

## 폴더 구조

```
src/
├─ app/
│  ├─ page.tsx                    # 프로젝트 목록
│  ├─ editor/[id]/page.tsx        # 메인 에디터
│  └─ api/
│     ├─ projects/                # 프로젝트 CRUD
│     ├─ upload/                  # 에셋 업로드
│     ├─ tts/                     # Typecast TTS
│     ├─ transcribe/              # Whisper STT
│     └─ render/                  # Remotion MP4 렌더
├─ components/editor/             # 에디터 UI (툴바/패널/타임라인)
├─ remotion/                      # 영상 합성 컴포넌트
├─ store/editorStore.ts           # Zustand 상태
├─ lib/                           # supabase/typecast/whisper 헬퍼
└─ types/project.ts               # 핵심 타입
```

## 구현 단계

- [x] **Phase 1** — 스캐폴딩, 에디터 UI, Remotion 컴포지션, API 라우트
- [ ] **Phase 2** — 타임라인 고도화 (스냅, 멀티선택, 단축키, Undo/Redo)
- [ ] **Phase 3** — 자막 편집 UI, 수동 수정, 스타일 프리셋
- [ ] **Phase 4** — 렌더 큐 시스템, 진행률 실시간 표시
- [ ] **Phase 5** — 트랜지션, 프로젝트 공유, 사용자 인증

## 알려진 제약

- 현재 MVP는 단일 사용자 전제 (Auth 미적용, RLS 비활성)
- Remotion 서버 렌더는 헤드리스 Chrome 필요 → 프로덕션은 Remotion Lambda 권장
- Typecast API의 `actor_id`는 계정별로 다르므로 `src/lib/typecast.ts`에서 기본값 설정 필요
