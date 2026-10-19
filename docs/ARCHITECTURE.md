## 1. 기술 스택

### Core

- React
- TypeScript
- Vite

### Styling

- Tailwind CSS

### Routing

- React-Router

### Data Fetching

- Axios
- TanStack Query

### Deployment

- Vercel

## 2. 라우팅 설계

| ID    | 경로                          | 페이지         | 기기    | 권한        |
| ----- | ----------------------------- | -------------- | ------- | ----------- |
| P01   | /login                        | 로그인         | 모바일  | 공개        |
| P02   | /invest                       | 투자 홈        | 모바일  | 투자자      |
| P03   | /invest/teams/:teamId         | 팀 투자        | 모바일  | 투자자      |
| P03-M | (P03 위 모달)                 | 최종 확인 모달 | 모바일  | 투자자      |
| P04   | /invest/success/:investmentId | 투자 완료      | 모바일  | 거래 소유자 |
| P05   | /invest/history               | 내 투자 내역   | 모바일  | 투자자      |
| A01   | /admin/login                  | 관리자 로그인  | PC      | 공개        |
| A02   | /admin                        | 운영 현황      | PC      | 관리자      |
| A03   | /admin/investors              | 투자자 목록    | PC      | 관리자      |
| A04   | /admin/investors/:investorId  | 투자자 상세    | PC      | 관리자      |
| D01   | /dashboard                    | 대형 대시보드  | PC 16:9 | 공개        |

## 3. 폴더 구조 설계

```text
src/
├── apis/                       # 공통 API 통신 설정
│   └── client.ts               # Axios 인스턴스
│
├── assets/                     # 이미지, 아이콘 등 정적 리소스
│
├── components/
│   └── ui/                     # 공통 UI 컴포넌트
│
├── features/                   # 기능별 코드 관리
│   ├── admin/                  # 관리자 기능
│   │   ├── apis/               # 관리자 API
│   │   └── components/         # 관리자 전용 컴포넌트
│   │
│   ├── auth/                   # 인증 기능
│   │   ├── apis/               # 로그인, 로그아웃, 세션 관련 API
│   │   └── types/              # 인증 관련 타입
│   │
│   ├── dashboard/              # 공개 투자 대시보드
│   │   ├── apis/               # 대시보드 API
│   │   └── components/         # 대시보드 전용 컴포넌트
│   │
│   ├── investment/             # 투자 기능
│   │   ├── apis/               # 투자 요청 및 투자 내역 API
│   │   ├── components/         # 투자 관련 컴포넌트
│   │   └── types/              # 투자 관련 타입
│   │
│   └── investor/               # 투자자 기능
│       ├── apis/               # 투자자 정보 및 팀 조회 API
│       └── components/         # 투자자 전용 컴포넌트
│
├── layouts/                    # 페이지 공통 레이아웃
│   ├── AdminLayout.tsx         # 관리자 레이아웃
│   └── InvestorLayout.tsx      # 투자자 레이아웃
│
├── pages/                      # 라우팅 단위 페이지
│   ├── admin/                  # 관리자 페이지
│   ├── dashboard/              # 공개 대시보드 페이지
│   └── investor/               # 투자자 페이지
│
├── App.tsx                     # 라우팅 설정
├── main.tsx                    # React 진입점 및 전역 Provider 설정
└── index.css                   # 전역 스타일
```

## 4. API 및 상태 관리 설계

### 4.1 API 통신

- Axios를 사용하여 HTTP 요청을 처리
- 공통 Axios 인스턴스를 생성
- API 요청 함수는 기능별로 분리
- API Base URL은 환경변수로 관리

### 4.2 서버 상태 관리

- TanStack Query를 사용
- 서버에서 조회한 데이터의 캐싱을 관리
- 데이터 변경 요청 성공 시 관련 쿼리를 갱신
- 로딩 및 에러 상태를 처리

### 4.3 클라이언트 상태 관리

- 컴포넌트 내부 상태는 useState를 우선 사용
- 불필요한 전역 상태 관리 라이브러리는 도입 X (Ex. zustand)

### 4.4 인증

- HttpOnly 세션 쿠키 기반 인증 사용
- Axios의 withCredentials 설정 적용
- 로그인 전 CSRF 토큰 발급
- 로그인 성공 후 갱신된 CSRF 토큰 사용
- 새로고침 시 세션 조회 API로 인증 상태 복구
- 투자자와 관리자 인증 상태 구분
- 인증 상태 및 권한에 따른 페이지 접근 제어
