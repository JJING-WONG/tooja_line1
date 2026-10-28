import { accessBlockedMessage } from "../../features/auth/utils/authError";
import { useEffect, useRef, useState } from "react";
import DesktopErrorDialog from "../../components/ui/DesktopErrorDialog";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import dashboardLogo from "../../assets/DashboardLogo.png";
import dashboardPaused from "../../assets/DashboardPaused.svg";
import { useInvestmentStatus } from "../../features/dashboard/hooks/useInvestmentStatus";

import { useDashboard } from "../../features/dashboard/hooks/useDashboard";

const updatedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

const columns = "grid-cols-[56px_150px_220px_minmax(0,1fr)_170px_170px]";

export default function DashboardPage() {
  const query = useDashboard();
  const statusQuery = useInvestmentStatus();
  const blockedMessage = accessBlockedMessage(query.error) ?? accessBlockedMessage(statusQuery.error);
  const isPaused = statusQuery.data?.status === "PAUSED";
  const isInitialLoading = !query.data && !query.isError;
  const isInitialError = !query.data && query.isError;
  const connectionStatus = query.isError || statusQuery.isError ? "reconnecting" : "connected";
  const lastUpdatedAt = query.data ? updatedAtFormatter.format(new Date(query.data.asOf)) : "—";
  const ranking = query.data?.teams ?? [];
  const topAmount = Math.max(0, ...ranking.map((team) => team.raisedAmount));
  const containerRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(
        Math.min(
          entry.contentRect.width / 1600,
          entry.contentRect.height / 900,
        ),
      );
    });
    observer.observe(container);
    function updateFullscreen() {
      setIsFullscreen(document.fullscreenElement === container);
    }
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);

  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch {
      setFullscreenError(
        "전체화면을 열 수 없습니다. 브라우저의 전체화면 기능을 이용해 주세요.",
      );
    }
  }

  return (
    <main
      ref={containerRef}
      className="flex h-dvh w-full items-center justify-center overflow-hidden bg-[#1f2329] font-['Noto_Sans_KR',sans-serif]"
    >
      {isInitialLoading ? (
        <LoadingOverlay variant="desktop" mode="initial" theme="dark" />
      ) : isInitialError ? (
        <DesktopErrorDialog
          title={blockedMessage ?? <>순위 정보를<br />불러오지 못했어요</>}
          dimBackground
          isRetrying={query.isFetching}
          onRetry={() => { if (!query.isFetching) void query.refetch(); }}
        />
      ) : <div
        className="relative shrink-0"
        style={{ width: 1600 * scale, height: 900 * scale }}
      >
        <div
          className="absolute top-0 left-0 flex h-225 w-[1600px] origin-top-left flex-col gap-1 overflow-hidden rounded-xl border-[1.5px] border-[#bdbdbd] bg-[#1f2329] px-8 py-6"
          style={{ transform: `scale(${scale})` }}
        >
          <header className="flex h-[85.5px] shrink-0 items-center gap-6 pb-3 whitespace-nowrap">
            <img
              src={dashboardLogo}
              width={73.5}
              height={73.5}
              alt="1호선톤"
              className="h-[73.5px] w-[73.5px] shrink-0"
            />
            <div className="w-101.25 shrink-0">
              <h1 className="h-10.5 text-[30px] leading-10.5 font-bold text-white">
                1호선톤 <span className="font-sans">LIVE INVESTMENT</span>
              </h1>
              <p className="text-[13px] leading-4.5 text-[#9ca3af]">
                실시간 가상 투자 순위
              </p>
            </div>
            <dl className="flex w-56.75 shrink-0 items-center gap-7">
              <div className="w-34.75 shrink-0">
                <dt className="text-xs leading-4.25 text-[#9ca3af]">
                  총 투자액
                </dt>
                <dd className="text-[22px] leading-7.75 font-bold text-white">
                  {query.data?.totalInvestedAmount.toLocaleString("ko-KR")}원
                </dd>
              </div>
              <div className="w-15 shrink-0">
                <dt className="text-xs leading-4.25 text-[#9ca3af]">
                  참여 인원
                </dt>
                <dd className="text-[22px] leading-7.75 font-bold text-white">
                  {query.data?.investedInvestorCount.toLocaleString("ko-KR")}명
                </dd>
              </div>
            </dl>
            {/* 갱신 실패 시 기존 데이터와 마지막 성공 조회 시각을 유지합니다. */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`shrink-0 rounded-full bg-[#2a2f36] px-3.5 py-2 text-[13px] leading-4.5 ${connectionStatus === "reconnecting" ? "w-65 text-[#fca5a5]" : isPaused ? "bg-[#2a2f36]/50 text-[#ffcb91]" : "w-36.75 text-[#a7f3d0]"}`}
            >
              <p>{connectionStatus === "reconnecting" ? (blockedMessage ? "● 요청 차단 · 접속 환경 확인" : "● 연결이 끊겼어요 · 재연결 중") : isPaused ? `● 투자 일시중지됨 · ${lastUpdatedAt}` : `● 연결됨 · ${lastUpdatedAt}`}</p>
              {connectionStatus === "reconnecting" && <p className="text-xs leading-4.25 text-[#9ca3af]">마지막 갱신 {lastUpdatedAt}</p>}
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={isFullscreen}
              className="h-9 w-23.75 shrink-0 rounded-lg border border-[#4b5563] bg-[#2a2f36] text-[13px] leading-4.5 font-bold whitespace-pre text-[#e5e7eb]"
            >
              {isFullscreen ? "⛶  화면축소" : "⛶  전체화면"}
            </button>
          </header>

          <section
            role="table"
            aria-label="실시간 가상 투자 순위"
            className="flex flex-col gap-1"
          >
            <div
              role="row"
              className={`${columns} grid h-5.25 items-start gap-3 px-4 pb-1 text-xs leading-4.25 text-[#6b7280]`}
            >
              {[
                "순위",
                "팀",
                "서비스",
                "유치금 그래프 (현재 1위 기준 상대 길이)",
                "유치금",
                "순위 변화",
              ].map((label, index) => (
                <span
                  key={label}
                  role="columnheader"
                  className={index > 3 ? "text-right" : ""}
                >
                  {label}
                </span>
              ))}
            </div>
            <div role="rowgroup" className="flex flex-col gap-0.75">
              {ranking.map(({ teamId: team, raisedAmount: amount, rank, serviceName }) => {
                const change = query.data?.changes[team]?.rankChange ?? 0;
                const increase = query.data?.changes[team]?.amountIncrease ?? 0;
                const highlighted = increase > 0;
                const bar = topAmount > 0 ? (amount / topAmount) * 620 : 0;
                return (
                  <div
                    key={team}
                    role="row"
                    className={`${columns} grid h-8 items-center gap-3 rounded-md px-4 whitespace-nowrap ${highlighted ? "border-[1.5px] border-[#f3f4f6] bg-[#3a4048]" : "bg-[#262b31]"}`}
                  >
                    <span
                      role="cell"
                      className={`text-[15px] leading-5.25 font-bold ${rank <= 3 ? "text-white" : "text-[#9ca3af]"}`}
                    >
                      {rank <= 2 ? (
                        <span className={`flex size-6 items-center justify-center rounded-full text-black ${rank === 1 ? "bg-[#fff5ab]" : "bg-[#e4e4e4]"}`}>
                          {rank}
                        </span>
                      ) : rank}
                    </span>
                    <span
                      role="cell"
                      className="font-sans text-[19px] leading-6.75 text-white"
                    >
                      TEAM {String(team).padStart(2, "0")}
                    </span>
                    <span
                      role="cell"
                      className="truncate text-[13px] leading-4.5 text-[#9ca3af]"
                    >
                      {serviceName}
                    </span>
                    <div
                      role="cell"
                      aria-label={`유치금 ${amount.toLocaleString("ko-KR")}원 그래프`}
                      className="h-3 overflow-hidden rounded bg-[#33393f]"
                    >
                      <div
                        className={`h-3 rounded ${highlighted ? "bg-primary" : "bg-secondary"}`}
                        style={{ width: bar }}
                      />
                    </div>
                    <span
                      role="cell"
                      className="text-right text-base leading-5.5 font-bold text-white"
                    >
                      {amount.toLocaleString("ko-KR")}원
                    </span>
                    <div
                      role="cell"
                      className="flex items-center justify-end gap-2 text-[13px] leading-4.5 font-bold"
                    >
                      {highlighted && (
                        <span className="w-24.5 rounded-full bg-[#f3f4f6] py-0.5 text-center text-[11px] leading-3.75 text-[#111]">
                          +{increase.toLocaleString("ko-KR")}원 갱신
                        </span>
                      )}
                      <span
                        className={
                          change > 0
                            ? "text-[#86efac]"
                            : change < 0
                              ? "text-[#fca5a5]"
                              : "text-[#6b7280]"
                        }
                      >
                        {change > 0
                          ? `▲ ${change}`
                          : change < 0
                            ? `▼ ${Math.abs(change)}`
                            : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          {isPaused && (
            <div
              role="status"
              aria-label="투자가 일시중지되었어요"
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/30"
            >
              <img src={dashboardPaused} width={170} height={170} alt="" />
            </div>
          )}
          <p role="alert" className="sr-only">
            {fullscreenError}
          </p>
        </div>
      </div>}
    </main>
  );
}
