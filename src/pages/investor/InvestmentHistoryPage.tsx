import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { Link } from "react-router-dom";

// P05 디자인 확인용 데이터. 내 투자 내역 API 연결 시 서버 응답으로 교체합니다.
const previewInvestments = [
  { teamId: 5, amount: 500_000, confirmedAt: "10.17 14:32" },
  { teamId: 2, amount: 200_000, confirmedAt: "10.17 13:10" },
  { teamId: 7, amount: 750_000, confirmedAt: "10.17 15:20" },
];

export default function InvestmentHistoryPage({
  previewEmpty = false,
  isInitialLoading = false,
  isError = false,
  isRetrying = false,
  onRetry,
}: {
  previewEmpty?: boolean;
  isInitialLoading?: boolean;
  isError?: boolean;
  isRetrying?: boolean;
  onRetry?: () => void;
}) {
  const investments = previewEmpty ? [] : previewInvestments;

  // API 연결 전 UI 상태입니다. 최초 조회 중에는 시안 금액·내역을 표시하지 않습니다.
  if (isInitialLoading) {
    return <main className="min-h-dvh bg-[#f6f6f6]"><LoadingOverlay mode="initial" /></main>;
  }

  return (
    <main className="min-h-dvh bg-[#f6f6f6] text-[#222] font-['Noto_Sans_KR',sans-serif]">
      <div className="mx-auto flex min-h-dvh w-full max-w-93.75 flex-col gap-3 px-[19.5px] pb-[21.5px] pt-[46.5px]">
        <header className="flex h-10.25 shrink-0 items-center">
          <Link to="/invest" className="rounded text-[16px] font-bold leading-5.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <h1><span aria-hidden="true">←</span> 내 투자내역</h1>
          </Link>
        </header>

        {isError ? (
          <section aria-busy={isRetrying} className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[14px] text-center">
            <h2 role="alert" className="text-[16px] font-bold leading-5.5">투자 내역을 불러오지 못했어요</h2>
            <p className="text-[14px] leading-5 text-[#777]">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => { if (!isRetrying) onRetry?.(); }}
              className="mt-1 min-h-11 rounded-lg bg-dark px-6 py-3 text-[14px] font-bold leading-5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              {isRetrying ? "불러오는 중…" : "다시 시도"}
            </button>
          </section>
        ) : <>
        <p className="h-4.25 shrink-0 text-[12px] leading-4.25 text-[#888]">
          최신순 · {investments.length}건
        </p>

        {investments.length > 0 && (
          <ul aria-label="투자 내역" className="shrink-0 rounded-[14px] bg-white px-4 py-1">
            {investments.map((investment) => {
              const teamNumber = String(investment.teamId).padStart(2, "0");
              return (
                <li key={investment.teamId} className="flex w-73.5 max-w-full flex-col gap-0.5 border-b border-[#eee] py-3.5">
                  <div className="flex h-5.25 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[14px] font-medium leading-5">
                      <span className="font-[Anta,sans-serif]">TEAM {teamNumber}</span> · 팀 {teamNumber} 데모 서비스
                    </p>
                    <p className="shrink-0 text-[15px] font-bold leading-5.25 text-[#111]">
                      {investment.amount.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                  <p className="h-4.25 text-[12px] leading-4.25 text-[#888]">{investment.confirmedAt}</p>
                </li>
              );
            })}
          </ul>
        )}

        <dl className="flex shrink-0 flex-col gap-2.5 rounded-[14px] bg-white p-4">
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">지급액</dt>
            <dd className="text-[15px] font-bold leading-5.25">1,000,000원</dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">총 투자액</dt>
            <dd className="text-[15px] font-bold leading-5.25">{previewEmpty ? "0" : "700,000"}원</dd>
          </div>
          <div aria-hidden="true" className="h-px rounded-lg bg-[#e2e2e2]" />
          <div className="flex h-8.75 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">남은 잔액</dt>
            <dd className="text-[25px] font-bold leading-8.75 text-[#2d42fc]">{previewEmpty ? "1,000,000" : "300,000"}원</dd>
          </div>
        </dl>

        {investments.length === 0 && (
          <p role="status" className="shrink-0 rounded-lg border border-dashed border-[#ccc] px-3.5 py-5.5 text-[13px] leading-4.5 text-[#999]">
            아직 투자 내역이 없어요.<br />
            부스를 체험하고 첫 투자를 해보세요.
          </p>
        )}

        <div aria-hidden="true" className="min-h-px flex-1" />
        </>}
        <Link to="/invest" className="flex h-13.5 shrink-0 items-center justify-center rounded-lg bg-dark text-[16px] font-bold leading-5.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          부스 목록으로
        </Link>
      </div>
    </main>
  );
}
