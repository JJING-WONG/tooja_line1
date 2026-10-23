import type { components } from "../../../apis/schema";

type SpendingStatus = components["schemas"]["Investor"]["spendingStatus"];

const styles = {
  UNSPENT: { label: "미소진", color: "bg-[#fdecec] text-[#b42318]" },
  COMPLETED: { label: "소진 완료", color: "bg-[#e4fae8] text-[#67a672]" },
  NOT_ACTIVATED: { label: "미지급", color: "bg-[#faf7e4] text-[#b1a86e]" },
};

// A03 목록·A04 상세 공통 상태 표시. 클릭 동작이 없는 배지입니다.
export default function SpendingStatusBadge({ status }: { status: SpendingStatus }) {
  const { label, color } = styles[status];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold leading-4.25 min-[1800px]:px-3.75 min-[1800px]:py-0.75 min-[1800px]:text-[18px] min-[1800px]:leading-6.25 ${color}`}>
      {label}
    </span>
  );
}
