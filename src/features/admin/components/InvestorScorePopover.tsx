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
    <AdminHoverCard id="investor-score-popover" labelledBy="pf-popover-name" className="w-110 min-[1800px]:w-120" anchor={anchor} onClose={onClose} onEnter={onEnter} onLeave={onLeave}>
      <header className="flex items-center justify-between gap-4 border-b border-[#efeff4] px-5.5 pt-5.5 pb-5 [&_h2]:text-[19px] [&_h2]:leading-normal [&_h2]:font-bold [&_h2]:tracking-[-0.5px] [&_h2]:text-dark [&_h2]:wrap-anywhere min-[1800px]:[&_h2]:text-[21px] [&_p]:mt-0.75 [&_p]:text-[11px] [&_p]:text-[#777] min-[1800px]:[&_p]:text-[12px]">
        <div><span className="mb-1 block text-[11px] text-[#888]">투자 성과</span><h2 id="pf-popover-name">{investor.alias}</h2><p>{investor.kind === "STAFF" ? "운영팀 투자자" : `참가자 · TEAM ${String(investor.teamId).padStart(2, "0")}`}</p></div>
        <div className="shrink-0 text-right [&>strong]:block [&>strong]:text-[28px] [&>strong]:font-bold [&>strong]:tracking-[-0.7px] [&>strong]:tabular-nums [&_small]:ml-0.75 [&_small]:text-[13px] [&_small]:font-normal [&_small]:text-[#888] [&>span]:mt-0.75 [&>span]:block [&>span]:text-[11px] [&>span]:text-[#777] min-[1800px]:[&>span]:text-[12px]"><strong className={investor.score < 0 ? "text-[#b42318]" : "text-secondary"}>{points(investor.score)}<small>점</small></strong><span>{investor.rank === null ? "미투자 · 순위 없음" : `${groupLabel} ${tied ? "공동 " : ""}${investor.rank}위`}</span></div>
      </header>
      {investor.contributions.length ? <>
        <div className="grid grid-cols-[minmax(0,1fr)_57px_56px_55px] items-center gap-x-1.75 bg-[#fafafb] px-5.5 py-2.75 text-[10px] text-[#888] [&>span:not(:first-child)]:text-right" aria-hidden="true"><span>투자 팀</span><span>투자금</span><span>10만원당</span><span>점수</span></div>
        <ol className="m-0 list-none px-5.5 [&>li]:grid [&>li]:grid-cols-[minmax(0,1fr)_57px_56px_55px] [&>li]:items-center [&>li]:gap-x-1.75 [&>li]:border-b [&>li]:border-[#efeff4] [&>li]:py-4 [&>li:last-child]:border-b-0 [&_h3]:text-[12px] [&_h3]:leading-[1.6] [&_h3]:font-semibold [&_h3]:text-[#333] [&_h3]:wrap-anywhere min-[1800px]:[&_h3]:text-[14px] [&_p]:mt-0.75 [&_p]:text-[10px] [&_p]:text-[#888] min-[1800px]:[&_p]:text-[11px] [&>li>span]:text-right [&>li>span]:text-[12px] [&>li>span]:whitespace-nowrap [&>li>span]:tabular-nums min-[1800px]:[&>li>span]:text-[13px] [&>li>strong]:text-right [&>li>strong]:text-[14px] [&>li>strong]:font-bold [&>li>strong]:whitespace-nowrap [&>li>strong]:tabular-nums min-[1800px]:[&>li>strong]:text-[16px] [&_small]:ml-0.5 [&_small]:text-[10px]">{investor.contributions.map(item => <li key={item.teamId}>
          <div><h3>{item.serviceName}</h3><p>TEAM {String(item.teamId).padStart(2, "0")} · 현재 {item.teamRank}위</p></div>
          <span>{item.investedAmount / 10000}<small>만원</small></span>
          <span className={item.pointsPerUnit < 0 ? "text-[#b42318]" : "text-secondary"}>{points(item.pointsPerUnit)}<small>점</small></span>
          <strong className={item.score < 0 ? "text-[#b42318]" : "text-secondary"}>{points(item.score)}<small>점</small></strong>
        </li>)}</ol>
      </> : <p className="px-5.5 py-8 text-center text-[#777]">아직 투자 내역이 없어요.</p>}
    </AdminHoverCard>
  );
}
