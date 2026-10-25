import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type TeamList = components["schemas"]["TeamList"];
type TeamDetail = components["schemas"]["TeamDetail"];

/**
 * 투자자 부스 목록 조회: GET /api/v1/investor/teams
 * 사용처: P02 투자 홈에서 useInvestorTeams가 현황 카드·20개 부스 표시를 위해 호출합니다.
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

/**
 * 투자자 팀 상세 조회: GET /api/v1/investor/teams/{teamId}
 * 사용처: P03의 useInvestorTeam에서 진입·포커스·재연결·수동 재시도 시 조회. 투자 거절 후 재조회는 투자 확정 연결 때 적용.
 * 요청 경로: teamId — 부스 목록에서 받은 정수 팀 번호(1~20).
 * 요청: 투자자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, TeamDetail — { investor, team, asOf, investmentStatus }.
 * team에는 소개·기존 투자액·investmentState·allowedAmounts가 포함됩니다.
 * P03은 이 응답의 잔액과 접수 상태를 사용하므로 별도 조회가 필요하지 않습니다.
 * PAUSED이거나 investmentState가 AVAILABLE이 아니면 투자를 차단해야 합니다.
 * 404(팀 없음)·422(경로값 오류) 등 HTTP 오류는 호출부에 전달합니다.
 */
export const getInvestorTeam = async (
  teamId: number,
  signal?: AbortSignal,
): Promise<TeamDetail> => {
  const response = await apiClient.get<TeamDetail>(`/investor/teams/${teamId}`, {
    signal,
  });

  return response.data;
};
