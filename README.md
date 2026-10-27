# MALLAGE

> 1호선톤 해커톤에서 사용하는 가상 투자 서비스의 프론트엔드 프로젝트

참가자와 운영팀 투자자가 부스를 체험하고 가상 투자금을 배분하는 서비스입니다. 투자자는 팀별 소개와 자신의 투자 현황을 확인하고, 관리자는 전체 운영 현황과 투자자를 조회하며 투자 접수를 중단하거나 재개할 수 있습니다.

- 개발 기간: 2026.10 ~ 진행 중
- 투자자 화면: 모바일 중심
- 관리자 화면: PC 중심
- 공개 대시보드: 행사장 대형 화면

투자자는 사전 등록 시 투자금 100만 원을 지급받으며, 로그인 시 재지급되지 않습니다. 투자자 이름은 등록된 정보를 조회하며 관리자 화면에서 수정하지 않습니다.

## 주요 기능

| 구분 | 기능 |
| --- | --- |
| 투자자 | 코드 로그인·세션 복구·로그아웃, 20개 부스 조회, 팀 상세·잔액 확인, 투자 확정·결과 복구, 투자 완료·내역 조회 |
| 관리자 | 별도 관리자 인증, 운영 현황 자동 갱신, 투자 시작·중단, 투자자 검색·필터·상세 조회 |
| 공개 대시보드 | 팀별 투자 순위·공동 순위·전체화면·로딩·오류 UI |

투자자·관리자 화면은 API 연결을 완료했으며 실제 서버·브라우저 통합 검증이 남아 있습니다. 공개 대시보드는 순위 API를 연결했으며, 일시정지 안내 UI의 접수 상태 API 연결이 남아 있습니다. 화면·API별 진행 상태는 [개발 진행 상황](docs/PROGRESS.md)에서 관리합니다.

## 기술 스택

| 용도 | 기술 |
| --- | --- |
| UI | React 19, TypeScript |
| 개발·빌드 | Vite 8 |
| 스타일 | Tailwind CSS v4 |
| 라우팅 | React Router |
| API 통신 | Axios |
| 서버 상태 | TanStack Query |
| API 타입 생성 | openapi-typescript |

## 로컬 실행

### 1. 준비·설치

- Node.js: 현재 Vite 의존성이 요구하는 `^20.19.0 || >=22.12.0`
- 패키지 관리자: npm (`package-lock.json` 사용)

프로젝트 루트에서 실행합니다.

```sh
npm ci
```

### 2. 환경변수 설정

루트에 `.env` 파일을 생성하고 백엔드 주소를 설정합니다.

```dotenv
API_PROXY_TARGET=http://localhost:8080
```

위 주소는 예시이며, 실제 사용할 백엔드의 기본 주소로 바꿉니다. `/api/v1`은 붙이지 않습니다.

프론트엔드는 `/api/v1`로 요청하고, Vite 개발 서버가 해당 요청을 `API_PROXY_TARGET`으로 전달합니다. 현재 Vite 설정은 개발·빌드·미리보기 실행 시 이 환경변수를 요구합니다.

### 3. 개발 서버 실행

```sh
npm run dev
```

터미널에 출력된 개발 서버 주소에서 아래 경로로 접속합니다.

| 경로 | 화면 |
| --- | --- |
| `/login` | 투자자 로그인 |
| `/admin/login` | 관리자 로그인 |
| `/dashboard` | 공개 대시보드 |

투자자·관리자 로그인에는 백엔드에 등록된 각 역할의 숫자 4자리 코드가 필요합니다. 투자자 로그인은 관리자 접근 권한을 부여하지 않습니다.

## 개발 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | TypeScript 검사 후 프로덕션 빌드 (`dist/`) |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과 로컬 미리보기. 먼저 `npm run build` 실행 |
| `npm run api:sync` | 백엔드 OpenAPI 명세 다운로드 및 TypeScript 타입 재생성 |

`api:sync`는 `curl`을 사용해 `https://api.leafeep.com/v3/api-docs`의 명세를 [docs/openapi.json](docs/openapi.json)에 내려받고 [src/apis/schema.d.ts](src/apis/schema.d.ts)를 갱신합니다.

Vite의 API 프록시는 개발 서버용입니다. `preview`와 배포 환경에서는 `/api/v1` 요청을 전달할 별도 서버·프록시 설정이 필요합니다.

## 프로젝트 구조

```text
src/
├── apis/               # 공통 Axios 인스턴스·OpenAPI 생성 타입
├── assets/             # 이미지·SVG 등 정적 리소스
├── components/ui/      # 공통 로딩·오류 UI
├── features/           # 기능별 API·훅·컴포넌트
│   ├── auth/           # 투자자·관리자 인증
│   ├── investor/       # 투자자 현황·부스·팀 상세
│   ├── investment/     # 투자 요청·결과 복구·내역
│   ├── admin/          # 운영 현황·투자자 관리·접수 제어
│   └── dashboard/      # 공개 대시보드
├── layouts/            # 공통 레이아웃
├── pages/              # 라우트 단위 페이지
├── App.tsx             # 라우팅 설정
├── main.tsx            # 앱 진입점·전역 Provider
└── index.css           # 전역 스타일

docs/                   # 아키텍처·진행 상황·OpenAPI 명세
scripts/                # 로컬 API·상태 처리 검증 스크립트
```

## 관련 문서

- [아키텍처·라우팅 설계](docs/ARCHITECTURE.md)
- [화면·API 진행 상황과 남은 검증](docs/PROGRESS.md)
- [개발 가이드](AGENTS.md)
- [OpenAPI 명세](docs/openapi.json)
- [API 생성 타입](src/apis/schema.d.ts)
