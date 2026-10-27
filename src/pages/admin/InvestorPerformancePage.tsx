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
import "./InvestorPerformancePage.css";

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
    <AdminHoverCard id="performance-rules-popover" labelledBy="pf-rules-title" className="pf-rules-popover" anchor={anchor} onClose={onClose} onEnter={onEnter} onLeave={onLeave}>
      <header className="pf-rules-heading"><span>점수 가이드</span><h2 id="pf-rules-title">점수 산정 방식</h2><p>조회 시점의 팀 순위에 따라 <strong>투자금 10만원당</strong> 점수를 받아요.</p></header>
      <div className="pf-rules-content">
        <div className="pf-points-grid">{Array.from({ length: 20 }, (_, i) => i + 1).map(rank => <div key={rank} className={rank > 10 ? "pf-minus-cell" : ""}><span>{rank}위</span><strong>{points(rank <= 10 ? 11 - rank : 10 - rank)}<small>점</small></strong></div>)}</div>
        <div className="pf-example"><p>2위 팀에 60만원, 15위 팀에 40만원을 투자했다면</p><strong>6 × 9 + 4 × (−5) = <span>34점</span></strong></div>
        <ul>
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
    <div className="performance-page flex flex-col gap-6.75">
      <header className="flex min-h-8.5 flex-wrap items-center justify-between gap-3 min-[1800px]:min-h-12.5">
        <div className="pf-title">
          <h1 className="text-2xl leading-8.5 min-[1800px]:text-[36px] min-[1800px]:leading-12.5 font-bold text-[#111]">투자 성과</h1>
          <button type="button" className="pf-help-trigger" aria-label="점수 산정 방식" aria-haspopup="dialog" aria-expanded={hovered?.kind === "rules"} aria-controls={hovered?.kind === "rules" ? "performance-rules-popover" : undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") showRules(event.currentTarget, 140); }} onPointerLeave={leavePopover}
            onFocus={event => showRules(event.currentTarget)} onBlur={event => { if (!(event.relatedTarget instanceof Node && document.getElementById("performance-rules-popover")?.contains(event.relatedTarget))) leavePopover(); }}
            onClick={event => showRules(event.currentTarget)} onKeyDown={event => { if (event.key === "ArrowDown" && hovered?.kind === "rules") { event.preventDefault(); document.getElementById("performance-rules-popover")?.focus(); } }}>?</button>
        </div>
        <div className="pf-header-actions">
          <p className="pf-as-of text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 text-[#777]">
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
        <div className="pf-error" role="alert">
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
            className="pf-button"
            onClick={refresh}
            disabled={isBusy}
          >
            다시 시도
          </button>
        </div>
      )}

      <section
        className="pf-summary grid grid-cols-1 gap-3 min-[900px]:grid-cols-3 min-[1800px]:gap-4.5"
        aria-label={`${groupLabel} 투자 성과 요약`}
        aria-busy={!rankings.data && rankings.isFetching}
      >
        <div className="pf-summary-main">
          <p>투자한 사람 / 전체 투자자</p>
          <div className="pf-metric">
            <strong>{rankings.data ? number(ranked.length) : "—"}</strong>명{" "}
            <span>/ {rankings.data ? number(items.length) : "—"}명</span>
          </div>
        </div>
        <div>
          <p>최고 점수</p>
          <div className="pf-metric">
            <strong>{ranked.length ? points(ranked[0].score) : "—"}</strong>점
          </div>
        </div>
        <div>
          <p>아직 투자하지 않은 사람</p>
          <div className="pf-metric">
            <strong>
              {rankings.data ? number(items.length - ranked.length) : "—"}
            </strong>
            명
          </div>
        </div>
      </section>

      <div className="pf-toolbar" aria-label="투자 성과 검색 및 필터">
        <div className="pf-group-tabs" role="group" aria-label="조회 그룹">
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
        <div className="pf-search">
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
        <label className="pf-checkbox">
          <input
            type="checkbox"
            checked={onlyRanked}
            onChange={(event) => { closePopover(); setOnlyRanked(event.target.checked); }}
          />
          <span>미소진자 제외</span>
        </label>
      </div>

      <section className="pf-ranking" aria-label="투자자 성과 목록">
        <div className="pf-table-shell" aria-busy={!rankings.data && rankings.isFetching}>
          <table className="pf-table">
            <caption className="sr-only">{groupLabel} 투자자 성과. 이름에 커서를 올리거나 키보드로 선택하면 계산 내역을 볼 수 있어요.</caption>
            <colgroup><col className="pf-col-rank" /><col /><col className="pf-col-kind" /><col className="pf-col-team" /><col className="pf-col-score" /><col className="pf-col-state" /></colgroup>
            <thead><tr>{["순위", "이름", "역할", "소속 팀", "성과 점수", "상태"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>
              {!rankings.data && rankings.isFetching ? <tr><td colSpan={6} className="pf-loading">목록을 불러오는 중...</td></tr> : visible.map(investor => {
                const active = hovered?.kind === "investor" && hovered.investorId === investor.investorId;
                return <tr key={investor.investorId} className={`${active ? "pf-row-active" : ""} ${investor.rank === null ? "pf-row-unranked" : ""}`}
                  onPointerEnter={event => {
                    const anchor = event.currentTarget.querySelector<HTMLButtonElement>(".pf-person-button");
                    if (event.pointerType !== "touch" && anchor) showPopover(investor.investorId, anchor, 140);
                  }} onPointerLeave={leavePopover}>
                  <td>{investor.rank === null ? <span className="pf-rank-none" aria-label="순위 없음">—</span> : <span className={`pf-rank-number ${investor.rank <= 3 ? `pf-rank-${investor.rank}` : ""}`}>{investor.rank}<span className="sr-only">위</span></span>}</td>
                  <td><button type="button" className="pf-person-button" aria-expanded={active} aria-haspopup="dialog" aria-controls={active ? "investor-score-popover" : undefined} aria-label={`${investor.alias} 점수 자세히 보기`}
                    onFocus={event => showPopover(investor.investorId, event.currentTarget)} onBlur={event => { if (!(event.relatedTarget instanceof Node && document.getElementById("investor-score-popover")?.contains(event.relatedTarget))) leavePopover(); }}
                    onClick={event => showPopover(investor.investorId, event.currentTarget)}
                    onKeyDown={event => { if (event.key === "ArrowDown" && active) { event.preventDefault(); document.getElementById("investor-score-popover")?.focus(); } }}>
                    <strong>{investor.alias}</strong><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button></td>
                  <td className="pf-kind-cell">{investor.kind === "STAFF" ? "운영팀" : "참가자"}</td>
                  <td>{investor.teamId === null ? <span className="pf-no-team">—</span> : <span className="font-sans pf-team-label">TEAM {String(investor.teamId).padStart(2, "0")}</span>}</td>
                  <td><div className={`pf-score-cell ${investor.score < 0 ? "pf-negative" : investor.score > 0 ? "pf-positive" : ""}`}><strong>{points(investor.score)}<small>점</small></strong></div></td>
                  <td><InvestorProgressBadge contributions={investor.contributions} /></td>
                </tr>;
              })}
            </tbody>
          </table>
          {rankings.data && !visible.length && <div className="pf-empty"><h3>{items.length ? "일치하는 투자자가 없어요" : "이 그룹에는 투자자가 없어요"}</h3><p>{items.length ? "검색어를 바꾸거나 ‘미소진자 제외’를 해제해 보세요." : "등록된 투자자가 생기면 이곳에 표시돼요."}</p>{items.length > 0 && <button type="button" className="pf-button" onClick={() => { closePopover(); setSearch(""); setOnlyRanked(false); }}>필터 초기화</button>}</div>}
          {!rankings.data && rankings.isError && <div className="pf-empty"><p>조회가 완료되면 순위가 표시돼요.</p></div>}
        </div>
      </section>
      {focusedInvestor && hovered?.kind === "investor" && <InvestorScorePopover investor={focusedInvestor} anchor={hovered.anchor} groupLabel={groupLabel} tied={focusedInvestor.rank !== null && items.filter(item => item.rank === focusedInvestor.rank).length > 1} onClose={closePopover} onEnter={cancelTimers} onLeave={leavePopover} />}
      {hovered?.kind === "rules" && <ScoringRules anchor={hovered.anchor} onClose={closePopover} onEnter={cancelTimers} onLeave={leavePopover} />}
    </div>
  );
}
