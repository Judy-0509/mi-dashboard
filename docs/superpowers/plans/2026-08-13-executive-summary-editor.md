# Executive Summary Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LAN 대시보드의 승인된 요약 영역을 공용 비밀번호로 편집하고, 검토·공개·선형 이력·페이지별 데이터 초기화를 로컬에서 안전하게 운영한다.

**Architecture:** 기존 `ThreadingHTTPServer`가 정적 파일과 동일 출처 JSON API를 함께 제공한다. Python 표준 라이브러리 저장소가 추적되는 `editorial-defaults.json`과 Git에서 제외되는 JSON/JSONL 런타임 상태를 관리하고, React 컨텍스트와 재사용 가능한 인라인 편집 카드가 공개본 또는 인증된 작업본을 표시한다.

**Tech Stack:** Python 3.10 표준 라이브러리, React 19, TypeScript 6, Vite 8, Node 24, 기존 Tailwind/shadcn 구성

**Spec:** `docs/superpowers/specs/2026-08-13-executive-summary-editor-design.md`

## Global Constraints

- 외부 Python·Node 패키지를 추가하지 않는다.
- 서버는 `0.0.0.0:8000` 기본 바인딩과 HTTP를 유지한다.
- 일반 API는 마지막 공개본 외의 기본값·작업본·이력·IP를 반환하지 않는다.
- 공용 비밀번호는 10~128자이고 `hashlib.scrypt` 해시만 저장한다.
- 편집자 이름은 공백 제거 후 1~40자다.
- 세션 쿠키는 `HttpOnly; SameSite=Strict; Path=/`이고 8시간 미사용 시 만료한다.
- 모든 인증된 변경은 CSRF, 동일 Origin/Host, `expectedVersion` 검사를 통과해야 한다.
- 콘텐츠 요청은 64 KiB 이하이며 문장은 1~500자, 소제목은 1~100자다.
- 런타임은 `runtime/editorial/`에만 기록하고 `runtime/`은 Git에서 제외한다.
- Executive Summary 타이포는 `DESIGN.md`의 기존 역할을 재사용한다.
- Weekly Sell-through는 별도 요약 카드를 만들지 않고 지역별 표의 세부 내용만 편집한다.

---

### Task 1: JSON/JSONL 편집 저장소와 인증 코어

**Files:**
- Create: `scripts/editorial.py`
- Create: `scripts/test_editorial.py`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `editorial-defaults.json`의 `{schemaVersion, pages[page]: {kind, dataRevision, content}}`
- Produces: `EditorialStore`, `PasswordAuth`, `SessionManager`, `EditorialError`, `ConflictError`, `validate_content`
- Produces: `EditorialStore.public_page(page)`, `editor_page(page)`, `save_draft(...)`, `set_reviewed(...)`, `publish(...)`, `unpublish(...)`, `history(...)`, `history_version(...)`, `restore(...)`

- [ ] **Step 1: 저장소 상태 전이의 실패 테스트 작성**

```python
def test_published_snapshot_survives_new_draft(self):
    page = self.store.editor_page("sigma")
    page = self.store.set_reviewed("sigma", page["version"], True, self.editor)
    page = self.store.publish("sigma", page["version"], self.editor)
    published = self.store.public_page("sigma")["published"]
    self.store.save_draft(
        "sigma", page["version"], "custom", ["새 작업본"], self.editor
    )
    self.assertEqual(self.store.public_page("sigma")["published"], published)
```

추가 테스트는 콘텐츠 세 종류 검증, 검토 전 공개 거부, 공개 취소, version 충돌, 복원 신규 버전, IP 비노출, 관련 revision만 `data_reset`, 손상 JSONL 복구를 각각 독립 메서드로 작성한다.

- [ ] **Step 2: 저장소 테스트가 기능 부재로 실패하는지 확인**

Run: `python -m unittest scripts.test_editorial.EditorialStoreTests -v`

Expected: `ModuleNotFoundError` 또는 `EditorialStore` 미정의로 FAIL

- [ ] **Step 3: 최소 저장소 구현**

```python
class EditorialStore:
    def __init__(self, defaults_path: Path, runtime_dir: Path, now=utc_now): ...
    def public_page(self, page: str) -> dict[str, object]: ...
    def editor_page(self, page: str) -> dict[str, object]: ...
    def save_draft(self, page: str, expected_version: int, mode: str,
                   content: object, editor: Editor) -> dict[str, object]: ...
```

