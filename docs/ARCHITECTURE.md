# MALLAGE 프론트엔드 아키텍처

현재 코드의 구조와 데이터·인증 흐름을 설명한다. 실행 방법은 [README](../README.md), 구현 현황·다음 작업·검증 상태는 [PROGRESS](./PROGRESS.md), 개발 규칙은 [AGENTS](../AGENTS.md)에서 관리한다.

## 1. 기술 스택·앱 진입점

| 영역 | 기술·역할 |
| --- | --- |
| UI | React 19·TypeScript |
| 개발·빌드 | Vite 8 |
| 스타일 | Tailwind CSS v4·전역 CSS |
| 라우팅 | React Router |
| API 통신 | 공통 Axios 인스턴스 |
| 서버 상태 | TanStack Query |
| API 타입 | OpenAPI 기반 openapi-typescript 생성 타입 |

[main.tsx](../src/main.tsx)에서 `StrictMode`·`QueryClientProvider`·`BrowserRouter`로 앱을 감싼다. `QueryClient`는 앱 전체에서 하나를 공유하고, [App.tsx](../src/App.tsx)에서 라우트와 보호 영역을 구성한다.

## 2. 라우팅·권한

| ID | 경로 | 페이지 | 화면 기준 | 접근 조건 |
| --- | --- | --- | --- | --- |
| P01 | `/login` | 투자자 로그인 | 모바일 | 투자자 미인증 |
| P02 | `/invest` | 투자 홈 | 모바일 | 투자자 |
| P03 | `/invest/teams/:teamId` | 팀 상세·금액 선택 | 모바일 | 투자자 |
| P03-M | 별도 경로 없음 | 투자 확인·결과 복구 모달 | 모바일 | 투자자 |
| P04 | `/invest/success/:investmentId` | 투자 완료 | 모바일 | 투자자·거래 소유자(API 검증) |
| P05 | `/invest/history` | 내 투자 내역 | 모바일 | 투자자 |
| A01 | `/admin/login` | 관리자 로그인 | PC | 관리자 미인증 |
| A02 | `/admin` | 운영 현황 | PC | 관리자 |
| A03 | `/admin/investors` | 투자자 목록 | PC | 관리자 |
| A04 | `/admin/investors/:investorId` | 투자자 상세 | PC | 관리자 |
| D01 | `/dashboard` | 공개 대시보드 | PC 16:9 | 공개 |

- `InvestorProtectedRoute`는 투자자 세션을 확인한다. 미인증이면 `/login`, 이미 로그인한 사용자가 P01에 접근하면 `/invest`로 이동한다.
- `AdminProtectedRoute`는 관리자 세션을 확인한다. 미인증이면 `/admin/login`, 이미 로그인한 사용자가 A01에 접근하면 `/admin`으로 이동한다.
- 투자자와 관리자 보호 영역은 독립적이다. 운영팀 투자자(`STAFF`)도 관리자 인증을 별도로 받아야 한다.
- 거래 소유 여부는 서버가 검증한다. P04는 없는 거래·타인 거래의 동일한 404 응답을 접근 불가 UI로 처리한다.
- P03-M 확인은 P03에서 시작한다. 미확정 요청 복구는 투자자 보호 영역 전체에서 수행하므로 별도 라우트를 만들지 않는다.

## 3. 실제 폴더 구조·책임

사용 중인 파일·폴더를 중심으로 표시하며 비어 있는 기능 하위 폴더는 생략한다.

