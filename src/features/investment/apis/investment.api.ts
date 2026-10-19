import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type InvestmentInput = components["schemas"]["InvestmentInput"];
type InvestmentReceipt = components["schemas"]["InvestmentReceipt"];
type RequestResult = components["schemas"]["RequestResult"];

/**
 * 투자 확정: POST /api/v1/investor/investments
 * 사용 예정: P03-M 확인 모달에서 사용자가 '투자 확정'을 눌렀을 때 호출. 현재 화면 미연동.
 * 요청 본문: InvestmentInput — { teamId: number, amount: number }.
 * teamId는 1~20, amount는 100000~700000원 사이의 100000원 단위 정수입니다.
 * 요청 헤더: X-CSRF-Token — 현재 투자자용 토큰.
 * 요청 헤더: Idempotency-Key — 이번 논리적 투자에 사용할 UUID v4.
 * 응답: 201, InvestmentReceipt — { investment, balanceAfterInvestment, snapshotVersion }.
 * balanceAfterInvestment는 거래 직후 잔액이며 현재 잔액과 다를 수 있습니다.
 * 호출부는 전송 전에 키·본문을 보관하고 재전송 시 같은 값을 사용해야 합니다.
 * 이 함수는 키 생성·자동 재시도를 수행하지 않으며 HTTP 오류를 그대로 전달합니다.
 * 통신 오류로 결과가 불확실하면 새 키를 만들지 말고 getInvestmentRequest로 확인합니다.
 */
export const createInvestment = async (
  input: InvestmentInput,
  csrfToken: string,
  requestKey: string,
): Promise<InvestmentReceipt> => {
  const response = await apiClient.post<InvestmentReceipt>(
    "/investor/investments",
    { teamId: input.teamId, amount: input.amount },
    {
      headers: {
        "X-CSRF-Token": csrfToken,
        "Idempotency-Key": requestKey,
      },
    },
  );

  return response.data;
};

/**
 * 투자 요청 결과 조회: GET /api/v1/investor/investment-requests/{requestKey}
 * 사용 예정: P03-M 투자 응답이 끊기거나 새로고침 후 보관한 요청의 결과를 복구할 때 호출.
 * 일반 화면 조회마다 호출하지 않으며, 현재 화면 미연동입니다.
 * 요청 경로: requestKey — 투자 확정 요청에서 사용한 UUID v4.
 * 요청: 투자자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, RequestResult — { status, requestKey, result?, originalHttpStatus?, error? }.
 * SUCCEEDED는 최초 영수증, REJECTED는 저장된 거절 결과이며 둘 다 정상 HTTP 200입니다.
 * 404 REQUEST_RESULT_NOT_FOUND는 투자 실패 확정이 아닙니다. 호출부에서 보관한
 * 같은 키·같은 본문으로 재전송해야 하며, 이 함수는 자동 재전송하지 않습니다.
 * HTTP 오류는 그대로 전달합니다. 명세에 없는 PROCESSING 상태는 만들지 않습니다.
 */
export const getInvestmentRequest = async (
  requestKey: string,
  signal?: AbortSignal,
): Promise<RequestResult> => {
  const response = await apiClient.get<RequestResult>(
    `/investor/investment-requests/${encodeURIComponent(requestKey)}`,
    { signal },
  );

  return response.data;
};
