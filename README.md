# Booggum Tool

AI 기반 영상 자동 생성 툴 (대본 → TTS → 자막 → 영상 매칭 → MP4 렌더).

> 이 레포는 **개발/테스트용 샌드박스**입니다. UI와 기능을 단계별로 확인한 뒤, 최종적으로 Boostech-AI(프론트, Vercel Pro) + Boostech-AI-backend(백엔드, Railway)로 분리 이식됩니다.

## 기술 스택

- Next.js 14 (App Router, TypeScript)
- Remotion — React 기반 영상 합성/렌더링
- Zustand — 에디터 상태관리
- Tailwind CSS — 스타일링
- Supabase — DB + Storage
- OpenAI Whisper — 자막 자동 생성
- Typecast — TTS
- Gemini — 대본 생성 / 참고 영상 매칭

## 개발 시작

```bash
npm install
npm run dev
```

→ <http://localhost:3000>

## 배포

- **개발**: Railway (단일 Next.js 서버, 렌더까지 동작)
- **프로덕션**: 프론트는 Vercel Pro, 백엔드는 Railway로 분리

## 개발 Phase

- [x] **Phase 1** — 초기 세팅 (스캐폴딩)
- [ ] **Phase 2** — 홈 UI (프로젝트 목록)
- [ ] **Phase 3** — Supabase 연결 + 프로젝트 CRUD
- [ ] **Phase 4** — 에디터 UI 스켈레톤
- [ ] **Phase 5** — 에셋 업로드
- [ ] **Phase 6** — 타임라인 편집
- [ ] **Phase 7** — 대본 생성 (Gemini)
- [ ] **Phase 8** — TTS (Typecast)
- [ ] **Phase 9** — 자막 (Whisper)
- [ ] **Phase 10** — 참고 영상 매칭
- [ ] **Phase 11** — MP4 렌더링
