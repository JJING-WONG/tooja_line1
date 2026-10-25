import { apiClient } from "../../../apis/client";
import type { components, operations } from "../../../apis/schema";

type Overview = components["schemas"]["Overview"];
type InvestmentStatusInput = components["schemas"]["InvestmentStatusInput"];
type InvestmentStatus = components["schemas"]["InvestmentStatus"];
type InvestorList = components["schemas"]["InvestorList"];
type InvestorListParams = operations["listInvestors"]["parameters"]["query"];
type InvestorDetail = components["schemas"]["InvestorDetail"];

/**
 * 관리자 운영 현황 조회: GET /api/v1/admin/overview
 * 사용처: AdminLayout의 useAdminOverview에서 A02 현황 카드·역할별 표와 A02~A04 공통 사이드바의 투자 접수 상태 조회.
 * 요청: 관리자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, Overview — { total, participants, staff, asOf, snapshotVersion, investmentStatus }.
 * total은 전체, participants·staff는 참가자·운영팀 투자자 집계이며 관리자는 제외합니다.
 * 미로그인·미지급자는 등록 수에 포함되지만 소진·미소진 수에는 포함되지 않습니다.
 * asOf는 조회 시각(UTC), snapshotVersion은 투자 커밋 버전으로 서로 구분합니다.
 * investmentStatus도 포함되므로 A02에서 접수 상태를 별도 조회할 필요는 없습니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다. 15초 제한으로 조회 지연을 오류 UI에 전달합니다.
 */
export const getAdminOverview = async (
  signal?: AbortSignal,
): Promise<Overview> => {
  const response = await apiClient.get<Overview>("/admin/overview", {
    signal,
    timeout: 15_000,
  });

  return response.data;
};

/**
 * 전체 투자 중지·재개: PATCH /api/v1/admin/investment-status
 * 사용처: A02~A04 공통 AdminLayout의 useUpdateInvestmentStatus에서 사이드바 투자 시작·중단 및 실패 재시도.
 * 요청 본문: InvestmentStatusInput — { status: "RUNNING" | "PAUSED" }.
 * 요청 헤더: X-CSRF-Token — 현재 관리자용 토큰. 관리자 세션 쿠키로 인증합니다.
 * 응답: 200, InvestmentStatus — { status, revision, updatedAt? }.
 * RUNNING은 시작·재개, PAUSED는 신규 투자 중지이며 최종 마감·결과 동결이 아닙니다.
 * 중지해도 로그인·조회·기존 성공 영수증 복구는 가능하며 확정 거래는 유지됩니다.
 * 같은 상태를 재요청하면 revision·updatedAt을 변경하지 않습니다.
 * HTTP 오류는 호출부에 전달하며 이 함수는 자동 재시도·CSRF 재발급을 하지 않습니다. 15초 제한 후 결과 확인은 훅에서 처리합니다.
 */
export const updateInvestmentStatus = async (
  input: InvestmentStatusInput,
  csrfToken: string,
): Promise<InvestmentStatus> => {
  const response = await apiClient.patch<InvestmentStatus>(
    "/admin/investment-status",
    { status: input.status },
    { headers: { "X-CSRF-Token": csrfToken }, timeout: 15_000 },
  );

  return response.data;
};

/**
 * 관리자 투자자 목록 조회: GET /api/v1/admin/investors
 * 사용처: A03의 useAdminInvestors에서 진입·검색어 입력 대기·필터 변경·2초 자동 갱신·수동 재시도 시 호출.
 * A02의 미소진 투자자 보기에서 이동하면 spendingStatus: "UNSPENT"로 조회합니다.
 * 요청: 관리자 세션 쿠키로 인증. 본문·CSRF 헤더 없음.
 * 선택 쿼리: q(별칭·내부 ID 부분 검색, 최대 100자), teamId(1~20),
 * kind(PARTICIPANT·STAFF), spendingStatus(NOT_ACTIVATED·UNSPENT·COMPLETED).
 * 전체 선택은 해당 필터를 생략합니다. UI의 ALL·빈 선택값을 서버로 보내지 않습니다.
 * 여러 필터는 AND 조건이며 STAFF와 teamId를 함께 지정하면 빈 목록입니다.
 * 응답: 200, InvestorList — { items: Investor[], count, asOf }.
 * 별칭·내부 ID순으로 정렬하며 페이지네이션은 없습니다. 결과가 없으면 items: [], count: 0.
 * 상세 이동에는 items의 investorId를 사용하며 로그인 코드는 반환하지 않습니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다.
 */
export const getAdminInvestors = async (
  params?: InvestorListParams,
  signal?: AbortSignal,
): Promise<InvestorList> => {
  const response = await apiClient.get<InvestorList>("/admin/investors", {
    params: {
      q: params?.q,
      teamId: params?.teamId,
      kind: params?.kind,
      spendingStatus: params?.spendingStatus,
    },
    signal,
    timeout: 15_000,
  });

  return response.data;
};

/**
 * 관리자 투자자 상세 조회: GET /api/v1/admin/investors/{investorId}
 * 사용 예정: A04 투자자 상세 진입·새로고침 시 정보·금액 카드·거래 표를 조회. 현재 화면 미연동.
 * 요청 경로: investorId — A03 목록에서 받은 내부 투자자 ID. 로그인 코드가 아닙니다.
 * 요청: 관리자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, InvestorDetail — { investor, investments, asOf }.
 * investor에는 별칭·역할·소속·지급액·투자액·잔액·소진 상태가 포함됩니다.
 * investments는 확정 거래의 최신순 목록이며, 확정 시각과 asOf는 UTC입니다.
 * 미로그인자는 지급액·잔액이 0원, 상태는 NOT_ACTIVATED, 거래는 빈 배열입니다.
 * 운영팀 투자자도 조회 가능하며, 잔액만으로 소진 상태를 판단하지 않습니다.
 * 없는 투자자·비활성 투자자·관리자 ID는 모두 404 RESOURCE_NOT_FOUND입니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다.
 */
export const getAdminInvestor = async (
  investorId: string,
  signal?: AbortSignal,
): Promise<InvestorDetail> => {
  const response = await apiClient.get<InvestorDetail>(
    `/admin/investors/${encodeURIComponent(investorId)}`,
    { signal },
  );

  return response.data;
};
