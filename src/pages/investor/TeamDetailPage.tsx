import { useState } from "react";
import { isAxiosError } from "axios";
import type { components } from "../../apis/schema";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorDialog from "../../components/ui/ErrorDialog";
import { useInvestorTeam } from "../../features/investor/hooks/useInvestorTeam";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import arrowBack from "../../assets/ArrowBack.svg";
import teamLogo from "../../assets/TeamLogo.svg";
import InvestmentConfirmDialog from "../../features/investment/components/InvestmentConfirmDialog";

const amounts = [100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000];

export default function TeamDetailPage() {
  const { teamId: pathTeamId } = useParams();
  const navigate = useNavigate();
  const parsedId = pathTeamId && /^\d+$/.test(pathTeamId) ? Number(pathTeamId) : NaN;
  const teamId = Number.isSafeInteger(parsedId) && parsedId >= 1 && parsedId <= 20 ? parsedId : null;
  const query = useInvestorTeam(teamId);
  const status = isAxiosError(query.error) ? query.error.response?.status : undefined;
  const isMissing = teamId === null || status === 404 || status === 422;
  if (isMissing || query.isError) {
    return <main className="min-h-dvh bg-white">
      <ErrorDialog
        title={isMissing ? "부스를 찾을 수 없어요" : "팀 정보를 불러오지 못했어요"}
        message={isMissing ? "부스 목록에서 다시 확인해 주세요." : "잠시 후 다시 시도해 주세요."}
        confirmLabel={isMissing ? "부스 목록으로" : "재시도"}
        isBusy={query.isFetching}
        onBack={isMissing ? undefined : () => navigate("/invest")}
        onConfirm={() => { if (isMissing) navigate("/invest"); else void query.refetch(); }}
      />
    </main>;
  }
  if (!query.data) return <main className="min-h-dvh bg-white"><LoadingOverlay mode="initial" /></main>;
  if (query.data.team.investmentState === "SELF_TEAM" || query.data.team.investmentState === "ALREADY_INVESTED" || query.data.team.myInvestmentAmount > 0) {
    return <Navigate to="/invest" replace />;
  }
  // 재조회가 진행 중이면 확정을 막고, 최신 응답 도착 시 선택·열린 확인창을 초기화합니다.
  return <TeamDetailContent key={`${teamId}:${query.dataUpdatedAt}`} detail={query.data} isRefreshing={query.isFetching} />;
}

