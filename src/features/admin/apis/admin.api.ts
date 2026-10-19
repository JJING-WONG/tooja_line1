import { apiClient } from "../../../apis/client";
import type { components, operations } from "../../../apis/schema";

type Overview = components["schemas"]["Overview"];
type InvestmentStatusInput = components["schemas"]["InvestmentStatusInput"];
type InvestmentStatus = components["schemas"]["InvestmentStatus"];
type InvestorList = components["schemas"]["InvestorList"];
type InvestorListParams = operations["listInvestors"]["parameters"]["query"];

/**
 * 관리자 운영 현황 조회: GET /api/v1/admin/overview
 * 사용 예정: A02 운영 현황 진입 및 자동 갱신 시 현황 카드·역할별 표를 표시. 현재 화면 미연동.
 * 요청: 관리자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, Overview — { total, participants, staff, asOf, snapshotVersion, investmentStatus }.
 * total은 전체, participants·staff는 참가자·운영팀 투자자 집계이며 관리자는 제외합니다.
 * 미로그인·미지급자는 등록 수에 포함되지만 소진·미소진 수에는 포함되지 않습니다.
 * asOf는 조회 시각(UTC), snapshotVersion은 투자 커밋 버전으로 서로 구분합니다.
 * investmentStatus도 포함되므로 A02에서 접수 상태를 별도 조회할 필요는 없습니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다.
 */
export const getAdminOverview = async (
  signal?: AbortSignal,
): Promise<Overview> => {
  const response = await apiClient.get<Overview>("/admin/overview", {
    signal,
  });

  return response.data;
};

/**
 * 전체 투자 중지·재개: PATCH /api/v1/admin/investment-status
 * 사용 예정: A02~A04 공통 AdminLayout 사이드바의 투자 시작·종료 버튼. 현재 화면 미연동.
 * 요청 본문: InvestmentStatusInput — { status: "RUNNING" | "PAUSED" }.
 * 요청 헤더: X-CSRF-Token — 현재 관리자용 토큰. 관리자 세션 쿠키로 인증합니다.
 * 응답: 200, InvestmentStatus — { status, revision, updatedAt? }.
 * RUNNING은 시작·재개, PAUSED는 신규 투자 중지이며 최종 마감·결과 동결이 아닙니다.
 * 중지해도 로그인·조회·기존 성공 영수증 복구는 가능하며 확정 거래는 유지됩니다.
 * 같은 상태를 재요청하면 revision·updatedAt을 변경하지 않습니다.
 * HTTP 오류는 호출부에 전달하며 이 함수는 자동 재시도·CSRF 재발급을 하지 않습니다.
 */
export const updateInvestmentStatus = async (
  input: InvestmentStatusInput,
  csrfToken: string,
): Promise<InvestmentStatus> => {
  const response = await apiClient.patch<InvestmentStatus>(
    "/admin/investment-status",
    { status: input.status },
    { headers: { "X-CSRF-Token": csrfToken } },
  );

  return response.data;
};

/**
 * 관리자 투자자 목록 조회: GET /api/v1/admin/investors
 * 사용 예정: A03 진입·검색·필터 변경·자동 갱신 시 호출. 현재 화면 미연동.
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
  });

  return response.data;
};
