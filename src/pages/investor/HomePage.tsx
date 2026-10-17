import { useInvestorLogout } from "../../features/auth/hooks/useInvestorLogout";
import { Link } from "react-router-dom";
import InvestorSummary from "../../features/investor/components/InvestorSummary";
import BoothMap from "../../features/investor/components/BoothMap";
import { useInvestorTeams } from "../../features/investor/hooks/useInvestorTeams";

export default function HomePage() {
  const { logout, isPending, errorMessage } = useInvestorLogout();
  const teamsQuery = useInvestorTeams();
  const home = teamsQuery.data;

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
        {teamsQuery.isPending && !home && (
          <p role="status" className="py-6 text-center text-sm text-[#777]">
            투자 현황과 부스 목록을 불러오고 있습니다.
          </p>
        )}
        {teamsQuery.isError && (
          <div role="alert" className="rounded-lg bg-white p-4 text-sm text-[#777]">
            <p>
              {home
                ? "최신 정보를 불러오지 못했습니다. 이전 조회 결과를 표시합니다."
                : "투자 현황과 부스 목록을 불러오지 못했습니다."}
            </p>
            <button
              type="button"
              onClick={() => void teamsQuery.refetch()}
              disabled={teamsQuery.isFetching || isPending}
              className="mt-2 cursor-pointer rounded text-secondary underline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              {teamsQuery.isFetching ? "불러오는 중…" : "다시 시도"}
            </button>
          </div>
        )}
        {home && (
          <>
            <InvestorSummary investor={home.investor} />
            <BoothMap
              teams={home.teams}
              isStaff={home.investor.kind === "STAFF"}
              isCompleted={home.investor.spendingStatus === "COMPLETED"}
            />
          </>
        )}
      </div>
    </main>
  );
}
