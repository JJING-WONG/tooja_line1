import { useIsMutating, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getInvestorSession } from "../apis/auth.api";

export const investorSessionQueryKey = ["auth", "investor", "session"] as const;

export function useInvestorSession() {
  const isLoggingOut = useIsMutating({
    mutationKey: ["auth", "investor", "logout"],
  }) > 0;
  return useQuery({
    queryKey: investorSessionQueryKey,
    // 로그아웃 중에는 포커스·재연결에 따른 세션 복구 요청도 중단합니다.
    enabled: !isLoggingOut,
    queryFn: async ({ signal }) => {
      try {
        // 응답 전체를 저장해 투자자 정보와 현재 CSRF 토큰을 함께 복구합니다.
        return await getInvestorSession(signal);
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
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
