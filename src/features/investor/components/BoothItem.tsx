import { Link } from "react-router-dom";
import type { components } from "../../../apis/schema";

export type Booth = Pick<
  components["schemas"]["Team"],
  "teamId" | "investmentState" | "myInvestmentAmount"
>;

export default function BoothItem({
  team,
  isStaff,
  isCompleted,
}: {
  team: Booth;
  isStaff: boolean;
  isCompleted: boolean;
}) {
  const isSelf = !isStaff && team.investmentState === "SELF_TEAM";
  const hasInvestment = team.myInvestmentAmount > 0;
  const isGray = isCompleted || team.investmentState === "BALANCE_EXHAUSTED";
  const label = `TEAM ${String(team.teamId).padStart(2, "0")}`;
  const color = isSelf
    ? "border-[1.117px] border-dashed border-[#a9a9a9] bg-[#d0d0d0]/50 text-[#a9a9a9]"
    : isGray
      ? "bg-[#d0d0d0]/50 text-[#777]"
      : hasInvestment
        ? "bg-secondary text-white"
        : "bg-primary/50 text-black";
  const content = (
    <>
      <span>{label}</span>
      {hasInvestment && (
        <span
          className={`text-[2.33cqw] ${isGray || isSelf ? "text-[#777]" : "text-[#e7ddff]"}`}
        >
          {team.myInvestmentAmount.toLocaleString("ko-KR")}
        </span>
      )}
    </>
  );
  const className = `flex h-full w-full flex-col items-center justify-center gap-px rounded-[5.583px] text-[2.66cqw] leading-[1.2] ${color}`;

  return isSelf ? (
    <span
      aria-label={`${label}, 내 팀, 선택 불가`}
      aria-disabled="true"
      className={className}
    >
      {content}
    </span>
  ) : (
    <Link
      to={`/invest/teams/${team.teamId}`}
      aria-label={`${label}${hasInvestment ? `, 투자 완료 ${team.myInvestmentAmount.toLocaleString("ko-KR")}원` : ""}, 상세 보기`}
      className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary`}
    >
      {content}
    </Link>
  );
}
