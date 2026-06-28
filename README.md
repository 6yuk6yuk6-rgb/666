# 프롬프트 보관소

이미지 생성용 프롬프트를 사진과 함께 보관하는 개인 웹사이트입니다. 공개 방문자는 등록된 프롬프트를 검색하고 복사할 수 있고, 관리자만 프롬프트·프로필·커버 이미지를 수정할 수 있습니다.

## 기술 구성

- Next.js App Router + TypeScript
- Supabase PostgreSQL
- Supabase Storage
- 서버 API Routes
- bcryptjs 비밀번호 해시 검증
- jose 서명 세션 쿠키
- HttpOnly, Secure, SameSite 관리자 쿠키

Supabase service role key는 서버 코드에서만 사용합니다. 브라우저 번들, API 응답, localStorage에는 관리자 비밀번호와 service role key가 노출되지 않습니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com/)에 로그인합니다.
2. `New project`를 누릅니다.
3. 프로젝트 이름과 데이터베이스 비밀번호를 정합니다.
4. Region은 Vercel 배포 지역과 가까운 곳을 선택합니다.
5. 프로젝트 생성이 끝나면 `Project Settings` → `API`로 이동합니다.
6. `Project URL` 값을 복사합니다. 이 값이 `SUPABASE_URL`입니다.
7. `service_role` key를 복사합니다. 이 값이 `SUPABASE_SERVICE_ROLE_KEY`입니다.

`service_role` key는 관리자 권한 키입니다. GitHub에 올리거나 클라이언트 코드에 넣지 마세요.

## 2. SQL migration 실행

1. Supabase 대시보드에서 `SQL Editor`를 엽니다.
2. `supabase/migration.sql` 파일 내용을 전부 복사합니다.
3. SQL Editor에 붙여넣고 `Run`을 누릅니다.

이 migration은 다음 테이블을 만듭니다.

- `categories`
- `prompts`
- `prompt_sections`
- `profile`
- `cover_settings`

`prompt_sections.prompt_id`는 `prompts.id`를 참조하며, 프롬프트 삭제 시 추가 프롬프트도 함께 삭제됩니다. RLS는 켜져 있고 공개 정책은 만들지 않습니다. 앱 서버가 service role key로만 데이터에 접근합니다.

## 3. Storage bucket 생성 및 설정

1. Supabase 대시보드에서 `Storage`로 이동합니다.
2. `New bucket`을 누릅니다.
3. bucket 이름을 정확히 `prompt-images`로 입력합니다.
4. `Public bucket`을 켭니다.
5. 생성 후 이미지 업로드가 되는지 확인합니다.

업로드는 서버 API가 service role key로 수행합니다. 허용 파일은 JPG, PNG, WEBP이며 최대 5MB입니다. 프롬프트 삭제 또는 이미지 교체 시 기존 Storage 파일도 정리합니다.

## 4. 샘플 데이터 넣기

개발 확인용 샘플이 필요하면 SQL Editor에서 `supabase/seed.sql`을 실행합니다.

샘플 데이터는 고정 UUID를 사용하므로 다시 실행해도 같은 샘플을 갱신합니다. 배포 전 삭제하려면 `seed.sql` 상단 주석의 `delete from prompts ...` 문을 실행하면 됩니다.

## 5. 비밀번호 해시 생성

먼저 의존성을 설치합니다.

```bash
npm install
```

원하는 관리자 비밀번호를 bcrypt 해시로 변환합니다.

```bash
npm run hash-password
```

터미널에 출력되는 `ADMIN_PASSWORD_HASH` 값만 환경변수에 저장합니다. 평문 비밀번호는 코드, README, GitHub, Vercel 로그에 저장하지 마세요.

