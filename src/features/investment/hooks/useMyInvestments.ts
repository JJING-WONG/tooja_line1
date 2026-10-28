import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSessionAuthError } from "../../auth/utils/authError";
import type { components } from "../../../apis/schema";
import {
  investorSessionQueryKey,
  useInvestorSession,
} from "../../auth/hooks/useInvestorSession";
import { getMyInvestments } from "../apis/investment.api";

type InvestorSession = components["schemas"]["InvestorSession"];

export function useMyInvestments() {
  const queryClient = useQueryClient();
  const session = useInvestorSession();
  const investorId = session.data?.investor.investorId;
  const isLoggingOut = useIsMutating({
    mutationKey: ["auth", "investor", "logout"],
  }) > 0;

  return useQuery({
    // 사용자별 캐시를 분리하고 기존 로그아웃 정리 범위에 포함합니다.
    queryKey: ["investor", "investments", investorId],
    enabled: session.isSuccess && Boolean(investorId) && !isLoggingOut,
    queryFn: async ({ signal }) => {
      const currentSession = queryClient.getQueryData<InvestorSession | null>(
        investorSessionQueryKey,
      );
      // 수동 refetch도 미인증·사용자 변경·로그아웃 중에는 요청하지 않습니다.
      if (
        !investorId ||
        currentSession?.investor.investorId !== investorId ||
        queryClient.isMutating({ mutationKey: ["auth", "investor", "logout"] }) > 0
      ) {
        throw new Error("투자자 로그인 상태를 확인해 주세요.");
      }

      try {
        return await getMyInvestments(signal);
      } catch (error) {
        if (isSessionAuthError(error)) {
          const latestSession = queryClient.getQueryData<InvestorSession | null>(
            investorSessionQueryKey,
          );
          // 이전 사용자의 늦은 실패 응답으로 새 로그인 상태를 지우지 않습니다.
          if (!signal.aborted && latestSession === currentSession) {
            queryClient.setQueryData(investorSessionQueryKey, null);
          }
        }
        // 통신·서버 오류는 세션을 유지하고 조회 오류로 호출부에 전달합니다.
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