function TeamDetailContent({ detail, isRefreshing }: { detail: components["schemas"]["TeamDetail"]; isRefreshing: boolean }) {
  const { team, investor, investmentStatus } = detail;
  const teamId = String(team.teamId);
  const balance = investor.balance;
  const isPaused = investmentStatus.status === "PAUSED";
  const isAvailable = team.investmentState === "AVAILABLE" && !isPaused && !isRefreshing;
  const isAmountAllowed = (amount: number) => isAvailable && team.allowedAmounts.includes(amount);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const hasInsufficientBalance = team.investmentState === "BALANCE_EXHAUSTED" || balance < amounts[0];
  const canInvest = selectedAmount !== null && isAmountAllowed(selectedAmount);

  return (
    <main className="min-h-dvh bg-white text-[#222] font-['Noto_Sans_KR', sans-serif]">
      <div className="mx-auto flex min-h-dvh w-full max-w-93.75 flex-col gap-3 px-[19.5px] pb-[21.5px] pt-[46.5px]">
        <header className="flex h-10.25 shrink-0 items-center">
          <Link
            to="/invest"
            className="flex items-center rounded text-[14px] font-medium leading-5 text-[#555] focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img src={arrowBack} alt="" />
            <span className="pl-2.5">부스 목록</span>
          </Link>
        </header>

        <section
          aria-label="부스 소개"
          className="flex h-37 shrink-0 items-center gap-3.5 overflow-hidden rounded-[14px] bg-primary pl-4 pr-5.75 py-4"
        >
          <img src={teamLogo} alt="" className="shrink-0" />
          <div className="flex w-54.75 shrink-0 flex-col gap-0.5 px-2.5">
            <h1 className="whitespace-nowrap text-[30px] leading-10.5 text-white font-[Anta, sans-serif]">
              TEAM {String(team.teamId).padStart(2, "0")}
            </h1>
            <p className="h-7.5 text-[12px] leading-[16.8px] text-white">
              {team.description}
            </p>
            <p className="text-[10px] leading-3.5 text-[#eee]">
              <span className="font-bold text-[#ffcabe]">[변경]</span>{" "}
              <strong>이 팀에는 한 번만 투자할 수 있어요</strong>
              <br />
              1회 10만~70만원
            </p>
          </div>
        </section>

        <fieldset className="min-w-0 shrink-0">
          <legend className="flex h-16.5 w-full items-end text-[15px] font-bold leading-5.25">
            투자 금액 선택
          </legend>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {amounts.map((amount, index) => (
              <button
                key={amount}
                type="button"
                disabled={!isAmountAllowed(amount)}
                aria-pressed={amount === selectedAmount}
                onClick={() => setSelectedAmount(amount)}
                className={`${index < 4 ? "h-16.25" : "h-16.5"} cursor-pointer rounded-lg text-[14px] font-bold leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${!isAmountAllowed(amount) ? `border border-[#bdbdbd] bg-[#f4f4f4] ${index < 4 ? "text-[#333]/50" : "text-black/30"}` : amount === selectedAmount ? "bg-secondary text-white" : "border border-[#bdbdbd] bg-white text-[#333]"}`}
              >
                {amount / 10_000}만원
              </button>
            ))}
          </div>
        </fieldset>

        <dl className="shrink-0 overflow-hidden rounded-lg bg-[#f4f4f4]/50">
          <div className="flex h-13.25 items-center justify-between px-4 py-3.5">
            <dt className="text-[14px] leading-5 text-[#777]">내 잔액</dt>
            <dd className="text-[18px] font-bold leading-6.25 text-[#222]/50">
              {balance === 0 ? "0" : `${balance.toLocaleString("ko-KR")}원`}
            </dd>
          </div>
          <div className={`flex items-center justify-between px-4 py-3.5 ${hasInsufficientBalance ? "h-12.25" : "h-13.25"}`}>
            <dt className="text-[14px] leading-5 text-[#777]">투자 금액</dt>
            <dd className={`text-[#ce6161] ${hasInsufficientBalance ? "text-[15px] font-medium leading-5.25" : "text-[18px] font-bold leading-6.25"}`}>
              {isPaused
                ? "지금은 투자할 수 없어요"
                : hasInsufficientBalance
                ? "투자 잔액이 부족해요"
                : selectedAmount === null
                  ? "-"
                  : `- ${selectedAmount.toLocaleString("ko-KR")}원`}
            </dd>
          </div>
        </dl>

        {!hasInsufficientBalance && <div className="flex h-15.75 shrink-0 items-center justify-between rounded-lg bg-[#f4f4f4] px-4 py-3.5">
          <span className="text-[14px] leading-5 text-[#777]">
            남은 잔액
          </span>
          <span className="text-[25px] font-bold leading-8.75 text-black">
            {selectedAmount === null ? "-" : `${(balance - selectedAmount).toLocaleString("ko-KR")}원`}
          </span>
        </div>}
        <div className="min-h-10.75 flex-1" />
        <button
          type="button"
          disabled={!canInvest}
          onClick={() => {
            if (canInvest) setIsConfirmOpen(true);
          }}
          className="h-13.5 shrink-0 rounded-lg bg-dark text-[16px] font-bold leading-5.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-primary disabled:bg-primary/40"
        >
          {canInvest && selectedAmount !== null ? `${selectedAmount / 10_000}만원 투자하기` : "지금은 투자할 수 없어요"}
        </button>
      </div>
      {isConfirmOpen && canInvest && selectedAmount !== null && (
        <InvestmentConfirmDialog
          teamId={teamId ?? "05"}
          amount={selectedAmount}
          balanceAfter={balance - selectedAmount}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}
    </main>
  );
}
