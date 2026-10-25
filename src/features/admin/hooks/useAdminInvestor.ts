import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminSession } from "../../auth/hooks/useAdminSession";
import { getAdminInvestor } from "../apis/admin.api";
import { assertAdminSession, handleAdminRequestError } from "../utils/adminRequest";

export const adminInvestorQueryKey = (adminId: string | undefined, investorId: string | undefined) => ["admin", "investor", adminId, investorId] as const;

export function useAdminInvestor(investorId: string | undefined) {
  const client = useQueryClient();
  const session = useAdminSession();
  const adminId = session.data?.admin.adminId;
  const isLoggingOut = useIsMutating({ mutationKey: ["auth", "admin", "logout"] }) > 0;
  const isUpdating = useIsMutating({ mutationKey: ["admin", "investment-status"] }) > 0;
  return useQuery({
    queryKey: adminInvestorQueryKey(adminId, investorId),
    enabled: Boolean(investorId) && session.isSuccess && Boolean(adminId) && !isLoggingOut && !isUpdating,
    queryFn: async ({ signal }) => {
      if (!investorId || !adminId || client.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0) {
        throw new Error("관리자 로그인 상태와 투자자 정보를 확인해 주세요.");
      }
      const current = assertAdminSession(client, adminId);
      try { return await getAdminInvestor(investorId, signal); }
      catch (error) {
        await handleAdminRequestError(client, adminId, error, current, signal);
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
