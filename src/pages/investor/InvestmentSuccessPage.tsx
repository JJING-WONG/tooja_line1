import { Link } from "react-router-dom";
import successIcon from "../../assets/InvestmentSuccess.svg";

// P04 디자인 확인용 시안 데이터. 거래 결과 조회 API 연결 시 교체합니다.
const preview = {
  teamId: 5,
  serviceName: "팀 05 데모 서비스",
  amount: 500_000,
  confirmedAt: "10.17 14:32",
  balance: 500_000,
};

export default function InvestmentSuccessPage() {
  const teamLabel = `TEAM ${String(preview.teamId).padStart(2, "0")}`;

  return (
    <main className="min-h-dvh bg-white text-[#222] font-['Noto_Sans_KR',sans-serif]">
      <div className="mx-auto flex min-h-dvh w-full max-w-93.75 flex-col gap-3 px-[19.5px] pb-[21.5px] pt-[118.5px]">
        <header className="flex shrink-0 flex-col items-center gap-2.5 text-center">
          <div className="size-18">
            <img src={successIcon} alt="" />
          </div>
          <h1 className="h-8.5 w-full text-[24px] font-bold leading-8.5 text-[#111]">
            투자 완료!
          </h1>
          <p className="h-5 w-full text-[14px] leading-5 text-[#777]">
            <span className="font-[Anta,sans-serif]">{teamLabel}</span>에{" "}
            {preview.amount.toLocaleString("ko-KR")}원을 투자했어요
          </p>
        </header>

        <div aria-hidden="true" className="h-6 shrink-0" />

        <dl className="flex shrink-0 flex-col gap-3 rounded-xl bg-[#f4f4f4] p-4">
          <div className="flex h-5 items-center justify-between gap-2">
            <dt className="shrink-0 text-[14px] leading-5 text-[#777]">
              투자 팀
            </dt>
            <dd className="min-w-0 text-right text-[13px] font-bold leading-4.5">
              <span className="font-[Anta,sans-serif]">{teamLabel}</span> ·{" "}
              {preview.serviceName}
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">투자 금액</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {preview.amount.toLocaleString("ko-KR")}원
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">확정 시각</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {preview.confirmedAt}
            </dd>
          </div>
        </dl>

        <div className="flex h-16.25 shrink-0 items-center justify-between rounded-xl border border-[#bdbdbd] bg-white p-4">
          <span className="text-[14px] leading-5 text-[#777]">남은 투자금</span>
          <span className="text-[22px] font-bold leading-7.75">
            {preview.balance.toLocaleString("ko-KR")}원
          </span>
        </div>

        <div className="min-h-35.75 flex-1" />
        <Link
          to="/invest"
          className="flex h-13.5 shrink-0 items-center justify-center rounded-lg bg-dark text-[16px] font-bold leading-5.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          다른 부스 보기
        </Link>
        <Link
          to="/invest/history"
          className="flex h-12.5 shrink-0 items-center justify-center rounded-lg border border-[#bdbdbd] bg-white text-[15px] font-bold leading-5.25 text-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          내 투자 내역
        </Link>
      </div>
    </main>
  );
}