```text
src/
├── apis/
│   ├── client.ts                  # 공통 Axios 인스턴스
│   └── schema.d.ts                # OpenAPI 생성 타입
├── assets/                        # 로고·배치도·아이콘 등 정적 리소스
├── components/ui/                 # 공통 로딩·모바일/PC 오류 모달
├── features/
│   ├── auth/
│   │   ├── apis/                  # 투자자·관리자 CSRF/로그인/세션/로그아웃
│   │   ├── components/            # 역할별 보호 라우트
│   │   └── hooks/                 # 역할별 인증·세션·로그아웃 훅
│   ├── investor/
│   │   ├── apis/                  # 투자자 부스·팀 상세 조회
│   │   ├── components/            # 현황 카드·부스 배치도·부스 항목
│   │   └── hooks/                 # 인증된 투자자별 조회
│   ├── investment/
│   │   ├── apis/                  # 투자 확정·요청 결과·내역·거래 상세
│   │   ├── components/            # 확인 모달·InvestmentFlowProvider
│   │   ├── hooks/                 # 투자 처리·내역/거래 조회
│   │   └── utils/                 # 요청 키 보관·결과 판정·동일 키 복구
│   ├── admin/
│   │   ├── apis/                  # 운영 현황·투자자 조회·접수 상태 변경
│   │   ├── components/            # 사이드바·상태 배지·갱신 오류 모달
│   │   ├── hooks/                 # 현황/목록/상세 조회·접수 상태 변경
│   │   └── utils/                 # 관리자 요청 인증·재요청 대기 공통 처리
│   └── dashboard/
│       └── apis/                  # 공개 순위·투자 접수 상태 요청
├── layouts/
│   ├── AdminLayout.tsx            # 공통 사이드바·운영 현황·접수 제어·Outlet
│   └── InvestorLayout.tsx         # 현재 비어 있으며 라우팅에서 사용하지 않음
├── pages/
│   ├── investor/                  # P01~P05
│   ├── admin/                     # A01~A04
│   └── dashboard/                 # D01
├── App.tsx                        # 라우트·보호 영역 구성
├── main.tsx                       # 전역 Provider·앱 진입점
└── index.css                      # 폰트·테마·공통 스타일

docs/                              # 설계·현황·OpenAPI 명세
scripts/                           # 로컬 응답·캐시·요청 흐름 검증
```

| 위치 | 책임 |
| --- | --- |
| `pages` | URL 해석, 화면 구성, 조회 결과·상태를 UI에 연결 |
| `features/*/apis` | 경로·본문·헤더 구성과 응답 반환. 오류는 호출부에 전달 |
| `features/*/hooks` | TanStack Query 조회/변경, 인증 확인, 캐시 갱신·실패 처리 |
| `features/*/components` | 기능 전용 UI와 기능 범위의 공통 상태 제공 |
| `features/*/utils` | 요청 결과 복구·재요청 대기 등 UI와 분리된 처리 |
| `components/ui` | 특정 기능에 종속되지 않는 공통 표현·접근성 처리 |

타입은 `schema.d.ts`의 `components`·`operations`를 우선 사용하고 필요한 타입 별칭은 사용 파일 가까이에 둔다. 폴더는 실제 필요할 때 추가하며 별도 `types` 계층을 일괄 생성하지 않는다.

## 4. API 통신·개발 프록시

- [client.ts](../src/apis/client.ts)의 `apiClient`는 `baseURL: "/api/v1"`, `withCredentials: true`를 사용한다.
- 기능별 요청 함수는 공통 접두사를 제외한 경로를 전달한다. 예: `/investor/teams`, `/admin/overview`.
- [vite.config.ts](../vite.config.ts)는 `.env`의 `API_PROXY_TARGET`을 개발 서버의 프록시 대상으로 사용한다. 프론트엔드 요청 경로 자체를 환경변수로 바꾸는 구조가 아니다.
- 개발 프록시는 백엔드 Origin 검사에 맞춰 `Origin`을 설정하고, 로컬 HTTP에서 쿠키를 사용할 수 있도록 응답 쿠키의 `Secure` 속성을 제거한다. 이 처리는 개발 서버 설정이다.
- `preview`·배포 환경은 `/api/v1` 전달과 SPA 경로의 `index.html` 복귀 설정을 별도로 구성해야 한다.
- 명세는 [openapi.json](./openapi.json), 타입은 [schema.d.ts](../src/apis/schema.d.ts)를 기준으로 한다. `npm run api:sync`로 함께 갱신한다.
- 조회에는 `AbortSignal`을 전달해 화면·조건·사용자 변경 또는 로그아웃 시 진행 중인 요청을 취소한다. CSRF는 필요한 변경 요청의 헤더에 전달한다.

