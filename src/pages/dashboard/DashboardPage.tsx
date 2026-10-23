import { useEffect, useRef, useState } from "react";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import dashboardLogo from "../../assets/DashboardLogo.png";

// D01 시안 데이터입니다. 순위·금액·연결 상태와 갱신 강조는 API 미연동입니다.
const previewRanking = [
  { team: 7, amount: 8300000, bar: 620, change: 0 },
  { team: 12, amount: 7600000, bar: 568, change: 3 },
  { team: 3, amount: 7400000, bar: 553, change: 0 },
  { team: 15, amount: 6900000, bar: 515, change: 0 },
  { team: 1, amount: 6500000, bar: 486, change: -1 },
  { team: 9, amount: 6200000, bar: 463, change: 0 },
  { team: 18, amount: 6000000, bar: 448, change: 0 },
  { team: 5, amount: 5700000, bar: 426, change: 1 },
  { team: 20, amount: 5400000, bar: 403, change: -2 },
  { team: 2, amount: 5100000, bar: 381, change: 0 },
  { team: 11, amount: 4900000, bar: 366, change: 0 },
  { team: 6, amount: 4600000, bar: 344, change: 0 },
  { team: 14, amount: 4400000, bar: 329, change: 0 },
  { team: 8, amount: 4100000, bar: 306, change: 0 },
  { team: 17, amount: 3700000, bar: 276, change: 0 },
  { team: 4, amount: 3400000, bar: 254, change: 0 },
  { team: 19, amount: 3000000, bar: 224, change: 0 },
  { team: 10, amount: 2600000, bar: 194, change: 0 },
  { team: 13, amount: 1600000, bar: 120, change: 0 },
  { team: 16, amount: 0, bar: 0, change: 0 },
];

const columns = "grid-cols-[56px_150px_220px_minmax(0,1fr)_170px_170px]";

export default function DashboardPage({
  previewMode = "normal",
  isInitialLoading = false,
  connectionStatus = "connected",
  lastUpdatedAt = "14:32:05",
}: {
  previewMode?: "normal" | "tied" | "zero";
  isInitialLoading?: boolean;
  connectionStatus?: "connected" | "reconnecting";
  lastUpdatedAt?: string;
}) {
  // 상태별 디자인 확인용 데이터입니다. 실제 조회 연결 시 응답의 rank를 사용합니다.
  const ranking = previewRanking.map((item, index) =>
    previewMode === "zero"
      ? { ...item, amount: 0, bar: 0, change: 0 }
      : previewMode === "tied" && index === 1
        ? { ...item, amount: previewRanking[0].amount, bar: previewRanking[0].bar }
        : item,
  );
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
                  {previewMode === "zero" ? "0원" : "98,400,000원"}
                </dd>
              </div>
              <div className="w-15 shrink-0">
                <dt className="text-xs leading-4.25 text-[#9ca3af]">
                  참여 인원
                </dt>
                <dd className="text-[22px] leading-7.75 font-bold text-white">
                  {previewMode === "zero" ? "0명" : "120명"}
                </dd>
              </div>
            </dl>
            {/* API 연결 시 마지막 성공 갱신 시각을 유지한 채 연결 상태만 바꿉니다. */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`shrink-0 rounded-full bg-[#2a2f36] px-3.5 py-2 text-[13px] leading-4.5 ${connectionStatus === "connected" ? "w-36.75 text-[#a7f3d0]" : "w-65 text-[#fca5a5]"}`}
            >
              <p>{connectionStatus === "connected" ? `● 연결됨 · ${lastUpdatedAt}` : "● 연결이 끊겼어요 · 재연결 중"}</p>
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
              {ranking.map(({ team, amount, bar, change }) => {
                const rank = ranking.findIndex((item) => item.amount === amount) + 1;
                const highlighted = previewMode !== "zero" && team === 12;
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
                      팀 {String(team).padStart(2, "0")} 데모 서비스
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
                          +500,000원 갱신
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
          <p role="alert" className="sr-only">
            {fullscreenError}
          </p>
        </div>
      </div>}
    </main>
  );
}