권장값은 스크립트가 먼저 출력하는 base64 형태의 `ADMIN_PASSWORD_HASH`입니다. base64 값에는 `$`가 없어서 `.env.local`과 Vercel Environment Variables에 같은 값을 넣을 수 있습니다. 원본 bcrypt 해시를 직접 넣을 수도 있지만, bcrypt 해시는 `$2b$12$...`처럼 `$` 문자를 포함하므로 로컬 `.env.local`에서는 반드시 `\$`로 escape해야 합니다.

관리자 아이디는 `oracle4243`입니다.

## 6. `.env.local` 작성

프로젝트 루트에 `.env.local` 파일을 직접 만들고 다음 값을 입력합니다.

```bash
SUPABASE_URL=Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=Supabase service_role key
ADMIN_USERNAME=oracle4243
ADMIN_PASSWORD_HASH=위에서 생성한 권장 base64 해시
SESSION_SECRET=충분히 긴 랜덤 문자열
```

`SESSION_SECRET`은 아래 명령으로 만들 수 있습니다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`.env.local`은 `.gitignore`에 포함되어 있으므로 GitHub에 올라가지 않습니다.

## 7. 로컬 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

첫 화면은 커버 페이지입니다. `Enter ♥`를 누르면 프롬프트 보관함으로 들어갑니다. 오른쪽 아래의 작은 자물쇠 아이콘을 누르면 관리자 로그인 모달이 열립니다.

## 8. GitHub 저장소 업로드

```bash
git init
git add .
git commit -m "Initial prompt archive"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

`.env.local`이 커밋되지 않았는지 꼭 확인하세요.

```bash
git status --short
```

## 9. Vercel에 GitHub 저장소 연결

1. [Vercel](https://vercel.com/)에 로그인합니다.
2. `Add New` → `Project`를 누릅니다.
3. GitHub 저장소를 선택합니다.
4. Framework Preset은 `Next.js`로 둡니다.
5. Build Command는 기본값 `npm run build`를 사용합니다.

GitHub Pages용 정적 사이트가 아니라 Vercel의 Next.js 서버 기능으로 배포해야 관리자 인증과 서버 API가 작동합니다.

## 10. Vercel Environment Variables 등록

Vercel 프로젝트 설정에서 `Settings` → `Environment Variables`로 이동해 아래 값을 추가합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`

`ADMIN_USERNAME` 값은 `oracle4243`입니다. `ADMIN_PASSWORD_HASH`에는 평문 비밀번호가 아니라 `npm run hash-password`가 출력한 권장 base64 해시를 넣습니다.

Production, Preview, Development 중 필요한 환경에 모두 등록합니다. 일반적으로 처음에는 Production과 Preview 둘 다 등록하면 편합니다.

## 11. 배포 및 관리자 로그인 확인

1. Vercel에서 `Deploy`를 누릅니다.
2. 배포가 끝나면 Vercel이 제공한 도메인으로 접속합니다.
3. 커버에서 `Enter ♥`를 누릅니다.
4. 오른쪽 아래 작은 자물쇠 아이콘을 누릅니다.
5. 아이디 `oracle4243`와 설정한 비밀번호로 로그인합니다.
6. 상단 관리자 툴바가 보이면 정상입니다.
7. `새 프롬프트 등록`, `커버 편집`, `편집 모드`, `잠금`을 확인합니다.

## 배포 직전에 직접 입력해야 하는 값

Supabase Dashboard:

- `SUPABASE_URL`: `Project Settings` → `API` → `Project URL`
- `SUPABASE_SERVICE_ROLE_KEY`: `Project Settings` → `API` → `service_role key`
- Storage bucket 이름: `prompt-images`

로컬 `.env.local`:

- `ADMIN_USERNAME`: `oracle4243`
- `ADMIN_PASSWORD_HASH`: `npm run hash-password`가 출력한 권장 base64 해시
- `SESSION_SECRET`: 랜덤 문자열

Vercel `Settings` → `Environment Variables`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`

GitHub에는 `.env.local`, 실제 비밀번호, service role key, session secret을 올리지 않습니다.
