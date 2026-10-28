import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { isCancel } from "axios";
import type { components } from "../../../apis/schema";
import { isSessionAuthError } from "../utils/authError";
import { getInvestorSession } from "../apis/auth.api";

export const investorSessionQueryKey = ["auth", "investor", "session"] as const;

export function useInvestorSession() {
  const client = useQueryClient();
  const isLoggingOut = useIsMutating({
    mutationKey: ["auth", "investor", "logout"],
  }) > 0;
  return useQuery({
    queryKey: investorSessionQueryKey,
    // 로그아웃 중에는 포커스·재연결에 따른 세션 복구 요청도 중단합니다.
    enabled: !isLoggingOut,
    queryFn: async ({ signal }) => {
      const previous = client.getQueryData<components["schemas"]["InvestorSession"] | null>(investorSessionQueryKey);
      try {
        // 응답 전체를 저장해 투자자 정보와 현재 CSRF 토큰을 함께 복구합니다.
        return await getInvestorSession(signal);
      } catch (error) {
        if (signal.aborted || isCancel(error)) throw error;
        const latest = client.getQueryData<components["schemas"]["InvestorSession"] | null>(investorSessionQueryKey);
        if (latest !== previous && latest !== undefined) return latest;
        if (isSessionAuthError(error)) {
          // 관리자 세션만 있거나 투자자 세션이 만료된 경우도 미인증입니다.
          return null;
        }
        // 통신·서버 오류로 기존 인증 정보를 지우지 않습니다.
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
  });
}
