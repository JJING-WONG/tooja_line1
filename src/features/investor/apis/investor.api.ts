import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type TeamList = components["schemas"]["TeamList"];

/**
 * 투자자 부스 목록 조회: GET /api/v1/investor/teams
 * 요청: 투자자 세션 쿠키로 인증. 본문·쿼리 파라미터·CSRF 헤더 없음.
 * 응답: 200, TeamList — { investor: Investor, teams: Team[], asOf: string, investmentStatus: InvestmentStatus }.
 * 현재 투자자 현황과 팀 번호 오름차순의 20개 부스를 반환합니다.
 * 자기 팀·투자 완료 팀도 포함하며, 상태와 본인 투자액은 서버 응답을 사용합니다.
 * signal은 조회 취소용이며 HTTP 요청 데이터로 전송하지 않습니다.
 */
export const getInvestorTeams = async (
  signal?: AbortSignal,
): Promise<TeamList> => {
  const response = await apiClient.get<TeamList>("/investor/teams", {
    signal,
  });

  return response.data;
};
