# Vercel 무료 배포 가이드

## 현재 배포 전제

- **목표**: AI 영상 자동 제작 파이프라인(대본→TTS→자막→영상 매칭)까지 테스트
- **제외**: MP4 내보내기(`/api/render`) → Vercel에서 동작 불가, 로컬에서만
- **플랜**: Vercel Hobby(무료)

## 1. 사전 준비

- Supabase 프로젝트 (기존 사용 중인 것 그대로)
- OpenAI / Typecast / Gemini API 키
- GitHub 레포 push 완료 (`https://github.com/kimkichan1225/auto-video`)

## 2. Supabase 스키마 업데이트

Storage 정책 추가 때문에 **SQL을 다시 실행**해야 합니다.

1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 전체 붙여넣기 → Run
3. `storage.policies` 테이블에 "anon upload to assets" 등이 생겼는지 확인

## 3. Vercel 프로젝트 생성

1. [vercel.com/new](https://vercel.com/new) → `kimkichan1225/auto-video` 임포트
2. Framework: Next.js (자동 감지)
3. Build/Output 설정 그대로 두기

## 4. 환경변수 입력

Vercel 프로젝트 설정 → **Environment Variables** 에 아래 모두 등록:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `OPENAI_API_KEY` | OpenAI 키 |
| `TYPECAST_API_KEY` | Typecast 키 |
| `TYPECAST_API_BASE` | `https://api.typecast.ai/v1` |
| `TYPECAST_ACTOR_ID` | `tc_...` 형식 voice_id |
| `GEMINI_API_KEY` | Gemini 키 |
| `GEMINI_MODEL` | `gemini-2.0-flash` (선택) |

모두 Production/Preview/Development 3곳 체크.

## 5. 배포

**Deploy** 버튼 → 완료 시 `https://auto-video-<hash>.vercel.app` 발급.

## 6. 동작 확인

### 정상 동작 예상
- 프로젝트 생성/목록/삭제 ✅
- 에셋 업로드 (브라우저 → Supabase 직접) ✅
- TTS, 대본 생성, 자막 생성 ✅ (60초 타임아웃 내)
- 영상 자동 매칭 ⚠️ (참고 영상 총 길이 30초 이하 권장, 60초 초과 시 타임아웃)

### 동작 안 함
- **MP4 내보내기** ❌ → "501 Not Supported" 안내 메시지
  - 로컬(`npm run dev`)에서만 사용 가능

## 7. 자주 나오는 에러

### "Bucket not found"
→ Supabase Storage에 `assets`, `renders` 버킷이 둘 다 public으로 생성됐는지 확인

### "new row violates row-level security policy"
→ `schema.sql` 의 Storage 정책 SQL이 실행되지 않음. 다시 실행 필요

### Gemini 429 Too Many Requests (`limit: 0`)
→ API 키를 **새 Google 프로젝트**에서 발급 ([aistudio.google.com/apikey](https://aistudio.google.com/apikey) "Create API key in new project")

### 매칭 타임아웃 (504)
→ 참고 영상 수/길이 감소. Vercel Hobby 한계(60초) 초과 시 Pro 필요

## 8. 앞으로의 업그레이드 (참고)

| 단계 | 플랜 | 비용 | 추가되는 것 |
|---|---|---|---|
| 현재 | Hobby | $0 | 배포 테스트 |
| 다음 | Pro + Railway Hobby | ~$25/월 | MP4 렌더, 긴 영상 매칭 |
| 상용 | Pro + Remotion Lambda | $20+/월 | 동시 다중 렌더 |
