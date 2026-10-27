import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminSession } from "../../auth/hooks/useAdminSession";
import {
  getAdminInvestorRankings,
  type InvestorRankingGroup,
} from "../apis/admin.api";
import {
  adminCooldownUntil,
  assertAdminSession,
  handleAdminRequestError,
} from "../utils/adminRequest";

export const adminInvestorRankingsQueryKey = (
  adminId: string | undefined,
  group: InvestorRankingGroup,
) => ["admin", "investor-rankings", adminId, group] as const;

export function useAdminInvestorRankings(group: InvestorRankingGroup) {
  const client = useQueryClient();
  const session = useAdminSession();
  const adminId = session.data?.admin.adminId;
  const isLoggingOut =
    useIsMutating({ mutationKey: ["auth", "admin", "logout"] }) > 0;
  const isUpdating =
    useIsMutating({ mutationKey: ["admin", "investment-status"] }) > 0;

  return useQuery({
    queryKey: adminInvestorRankingsQueryKey(adminId, group),
    enabled:
      session.isSuccess && Boolean(adminId) && !isLoggingOut && !isUpdating,
    queryFn: async ({ signal }) => {
      if (
        !adminId ||
        client.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0
      ) {
        throw new Error("관리자 상태를 확인해 주세요.");
      }
      const current = assertAdminSession(client, adminId);
      try {
        return await getAdminInvestorRankings(group, signal);
      } catch (error) {
        await handleAdminRequestError(client, adminId, error, current, signal);
        throw error;
      }
    },
    // 다른 그룹의 결과를 placeholder로 사용하지 않습니다.
    staleTime: 0,
    gcTime: 0,
    retry: false,
    retryOnMount: false,
    refetchInterval: () =>
      isLoggingOut || isUpdating
        ? false
        : Math.max(5000, adminId ? adminCooldownUntil(client, adminId) - Date.now() : 0),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
