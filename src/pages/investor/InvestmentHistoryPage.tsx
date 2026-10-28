import { accessBlockedMessage } from "../../features/auth/utils/authError";
import { useMyInvestments } from "../../features/investment/hooks/useMyInvestments";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorDialog from "../../components/ui/ErrorDialog";
import { Link, useNavigate } from "react-router-dom";

const confirmedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function formatConfirmedAt(value: string) {
  const parts = confirmedAtFormatter.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export default function InvestmentHistoryPage() {
  const navigate = useNavigate();
  const query = useMyInvestments();
  const history = query.data;
  const isError = query.isError;
  const isRetrying = query.isFetching;
  const investments = history?.items ?? [];

  if (!history && !isError) {
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
          <ErrorDialog
            title="투자 내역을 불러오지 못했어요"
            message={accessBlockedMessage(query.error) ?? "잠시 후 다시 시도해 주세요."}
            confirmLabel="재시도"
            isBusy={isRetrying}
            onConfirm={() => { if (!isRetrying) void query.refetch(); }}
            onBack={() => navigate("/invest")}
          />
        ) : history && <>
        <p className="h-4.25 shrink-0 text-[12px] leading-4.25 text-[#888]">
          최신순 · {history.count}건
        </p>

        {investments.length > 0 && (
          <ul aria-label="투자 내역" className="shrink-0 rounded-[14px] bg-white px-4 py-1">
            {investments.map((investment) => {
              const teamNumber = String(investment.teamId).padStart(2, "0");
              return (
                <li key={investment.investmentId} className="flex w-73.5 max-w-full flex-col gap-0.5 border-b border-[#eee] py-3.5">
                  <div className="flex h-5.25 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-[14px] font-medium leading-5">
                      <span className="font-[Anta,sans-serif]">TEAM {teamNumber}</span> · {investment.serviceName}
                    </p>
                    <p className="shrink-0 text-[15px] font-bold leading-5.25 text-[#111]">
                      {investment.amount.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                  <p className="h-4.25 text-[12px] leading-4.25 text-[#888]">{formatConfirmedAt(investment.confirmedAt)}</p>
                </li>
              );
            })}
          </ul>
        )}

        <dl className="flex shrink-0 flex-col gap-2.5 rounded-[14px] bg-white p-4">
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">지급액</dt>
            <dd className="text-[15px] font-bold leading-5.25">{history.investor.issuedAmount.toLocaleString("ko-KR")}원</dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">총 투자액</dt>
            <dd className="text-[15px] font-bold leading-5.25">{history.investor.investedAmount.toLocaleString("ko-KR")}원</dd>
          </div>
          <div aria-hidden="true" className="h-px rounded-lg bg-[#e2e2e2]" />
          <div className="flex h-8.75 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">남은 잔액</dt>
            <dd className="text-[25px] font-bold leading-8.75 text-[#2d42fc]">{history.investor.balance.toLocaleString("ko-KR")}원</dd>
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