## 5. 서버 상태·캐시

### 쿼리 키

| 데이터 | 쿼리 키 |
| --- | --- |
| 투자자 세션 | `["auth", "investor", "session"]` |
| 관리자 세션 | `["auth", "admin", "session"]` |
| 로그인 준비 토큰 | `["auth", 역할, "csrf"]` |
| 투자자 현황·부스 | `["investor", "teams", investorId]` |
| 팀 상세 | `["investor", "team", investorId, teamId]` |
| 내 투자 내역 | `["investor", "investments", investorId]` |
| 본인 거래 상세 | `["investor", "investment", investorId, investmentId]` |
| 관리자 운영 현황 | `["admin", "overview", adminId]` |
| 관리자 투자자 목록 | `["admin", "investors", adminId, filters]` |
| 관리자 투자자 상세 | `["admin", "investor", adminId, investorId]` |

- 사용자 ID·경로값·검색 조건을 키에 포함한다. 다른 사용자·조건의 결과를 현재 데이터로 표시하지 않는다.
- 조회 훅은 인증된 사용자와 로그아웃 여부를 확인한다. 인증 오류는 세션 처리로 연결하고 통신·서버 오류에서는 세션을 유지한다.
- 투자 성공 시 투자자 데이터·세션을 무효화하고, 접수 상태 변경 성공 시 관리자 데이터를 무효화한다. 화면 진입·활성화 조건에 따라 다시 조회한다.
- 로그아웃은 해당 역할의 진행 중인 조회를 취소하고 데이터·CSRF 캐시와 로그인 mutation에 남은 정보를 정리한 뒤 세션 캐시를 `null`로 설정한다. 다른 역할·공개 데이터는 유지한다.
- 변경 요청은 `useMutation`과 동기 `useRef` 잠금으로 중복 제출을 막는다. 투자 결과 확인·CSRF 갱신 등의 재전송은 훅·복구 함수에서 명시적으로 제어한다.

### 관리자 공통 상태

[AdminLayout](../src/layouts/AdminLayout.tsx)이 `useAdminOverview`·`useUpdateInvestmentStatus`·`useAdminLogout`을 사용한다. 조회 결과와 처리 상태는 `Outlet` 컨텍스트로 본문에 전달하고, 사이드바도 같은 접수 상태를 사용한다.

- 공통 운영 현황은 1초, A03 목록은 2초 주기로 갱신한다. 숨겨진 탭·로그아웃·접수 상태 변경 중에는 주기 조회를 중단한다.
- A04 상세는 주기 조회 없이 진입·포커스·재연결·수동 재시도로 갱신한다.
- `adminRequest.ts`는 관리자 세션 확인과 인증 오류·`Retry-After`를 처리한다. 관리자별 재요청 허용 시각을 `["admin", "request-cooldown", adminId]`에 보관해 조회·변경 요청이 함께 준수한다.
- 최초 로딩·조회 실패와 기존 데이터가 있는 갱신 실패를 구분한다. A02·A03의 자동 갱신 실패는 기존 데이터를 유지하며 동일 장애의 모달 반복 표시를 막는다.
- 접수 상태 변경 전 이전 관리자 조회를 취소한다. 서버 성공 응답을 확인한 뒤 상태를 반영하고, 응답 유실 시 현황 재조회로 변경 여부를 확인한다.

화면 표시 시각은 `Asia/Seoul`로 변환한다. 응답의 `asOf`는 조회 기준 시각, `snapshotVersion`은 투자 커밋 버전, `investmentStatus.revision`은 접수 상태 변경 버전으로 구분한다.

## 6. 역할별 인증 흐름

