import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { components } from "../../apis/schema";
import type { AdminOverviewContext } from "../../layouts/AdminLayout";
import type { InvestorRankingGroup } from "../../features/admin/apis/admin.api";
import { useAdminInvestorRankings } from "../../features/admin/hooks/useAdminInvestorRankings";
import {
  AdminRequestCooldown,
  adminErrorCode,
} from "../../features/admin/utils/adminRequest";
import InvestorScorePopover from "../../features/admin/components/InvestorScorePopover";
import InvestorProgressBadge from "../../features/admin/components/InvestorProgressBadge";
import AdminHoverCard from "../../features/admin/components/AdminHoverCard";

type Investor = components["schemas"]["InvestorRanking"];
const groups: { value: InvestorRankingGroup; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PARTICIPANT", label: "참가자" },
  { value: "STAFF", label: "운영팀 투자자" },
];
const number = (value: number) => value.toLocaleString("ko-KR");
const points = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${number(Math.abs(value))}`;
const affiliation = (investor: Investor) =>
  investor.kind === "STAFF"
    ? "운영팀 투자자"
    : `참가자 · TEAM ${String(investor.teamId).padStart(2, "0")}`;
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));

function ScoringRules({ anchor, onClose, onEnter, onLeave }: {
  anchor: HTMLElement;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <AdminHoverCard
      id="performance-rules-popover"
      labelledBy="pf-rules-title"
      className="w-[min(560px,calc(100vw-24px))]"
      anchor={anchor}
      onClose={onClose}
      onEnter={onEnter}
      onLeave={onLeave}
    >
      <header className="border-b border-[#efeff4] px-6 pt-6 pb-4.5">
        <span className="mb-1.25 block text-[11px] font-medium text-secondary">점수 가이드</span>
        <h2 id="pf-rules-title" className="text-[20px] font-bold tracking-[-0.5px] text-dark">점수 산정 방식</h2>
        <p className="mt-2.5 text-[12px] leading-[1.8] text-[#777]">조회 시점의 팀 순위에 따라 <strong>투자금 10만원당</strong> 점수를 받아요.</p>
      </header>
      <div className="px-6 py-5">
        <div className="grid grid-cols-10 gap-1 max-[560px]:grid-cols-5">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((rank) => (
            <div key={rank} className={`flex flex-col items-center gap-1.5 rounded-md py-2.5 ${rank > 10 ? "bg-[#fdf2f1] text-[#b42318]" : "bg-[#f0f0fc] text-secondary"}`}>
              <span className="text-[10px] text-[#777]">{rank}위</span>
              <strong className="text-[13px] font-semibold">
                {points(rank <= 10 ? 11 - rank : 10 - rank)}<small className="ml-0.25 text-[9px] font-normal">점</small>
              </strong>
            </div>
          ))}
        </div>
        <div className="mt-4.5 rounded-[9px] bg-[#f6f6f6] p-4">
          <p className="text-[12px] leading-[1.8] text-[#777]">2위 팀에 60만원, 15위 팀에 40만원을 투자했다면</p>
          <strong className="mt-2 block text-[18px] font-semibold text-[#333] tabular-nums">6 × 9 + 4 × (−5) = <span className="text-secondary">34점</span></strong>
        </div>
        <ul className="mt-4.5 list-disc pl-4 [&_li]:mt-2 [&_li]:pl-0.5 [&_li]:text-[12px] [&_li]:leading-[1.9] [&_li]:text-[#666] [&_strong]:font-semibold [&_strong]:text-[#444]">
          <li><strong>한 번이라도 투자하면 순위가 생겨요.</strong> 남은 투자금과 무관하며, 투자하지 않은 사람만 순위가 없어요.</li>
          <li>동점은 <strong>1위 · 1위 · 3위</strong>예요. 팀 순위와 개인 순위 모두 같아요.</li>
          <li>그룹을 바꾸면 해당 그룹 안에서 순위를 매겨요. 개인 점수와 팀 배점은 같아요.</li>
          <li>투자를 받지 못한 팀은 이 계산에서 공동 20위로 봐요.</li>
        </ul>
      </div>
      <footer>성과 점수는 행사 평가 기준이며, 실제 수익률이나 손익은 아니에요.</footer>
    </AdminHoverCard>
  );
}

export default function InvestorPerformancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawGroup = searchParams.get("group");
  const group: InvestorRankingGroup =
    rawGroup === "PARTICIPANT" || rawGroup === "STAFF" ? rawGroup : "ALL";
  const groupLabel = groups.find((item) => item.value === group)!.label;
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<({ kind: "investor"; investorId: string; anchor: HTMLElement } | { kind: "rules"; anchor: HTMLElement }) | null>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const cancelTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);
  const closePopover = useCallback(() => {
    cancelTimers();
    setHovered(null);
  }, [cancelTimers]);
  useEffect(() => cancelTimers, [cancelTimers]);
  const showPopover = (investorId: string, anchor: HTMLElement, delay = 0) => {
    cancelTimers();
    if (delay) openTimer.current = window.setTimeout(() => setHovered({ kind: "investor", investorId, anchor }), delay);
    else setHovered({ kind: "investor", investorId, anchor });
  };
  const showRules = (anchor: HTMLElement, delay = 0) => {
    cancelTimers();
    if (delay) openTimer.current = window.setTimeout(() => setHovered({ kind: "rules", anchor }), delay);
    else setHovered({ kind: "rules", anchor });
  };
  const leavePopover = () => {
    cancelTimers();
    closeTimer.current = window.setTimeout(() => setHovered(null), 160);
  };
  const [onlyRanked, setOnlyRanked] = useState(false);
  const layout = useOutletContext<AdminOverviewContext>();
  const rankings = useAdminInvestorRankings(group);
  const items = rankings.data?.items ?? [];
  const ranked = items.filter((item) => item.rank !== null);
  const needle = search.trim().toLocaleLowerCase("ko-KR");
  const visible = items.filter(
    (item) =>
      (!onlyRanked || item.rank !== null) &&
      (!needle ||
        `${item.alias} ${affiliation(item)} ${item.teamId ?? ""}팀`
          .toLocaleLowerCase("ko-KR")
          .includes(needle)),
  );
  const focusedInvestor = hovered?.kind === "investor" ? visible.find((item) => item.investorId === hovered.investorId) : undefined;
  const isBusy =
    rankings.isFetching || layout?.isUpdating || layout?.isLoggingOut;
  const errorCode = adminErrorCode(rankings.error);
  const limited =
    errorCode === "RATE_LIMITED" ||
    rankings.error instanceof AdminRequestCooldown;
  const refresh = () => {
    if (!isBusy) void rankings.refetch();
  };
  const selectGroup = (next: InvestorRankingGroup) => {
    if (next === group) return;
    closePopover();
    setSearch("");
    setSearchParams(next === "ALL" ? {} : { group: next });
  };

  return (
    <div className="text-[#333] text-[13px] leading-[1.4] min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-60 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-primary [&_button:focus-visible]:outline-offset-3 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-primary [&_input:focus-visible]:outline-offset-3 flex flex-col gap-6.75">
      <header className="flex min-h-8.5 flex-wrap items-center justify-between gap-3 min-[1800px]:min-h-12.5">
        <div className="flex items-center gap-2.5 min-[1800px]:gap-3.75">
          <h1 className="text-2xl leading-8.5 min-[1800px]:text-[36px] min-[1800px]:leading-12.5 font-bold text-[#111]">투자 성과</h1>
          <button type="button" className="grid size-5.25 place-items-center rounded-full border-[1.3px] border-[#999] bg-white text-[13px] font-semibold leading-none text-[#777] hover:border-secondary hover:bg-[#f3f3fc] hover:text-secondary aria-expanded:border-secondary aria-expanded:bg-[#f3f3fc] aria-expanded:text-secondary min-[1800px]:size-7 min-[1800px]:text-[18px]" aria-label="점수 산정 방식" aria-haspopup="dialog" aria-expanded={hovered?.kind === "rules"} aria-controls={hovered?.kind === "rules" ? "performance-rules-popover" : undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") showRules(event.currentTarget, 140); }} onPointerLeave={leavePopover}
            onFocus={event => showRules(event.currentTarget)} onBlur={event => { if (!(event.relatedTarget instanceof Node && document.getElementById("performance-rules-popover")?.contains(event.relatedTarget))) leavePopover(); }}
            onClick={event => showRules(event.currentTarget)} onKeyDown={event => { if (event.key === "ArrowDown" && hovered?.kind === "rules") { event.preventDefault(); document.getElementById("performance-rules-popover")?.focus(); } }}>?</button>
        </div>
        <div className="flex flex-wrap items-center gap-4.5 min-[1800px]:gap-6 max-[900px]:items-start">
          <p className="max-[900px]:w-full text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 text-[#777]">
            {rankings.data ? (
              <>
                ● 조회 기준{" "}
                <time dateTime={rankings.data.asOf}>
                  {timestamp(rankings.data.asOf)}
                </time>{" "}
                · 5초 자동 갱신
              </>
            ) : (
              "조회 시점 기준 · 5초 자동 갱신"
            )}
          </p>
        </div>
      </header>

      {rankings.isError && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-[#fdecec] p-4.5 text-[#b42318] [&_p]:mt-1.5" role="alert">
          <div>
            <strong>
              {limited
                ? "잠시 후 다시 조회해 주세요."
                : rankings.data
                  ? "새 정보를 불러오지 못했어요."
                  : "성과를 불러오지 못했어요."}
            </strong>
            <p>
              {rankings.data
                ? "마지막 결과를 표시하며 자동으로 다시 시도하고 있어요."
                : "연결 상태를 확인한 뒤 다시 시도해 주세요."}
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-4.5 py-2.5 font-bold whitespace-nowrap text-[#333] hover:bg-[#f6f6f6] min-[1800px]:min-h-16.5 min-[1800px]:px-6.75 min-[1800px]:py-3.75"
            onClick={refresh}
            disabled={isBusy}
          >
            다시 시도
          </button>
        </div>
      )}

      <section
        className="[&>div]:min-w-0 [&>div]:rounded-[15px] [&>div]:bg-[#f6f6f6] [&>div]:px-5 [&>div]:py-4.5 min-[1800px]:[&>div]:px-6.75 min-[1800px]:[&>div]:py-6 [&_p]:mb-1.5 [&_p]:text-[#777] grid grid-cols-1 gap-3 min-[900px]:grid-cols-3 min-[1800px]:gap-4.5"
        aria-label={`${groupLabel} 투자 성과 요약`}
        aria-busy={!rankings.data && rankings.isFetching}
      >
        <div >
          <p>투자한 사람 / 전체 투자자</p>
          <div className="text-[22px] leading-7.75 font-bold text-[#111] wrap-anywhere tabular-nums min-[1800px]:text-[33px] min-[1800px]:leading-11.5">
            <strong>{rankings.data ? number(ranked.length) : "—"}</strong>명{" "}
            <span className="ml-1.25 text-[16px] font-normal text-[#888] min-[1800px]:text-[24px]">/ {rankings.data ? number(items.length) : "—"}명</span>
          </div>
        </div>
        <div>
          <p>최고 점수</p>
          <div className="text-[22px] leading-7.75 font-bold text-[#111] wrap-anywhere tabular-nums min-[1800px]:text-[33px] min-[1800px]:leading-11.5">
            <strong>{ranked.length ? points(ranked[0].score) : "—"}</strong>점
          </div>
        </div>
        <div>
          <p>아직 투자하지 않은 사람</p>
          <div className="text-[22px] leading-7.75 font-bold text-[#111] wrap-anywhere tabular-nums min-[1800px]:text-[33px] min-[1800px]:leading-11.5">
            <strong>
              {rankings.data ? number(items.length - ranked.length) : "—"}
            </strong>
            명
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 min-[1800px]:gap-[22.5px]" aria-label="투자 성과 검색 및 필터">
        <div className="flex overflow-hidden rounded-xl border-[1.5px] border-[#c4c4c4] max-[900px]:max-w-full max-[900px]:overflow-x-auto [&_button]:min-h-10.5 [&_button]:bg-white [&_button]:px-5.5 [&_button]:py-2.5 [&_button]:font-bold [&_button]:whitespace-nowrap [&_button]:text-[#555] [&_button[aria-pressed=true]]:bg-dark [&_button[aria-pressed=true]]:text-white min-[1800px]:[&_button]:min-h-15.75 min-[1800px]:[&_button]:px-8.25 min-[1800px]:[&_button]:py-3.75 max-[900px]:[&_button]:px-4" role="group" aria-label="조회 그룹">
          {groups.map((item) => (
            <button
              type="button"
              key={item.value}
              aria-pressed={group === item.value}
              onClick={() => selectGroup(item.value)}
              disabled={layout?.isUpdating || layout?.isLoggingOut}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex w-65 max-w-full items-center rounded-xl border-[1.5px] border-[#c4c4c4] bg-white min-[1800px]:w-97.5 max-[900px]:ml-0 [&_input]:h-10.25 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-[inherit] [&_input]:bg-transparent [&_input]:px-5.25 [&_input]:text-[#333] [&_input::placeholder]:text-[#999] [&_input::-webkit-search-cancel-button]:hidden min-[1800px]:[&_input]:h-15.75 min-[1800px]:[&_input]:px-[31.5px] [&_button]:py-2 [&_button]:pr-3.5 [&_button]:text-[20px] [&_button]:text-[#777]">
          <input
            type="search"
            aria-label="이름 또는 소속 검색"
            placeholder="이름 · 소속 검색"
            value={search}
            maxLength={100}
            onChange={(event) => { closePopover(); setSearch(event.target.value); }}
          />
          {search && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-[#555] [&_input]:size-4 [&_input]:accent-dark min-[1800px]:[&_input]:size-5.5">
          <input
            type="checkbox"
            checked={onlyRanked}
            onChange={(event) => { closePopover(); setOnlyRanked(event.target.checked); }}
          />
          <span>미투자자 제외</span>
        </label>
      </div>

      <section className="min-w-0" aria-label="투자자 성과 목록">
        <div className="rounded-xl border-[1.5px] border-[#d0d0d0] max-[900px]:overflow-x-auto" aria-busy={!rankings.data && rankings.isFetching}>
          <table className="w-full min-w-155 table-fixed border-separate border-spacing-0 text-left whitespace-nowrap min-[1800px]:min-w-215 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2] [&_th]:border-b-[1.5px] [&_th]:border-[#e4e4e4] [&_th]:bg-[#ededed] [&_th]:px-5 [&_th]:py-3.25 [&_th]:font-bold [&_th]:text-[#555] [&_th:first-child]:rounded-tl-[10px] [&_th:last-child]:rounded-tr-[10px] [&_td]:h-16 [&_td]:border-b [&_td]:border-[#e8e8e8] [&_td]:px-5 [&_td]:py-3 [&_th:nth-child(5)]:pr-8 [&_th:nth-child(5)]:text-right [&_td:nth-child(5)]:pr-8 [&_td:nth-child(5)]:text-right [&_th:last-child]:text-center [&_td:last-child]:text-center [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:last-child_td:first-child]:rounded-bl-[10px] [&_tbody_tr:last-child_td:last-child]:rounded-br-[10px] min-[1800px]:[&_th]:px-6.75 min-[1800px]:[&_th]:py-4.5 min-[1800px]:[&_td]:h-21 min-[1800px]:[&_td]:px-6.75 min-[1800px]:[&_td]:py-4.5 min-[1800px]:[&_th:nth-child(5)]:pr-12 min-[1800px]:[&_td:nth-child(5)]:pr-12">
            <caption className="sr-only">{groupLabel} 투자자 성과. 이름에 커서를 올리거나 키보드로 선택하면 계산 내역을 볼 수 있어요.</caption>
            <colgroup><col className="w-[9%]" /><col /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[17%]" /><col className="w-[17%]" /></colgroup>
            <thead><tr>{["순위", "이름", "역할", "소속 팀", "성과 점수", "상태"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>
              {!rankings.data && rankings.isFetching ? <tr><td colSpan={6} className="text-center text-[#777]">목록을 불러오는 중...</td></tr> : visible.map(investor => {
                const active = hovered?.kind === "investor" && hovered.investorId === investor.investorId;
                return <tr key={investor.investorId} className={`group hover:bg-[#f5f5fc] ${active ? "bg-[#f5f5fc]" : ""}`}
                  onPointerEnter={event => {
                    const anchor = event.currentTarget.querySelector<HTMLButtonElement>("[data-score-trigger]");
                    if (event.pointerType !== "touch" && anchor) showPopover(investor.investorId, anchor, 140);
                  }} onPointerLeave={leavePopover}>
                  <td>{investor.rank === null ? <span className="block pl-2.5 text-[#aaa]" aria-label="순위 없음">—</span> : <span className={`inline-flex h-7.5 min-w-7.5 items-center justify-center font-semibold tabular-nums min-[1800px]:h-10 min-[1800px]:min-w-10 ${investor.rank === 1 ? "rounded-lg bg-primary text-white" : investor.rank <= 3 ? "rounded-lg bg-[#eeeefb] text-secondary" : "text-[#777]"}`}>{investor.rank}<span className="sr-only">위</span></span>}</td>
                  <td><button type="button" data-score-trigger className="inline-flex max-w-full items-center gap-2.5 rounded text-left [&_strong]:overflow-hidden [&_strong]:font-medium [&_strong]:text-ellipsis [&_svg]:size-3.75 [&_svg]:shrink-0 [&_svg]:text-secondary [&_svg]:opacity-0 group-hover:[&_svg]:opacity-100 aria-expanded:[&_svg]:opacity-100 focus-visible:[&_svg]:opacity-100 min-[1800px]:[&_svg]:size-4.75" aria-expanded={active} aria-haspopup="dialog" aria-controls={active ? "investor-score-popover" : undefined} aria-label={`${investor.alias} 점수 자세히 보기`}
                    onFocus={event => showPopover(investor.investorId, event.currentTarget)} onBlur={event => { if (!(event.relatedTarget instanceof Node && document.getElementById("investor-score-popover")?.contains(event.relatedTarget))) leavePopover(); }}
                    onClick={event => showPopover(investor.investorId, event.currentTarget)}
                    onKeyDown={event => { if (event.key === "ArrowDown" && active) { event.preventDefault(); document.getElementById("investor-score-popover")?.focus(); } }}>
                    <strong>{investor.alias}</strong><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button></td>
                  <td className="text-[#777]">{investor.kind === "STAFF" ? "운영팀" : "참가자"}</td>
                  <td>{investor.teamId === null ? <span className="text-[#aaa]">—</span> : <span className="font-sans text-[#555]">TEAM {String(investor.teamId).padStart(2, "0")}</span>}</td>
                  <td><div className={`tabular-nums [&_strong]:text-[16px] [&_strong]:font-bold [&_small]:ml-1 [&_small]:text-[12px] [&_small]:font-normal [&_small]:text-[#888] min-[1800px]:[&_strong]:text-[22px] min-[1800px]:[&_small]:text-[16px] ${investor.score < 0 ? "text-[#b42318]" : investor.score > 0 ? "text-secondary" : ""}`}><strong>{points(investor.score)}<small>점</small></strong></div></td>
                  <td><InvestorProgressBadge contributions={investor.contributions} /></td>
                </tr>;
              })}
            </tbody>
          </table>
          {rankings.data && !visible.length && <div className="flex min-h-47.5 flex-col items-center justify-center gap-3 px-4 py-6.25 text-center text-[#777] [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-[#222]"><h3>{items.length ? "일치하는 투자자가 없어요" : "이 그룹에는 투자자가 없어요"}</h3><p>{items.length ? "검색어를 바꾸거나 ‘미투자자 제외’를 해제해 보세요." : "등록된 투자자가 생기면 이곳에 표시돼요."}</p>{items.length > 0 && <button type="button" className="min-h-11 rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-4.5 py-2.5 font-bold whitespace-nowrap text-[#333] hover:bg-[#f6f6f6] min-[1800px]:min-h-16.5 min-[1800px]:px-6.75 min-[1800px]:py-3.75" onClick={() => { closePopover(); setSearch(""); setOnlyRanked(false); }}>필터 초기화</button>}</div>}
          {!rankings.data && rankings.isError && <div className="flex min-h-47.5 flex-col items-center justify-center gap-3 px-4 py-6.25 text-center text-[#777] [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-[#222]"><p>조회가 완료되면 순위가 표시돼요.</p></div>}
        </div>
      </section>
      {focusedInvestor && hovered?.kind === "investor" && <InvestorScorePopover investor={focusedInvestor} anchor={hovered.anchor} groupLabel={groupLabel} tied={focusedInvestor.rank !== null && items.filter(item => item.rank === focusedInvestor.rank).length > 1} onClose={closePopover} onEnter={cancelTimers} onLeave={leavePopover} />}
      {hovered?.kind === "rules" && <ScoringRules anchor={hovered.anchor} onClose={closePopover} onEnter={cancelTimers} onLeave={leavePopover} />}
    </div>
  );
}
