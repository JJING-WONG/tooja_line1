import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type CsrfResponse = components["schemas"]["Csrf"];
type LoginInput = components["schemas"]["LoginInput"];
type InvestorSession = components["schemas"]["InvestorSession"];
type AdminSession = components["schemas"]["AdminSession"];

/**
 * 투자자 로그인 준비: GET /api/v1/investor/csrf
 * 사용처: P01 로그인 준비(useInvestorLogin), P02 로그아웃 시 토큰 복구(useInvestorLogout).
 * 요청: 본문·CSRF 헤더 없음.
 * 응답: 200, CsrfResponse (schema: Csrf) — { csrfToken: string }.
 * 유효한 세션이 없으면 서버가 로그인 준비 HttpOnly 쿠키를 발급합니다.
 */
export const getInvestorCsrf = async (): Promise<CsrfResponse> => {
  const response = await apiClient.get<CsrfResponse>("/investor/csrf");

  return response.data;
};

/**
 * 투자자 로그인: POST /api/v1/investor/session
 * 사용처: P01 로그인 페이지에서 코드 제출 시 useInvestorLogin이 호출합니다.
 * 요청 본문: LoginInput — { code: string } (ASCII 숫자 4자리, 앞자리 0 유지).
 * 요청 헤더: X-CSRF-Token — 투자자 로그인 준비 API에서 받은 토큰.
 * 응답: 200, InvestorSession — { investor: Investor, csrfToken: string, expiresAt: string }.
 * 서버가 세션 HttpOnly 쿠키를 발급하며, 이후 요청에는 응답의 새 csrfToken을 사용합니다.
 */
export const loginInvestor = async (
  input: LoginInput,
  csrfToken: string,
): Promise<InvestorSession> => {
  const response = await apiClient.post<InvestorSession>(
    "/investor/session",
    { code: input.code },
    { headers: { "X-CSRF-Token": csrfToken } },
  );

  return response.data;
};

/**
 * 투자자 세션 조회·복구: GET /api/v1/investor/session
 * 사용처: P01 및 투자자 보호 화면(P02~P05)의 공통 인증 처리(useInvestorSession).
 * 호출 시점: 화면 진입·새로고침 시 세션을 복구하며, P05는 페이지 구현 후 같은 인증 처리를 적용합니다.
 * 요청: 본문·CSRF 헤더 없이 투자자 세션 쿠키로 인증.
 * 응답: 200, InvestorSession — { investor: Investor, csrfToken: string, expiresAt: string }.
 * expiresAt은 UTC 만료 시각이며, 조회로 세션 만료가 연장되지 않습니다.
 */
export const getInvestorSession = async (
  signal?: AbortSignal,
): Promise<InvestorSession> => {
  const response = await apiClient.get<InvestorSession>("/investor/session", {
    signal,
  });

  return response.data;
};

/**
 * 투자자 로그아웃: DELETE /api/v1/investor/session
 * 사용처: P02 투자 홈의 로그아웃 버튼에서 useInvestorLogout이 호출합니다.
 * 요청 본문: 없음.
 * 요청 헤더: X-CSRF-Token — 현재 투자자 세션 또는 로그인 준비 API의 토큰.
 * 응답: 204 No Content — 본문 없음, 함수 반환 타입 Promise<void>.
 * 현재 브라우저의 투자자 세션·로그인 준비 쿠키만 폐기하며 관리자 세션은 유지합니다.
 */
export const logoutInvestor = async (csrfToken: string): Promise<void> => {
  await apiClient.delete<void>("/investor/session", {
    headers: { "X-CSRF-Token": csrfToken },
  });
};

/**
 * 관리자 로그인 준비: GET /api/v1/admin/csrf
 * 사용 예정: A01 로그인 준비, 관리자 공통 로그아웃 시 토큰 복구. 현재 화면 미연동.
 * 요청: 본문·쿼리·CSRF 헤더 없음. 로그인 여부와 관계없이 호출할 수 있습니다.
 * 응답: 200, CsrfResponse (schema: Csrf) — { csrfToken: string }.
 * 유효한 관리자 세션이 없으면 서버가 로그인 준비 HttpOnly 쿠키를 발급합니다.
 * 가장 최근 관리자용 토큰을 사용하고 로그인 성공 후 응답의 새 토큰으로 교체합니다.
 * 투자자용 토큰과 혼용하지 않습니다.
 */
export const getAdminCsrf = async (): Promise<CsrfResponse> => {
  const response = await apiClient.get<CsrfResponse>("/admin/csrf");

  return response.data;
};

/**
 * 관리자 로그인: POST /api/v1/admin/session
 * 사용 예정: A01 관리자 로그인 페이지에서 코드 제출 시 호출. 현재 화면 미연동.
 * 요청 본문: LoginInput — { code: string } (ASCII 숫자 4자리, 앞자리 0 유지).
 * 요청 헤더: X-CSRF-Token — 관리자 로그인 준비 API에서 받은 토큰.
 * 응답: 200, AdminSession — { admin, csrfToken, expiresAt }.
 * 서버가 관리자 세션 HttpOnly 쿠키를 발급하며 투자자 세션은 유지합니다.
 * 이후 관리자 쓰기 요청에는 로그인 응답의 새 csrfToken을 사용해야 합니다.
 */
export const loginAdmin = async (
  input: LoginInput,
  csrfToken: string,
): Promise<AdminSession> => {
  const response = await apiClient.post<AdminSession>(
    "/admin/session",
    { code: input.code },
    { headers: { "X-CSRF-Token": csrfToken } },
  );

  return response.data;
};

/**
 * 관리자 세션 조회·복구: GET /api/v1/admin/session
 * 사용 예정: A01 기존 로그인 확인, A02~A04 공통 인증·접근 제어. 현재 화면 미연동.
 * 호출 시점: 관리자 화면 진입·새로고침 시 세션과 CSRF 토큰을 복구합니다.
 * 요청: 관리자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, AdminSession — { admin, csrfToken, expiresAt }.
 * expiresAt은 UTC 만료 시각이며 조회로 만료 시각을 연장하지 않습니다.
 * 투자자(STAFF 포함) 로그인은 관리자 인증을 대신하지 않습니다.
 * 401·403 등 HTTP 오류는 호출부에 전달합니다.
 */
export const getAdminSession = async (
  signal?: AbortSignal,
): Promise<AdminSession> => {
  const response = await apiClient.get<AdminSession>("/admin/session", {
    signal,
  });

  return response.data;
};

/**
 * 관리자 로그아웃: DELETE /api/v1/admin/session
 * 사용 예정: A02~A04의 공통 AdminLayout 사이드바 로그아웃 버튼. 현재 화면 미연동.
 * 요청 본문: 없음.
 * 요청 헤더: X-CSRF-Token — 현재 관리자 세션 또는 관리자 로그인 준비 API의 토큰.
 * 응답: 204 No Content — 본문 없음, 함수 반환 타입 Promise<void>.
 * 현재 브라우저의 관리자 세션·준비 쿠키만 폐기하며 투자자 세션은 유지합니다.
 * 세션 만료 후에도 CSRF가 필요하므로 호출부에서 getAdminCsrf로 토큰을 복구합니다.
 * HTTP 오류는 호출부에 전달하며 이 함수는 자동 재발급·재시도하지 않습니다.
 */
export const logoutAdmin = async (csrfToken: string): Promise<void> => {
  await apiClient.delete<void>("/admin/session", {
    headers: { "X-CSRF-Token": csrfToken },
  });
};
