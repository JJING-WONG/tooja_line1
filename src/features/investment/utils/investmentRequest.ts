import { isAxiosError } from "axios";
import type { components } from "../../../apis/schema";
import { createInvestment, getInvestmentRequest } from "../apis/investment.api";

import { apiErrorCode, isSessionAuthError, accessBlockedMessage } from "../../auth/utils/authError";
export type PendingInvestment = {
  investorId: string;
  requestKey: string;
  input: components["schemas"]["InvestmentInput"];
  retryAt?: number;
  waitingForResume?: boolean;
};

export class InvestmentFailure extends Error {
  outcome: "rejected" | "unknown" | "auth" | "paused";
  retryAt?: number;
  constructor(message: string, outcome: InvestmentFailure["outcome"], retryAt?: number) {
    super(message);
    this.outcome = outcome;
    this.retryAt = retryAt;
  }
}

const messages: Record<string, string> = {
  INVESTMENT_PAUSED: "지금은 투자가 일시 중지되어 있어요.",
  ALREADY_INVESTED: "이미 투자한 팀이에요.",
  INSUFFICIENT_BALANCE: "투자 잔액이 부족해요.",
  SELF_INVESTMENT_FORBIDDEN: "내 팀에는 투자할 수 없어요.",
  RESOURCE_NOT_FOUND: "투자할 팀을 찾을 수 없어요.",
  VALIDATION_FAILED: "투자 금액을 다시 선택해 주세요.",
  INVALID_REQUEST: "투자 정보를 다시 확인해 주세요.",
  IDEMPOTENCY_KEY_REUSED: "이전 요청과 투자 정보가 달라요. 결과를 다시 확인해 주세요.",
  CSRF_INVALID: "인증 정보를 확인하지 못했어요. 다시 시도해 주세요.",
};

export function investmentErrorCode(error: unknown) {
  return apiErrorCode(error);
}

function classify(error: unknown): InvestmentFailure {
  if (error instanceof InvestmentFailure) return error;
  const status = isAxiosError(error) ? error.response?.status : undefined;
  const code = investmentErrorCode(error);
  if (isSessionAuthError(error)) {
    return new InvestmentFailure("로그인 상태를 다시 확인해 주세요.", "auth");
  }
  if (status === 409 && code === "INVESTMENT_PAUSED") {
    return new InvestmentFailure(messages.INVESTMENT_PAUSED, "paused");
  }
  if (status === 429 || status === 503) {
    const seconds = Number(isAxiosError(error) ? error.response?.headers?.["retry-after"] : 0);
    return new InvestmentFailure("잠시 후 처리 결과를 다시 확인해 주세요.", "unknown", Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 5) * 1000);
  }
  // 응답이 없는 경우·5xx·키 충돌은 차감 여부를 단정하지 않습니다.
  if (!status || status >= 500 || code === "IDEMPOTENCY_KEY_REUSED") {
    return new InvestmentFailure("결과를 확인하지 못했어요. 같은 요청의 결과를 다시 확인해 주세요.", "unknown");
  }
  return new InvestmentFailure(accessBlockedMessage(error) ?? messages[code ?? ""] ?? "투자하지 못했어요. 투자 정보를 다시 확인해 주세요.", "rejected");
}

// #8·#11: 자동 POST는 최초 전송 + 결과 없음에 따른 동일 키 재전송 한 번으로 제한합니다.
export async function resolveInvestment(
  request: PendingInvestment,
  recover: boolean,
  getToken: (refresh: boolean) => Promise<string>,
  onChecking: () => void,
  canSend: () => boolean = () => true,
) {
  async function send() {
    if (!canSend()) throw new InvestmentFailure(messages.INVESTMENT_PAUSED, "paused");
    let token = await getToken(false);
    if (!canSend()) throw new InvestmentFailure(messages.INVESTMENT_PAUSED, "paused");
    try {
      return await createInvestment(request.input, token, request.requestKey);
    } catch (error) {
      if (investmentErrorCode(error) !== "CSRF_INVALID") throw error;
      token = await getToken(true);
      if (!canSend()) throw new InvestmentFailure(messages.INVESTMENT_PAUSED, "paused");
      return createInvestment(request.input, token, request.requestKey);
    }
  }
  if (request.retryAt && Date.now() < request.retryAt) {
    throw new InvestmentFailure("요청이 잠시 제한되었어요. 잠시 후 결과를 다시 확인해 주세요.", "unknown", request.retryAt);
  }
  if (!recover) {
    try { return await send(); }
    catch (error) {
      const failure = classify(error);
      if (failure.outcome !== "unknown" || failure.retryAt) throw failure;
    }
  }
  onChecking();
  try {
    // 토큰을 전송하지 않는 조회에서도 현재 투자자·로그아웃 여부를 확인합니다.
    await getToken(false);
    const result = await getInvestmentRequest(request.requestKey);
    if (result.status === "SUCCEEDED" && result.result) return result.result;
    if (result.status === "REJECTED" && result.error) {
      throw new InvestmentFailure(messages[result.error.code] ?? "투자 요청이 거절되었어요.", "rejected");
    }
    throw new InvestmentFailure("처리 결과를 다시 확인해 주세요.", "unknown");
  } catch (error) {
    if (investmentErrorCode(error) !== "REQUEST_RESULT_NOT_FOUND") {
      const failure = classify(error);
      // 결과 조회 실패는 투자 거절을 의미하지 않습니다.
      if (!(error instanceof InvestmentFailure) && failure.outcome === "rejected") failure.outcome = "unknown";
      throw failure;
    }
  }
  try { return await send(); }
  catch (error) { throw classify(error); }
}

function storageKey(investorId: string) { return `mallage:pending-investment:${investorId}`; }
export function readPendingInvestment(investorId: string): PendingInvestment | null {
  const raw = sessionStorage.getItem(storageKey(investorId));
  if (!raw) return null;
  const value = JSON.parse(raw) as Partial<PendingInvestment>;
  if (value.investorId !== investorId || typeof value.requestKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestKey) ||
    (value.retryAt !== undefined && (typeof value.retryAt !== "number" || !Number.isFinite(value.retryAt) || value.retryAt < 0)) ||
    (value.waitingForResume !== undefined && typeof value.waitingForResume !== "boolean") ||
    !value.input || !Number.isInteger(value.input.teamId) || value.input.teamId < 1 || value.input.teamId > 20 ||
    !Number.isInteger(value.input.amount) || value.input.amount < 100000 || value.input.amount > 700000 || value.input.amount % 100000 !== 0) {
    throw new Error("저장된 투자 요청을 확인할 수 없어요.");
  }
  return value as PendingInvestment;
}
export function savePendingInvestment(request: PendingInvestment) {
  sessionStorage.setItem(storageKey(request.investorId), JSON.stringify(request));
}
export function clearPendingInvestment(investorId: string) {
  sessionStorage.removeItem(storageKey(investorId));
}
