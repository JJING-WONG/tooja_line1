import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type Dashboard = components["schemas"]["Dashboard"];
type InvestmentStatus = components["schemas"]["InvestmentStatus"];

/**
 * 공개 투자 순위 조회: GET /api/v1/public/dashboard
 * 사용 예정: D01 대형 대시보드 진입·주기적 갱신 시 순위와 전체 현황을 조회. 현재 화면 미연동.
 * 요청: 로그인·CSRF 불필요. 본문·쿼리 없음.
 * 응답: 200, Dashboard — { teams, totalInvestedAmount, investedInvestorCount, snapshotVersion, asOf }.
 * teams는 유치금 내림차순의 20개 팀이며 0원인 팀도 포함합니다.
 * 공동 순위는 1·1·3이며 전체 0원이면 모두 1위입니다. 배열 인덱스 대신 rank를 사용합니다.
 * 순위 변화·최근 증가액은 호출부에서 이전 결과와 비교하고, 같은 snapshotVersion이면
 * 순위 변동 효과를 반복하지 않습니다. asOf는 조회 기준 시각(UTC)입니다.
 * HTTP 오류는 그대로 전달합니다. 429 시 호출부에서 Retry-After(초)를 확인해 재시도합니다.
 * signal은 조회 취소용이며 이 함수는 주기적 호출·자동 재시도를 수행하지 않습니다.
 */
export const getDashboard = async (
  signal?: AbortSignal,
): Promise<Dashboard> => {
  const response = await apiClient.get<Dashboard>("/public/dashboard", {
    signal,
  });

  return response.data;
};

/**
 * 공개 투자 접수 상태 조회: GET /api/v1/public/investment-status
 * 사용 예정: D01에서 투자 진행·중지 안내를 표시할 경우 조회. 안내 디자인 및 화면 연동은 대기 중.
 * 요청: 로그인·CSRF 불필요. 본문·쿼리 없음.
 * 응답: 200, InvestmentStatus — { status, revision, updatedAt? }.
 * RUNNING은 신규 투자 접수, PAUSED는 신규 투자 중지이며 로그인·조회는 계속 가능합니다.
 * revision은 실제 접수 상태 변경 때만 증가하며 투자 snapshotVersion과 별개입니다.
 * updatedAt은 마지막 상태 변경 시각(UTC)이며 최초 상태에서는 null일 수 있습니다.
 * HTTP 오류는 호출부에 전달하며 signal은 조회 취소용입니다.
 * 이 함수는 주기적 호출·자동 재시도를 수행하지 않습니다.
 */
export const getInvestmentStatus = async (
  signal?: AbortSignal,
): Promise<InvestmentStatus> => {
  const response = await apiClient.get<InvestmentStatus>(
    "/public/investment-status",
    { signal },
  );

  return response.data;
};
