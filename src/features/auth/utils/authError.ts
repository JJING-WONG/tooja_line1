import { isAxiosError, isCancel } from "axios";

export function apiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const data: unknown = error.response?.data;
  if (!data || typeof data !== "object" || !("error" in data)) return undefined;
  const detail = data.error;
  if (!detail || typeof detail !== "object" || !("code" in detail)) return undefined;
  return typeof detail.code === "string" ? detail.code : undefined;
}

// 역할 세션을 폐기하는 경우만 판정합니다. 일반 403·HTML 차단 응답은 포함하지 않습니다.
export function isSessionAuthError(error: unknown) {
  if (isCancel(error) || !isAxiosError(error)) return false;
  const status = error.response?.status;
  const code = apiErrorCode(error);
  return (status === 401 && code === "SESSION_EXPIRED") || (status === 403 && code === "FORBIDDEN");
}

export function accessBlockedMessage(error: unknown): string | undefined {
  if (isCancel(error) || !isAxiosError(error) || error.response?.status !== 403) return undefined;
  const code = apiErrorCode(error);
  if (["FORBIDDEN", "CSRF_INVALID", "SELF_INVESTMENT_FORBIDDEN"].includes(code ?? "")) return undefined;
  return "요청이 차단되었어요. 접속 환경을 확인해 주세요.";
}
