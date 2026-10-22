import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import arrowBack from "../../assets/ArrowBack.svg";
import teamLogo from "../../assets/TeamLogo.svg";
import InvestmentConfirmDialog from "../../features/investment/components/InvestmentConfirmDialog";

const amounts = [100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000];

export default function TeamDetailPage({
  previewBalance = 1_000_000,
}: {
  previewBalance?: number;
}) {
  const { teamId } = useParams();
  // UI 상태 확인용 값. API 연결 시 잔액·allowedAmounts·investmentState로 교체합니다.
  const balance = previewBalance;
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const hasInsufficientBalance = balance < amounts[0];
  const canInvest = selectedAmount !== null && selectedAmount <= balance;

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
              TEAM {String(teamId ?? "05").padStart(2, "0")}
            </h1>
            <p className="h-7.5 text-[12px] leading-[16.8px] text-white">
              로컬 상점을 연결하는 서비스
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
                disabled={amount > balance}
                aria-pressed={amount === selectedAmount}
                onClick={() => setSelectedAmount(amount)}
                className={`${index < 4 ? "h-16.25" : "h-16.5"} cursor-pointer rounded-lg text-[14px] font-bold leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed ${amount > balance ? `border border-[#bdbdbd] bg-[#f4f4f4] ${index < 4 ? "text-[#333]/50" : "text-black/30"}` : amount === selectedAmount ? "bg-secondary text-white" : "border border-[#bdbdbd] bg-white text-[#333]"}`}
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
              {hasInsufficientBalance
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
