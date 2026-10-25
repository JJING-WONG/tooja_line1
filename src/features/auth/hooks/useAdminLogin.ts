import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { components } from "../../../apis/schema";
import { getAdminCsrf, loginAdmin } from "../apis/auth.api";
import { adminSessionQueryKey } from "./useAdminSession";

const csrfQueryOptions = {
  queryKey: ["auth", "admin", "csrf"],
  queryFn: getAdminCsrf,
  staleTime: 0,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

function getLoginErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (isAxiosError<components["schemas"]["ApiError"]>(error)) {
    const code = error.response?.data?.error?.code;
    if (code === "AUTHENTICATION_FAILED" || code === "VALIDATION_FAILED") {
      return "관리자 코드가 올바르지 않습니다.";
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

export function useAdminLogin() {
  const submitting = useRef(false);
  const queryClient = useQueryClient();
  const csrf = useQuery(csrfQueryOptions);
  const login = useMutation({
    mutationKey: ["auth", "admin", "login"],
    onMutate: () => queryClient.cancelQueries({ queryKey: adminSessionQueryKey }),
    mutationFn: async (code: string) => {
      // 제출마다 준비 토큰을 확인해 10분 만료 및 변경된 쿠키에 대응합니다.
      // 동일 query key의 진행 중인 준비 요청은 공유합니다.
      const { csrfToken } = await queryClient.fetchQuery(csrfQueryOptions);
      return loginAdmin({ code }, csrfToken);
    },
    retry: false,
    onSuccess: async (session) => {
      await queryClient.cancelQueries({ queryKey: adminSessionQueryKey });
      // 이전 관리자 데이터는 정리하고 투자자·공개 데이터는 유지합니다.
      await queryClient.cancelQueries({ queryKey: ["admin"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
      // 준비 토큰 대신 로그인 응답의 새 토큰을 세션과 함께 보관합니다.
      queryClient.setQueryData(adminSessionQueryKey, session);
      queryClient.removeQueries({ queryKey: csrfQueryOptions.queryKey });
    },
    onSettled: () => { submitting.current = false; },
  });

  return {
    login: (code: string) => {
      if (submitting.current || csrf.isFetching || !/^[0-9]{4}$/.test(code)) return;
      submitting.current = true;
      login.mutate(code);
    },
    resetError: login.reset,
    isPending: csrf.isFetching || login.isPending,
    errorMessage: getLoginErrorMessage(login.error ?? csrf.error),
  };
}
