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

export default function InvestorDetailPage() {
  return (
    <div className="flex flex-col gap-4.5">
      <nav
        aria-label="현재 위치"
        className="flex items-center gap-2 text-[13px] leading-4.5"
      >
        <Link
          to="/admin/investors"
          className="w-18.25 shrink-0 text-[#888] whitespace-pre"
        >
          투자자 목록 ›
        </Link>
        <span aria-current="page" className="font-bold text-[#333]">
          {previewInvestor.alias}
        </span>
      </nav>

      <header className="flex h-8.5 items-center gap-3 whitespace-nowrap">
        <h1 className="w-44 shrink-0 text-2xl leading-8.5 font-bold text-[#111]">
          {previewInvestor.alias}
        </h1>
        <span className="flex h-6.25 w-28.25 shrink-0 items-center rounded-full bg-[#ededed] px-2.5 text-xs leading-4.25 text-[#555]">
          참가자 · <span className="font-sans">{previewInvestor.team}</span>
        </span>
        <span className="w-13.5 rounded-full bg-[#fdecec] py-1 text-center text-xs leading-4.25 font-bold text-[#b42318]">
          미소진
        </span>
      </header>

      <dl className="flex gap-3 whitespace-nowrap">
        {previewMetrics.map(({ label, value, background }) => (
          <div
            key={label}
            className={`${background} flex min-w-0 flex-1 flex-col gap-1 rounded-[10px] px-4.5 py-4`}
          >
            <dt className="text-[13px] leading-4.5 text-[#777]">{label}</dt>
            <dd className="text-[22px] leading-7.75 font-bold text-[#111]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <h2
        id="transaction-history-title"
        className="text-base leading-5.5 font-bold text-[#222]"
      >
        거래 내역 (최신순)
      </h2>
      <div className="h-29.5 overflow-hidden rounded-lg border border-[#d0d0d0]">
        <table
          aria-labelledby="transaction-history-title"
          className="w-full table-fixed border-separate border-spacing-0 text-left text-[13px] leading-4.5 whitespace-nowrap"
        >
          <colgroup>
            <col className="w-55" />
            <col className="w-75" />
            <col />
          </colgroup>
          <thead className="bg-[#ededed] text-[#444]">
            <tr>
              {["확정 시각", "투자 팀", "금액"].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="border-b border-[#e4e4e4] px-3.5 py-2.5 font-bold"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {previewTransactions.map(({ time, team, name, amount }) => (
              <tr
                key={`${time}-${team}`}
                className="[&>td]:border-b [&>td]:border-[#e4e4e4] [&>td]:px-3.5 [&>td]:py-2.5"
              >
                <td>{time}</td>
                <td>
                  <div className="flex h-4.5 items-center">
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

      <p className="rounded-lg bg-[#f4f4f4] px-3.5 py-3 text-xs leading-4.25 text-[#777]">
        잔액 수정 · 투자 취소 기능 없음 (조회 전용)
      </p>
    </div>
  );
}
