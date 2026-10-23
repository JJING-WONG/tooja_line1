import { Link, useOutletContext } from "react-router-dom";

import runningIcon from "../../assets/InvestmentRunning.svg";
import pausedIcon from "../../assets/InvestmentPaused.svg";
import type { AdminOverviewContext } from "../../layouts/AdminLayout";

// Figma A02 시안 데이터입니다. 관리자 조회 API 연결 시 서버 응답으로 교체합니다.
const previewMetrics = [
  { label: "등록 투자자", value: "132명", width: "w-[175.5px]" },
  { label: "투자 인원", value: "120명", width: "w-[216px]" },
  { label: "총 지급액", value: "132,000,000원", width: "w-[520.5px]" },
  { label: "총 투자액", value: "98,400,000원", width: "w-[520.5px]" },
  { label: "총 잔액", value: "33,600,000원", width: "w-[969px]" },
  { label: "전액 소진 / 미소진", value: "80명 / 52명", width: "w-[499.5px]" },
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
  const { investmentStatus = "RUNNING" } =
    useOutletContext<AdminOverviewContext>() ?? {};
  const isRunning = investmentStatus === "RUNNING";
  return (
    <div className="flex flex-col gap-7.5">
      <header className="flex h-12.5 items-center justify-between gap-6 whitespace-nowrap">
        <h1 className="flex items-center gap-5.75 text-[36px] leading-12.5 font-bold text-[#111]">
          <img src={isRunning ? runningIcon : pausedIcon} alt="" />
          {isRunning ? "투자 진행 중" : "투자 중단됨"}
        </h1>
        {/* 자동 갱신 및 기준 시각은 조회 API 연결 시 적용합니다. */}
        <p className="text-[19.5px] leading-6.75 text-[#777]">
          ● 마지막 갱신 14:32:05 · 1초 자동 갱신
        </p>
      </header>
      <dl className="flex flex-wrap gap-4.5">
        {previewMetrics.map(({ label, value, width }) => (
          <div
            key={label}
            className={`${width} flex shrink-0 flex-col gap-1.5 rounded-[15px] bg-[#f6f6f6] px-6.75 py-6 whitespace-nowrap`}
          >
            <dt className="text-[19.5px] leading-6.75 text-[#777]">{label}</dt>
            <dd className="text-[33px] leading-11.5 font-bold text-[#111]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <h2
        id="role-summary-title"
        className="text-[24px] leading-8.5 font-bold text-[#222]"
      >
        역할별 현황
      </h2>
      <div className="overflow-hidden rounded-xl border-[1.5px] border-[#d0d0d0]">
        <table
          aria-labelledby="role-summary-title"
          className="w-full table-fixed border-separate border-spacing-0 text-left text-[19.5px] leading-6.75 whitespace-nowrap"
        >
          <colgroup>
            <col className="w-60" />
            <col className="w-52.5" />
            <col className="w-52.5" />
            <col className="w-63.75" />
            <col className="w-63.75" />
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
                  className="border-b-[1.5px] border-[#e4e4e4] px-5.25 py-[16.5px] font-bold"
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
                  className="border-b-[1.5px] border-[#e4e4e4] px-5.25 py-[16.5px] font-normal"
                >
                  {role}
                </th>
                {values.map((value, index) => (
                  <td
                    key={index}
                    className="border-b-[1.5px] border-[#e4e4e4] px-5.25 py-[16.5px]"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3.75 text-[21px] leading-7.25 font-bold whitespace-nowrap">
        <Link
          to="/admin/investors?spendingStatus=UNSPENT"
          className="flex h-16.25 w-61 items-center justify-center rounded-xl bg-dark text-center text-white"
        >
          미소진 투자자 보기 →
        </Link>
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-17 w-63 items-center justify-center rounded-xl border-[1.5px] border-[#c4c4c4] text-center text-[#333]"
        >
          대형 대시보드 새 탭 ↗
        </Link>
      </div>
    </div>
  );
}
