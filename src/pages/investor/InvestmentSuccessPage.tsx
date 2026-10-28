import { accessBlockedMessage } from "../../features/auth/utils/authError";
import { isAxiosError } from "axios";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { useMyInvestment } from "../../features/investment/hooks/useMyInvestment";
import { Link, useParams } from "react-router-dom";
import successIcon from "../../assets/InvestmentSuccess.svg";
import accessUnavailableIcon from "../../assets/AccessUnavailable.svg";

const confirmedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function formatConfirmedAt(value: string) {
  const parts = confirmedAtFormatter.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export default function InvestmentSuccessPage() {
  const { investmentId } = useParams();
  const query = useMyInvestment(investmentId);
  const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
  const isUnavailable = !investmentId || status === 404;
  const isError = !isUnavailable && query.isError;
  const investment = query.data?.investment;
  const balance = query.data?.currentBalance;
  const hasResult = !isUnavailable && !isError && investment !== undefined;
  const isCompleted = hasResult && balance === 0;
  const isRetrying = query.isFetching;
  const teamLabel = investment ? `TEAM ${String(investment.teamId).padStart(2, "0")}` : "";

  if (!isUnavailable && !isError && !query.data) {
    return <main className="min-h-dvh bg-white"><LoadingOverlay mode="initial" /></main>;
  }

  return (
    <main className="min-h-dvh bg-white text-[#222] font-['Noto_Sans_KR',sans-serif]">
      <div className="mx-auto flex min-h-dvh w-full max-w-93.75 flex-col gap-3 px-[19.5px] pb-[21.5px] pt-[118.5px]">
        {!hasResult ? <div aria-hidden="true" className="h-36.5 shrink-0" /> : <header className="flex shrink-0 flex-col items-center gap-2.5 text-center">
          <div className="size-18">
            <img src={successIcon} alt="" />
          </div>
          <h1 className="h-8.5 w-full text-[24px] font-bold leading-8.5 text-[#111]">
            투자 완료!
          </h1>
          <p className="h-5 w-full text-[14px] leading-5 text-[#777]">
            <span className="font-[Anta,sans-serif]">{teamLabel}</span>에{" "}
            {investment?.amount.toLocaleString("ko-KR")}원을 투자했어요
          </p>
        </header>}

        <div aria-hidden="true" className="h-6 shrink-0" />

        {!hasResult ? (
          <div role="alert" className="flex h-12 shrink-0 items-center gap-[7px] rounded-xl bg-[#fdecec] px-4">
            <img src={accessUnavailableIcon} alt="" className="shrink-0" />
            <h1 className="text-[13px] font-bold leading-4.5 text-[#ce6161]">{isError ? "거래 정보를 불러오지 못했어요" : "지금은 접근할 수 없어요"}</h1>
          </div>
        ) : isCompleted ? (
          <p role="status" className="flex h-12 shrink-0 items-center rounded-xl bg-[#f4f4f4] px-4 text-[15px] font-medium leading-5.25 text-[#989898]">투자 금액을 모두 소진했어요</p>
        ) : <div aria-hidden="true" className="h-12 shrink-0" />}

        {isError && <p className="px-4 text-[14px] leading-5 text-[#777]">{accessBlockedMessage(query.error) ?? "잠시 후 다시 시도해 주세요."}</p>}

        {hasResult && <>
        <dl className="flex shrink-0 flex-col gap-3 rounded-xl bg-[#f4f4f4] p-4">
          <div className="flex h-5 items-center justify-between gap-2">
            <dt className="shrink-0 text-[14px] leading-5 text-[#777]">
              투자 팀
            </dt>
            <dd className="min-w-0 text-right text-[13px] font-bold leading-4.5">
              <span className="font-[Anta,sans-serif]">{teamLabel}</span> ·{" "}
              {investment?.serviceName}
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">투자 금액</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {investment?.amount.toLocaleString("ko-KR")}원
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">확정 시각</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {investment && formatConfirmedAt(investment.confirmedAt)}
            </dd>
          </div>
        </dl>

        <div className="flex h-16.25 shrink-0 items-center justify-between rounded-xl border border-[#bdbdbd] bg-white p-4">
          <span className="text-[14px] leading-5 text-[#777]">남은 투자금</span>
          <span className="text-[22px] font-bold leading-7.75">
            {balance?.toLocaleString("ko-KR")}원
          </span>
        </div>
        </>}

        <div className="min-h-20.75 flex-1" />
        {isError ? <>
          <button
            type="button"
            disabled={isRetrying}
            aria-busy={isRetrying}
            onClick={() => {
              if (!isRetrying) void query.refetch();
            }}
            className="h-13.5 shrink-0 rounded-lg bg-dark text-[16px] font-bold leading-5.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
          >
            {isRetrying ? "불러오는 중…" : "다시 시도"}
          </button>
          <Link to="/invest" className="flex h-12.5 shrink-0 items-center justify-center rounded-lg border border-[#bdbdbd] bg-white text-[15px] font-bold leading-5.25 text-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">부스 목록으로 돌아가기</Link>
        </> : <>
        <Link
          to="/invest"
          className="flex h-13.5 shrink-0 items-center justify-center rounded-lg bg-dark text-[16px] font-bold leading-5.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          부스 목록으로 돌아가기
        </Link>
        <Link
          to="/invest/history"
          className="flex h-12.5 shrink-0 items-center justify-center rounded-lg border border-[#bdbdbd] bg-white text-[15px] font-bold leading-5.25 text-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          내 투자 내역
        </Link>
        </>}
      </div>
    </main>
  );
}
