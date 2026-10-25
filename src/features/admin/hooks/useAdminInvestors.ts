import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import type { operations } from "../../../apis/schema";
import { useAdminSession } from "../../auth/hooks/useAdminSession";
import { getAdminInvestors } from "../apis/admin.api";
import { adminCooldownUntil, assertAdminSession, handleAdminRequestError } from "../utils/adminRequest";

type InvestorFilters = NonNullable<operations["listInvestors"]["parameters"]["query"]>;

// URL에 직접 넣은 잘못된 값·UI의 ALL을 API로 전송하지 않습니다.
export function parseInvestorFilters(search: URLSearchParams): InvestorFilters {
  const q = (search.get("q") ?? "").slice(0, 100);
  const team = search.get("teamId") ?? "";
  const teamId = /^\d{1,2}$/.test(team) && Number(team) >= 1 && Number(team) <= 20 ? Number(team) : undefined;
  const kind = search.get("kind");
  const spending = search.get("spendingStatus") ?? "UNSPENT";
  return {
    q: q || undefined,
    teamId,
    kind: kind === "PARTICIPANT" || kind === "STAFF" ? kind : undefined,
    spendingStatus: spending === "ALL" ? undefined : spending === "NOT_ACTIVATED" || spending === "COMPLETED" || spending === "UNSPENT" ? spending : "UNSPENT",
  };
}

export const adminInvestorsQueryKey = (adminId: string | undefined, filters: InvestorFilters) => ["admin", "investors", adminId, filters] as const;

export function useAdminInvestors(filters: InvestorFilters, enabled = true) {
  const client = useQueryClient();
  const session = useAdminSession();
  const adminId = session.data?.admin.adminId;
  const isLoggingOut = useIsMutating({ mutationKey: ["auth", "admin", "logout"] }) > 0;
  const isUpdating = useIsMutating({ mutationKey: ["admin", "investment-status"] }) > 0;
  return useQuery({
    queryKey: adminInvestorsQueryKey(adminId, filters),
    enabled: enabled && session.isSuccess && Boolean(adminId) && !isLoggingOut && !isUpdating,
    queryFn: async ({ signal }) => {
      if (!enabled || !adminId || client.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0) {
        throw new Error("검색 조건과 관리자 상태를 확인해 주세요.");
      }
      const current = assertAdminSession(client, adminId);
      try { return await getAdminInvestors(filters, signal); }
      catch (error) {
        await handleAdminRequestError(client, adminId, error, current, signal);
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    // 다른 검색 조건의 이전 목록을 새 결과처럼 표시하지 않습니다.
    refetchInterval: () => !enabled || isLoggingOut || isUpdating ? false : Math.max(2000, adminId ? adminCooldownUntil(client, adminId) - Date.now() : 0),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
