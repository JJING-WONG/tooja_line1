# MALLAGE Frontend Development Guide

## 1. 프로젝트 개요

MALLAGE는 1호선톤 해커톤에서 사용하는 가상 투자 서비스입니다.

주요 사용자:
- 투자자: 팀 조회, 가상 투자, 투자 내역 확인
- 관리자: 투자자 관리, 투자 일시정지 및 재개
- 대시보드: 투자 순위 공개

프론트엔드 개발자는 1명입니다.

## 2. 기술 스택

- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Axios
- TanStack Query

기존 기술 스택을 우선 사용하고 불필요한 라이브러리는 추가하지 않습니다.

## 3. 아키텍처

상세 설계는 `docs/ARCHITECTURE.md`를 참고합니다.

기본 원칙:
- pages: 라우트 단위 페이지
- features: 기능별 비즈니스 로직 및 컴포넌트
- components/ui: 공통 UI 컴포넌트
- apis/client.ts: 공통 Axios 인스턴스
- features/*/apis: 기능별 API 요청 함수
- layouts: 공통 레이아웃

기존 구조를 우선 유지합니다.

## 4. API 연동 규칙

- API 기본 경로는 `/api/v1`입니다.
- 공통 Axios 인스턴스를 사용합니다.
- 로컬 개발 환경에서는 Vite 프록시를 사용합니다.
- API 타입은 `src/apis/schema.d.ts`를 우선 활용합니다.
- API 명세를 추측하지 않습니다.
- 서버 상태는 TanStack Query로 관리합니다.

## 5. 인증 규칙

- HttpOnly 세션 쿠키 기반 인증을 사용합니다.
- JWT 및 LocalStorage 기반 인증을 임의로 도입하지 않습니다.
- CSRF 토큰은 인증 요청에 맞게 관리합니다.
- 로그인 성공 후 새로운 CSRF 토큰으로 갱신합니다.
- 투자자와 관리자 인증 상태를 구분합니다.
- 새로고침 시 세션 복구를 지원합니다.

## 6. 개발 규칙

- 글꼴은 영어에 Anta, 한글에 Noto Sans KR을 사용합니다. 기본 font-family 순서는 "Anta", "Noto Sans KR", sans-serif이며, 이후 UI 작업에서도 유지합니다.
- TypeScript 타입 안정성을 유지합니다.
- 불필요한 any 사용을 지양합니다.
- 기존 코드와 네이밍 컨벤션을 따릅니다.
- 과도한 추상화와 불필요한 파일 생성을 피합니다.
- 구현 후 관련 기능을 검증합니다.
- 작업 완료 후 변경 사항과 테스트 결과를 요약합니다.

## 7. Codex 작업 방식

- 작업 전 관련 파일과 아키텍처 문서를 확인합니다.
- 요청 범위를 벗어난 코드는 수정하지 않습니다.
- 큰 변경 작업은 구현 전에 계획을 제시합니다.
- 중요한 기술적 선택에는 이유를 설명합니다.
- 기존 기능에 영향을 줄 수 있는 변경 사항을 알려줍니다.
- 사용자가 직접 이해하고 개발할 수 있도록 설명합니다.


현재 작업 상태는 `docs/PROGRESS.md`를 참고합니다.
