import AdminHoverCard from "./AdminHoverCard";
import type { components } from "../../../apis/schema";

type Investor = components["schemas"]["InvestorRanking"];
const points = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("ko-KR")}`;

export default function InvestorScorePopover({ investor, anchor, groupLabel, tied, onClose, onEnter, onLeave }: {
  investor: Investor;
  anchor: HTMLElement;
  groupLabel: string;
  tied: boolean;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <AdminHoverCard id="investor-score-popover" labelledBy="pf-popover-name" className="pf-score-popover" anchor={anchor} onClose={onClose} onEnter={onEnter} onLeave={onLeave}>
      <header className="pf-popover-header">
        <div><span className="pf-popover-eyebrow">투자 성과</span><h2 id="pf-popover-name">{investor.alias}</h2><p>{investor.kind === "STAFF" ? "운영팀 투자자" : `참가자 · TEAM ${String(investor.teamId).padStart(2, "0")}`}</p></div>
        <div className="pf-popover-total"><strong className={investor.score < 0 ? "pf-negative" : ""}>{points(investor.score)}<small>점</small></strong><span>{investor.rank === null ? "미투자 · 순위 없음" : `${groupLabel} ${tied ? "공동 " : ""}${investor.rank}위`}</span></div>
      </header>
      {investor.contributions.length ? <>
        <div className="pf-popover-columns" aria-hidden="true"><span>투자 팀</span><span>투자금</span><span>10만원당</span><span>점수</span></div>
        <ol className="pf-popover-contributions">{investor.contributions.map(item => <li key={item.teamId}>
          <div><h3>{item.serviceName}</h3><p>TEAM {String(item.teamId).padStart(2, "0")} · 현재 {item.teamRank}위</p></div>
          <span>{item.investedAmount / 10000}<small>만원</small></span>
          <span className={item.pointsPerUnit < 0 ? "pf-negative" : "pf-positive"}>{points(item.pointsPerUnit)}<small>점</small></span>
          <strong className={item.score < 0 ? "pf-negative" : "pf-positive"}>{points(item.score)}<small>점</small></strong>
        </li>)}</ol>
      </> : <p className="pf-popover-empty">아직 투자 내역이 없어요.</p>}
    </AdminHoverCard>
  );
}
