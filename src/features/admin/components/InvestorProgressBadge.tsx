import type { components } from "../../../apis/schema";

type Contribution = components["schemas"]["ScoreContribution"];

// 성과 화면의 표시 상태입니다. 순위 자격과 별개로 확정 투자액을 합산해요.
// 모든 투자자의 지급액은 100만원이며, 기존 투자자 API의 spendingStatus와 구분합니다.
export default function InvestorProgressBadge({ contributions }: { contributions: Contribution[] }) {
  const invested = contributions.reduce((total, item) => total + item.investedAmount, 0);
  const state = invested === 0
    ? { label: "미소진", color: "bg-[#fdecec] text-[#b42318]" }
    : invested < 1_000_000
      ? { label: "진행 중", color: "bg-[#eeeefb] text-[#5758af]" }
      : { label: "전부 소진", color: "bg-[#e4fae8] text-[#67a672]" };

  return <span className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold leading-4.25 min-[1800px]:px-3.75 min-[1800px]:py-0.75 min-[1800px]:text-[18px] min-[1800px]:leading-6.25 ${state.color}`}>{state.label}</span>;
}
