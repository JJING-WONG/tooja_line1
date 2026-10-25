import { apiClient } from "../../../apis/client";
import type { components } from "../../../apis/schema";

type InvestmentInput = components["schemas"]["InvestmentInput"];
type InvestmentReceipt = components["schemas"]["InvestmentReceipt"];
type RequestResult = components["schemas"]["RequestResult"];
type InvestmentDetail = components["schemas"]["InvestmentDetail"];
type InvestmentHistory = components["schemas"]["InvestmentHistory"];

/**
 * 투자 확정: POST /api/v1/investor/investments
 * 사용처: P03-M의 useCreateInvestment에서 투자 확정 및 동일 키·본문 복구 전송.
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
      timeout: 15_000, // 응답 지연 시 동일 키의 결과 조회로 복구합니다.
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
 * 사용처: InvestmentFlowProvider/useCreateInvestment의 불확실한 요청 확인·새로고침 복구. 일반 조회마다 호출하지 않습니다.
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
    { signal, timeout: 15_000 },
  );

  return response.data;
};

/**
 * 본인 거래 상세 조회: GET /api/v1/investor/investments/{investmentId}
 * 사용처: P04의 useMyInvestment에서 진입·새로고침·포커스·재연결·수동 재시도 시 거래 요약과 현재 잔액 조회.
 * P05에서 거래 선택 이동을 제공할 경우 재사용 가능하며 현재 P05에는 연결하지 않습니다.
 * 요청 경로: investmentId — 투자 성공 영수증 또는 본인 거래 목록에서 받은 거래 ID.
 * 요청: 투자자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, InvestmentDetail — { investment, currentBalance, asOf }.
 * investment에는 팀 번호·서비스 이름·금액·확정 시각(UTC)이 포함됩니다.
 * currentBalance는 조회 시점 잔액이며 영수증의 거래 직후 잔액과 다를 수 있습니다.
 * 없는 거래와 다른 투자자 소유 거래는 모두 404 RESOURCE_NOT_FOUND입니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다.
 */
export const getMyInvestment = async (
  investmentId: string,
  signal?: AbortSignal,
): Promise<InvestmentDetail> => {
  const response = await apiClient.get<InvestmentDetail>(
    `/investor/investments/${encodeURIComponent(investmentId)}`,
    { signal },
  );

  return response.data;
};

/**
 * 본인 투자 내역 조회: GET /api/v1/investor/investments
 * 사용처: P05의 useMyInvestments에서 진입·포커스·재연결·수동 재시도 시 조회. 투자 성공 후 캐시 무효화로 재진입 시 최신 내역 조회.
 * 요청: 투자자 세션 쿠키로 인증. 본문·쿼리·CSRF 헤더 없음.
 * 응답: 200, InvestmentHistory — { investor, items, count, asOf }.
 * investor에는 현재 잔액·총 투자액·소진 상태가 포함되어 별도 잔액 조회가 필요 없습니다.
 * items는 본인의 확정 거래만 최신 확정 시각순(동일 시각은 저장 역순)으로 반환합니다.
 * 거래가 없으면 정상 200 응답에 items: [], count: 0이며 페이지네이션은 없습니다.
 * 상세 조회에는 각 거래의 investmentId를 사용하고 확정 시각(UTC)은 표시 시 변환합니다.
 * HTTP 오류는 호출부에 전달하며, signal은 조회 취소용입니다.
 */
export const getMyInvestments = async (
  signal?: AbortSignal,
): Promise<InvestmentHistory> => {
  const response = await apiClient.get<InvestmentHistory>(
    "/investor/investments",
    { signal },
  );

  return response.data;
};
