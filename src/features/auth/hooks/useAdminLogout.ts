import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import type { components } from "../../../apis/schema";
import { getAdminCsrf, logoutAdmin } from "../apis/auth.api";
import { adminSessionQueryKey } from "./useAdminSession";

type AdminSession = components["schemas"]["AdminSession"];

export function useAdminLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const logout = useMutation({
    mutationKey: ["auth", "admin", "logout"],
    retry: false,
    onMutate: async () => {
      // 늦게 도착한 세션 응답이 로그아웃 결과를 덮어쓰지 않도록 중단합니다.
      await queryClient.cancelQueries({ queryKey: ["auth", "admin"] });
      await queryClient.cancelQueries({ queryKey: ["admin"] });
    },
    mutationFn: async () => {
      const session = queryClient.getQueryData<AdminSession | null>(
        adminSessionQueryKey,
      );
      const csrfToken = session?.csrfToken ?? (await getAdminCsrf()).csrfToken;

      try {
        await logoutAdmin(csrfToken);
      } catch (error) {
        if (
          !isAxiosError<components["schemas"]["ApiError"]>(error) ||
          error.response?.data?.error?.code !== "CSRF_INVALID"
        ) {
          throw error;
        }
        // 세션 만료 시에도 준비 토큰으로 로그아웃할 수 있습니다. 한 번만 재시도합니다.
        const prepared = await getAdminCsrf();
        await logoutAdmin(prepared.csrfToken);
      }
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: ["auth", "admin"] });
      await queryClient.cancelQueries({ queryKey: ["admin"] });
      // 투자자·공개 데이터는 유지하고 관리자 전용 캐시만 정리합니다.
      queryClient.removeQueries({ queryKey: ["auth", "admin", "csrf"] });
      queryClient.removeQueries({ queryKey: ["admin"] });
      // 로그인 mutation에 남은 코드·세션 응답도 함께 제거합니다.
      const mutationCache = queryClient.getMutationCache();
      mutationCache
        .findAll({ mutationKey: ["auth", "admin", "login"] })
        .forEach((mutation) => mutationCache.remove(mutation));
      queryClient.setQueryData(adminSessionQueryKey, null);
      navigate("/admin/login", { replace: true });
    },
    onSettled: () => {
      submitting.current = false;
    },
  });

  return {
    logout: () => {
      if (submitting.current || queryClient.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0) return;
      submitting.current = true;
      logout.mutate();
    },
    isPending: logout.isPending,
    errorMessage: logout.isError
      ? "로그아웃에 실패했습니다. 다시 시도해 주세요."
      : undefined,
    resetError: logout.reset,
  };
}
