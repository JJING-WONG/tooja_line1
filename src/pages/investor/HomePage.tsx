import { useInvestorLogout } from "../../features/auth/hooks/useInvestorLogout";
import { Link } from "react-router-dom";
import type { components } from "../../apis/schema";
import InvestorSummary from "../../features/investor/components/InvestorSummary";
import BoothMap from "../../features/investor/components/BoothMap";
import type { Booth } from "../../features/investor/components/BoothItem";

// UI 1차 구현용 Figma 예시 데이터. 다음 단계에서 useInvestorTeams 응답으로 교체합니다.
const previewInvestor: components["schemas"]["Investor"] = {
  investorId: "preview",
  alias: "팀 03 투자자 012",
  kind: "PARTICIPANT",
  teamId: 3,
  hasLoggedIn: true,
  issuedAmount: 1_000_000,
  investedAmount: 700_000,
  balance: 300_000,
  spendingStatus: "UNSPENT",
};
const previewTeams: Booth[] = Array.from({ length: 20 }, (_, index) => ({
  teamId: index + 1,
  investmentState:
    index === 2 ? "SELF_TEAM" : index === 1 ? "ALREADY_INVESTED" : "AVAILABLE",
  myInvestmentAmount: index === 1 ? 700_000 : 0,
}));

export default function HomePage() {
  const { logout, isPending, errorMessage } = useInvestorLogout();

  return (
    <main className="min-h-dvh bg-[#fafafa] text-dark">
      <div className="mx-auto flex w-full max-w-93.75 flex-col gap-3 px-[19.5px] pb-[33.5px] pt-[46.5px]">
        <header className="flex min-h-9.75 flex-wrap items-center justify-between gap-1">
          <p className="whitespace-nowrap text-[20px] leading-7 text-[#2b362d]">
            MALLAGE{" "}
            <span className="text-[10px] text-[#2b362d]/50">
              가상투자 서비스
            </span>
          </p>
          <nav
            aria-label="투자자 메뉴"
            className="flex items-center gap-2 whitespace-nowrap text-[13px] leading-4.5 text-[#777]"
          >
            <Link
              to="/invest/history"
              className="rounded focus-visible:outline-2 focus-visible:outline-primary"
            >
              내역
            </Link>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={logout}
              disabled={isPending}
              aria-busy={isPending}
              className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              {isPending ? "로그아웃 중…" : "로그아웃"}
            </button>
          </nav>
        </header>
        {errorMessage && (
          <p role="alert" className="mt-3 text-sm text-[#f68b8b]">
            {errorMessage}
          </p>
        )}
        <InvestorSummary investor={previewInvestor} />
        <BoothMap
          teams={previewTeams}
          isStaff={previewInvestor.kind === "STAFF"}
          isCompleted={previewInvestor.spendingStatus === "COMPLETED"}
        />
      </div>
    </main>
  );
}
