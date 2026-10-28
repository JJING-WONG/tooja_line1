import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError, isCancel } from "axios";
import type { components } from "../../../apis/schema";
import { getAdminCsrf } from "../../auth/apis/auth.api";
import { adminSessionQueryKey, useAdminSession } from "../../auth/hooks/useAdminSession";
import { updateInvestmentStatus } from "../apis/admin.api";
import { adminOverviewQueryKey, fetchAdminOverview } from "./useAdminOverview";
import { adminErrorCode, assertAdminSession, handleAdminRequestError } from "../utils/adminRequest";

import { accessBlockedMessage } from "../../auth/utils/authError";

type Status = components["schemas"]["InvestmentStatus"]["status"];
type Overview = components["schemas"]["Overview"];

export function useUpdateInvestmentStatus() {
  const client = useQueryClient();
  const session = useAdminSession();
  const adminId = session.data?.admin.adminId;
  const lock = useRef(false);
  const [failedStatusChange, setFailedStatusChange] = useState<Status | null>(null);
  const mutation = useMutation({
    mutationKey: ["admin", "investment-status", adminId],
    retry: false,
    mutationFn: async (status: Status) => {
      if (!adminId) throw new Error("관리자 로그인 상태를 확인해 주세요.");
      assertAdminSession(client, adminId);
      // 이전 조회가 상태 변경 응답을 덮어쓰지 않게 먼저 취소합니다.
      await client.cancelQueries({ queryKey: ["admin"] });
      let current = assertAdminSession(client, adminId);
      try {
        try { return await updateInvestmentStatus({ status }, current.csrfToken); }
        catch (error) {
          if (adminErrorCode(error) !== "CSRF_INVALID") throw error;
          const prepared = await getAdminCsrf();
          current = assertAdminSession(client, adminId);
          current = { ...current, csrfToken: prepared.csrfToken };
          client.setQueryData(adminSessionQueryKey, current);
          return await updateInvestmentStatus({ status }, current.csrfToken);
        }
      } catch (error) {
        await handleAdminRequestError(client, adminId, error, current);
        // 타임아웃·통신 오류·5xx는 변경 여부를 단정하지 않고 최신 현황을 확인합니다.
        // Retry-After가 있으면 fetchAdminOverview가 실제 재요청을 차단합니다.
        if (isAxiosError(error) && (!error.response || error.response.status >= 500)) {
          try {
            const latest = await fetchAdminOverview(client, adminId);
            assertAdminSession(client, adminId);
            client.setQueryData(adminOverviewQueryKey(adminId), latest);
            if (latest.investmentStatus.status === status) return latest.investmentStatus;
          } catch { /* 확인도 실패하면 기존 상태와 실패한 목표를 유지합니다. */ }
        }
        throw error;
      }
    },
    onSuccess: async (result) => {
      if (!adminId || client.getQueryData<components["schemas"]["AdminSession"] | null>(adminSessionQueryKey)?.admin.adminId !== adminId) return;
      client.setQueryData<Overview>(adminOverviewQueryKey(adminId), (previous) => previous ? {
        ...previous,
        investmentStatus: previous.investmentStatus.revision > result.revision ? previous.investmentStatus : result,
      } : undefined);
      setFailedStatusChange(null);
      // 화면의 수치·다른 관리자 조회는 성공 응답 이후 재조회합니다.
      await client.invalidateQueries({ queryKey: ["admin"], refetchType: "none" });
    },
    onError: (error, status) => {
      if (isCancel(error)) return;
      if (adminId && client.getQueryData<components["schemas"]["AdminSession"] | null>(adminSessionQueryKey)?.admin.adminId === adminId) setFailedStatusChange(status);
    },
    onSettled: () => { lock.current = false; },
  });
  return {
    failedStatusChange,
    isPending: mutation.isPending,
    errorMessage: mutation.error && !isCancel(mutation.error) ? (accessBlockedMessage(mutation.error) ?? (adminErrorCode(mutation.error) === "RATE_LIMITED" ? "요청이 잠시 제한되었어요" : "잠시 후 다시 시도해 주세요")) : undefined,
    update: (status: Status) => {
      if (lock.current || !adminId || client.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0) return;
      if (failedStatusChange !== status) setFailedStatusChange(null);
      lock.current = true;
      mutation.mutate(status);
    },
    dismissError: () => { if (!lock.current) { setFailedStatusChange(null); mutation.reset(); } },
  };
}
