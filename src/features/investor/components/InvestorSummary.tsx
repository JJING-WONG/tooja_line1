import type { components } from "../../../apis/schema";

type Investor = components["schemas"]["Investor"];

export default function InvestorSummary({ investor }: { investor: Investor }) {
  const progress =
    investor.issuedAmount > 0
      ? Math.min(
          100,
          Math.max(0, (investor.investedAmount / investor.issuedAmount) * 100),
        )
      : 0;

  return (
    <section
      aria-label="내 투자 현황"
      className="flex w-[calc(100%+3px)] flex-col gap-1.5 rounded-[14px] bg-white p-4.5 font-['Noto_Sans_KR',sans-serif]"
    >
      <p className="h-4.25 text-[12px] leading-4.25 text-[#888]">
        {investor.kind === "STAFF" ? (
          "운영팀"
        ) : (
          <>
            <span className="font-[Anta,sans-serif]">
              TEAM {String(investor.teamId).padStart(2, "0")}
            </span>{" "}
            · {investor.alias}
          </>
        )}
      </p>
      <h1 className="text-[14px] leading-5 text-[#555]">남은 마일리지</h1>
      <p className="text-[34px] font-bold leading-12 text-[#111]">
        {investor.balance.toLocaleString("ko-KR")}원
      </p>
      <div
        role="progressbar"
        aria-label="투자한 비율"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="h-2 overflow-hidden rounded bg-[#e2e2e2]"
      >
        <div
          className="h-full rounded bg-secondary"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[12px] leading-4.25 text-[#888]">
        총 지급 {investor.issuedAmount.toLocaleString("ko-KR")}원 · 투자{" "}
        {investor.investedAmount.toLocaleString("ko-KR")}원
      </p>
      {investor.kind === "PARTICIPANT" &&
        investor.spendingStatus === "COMPLETED" && (
          <p
            role="status"
            className="rounded-lg bg-[#fdecec] px-3.5 py-3 text-[12px] leading-4.25 text-[#b42318]"
          >
            마일리지가 전부 소진되었어요
          </p>
        )}
      {investor.kind === "PARTICIPANT" &&
        investor.spendingStatus !== "COMPLETED" && (
          <div className="rounded-lg bg-[#fff8e6] px-3.5 py-3 text-[12px] leading-4.25 text-[#7a5b00]">
            <p>지급된 100만원을 모두 투자해 주세요.</p>
            <p>미소진 시 운영 기준에 따라 심사 감점이 적용됩니다.</p>
          </div>
        )}
    </section>
  );
}
