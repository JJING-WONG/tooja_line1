import SpendingStatusBadge from "../../features/admin/components/SpendingStatusBadge";
import type { components } from "../../apis/schema";
import { Link } from "react-router-dom";

// Figma A04 시안 데이터입니다. 실제 투자자 ID별 조회는 API 연결 시 적용합니다.
const previewInvestor = {
  alias: "팀 03 투자자 012",
  team: "TEAM 03",
};

const previewMetrics = [
  { label: "지급액", value: "1,000,000원", background: "bg-[#f6f6f6]" },
  { label: "투자액", value: "700,000원", background: "bg-[#f6f6f6]" },
  { label: "남은 잔액", value: "300,000원", background: "bg-primary/20" },
];

const previewTransactions = [
  {
    time: "10.17 14:32",
    team: "TEAM 05",
    name: "팀 05 데모 서비스",
    amount: "500,000원",
  },
  {
    time: "10.17 13:10",
    team: "TEAM 02",
    name: "팀 02 데모 서비스",
    amount: "200,000원",
  },
];

export default function InvestorDetailPage({
  previewEmpty = false,
  previewSpendingStatus = "UNSPENT",
}: {
  previewEmpty?: boolean;
  previewSpendingStatus?: components["schemas"]["Investor"]["spendingStatus"];
}) {
  const isCompleted = previewSpendingStatus === "COMPLETED";
  // 소진 완료 시안은 지급액·투자액·거래 합계가 일치하도록 표시합니다.
  const metrics = previewMetrics.map((metric) => {
    if (!isCompleted) return metric;
    if (metric.label === "투자액") return { ...metric, value: "1,000,000원" };
    if (metric.label === "남은 잔액") {
      return {
        ...metric,
        value: "마일리지가 전부 소진되었어요",
        background: "bg-[#fdecec]",
      };
    }
    return metric;
  });
  const transactions = previewEmpty
    ? []
    : previewTransactions.map((transaction, index) =>
        isCompleted && index === 1
          ? { ...transaction, amount: "500,000원" }
          : transaction,
      );
  return (
    <div className="flex flex-col gap-4.5 min-[1800px]:gap-6.75">
      <nav
        aria-label="현재 위치"
        className="flex flex-wrap items-center gap-2 text-[13px] leading-4.5 min-[1800px]:gap-3 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75"
      >
        <Link
          to="/admin/investors"
          className="shrink-0 text-[#888] whitespace-pre"
        >
          투자자 목록 ›
        </Link>
        <span aria-current="page" className="font-bold text-[#333]">
          {previewInvestor.alias}
        </span>
      </nav>

      <header className="flex min-h-8.5 flex-wrap items-center gap-3 whitespace-nowrap min-[1800px]:min-h-12.5 min-[1800px]:gap-4.5">
        <h1 className="min-w-0 wrap-break-word text-2xl leading-8.5 min-[1800px]:text-[36px] min-[1800px]:leading-12.5 font-bold text-[#111]">
          {previewInvestor.alias}
        </h1>
        <span className="flex shrink-0 items-center rounded-full bg-[#ededed] px-2.5 py-1 text-xs leading-4.25 min-[1800px]:px-3.75 min-[1800px]:py-1.5 min-[1800px]:text-[18px] min-[1800px]:leading-6.25 text-[#555]">
          참가자 · <span className="font-sans">{previewInvestor.team}</span>
        </span>
        <SpendingStatusBadge status={previewSpendingStatus} />
      </header>

      <dl className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-3 min-[1800px]:gap-4.5">
        {metrics.map(({ label, value, background }) => {
          const isCompletedBalance = isCompleted && label === "남은 잔액";
          return (
            <div
              key={label}
              className={`${background} flex min-w-0 flex-1 flex-col rounded-[10px] px-4.5 py-4 min-[1800px]:rounded-[15px] min-[1800px]:px-6.75 min-[1800px]:py-6 ${isCompletedBalance ? "gap-2 min-[1800px]:gap-2.75" : "gap-1 min-[1800px]:gap-1.5"}`}
            >
              <dt className="text-[13px] leading-4.5 text-[#777] min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75">
                {label}
              </dt>
              <dd
                className={`wrap-break-word ${isCompletedBalance ? "text-[17px] font-medium leading-6 text-[#ce6161] min-[1800px]:text-[25px] min-[1800px]:leading-8.75" : "text-[22px] leading-7.75 min-[1800px]:text-[33px] min-[1800px]:leading-11.5 font-bold text-[#111]"}`}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>

      <h2
        id="transaction-history-title"
        className="text-base leading-5.5 min-[1800px]:text-[24px] min-[1800px]:leading-8.5 font-bold text-[#222]"
      >
        거래 내역 (최신순)
      </h2>
      <div className="overflow-x-auto rounded-lg border min-[1800px]:rounded-xl min-[1800px]:border-[1.5px] border-[#d0d0d0]">
        <table
          aria-labelledby="transaction-history-title"
          className="w-full min-w-175 table-fixed border-separate border-spacing-0 text-left text-[13px] leading-4.5 whitespace-nowrap min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75"
        >
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[30%]" />
            <col />
          </colgroup>
          <thead className="bg-[#ededed] text-[#444]">
            <tr>
              {["확정 시각", "투자 팀", "금액"].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="border-b border-[#e4e4e4] px-3.5 py-2.5 font-bold min-[1800px]:border-b-[1.5px] min-[1800px]:px-5.25 min-[1800px]:py-3.75"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="border-b border-[#e4e4e4] px-3.5 py-2.5 text-center min-[1800px]:border-b-[1.5px] min-[1800px]:px-5.25 min-[1800px]:py-3.75"
                >
                  아직 투자한 팀이 없어요
                </td>
              </tr>
            )}
            {transactions.map(({ time, team, name, amount }) => (
              <tr
                key={`${time}-${team}`}
                className="[&>td]:border-b [&>td]:border-[#e4e4e4] [&>td]:px-3.5 [&>td]:py-2.5 min-[1800px]:[&>td]:border-b-[1.5px] min-[1800px]:[&>td]:px-5.25 min-[1800px]:[&>td]:py-3.75"
              >
                <td>{time}</td>
                <td>
                  <div className="flex h-4.5 items-center min-[1800px]:h-6.75">
                    <span className="font-sans">{team}</span>
                    <span className="whitespace-pre"> · {name}</span>
                  </div>
                </td>
                <td>{amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-lg bg-[#f4f4f4] px-3.5 py-3 text-xs leading-4.25 min-[1800px]:rounded-xl min-[1800px]:px-5.25 min-[1800px]:py-4.5 min-[1800px]:text-[18px] min-[1800px]:leading-6.25 text-[#777]">
        잔액 수정 · 투자 취소 기능 없음 (조회 전용)
      </p>
    </div>
  );
}
