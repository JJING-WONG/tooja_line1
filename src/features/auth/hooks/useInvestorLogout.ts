import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError, isCancel } from "axios";
import { useNavigate } from "react-router-dom";
import type { components } from "../../../apis/schema";
import { getInvestorCsrf, logoutInvestor } from "../apis/auth.api";
import { investorSessionQueryKey } from "./useInvestorSession";

import { accessBlockedMessage, isSessionAuthError } from "../utils/authError";

type InvestorSession = components["schemas"]["InvestorSession"];

export function useInvestorLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const logout = useMutation({
    mutationKey: ["auth", "investor", "logout"],
    retry: false,
    onMutate: async () => {
      // 늦게 도착한 세션 응답이 로그아웃 결과를 덮어쓰지 않도록 중단합니다.
      await queryClient.cancelQueries({ queryKey: ["auth", "investor"] });
      await queryClient.cancelQueries({ queryKey: ["investor"] });
    },
    mutationFn: async () => {
      const session = queryClient.getQueryData<InvestorSession | null>(
        investorSessionQueryKey,
      );
      const csrfToken = session?.csrfToken ?? (await getInvestorCsrf()).csrfToken;

      try {
        await logoutInvestor(csrfToken);
      } catch (error) {
        if (isSessionAuthError(error)) return;
        if (
          !isAxiosError<components["schemas"]["ApiError"]>(error) ||
          error.response?.data?.error?.code !== "CSRF_INVALID"
        ) {
          throw error;
        }
        // 세션 만료 시에도 준비 토큰으로 로그아웃할 수 있습니다. 한 번만 재시도합니다.
        const prepared = await getInvestorCsrf();
        try { await logoutInvestor(prepared.csrfToken); }
        catch (retryError) { if (!isSessionAuthError(retryError)) throw retryError; }
      }
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: ["auth", "investor"] });
      await queryClient.cancelQueries({ queryKey: ["investor"] });
      // 관리자·공개 데이터는 유지하고 투자자 전용 캐시만 정리합니다.
      queryClient.removeQueries({ queryKey: ["auth", "investor", "csrf"] });
      queryClient.removeQueries({ queryKey: ["investor"] });
      // 로그인 mutation에 남은 코드·세션 응답도 함께 제거합니다.
      const mutationCache = queryClient.getMutationCache();
      mutationCache
        .findAll({ mutationKey: ["auth", "investor", "login"] })
        .forEach((mutation) => mutationCache.remove(mutation));
      queryClient.setQueryData(investorSessionQueryKey, null);
      navigate("/login", { replace: true });
    },
    onSettled: () => {
      submitting.current = false;
    },
  });

  return {
    logout: () => {
      if (submitting.current || queryClient.isMutating({ mutationKey: ["investor", "investment", "create"] }) > 0) return;
      submitting.current = true;
      logout.mutate();
    },
    isPending: logout.isPending,
    errorMessage: logout.isError && !isCancel(logout.error)
      ? accessBlockedMessage(logout.error) ?? "로그아웃에 실패했습니다. 다시 시도해 주세요."
      : undefined,
    resetError: logout.reset,
  };
}