1. 역할에 맞는 CSRF API로 로그인 준비 토큰을 발급한다.
2. 숫자 4자리 코드를 문자열로 제출한다. 앞자리 0을 유지한다.
3. 로그인 성공 응답의 세션·새 CSRF 토큰을 역할별 쿼리 캐시에 보관한다.
4. 보호 라우트는 새로고침 시 역할별 세션 조회로 인증을 복구한다.
5. 변경 요청에 현재 역할의 CSRF 토큰을 전달한다. 투자·접수 상태 변경·로그아웃 훅은 `CSRF_INVALID`에서 토큰 복구·제한된 재시도를 처리한다.
6. 로그아웃 성공 시 해당 역할의 캐시를 정리하고 해당 로그인 경로로 이동한다.

세션 쿠키는 HttpOnly이며 브라우저가 관리한다. CSRF 토큰은 메모리의 쿼리 캐시에서 관리하고, JWT·LocalStorage 기반 인증을 도입하지 않는다. 투자자와 관리자는 같은 브라우저에서 각자의 쿠키·캐시로 동작한다.

## 7. 투자 확정·결과 복구

### 구성과 생명주기

- [InvestmentFlowProvider](../src/features/investment/components/InvestmentFlowProvider.tsx)는 `InvestorProtectedRoute`의 인증된 투자자 영역에서 한 번 생성되고 투자자 ID를 `key`로 사용한다.
- P03은 `useInvestmentConfirmation`으로 선택 금액을 전달한다. Provider가 확인·전송·결과 확인·실패 모달과 배경 조작 잠금을 관리한다.
- [useCreateInvestment](../src/features/investment/hooks/useCreateInvestment.ts)는 mutation·현재 사용자 확인·임시 요청 보관·캐시 갱신·P04 이동을 담당한다.
- [investmentRequest.ts](../src/features/investment/utils/investmentRequest.ts)는 오류 판정·동일 키 복구·저장소 입출력을 담당한다.

페이지의 팀 상세 재조회·라우트 이동으로 진행 중인 투자 상태가 사라지지 않도록 Provider를 페이지 밖에 둔다. 일반 입력·필터·선택 상태는 각 화면의 `useState`로 관리하고, 중복 제출 잠금 등 즉시 반영할 값은 `useRef`를 사용한다.

### 요청·복구 순서

1. 제출 직전 현재 투자자·팀 상태·허용 금액을 확인한다. 최종 투자 가능 여부는 서버가 검증한다.
2. UUID v4 요청 키와 고정한 `teamId`·`amount`를 투자자 ID별 `sessionStorage`에 먼저 보관한다. 저장 실패 시 전송하지 않는다.
3. #8 투자 확정 요청에 `Idempotency-Key`·현재 CSRF 토큰을 보낸다.
4. 성공하면 임시 요청을 정리하고 영수증의 거래 ID로 P04에 이동한다. P04는 #10으로 거래와 현재 잔액을 조회한다.
5. 결과가 불확실하면 #11을 조회한다. `SUCCEEDED`는 성공, `REJECTED`는 저장된 거절이다.
   결과 확인 중 표시는 클라이언트 UI 상태이며 명세에 없는 서버 `PROCESSING` 상태를 가정하지 않는다.
6. `REQUEST_RESULT_NOT_FOUND`일 때만 같은 키·같은 본문으로 #8을 재전송한다. 조회 실패를 투자 실패로 단정하거나 새 키로 자동 재전송하지 않는다.
7. 계속 확인할 수 없으면 요청을 보관하고 사용자 재확인을 제공한다. 새로고침·같은 투자자 재로그인 후에도 기존 결과 확인부터 수행한다.

임시 보관에는 투자자 ID·요청 키·본문·필요한 재요청 허용 시각만 포함한다. 로그인 코드·세션 쿠키·CSRF 토큰은 저장하지 않는다. 처리 중 버튼·Esc·배경·로그아웃을 잠그고, 불확실한 요청이 남아 있으면 새 투자 대신 결과 재확인을 진행한다.

API별 구현·화면 연결·실제 서버 검증 여부는 [PROGRESS](./PROGRESS.md)를 기준으로 확인한다.