모든 변경은 하나의 `threading.RLock`에서 이력 append+fsync, 백업, 임시 파일+fsync, `os.replace` 순으로 저장한다. 이력 스냅샷에는 당시의 해석된 `draftContent`도 포함해 이전 default 버전을 정확히 복원한다.

- [ ] **Step 4: 비밀번호·세션의 실패 테스트 작성**

```python
def test_password_file_never_contains_plaintext(self):
    auth = PasswordAuth(self.runtime / "auth.json")
    auth.setup("correct horse battery staple")
    self.assertTrue(auth.verify("correct horse battery staple"))
    self.assertNotIn("correct horse battery staple", (self.runtime / "auth.json").read_text())
```

로그인 실패 5회 제한, 성공 시 초기화, 이름 정규화, 8시간 idle 만료, 로그아웃과 새 `SessionManager`에서 기존 토큰 무효화를 실제 시간 주입으로 검증한다.

- [ ] **Step 5: 인증 테스트 RED 확인 후 최소 구현**

Run: `python -m unittest scripts.test_editorial.PasswordAndSessionTests -v`

Expected: `PasswordAuth`/`SessionManager` 미정의로 FAIL

`hashlib.scrypt(n=16384, r=8, p=1, dklen=32)`, `secrets.token_urlsafe(32)`, `hmac.compare_digest`를 사용한다.

- [ ] **Step 6: 전체 코어 테스트 GREEN 확인**

Run: `python -m unittest scripts.test_editorial -v`

Expected: 모든 저장소·인증 테스트 PASS

- [ ] **Step 7: 코어 커밋**

```powershell
git add .gitignore scripts/editorial.py scripts/test_editorial.py
git commit -m "feat: add local editorial store and auth"
```

---

### Task 2: 동일 출처 편집 HTTP API

**Files:**
- Modify: `scripts/editorial.py`
- Modify: `scripts/serve_dashboard.py`
- Modify: `scripts/test_editorial.py`

**Interfaces:**
- Consumes: Task 1의 `EditorialStore`, `PasswordAuth`, `SessionManager`
- Produces: `create_editorial_handler(site_root, store, auth, sessions)`
- Produces: 설계 문서 11절의 `/api/editorial/*`, `/api/editor/*` 경로

- [ ] **Step 1: 실제 임시 HTTP 서버 통합 테스트 작성**

```python
def test_public_api_never_returns_draft_or_history(self):
    status, _, body = self.request("GET", "/api/editorial/pages/sigma")
    self.assertEqual(status, 200)
    self.assertEqual(set(body), {"page", "published"})
    self.assertNotIn("draft", json.dumps(body))
```

loopback setup, 원격 setup 거부, 로그인 쿠키 속성, CSRF 누락, Origin 불일치, 64 KiB 초과, 인증 없는 history, `409` 최신본 응답을 실제 `ThreadingHTTPServer`로 검증한다.

- [ ] **Step 2: API 테스트 RED 확인**

Run: `python -m unittest scripts.test_editorial.EditorialHttpTests -v`

Expected: handler factory 미정의로 FAIL

- [ ] **Step 3: API 라우터와 JSON 경계 구현**

```python
handler = create_editorial_handler(
    site_root=package_root / "site",
    store=EditorialStore(defaults_path, runtime_dir),
    auth=PasswordAuth(runtime_dir / "auth.json"),
    sessions=SessionManager(),
)
server = ThreadingHTTPServer((args.host, args.port), handler)
```

API 응답에는 `Cache-Control: no-store`를 적용하고 CORS 헤더를 보내지 않는다. 상태 변경은 `Origin == http://{Host}`와 `X-CSRF-Token`을 검사한다.

- [ ] **Step 4: API GREEN 및 정적 파일 회귀 확인**

Run: `python -m unittest scripts.test_editorial -v`

Expected: API와 코어 테스트 PASS

실제 저장소 루트 manifest를 사용하는 서버 시작 검증은 Task 3 산출물이 생긴 뒤 Task 6에서 수행한다.

- [ ] **Step 5: API 커밋**

```powershell
git add scripts/editorial.py scripts/serve_dashboard.py scripts/test_editorial.py
git commit -m "feat: serve authenticated editorial api"
```

