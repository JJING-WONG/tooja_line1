import type { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { components } from "../../../apis/schema";
import { adminSessionQueryKey } from "../../auth/hooks/useAdminSession";

type AdminSession = components["schemas"]["AdminSession"];
export class AdminRequestCooldown extends Error {
  constructor() { super("요청이 잠시 제한되었어요. 잠시 후 다시 시도해 주세요."); }
}
const cooldownKey = (adminId: string) => ["admin", "request-cooldown", adminId];
export function adminCooldownUntil(client: QueryClient, adminId: string) {
  return client.getQueryData<number>(cooldownKey(adminId)) ?? 0;
}
export function assertAdminSession(client: QueryClient, adminId: string) {
  const session = client.getQueryData<AdminSession | null>(adminSessionQueryKey);
  if (session?.admin.adminId !== adminId || client.isMutating({ mutationKey: ["auth", "admin", "logout"] }) > 0) {
    throw new Error("관리자 로그인 상태를 확인해 주세요.");
  }
  if (Date.now() < adminCooldownUntil(client, adminId)) throw new AdminRequestCooldown();
  return session;
}
export function adminErrorCode(error: unknown) {
  return isAxiosError<components["schemas"]["ApiError"]>(error) ? error.response?.data?.error?.code : undefined;
}
export async function handleAdminRequestError(client: QueryClient, adminId: string, error: unknown, session: AdminSession, signal?: AbortSignal) {
  if (signal?.aborted || !isAxiosError(error) || client.getQueryData<AdminSession | null>(adminSessionQueryKey)?.admin.adminId !== adminId) return;
  const status = error.response?.status;
  if (client.getQueryData(adminSessionQueryKey) === session && (status === 401 || (status === 403 && adminErrorCode(error) !== "CSRF_INVALID"))) {
    await client.cancelQueries({ queryKey: adminSessionQueryKey });
    if (client.getQueryData(adminSessionQueryKey) === session) client.setQueryData(adminSessionQueryKey, null);
  }
  if (status === 429 || status === 503) {
    const seconds = Number(error.response?.headers?.["retry-after"]);
    const until = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 5) * 1000;
    client.setQueryData(cooldownKey(adminId), Math.max(until, adminCooldownUntil(client, adminId)));
  }
}
