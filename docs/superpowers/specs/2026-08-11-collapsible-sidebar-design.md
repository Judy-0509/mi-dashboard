# 접이식 좌측 네비게이션바 — 설계 사양

**상태:** 사용자 승인 설계
**일자:** 2026-08-11
**범위:** MI Intelligence Portal의 기존 `PortalSidebar`와 데스크톱 shell

## 목적

사용자가 좌측 네비게이션바를 접어 본문 작업 공간을 넓히고, 필요할 때 다시 펼칠 수 있게 한다. 기존 메뉴, 현재 페이지 표시, hash 기반 라우팅은 그대로 유지한다.

## 승인된 동작

- `PortalSidebar`가 내부 `collapsed: boolean` 상태를 소유한다.
- 기본 상태는 펼침이며 새로고침 후에도 항상 펼침으로 시작한다.
- 펼침 상태는 기존 UI와 동일한 `256px` 폭, 메뉴, 위계를 유지한다.
- 접힘 상태는 `40px` 폭의 세로 rail만 남긴다.
- 접힌 rail에는 가운데 정렬된 펼치기 chevron 버튼 하나만 표시한다.
- 펼침/접힘 전환은 폭에 짧고 미세한 CSS transition을 적용한다.
- shell의 본문 영역은 기존 flex 흐름으로 남은 폭을 자동 사용한다.

## 최소 구현 변경

1. `PortalSidebar`에 boolean 상태와 토글 핸들러를 추가한다.
2. Sidebar root에 펼침/접힘 상태 class 또는 data attribute를 연결한다.
3. 기존 폭 token을 펼침 `256px`, 접힘 `40px`로 분기하고 메뉴 콘텐츠를 접힘 시 숨긴다.
4. 기존 `Button`을 재사용해 chevron 토글 버튼을 렌더링한다.
5. App, 페이지 설정, 라우팅, export registry에는 변경을 추가하지 않는다.

새 상태 관리 라이브러리, provider별 아이콘, 별도 Sidebar 컴포넌트, localStorage 저장은 만들지 않는다.

## 접근성

- 토글 버튼은 `aria-expanded="true|false"`를 현재 상태와 동기화한다.
- 펼침 상태의 버튼 `aria-label`은 `네비게이션바 접기`, 접힘 상태의 버튼은 `네비게이션바 펼치기`로 제공한다.
- 기존 `Button`의 native button semantics와 keyboard focus/Enter·Space 동작을 유지한다.
- 접힌 상태에서도 토글 버튼은 키보드로 도달 가능하고 visible focus를 유지한다.
- 메뉴를 숨길 때 비활성화된 중복 focus 대상이 남지 않도록 기존 메뉴 콘텐츠를 함께 숨긴다.

## 검증 및 acceptance

1. 초기 진입과 새로고침에서 Sidebar가 `256px`로 펼쳐진다.
2. 토글 클릭 또는 keyboard activation으로 펼침과 접힘이 왕복한다.
3. 접힘 상태의 실제 폭은 `40px`이고 chevron 버튼만 중앙에 보인다.
4. 접힘 상태에서 본문 flex 영역이 확장되고 수평 overflow가 발생하지 않는다.
5. 펼침 상태의 메뉴, active route, hash navigation, back/forward 동작이 기존과 같다.
6. 버튼의 `aria-expanded`, 한국어 `aria-label`, keyboard focus가 상태별로 정확하다.
7. 기존 test, typecheck, lint, build와 production check가 통과한다.
8. standalone HTML export는 기존처럼 Sidebar를 포함하지 않으며 결과가 변하지 않는다.

## 비범위

- 접힘 상태 localStorage 저장 또는 사용자별 preference
- provider별 메뉴 아이콘, tooltip, 새 routing/hash, 메뉴 동작 변경
- 모바일 전용 동작이나 responsive 재설계
- standalone HTML export의 Sidebar 또는 export 내용 변경
- 새 dependency, generic layout abstraction, 페이지별 예외 처리
