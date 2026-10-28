import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError, isCancel } from "axios";
import type { components } from "../../../apis/schema";
import { getInvestorCsrf, loginInvestor } from "../apis/auth.api";
import { investorSessionQueryKey } from "./useInvestorSession";

import { accessBlockedMessage } from "../utils/authError";

const csrfQueryOptions = {
  queryKey: ["auth", "investor", "csrf"],
  queryFn: getInvestorCsrf,
  staleTime: 0,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

function getLoginErrorMessage(error: unknown): string | undefined {
  if (!error || isCancel(error)) return undefined;
  const blocked = accessBlockedMessage(error);
  if (blocked) return blocked;
  if (isAxiosError<components["schemas"]["ApiError"]>(error)) {
    const code = error.response?.data?.error?.code;
    if (code === "AUTHENTICATION_FAILED" || code === "VALIDATION_FAILED") {
      return "비밀코드가 올바르지 않습니다.";
    }
    if (code === "CSRF_INVALID") {
      return "로그인 준비가 만료되었습니다. 다시 시도해 주세요.";
    }
    if (!error.response) {
      return "네트워크 연결을 확인하고 다시 시도해 주세요.";
    }
  }
  return "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export function useInvestorLogin() {
  const queryClient = useQueryClient();
  const csrf = useQuery(csrfQueryOptions);
  const login = useMutation({
    mutationKey: ["auth", "investor", "login"],
    mutationFn: async (code: string) => {
      // 제출마다 준비 토큰을 확인해 10분 만료 및 변경된 쿠키에 대응합니다.
      // 동일 query key의 진행 중인 준비 요청은 공유합니다.
      const { csrfToken } = await queryClient.fetchQuery(csrfQueryOptions);
      return loginInvestor({ code }, csrfToken);
    },
    retry: false,
    onSuccess: async (session) => {
      await queryClient.cancelQueries({ queryKey: investorSessionQueryKey });
      // 준비 토큰 대신 로그인 응답의 새 토큰을 세션과 함께 보관합니다.
      queryClient.setQueryData(investorSessionQueryKey, session);
      queryClient.removeQueries({ queryKey: csrfQueryOptions.queryKey });
    },
  });

  return {
    login: login.mutate,
    resetError: login.reset,
    isPending: csrf.isFetching || login.isPending,
    errorMessage: getLoginErrorMessage(login.error ?? csrf.error),
  };
}