---

### Task 3: 자동 생성 기본값 manifest와 페이지별 revision

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/data/editorial-defaults.ts`
- Create: `prototype/mi-dashboard-shadcn/scripts/build-editorial-defaults.mjs`
- Create: `prototype/mi-dashboard-shadcn/scripts/check-editorial-defaults.mjs`
- Create: `editorial-defaults.json`
- Modify: `prototype/mi-dashboard-shadcn/package.json`
- Modify: `prototype/mi-dashboard-shadcn/src/data/dashboard.json`
- Modify: `prototype/mi-dashboard-shadcn/src/data/production.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/weekly.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/pipeline-check.ts`
- Modify: `prototype/mi-dashboard-shadcn/src/data/pipeline-check-iphone.ts`
- Modify: `prototype/mi-dashboard-shadcn/scripts/update-dashboard-data.mjs`

**Interfaces:**
- Produces: `getEditorialDefaultSources(): Record<PageKey, {kind, revisionData, content}>`
- Produces: `createEditorialManifest(sources)`와 root `editorial-defaults.json`
- Consumes: 각 페이지의 현재 정규화 데이터 export

- [ ] **Step 1: manifest 생성 실패 테스트 작성**

```javascript
assert.deepEqual(Object.keys(manifest.pages).sort(), expectedPageKeys.sort())
assert.match(manifest.pages.sigma.dataRevision, /^sha256:[0-9a-f]{64}$/)
assert.equal(createRevision({ b: 2, a: 1 }), createRevision({ a: 1, b: 2 }))
```

한 페이지의 `revisionData`만 바꾼 사본에서 해당 revision만 달라지는지와 세 콘텐츠 형식의 길이 제한도 검증한다.

- [ ] **Step 2: manifest 테스트 RED 확인**

Run: `node --experimental-strip-types scripts/check-editorial-defaults.mjs`

Working directory: `prototype/mi-dashboard-shadcn`

Expected: generator module 미존재로 FAIL

- [ ] **Step 3: 순수 기본 문구 생성과 안정 해시 구현**

```typescript
export type EditorialDefaultSource = {
  kind: "bullets" | "titled" | "regional"
  revisionData: unknown
  content: unknown
}
```

Sigma·Weekly·Pipeline 기존 문장 생성은 이 전용 모듈로 이동한다. ANI, Sell-through, Flagship, Latest Results 두 페이지는 설계된 현재 총량·변화·상태 개수를 계산한다. MI Insight 두 페이지는 기존 구조를 기본값으로 사용한다.

- [ ] **Step 4: 추적되는 manifest 생성 및 데이터 파일에서 공개 문구 제거**

Run: `node --experimental-strip-types scripts/build-editorial-defaults.mjs`

Expected: 저장소 루트에 11개 페이지가 있는 UTF-8 JSON 생성

`dashboard.json`의 `executiveSummary`와 프런트에서 사용하던 summary export를 제거해 미공개 문구가 번들 입력에 남지 않게 한다.

- [ ] **Step 5: manifest 테스트 GREEN 확인**

Run: `npm.cmd test`

Expected: 실제 manifest 일치, revision 안정성, 기존 검사 모두 PASS

- [ ] **Step 6: manifest 커밋**

```powershell
git add editorial-defaults.json prototype/mi-dashboard-shadcn
git commit -m "feat: generate private editorial defaults"
```

---

### Task 4: 전역 편집 세션과 API 클라이언트

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/lib/editorial-model.ts`
- Create: `prototype/mi-dashboard-shadcn/src/lib/editorial.tsx`
- Create: `prototype/mi-dashboard-shadcn/src/components/editor-access.tsx`
- Create: `prototype/mi-dashboard-shadcn/scripts/check-editorial-client.mjs`
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/page-actions.tsx`
- Modify: `prototype/mi-dashboard-shadcn/package.json`

**Interfaces:**
- Produces: `EditorialProvider`, `useEditorialSession()`, `useEditorialPage(page)`
- Produces: `EditorAccess` 로그인·최초 설정·비밀번호 변경·로그아웃 UI
- API errors: `{status, code, message, latest?}`

- [ ] **Step 1: API 클라이언트와 편집 모델 계약 검사 작성**

Node 검사는 Vite SSR로 TypeScript 모듈을 불러오고 임시 Node HTTP 서버의 실제 JSON 응답을 통해 unauthenticated session, 공개 page, 인증 page, 오류와 `409.latest` 파싱을 확인한다. 문장 추가·삭제·이동, 콘텐츠 정규화와 flatten 결과는 손으로 계산한 literal로 검증한다.

- [ ] **Step 2: 클라이언트 검사 RED 확인**

Run: `node scripts/check-editorial-client.mjs`

Expected: React 클라이언트 export 또는 인증 흐름 부재로 FAIL

- [ ] **Step 3: 컨텍스트와 fetch 경계 구현**

```typescript
type EditorialSession = {
  authenticated: boolean
  editorName: string | null
  csrfToken: string | null
  setupRequired: boolean
  setupAllowed: boolean
}
```

`fetch`는 `credentials: "same-origin"`, JSON 오류 파싱, CSRF 헤더, `409.latest` 보존을 한 함수에서 처리한다. export HTML에서는 API 호출과 편집 UI를 비활성화한다.

- [ ] **Step 4: native dialog 기반 접근 UI와 이탈 보호 구현**

페이지 상단 `PageActions`에 `편집 모드` 또는 `편집 중: 이름`·`로그아웃`을 표시한다. dirty 상태에서는 페이지 이동, 로그아웃, `beforeunload` 전에 확인한다.

- [ ] **Step 5: 클라이언트 계약 GREEN 확인**

Run: `node scripts/check-editorial-client.mjs`

Expected: setup/login/session/public/editor 계약 PASS

- [ ] **Step 6: 전역 세션 커밋**

```powershell
git add prototype/mi-dashboard-shadcn/src/lib/editorial-model.ts prototype/mi-dashboard-shadcn/src/lib/editorial.tsx prototype/mi-dashboard-shadcn/src/components/editor-access.tsx prototype/mi-dashboard-shadcn/src/components/page-actions.tsx prototype/mi-dashboard-shadcn/src/App.tsx prototype/mi-dashboard-shadcn/scripts/check-editorial-client.mjs prototype/mi-dashboard-shadcn/package.json
git commit -m "feat: add dashboard edit mode session"
```

---

### Task 5: 세 콘텐츠 형식의 인라인 편집·공개·이력 UI

**Files:**
- Create: `prototype/mi-dashboard-shadcn/src/components/editorial-summary.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/App.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/mi-weekly-sell-through-summary.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/mi-insight-weekly-report.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/pipeline-check.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/pipeline-check-iphone.tsx`
- Modify: `prototype/mi-dashboard-shadcn/src/components/latest-results-page.tsx`
- Delete: `prototype/mi-dashboard-shadcn/src/components/executive-summary.tsx`
- Delete: `prototype/mi-dashboard-shadcn/src/components/weekly-executive-summary.tsx`
- Modify: `prototype/mi-dashboard-shadcn/scripts/check-editorial-client.mjs`

**Interfaces:**
- Produces: `<EditorialSummary page="..." />` for `bullets` and `titled`
- Produces: `EditorialStatusActions` and `EditorialHistory` reused by regional table
- Consumes: Task 4의 `useEditorialPage(page)`

- [ ] **Step 1: 공개/편집 렌더 계약의 실패 검사 작성**

Node 검사는 Vite SSR과 `react-dom/server`로 실제 presentational 컴포넌트를 렌더링한다. 비공개 일반 상태는 빈 markup, 인증 상태는 상태 배지와 편집 버튼, 공개 상태는 문구, Weekly 지역 표의 비공개 일반 상태는 세부 내용 header가 없는지를 확인한다. 클릭·저장 흐름은 Task 6의 실제 브라우저 검증에서 확인한다.

- [ ] **Step 2: UI 검사 RED 확인**

Run: `node scripts/check-editorial-client.mjs --ui`

Expected: 편집 카드와 지역 입력 부재로 FAIL

- [ ] **Step 3: bullets/titled 인라인 카드 구현**

입력 변경 시 `custom`, 복원 시 `default`로 전환한다. 불릿 1~3개, 소제목 1~3개, 세부 문장 1~5개에서 추가·삭제·위/아래 이동을 제공하고 저장 전 빈 값과 길이를 검증한다.

- [ ] **Step 4: 검토·공개·공개 취소와 충돌 UI 구현**

저장과 공개 버튼을 분리한다. `409`에서는 로컬 초안과 `latest.draftContent`를 나란히 보여주고 `최신본 불러오기`와 `최신 버전에 내 초안 저장`을 사용자가 선택하게 한다.

- [ ] **Step 5: 선형 이력·두 버전 비교·복원 구현**

이력 목록은 IP 없이 버전·편집자·시각·행동을 표시한다. 선택 버전의 before/after 문장 비교, 두 버전의 after 비교, 복원 확인을 같은 카드 아래 접이식 영역에 제공한다.

- [ ] **Step 6: Weekly Sell-through 지역 표 구현**

카드 제목은 `지역별 YoY·WoW`로 유지하고 YoY/WoW는 텍스트로만 렌더한다. 일반 사용자는 공개 상세가 없을 때 상세 열 자체를 받지 않고, 편집자는 6개 고정 지역의 0~3개 문장만 수정한다.

- [ ] **Step 7: 모든 페이지에 편집 영역 연결**

10개 Executive Summary 페이지에 `<EditorialSummary>`를 배치하고 기존 하드코딩 카드 두 파일과 Pipeline/MI Insight 내부 중복 카드를 제거한다. Latest Results 두 페이지는 헤더와 필터 사이에 카드를 둔다.

- [ ] **Step 8: UI 계약 GREEN 확인**

Run: `node scripts/check-editorial-client.mjs --ui`

Expected: 비공개/편집/공개/지역 상세/이력/충돌 흐름 PASS

- [ ] **Step 9: 편집 UI 커밋**

```powershell
git add prototype/mi-dashboard-shadcn
git commit -m "feat: add inline editorial workflow"
```

---

### Task 6: 운영 문서, 빌드, 통합 검증

**Files:**
- Modify: `README.md`
- Modify: `대시보드 실행.bat` only if the existing command cannot start the integrated server
- Modify: `docs/superpowers/specs/2026-08-13-executive-summary-editor-design.md` to record resolved snapshot restoration detail
- Modify: `site/**` through the existing build command

**Interfaces:**
- Documents: localhost 최초 설정, LAN URL, 로그인/공개, 비밀번호 변경, runtime 백업
- Verifies: source, generated manifest, Python API, built static site, browser behavior

- [ ] **Step 1: 운영 README 갱신**

GitHub Pages 안내를 제거하고 서버 PC의 `대시보드 실행.bat`, `http://localhost:8000`, 최초 비밀번호 설정, LAN 조회 URL, 편집 이력 위치와 백업 주의사항을 기록한다.

- [ ] **Step 2: 전체 자동 검사**

```powershell
python -m unittest scripts.test_editorial -v
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
git diff --check
```

Working directory for npm commands: `prototype/mi-dashboard-shadcn`

Expected: 모두 exit code 0, placeholder/skip/only 없음

- [ ] **Step 3: 빌드 산출물 비공개 검사 재실행**

Run: `node scripts/check-editorial-defaults.mjs --built-site`

Expected: `site/assets/*.js`와 독립 HTML에 11개 기본 요약의 전체 문장이 없음

- [ ] **Step 4: 실제 localhost 브라우저 검증**

서버를 `127.0.0.1:8000`에서 시작하고 페이지 제목 `MI Intelligence Portal`, 예상 asset, `스마트폰 생산 전망` heading을 확인한다. 별도 일반/편집 세션으로 설정→로그인→저장→검토→공개→새 초안→이력→복원과 Weekly 상세 열을 확인한다.

- [ ] **Step 5: 런타임 Git 비오염과 백업 확인**

편집 후 `runtime/editorial/content.json`, `.bak`, `history.jsonl`, `auth.json`이 존재하고 `git status --short`에는 나타나지 않는지 확인한다.

- [ ] **Step 6: 최종 문서·빌드 커밋**

```powershell
git add README.md docs/superpowers/specs/2026-08-13-executive-summary-editor-design.md site editorial-defaults.json prototype/mi-dashboard-shadcn
git commit -m "docs: document local editorial operations"
```

- [ ] **Step 7: 최종 상태 확인**

Run: `git status --short --branch`

Expected: 추적 파일 변경 없음. `master`는 원격보다 로컬 커밋만큼 앞서며 push는 수행하지 않음.
