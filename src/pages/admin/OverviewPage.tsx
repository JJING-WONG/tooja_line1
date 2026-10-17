import { Link } from "react-router-dom";

// Figma A02 시안 데이터입니다. 관리자 조회 API 연결 시 서버 응답으로 교체합니다.
const previewMetrics = [
  { label: "등록 투자자", value: "132명", width: "w-[117px]" },
  { label: "투자 인원", value: "120명", width: "w-[144px]" },
  { label: "총 지급액", value: "132,000,000원", width: "w-[347px]" },
  { label: "총 투자액", value: "98,400,000원", width: "w-[347px]" },
  { label: "총 잔액", value: "33,600,000원", width: "w-[646px]" },
  { label: "전액 소진 / 미소진", value: "80명 / 52명", width: "w-[333px]" },
];

const previewRoles = [
  [
    "참가자",
    "120명",
    "112명",
    "120,000,000원",
    "91,200,000원",
    "소진 74 / 미소진 46",
  ],
  [
    "운영팀 투자자",
    "12명",
    "8명",
    "12,000,000원",
    "7,200,000원",
    "소진 6 / 미소진 6",
  ],
];

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex h-8.5 items-center justify-between whitespace-nowrap">
        <h1 className="text-2xl leading-8.5 font-bold text-[#111]">
          운영 현황
        </h1>
        {/* 자동 갱신 및 기준 시각은 조회 API 연결 시 적용합니다. */}
        <p className="text-[13px] leading-4.5 text-[#777]">
          ● 마지막 갱신 14:32:05 · 1초 자동 갱신
        </p>
      </header>
      <dl className="flex max-w-248.25 flex-wrap gap-3">
        {previewMetrics.map(({ label, value, width }) => (
          <div
            key={label}
            className={`${width} flex shrink-0 flex-col gap-1 rounded-[10px] bg-[#f6f6f6] px-4.5 py-4 whitespace-nowrap`}
          >
            <dt className="text-[13px] leading-4.5 text-[#777]">{label}</dt>
            <dd className="text-[22px] leading-7.75 font-bold text-[#111]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <h2
        id="role-summary-title"
        className="text-base leading-5.5 font-bold text-[#222]"
      >
        역할별 현황
      </h2>
      <div className="overflow-hidden rounded-lg border border-[#d0d0d0]">
        <table
          aria-labelledby="role-summary-title"
          className="w-full table-fixed border-separate border-spacing-0 text-left text-[13px] leading-4.5 whitespace-nowrap"
        >
          <colgroup>
            <col className="w-40" />
            <col className="w-35" />
            <col className="w-35" />
            <col className="w-42.5" />
            <col className="w-42.5" />
            <col />
          </colgroup>
          <thead className="bg-[#ededed] text-[#444]">
            <tr>
              {[
                "역할",
                "등록",
                "투자 경험",
                "지급액",
                "투자액",
                "소진 현황",
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="border-b border-[#e4e4e4] px-3.5 py-2.75 font-bold"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {previewRoles.map(([role, ...values]) => (
              <tr key={role}>
                <th
                  scope="row"
                  className="border-b border-[#e4e4e4] px-3.5 py-2.75 font-normal"
                >
                  {role}
                </th>
                {values.map((value, index) => (
                  <td
                    key={index}
                    className="border-b border-[#e4e4e4] px-3.5 py-2.75"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2.5 text-sm leading-5 font-bold whitespace-nowrap">
        <Link
          to="/admin/investors?spendingStatus=UNSPENT"
          className="w-40.75 rounded-lg bg-dark py-3 text-center text-white"
        >
          미소진 투자자 보기 →
        </Link>
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="w-42 rounded-lg border border-[#c4c4c4] py-3 text-center text-[#333]"
        >
          대형 대시보드 새 탭 ↗
        </Link>
      </div>
    </div>
  );
}
