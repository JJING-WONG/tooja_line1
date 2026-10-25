import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { getAdminOverview } from "../apis/admin.api";
import { useAdminSession } from "../../auth/hooks/useAdminSession";
import { adminCooldownUntil, assertAdminSession, handleAdminRequestError } from "../utils/adminRequest";

export const adminOverviewQueryKey = (adminId: string | undefined) => ["admin", "overview", adminId] as const;

// #16: 주기 조회와 #20의 응답 유실 후 확인에서 같은 인증·제한 처리를 사용합니다.
export async function fetchAdminOverview(client: QueryClient, adminId: string, signal?: AbortSignal) {
  const session = assertAdminSession(client, adminId);
  try { return await getAdminOverview(signal); }
  catch (error) {
    await handleAdminRequestError(client, adminId, error, session, signal);
    throw error;
  }
}

export function useAdminOverview() {
  const client = useQueryClient();
  const session = useAdminSession();
  const adminId = session.data?.admin.adminId;
  const isLoggingOut = useIsMutating({ mutationKey: ["auth", "admin", "logout"] }) > 0;
  const isUpdating = useIsMutating({ mutationKey: ["admin", "investment-status"] }) > 0;
  return useQuery({
    queryKey: adminOverviewQueryKey(adminId),
    enabled: session.isSuccess && Boolean(adminId) && !isLoggingOut && !isUpdating,
    queryFn: ({ signal }) => {
      if (!adminId || client.isMutating({ mutationKey: ["admin", "investment-status"] }) > 0) {
        throw new Error("관리자 상태 변경이 끝난 뒤 다시 조회해 주세요.");
      }
      return fetchAdminOverview(client, adminId, signal);
    },
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    refetchInterval: () => isLoggingOut || isUpdating ? false : Math.max(1000, adminId ? adminCooldownUntil(client, adminId) - Date.now() : 0),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
