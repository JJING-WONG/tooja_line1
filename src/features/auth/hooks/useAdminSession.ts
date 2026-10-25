import { useIsMutating, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getAdminSession } from "../apis/auth.api";

export const adminSessionQueryKey = ["auth", "admin", "session"] as const;

export function useAdminSession() {
  const isLoggingOut = useIsMutating({
    mutationKey: ["auth", "admin", "logout"],
  }) > 0;
  const isLoggingIn = useIsMutating({ mutationKey: ["auth", "admin", "login"] }) > 0;
  return useQuery({
    queryKey: adminSessionQueryKey,
    // 로그인·로그아웃 중에는 늦은 세션 응답이 인증 결과를 덮어쓰지 않도록 조회를 중단합니다.
    enabled: !isLoggingOut && !isLoggingIn,
    queryFn: async ({ signal }) => {
      try {
        // 응답 전체를 저장해 관리자 정보와 현재 CSRF 토큰을 함께 복구합니다.
        return await getAdminSession(signal);
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
          // 투자자 세션만 있거나 관리자 세션이 만료된 경우도 미인증입니다.
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
