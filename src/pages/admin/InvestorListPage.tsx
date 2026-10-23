import SpendingStatusBadge from "../../features/admin/components/SpendingStatusBadge";
import type { components } from "../../apis/schema";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// A03 시안의 6개 행입니다. 실제 목록·전체 건수·자동 갱신은 API 연결 시 교체합니다.
const previewInvestors = [
  {
    id: "preview-participant-004",
    alias: "팀 01 투자자 004",
    kind: "PARTICIPANT",
    teamId: 1,
    investedAmount: 700000,
  },
  {
    id: "preview-participant-012",
    alias: "팀 03 투자자 012",
    kind: "PARTICIPANT",
    teamId: 3,
    investedAmount: 700000,
  },
  {
    id: "preview-participant-002",
    alias: "팀 07 투자자 002",
    kind: "PARTICIPANT",
    teamId: 7,
    investedAmount: 0,
  },
  {
    id: "preview-participant-005",
    alias: "팀 12 투자자 005",
    kind: "PARTICIPANT",
    teamId: 12,
    investedAmount: 900000,
  },
  {
    id: "preview-staff-003",
    alias: "운영팀 투자자 003",
    kind: "STAFF",
    teamId: null,
    investedAmount: 500000,
  },
  {
    id: "preview-staff-008",
    alias: "운영팀 투자자 008",
    kind: "STAFF",
    teamId: null,
    investedAmount: 600000,
  },
];

const spendingFilters = [
  { value: "ALL", label: "전체", width: "w-22.5" },
  { value: "UNSPENT", label: "미소진", width: "w-27" },
  { value: "COMPLETED", label: "소진 완료", width: "w-[131px]" },
];

export default function InvestorListPage({
  previewEmpty = false,
  previewSpendingStatus = "UNSPENT",
}: {
  previewEmpty?: boolean;
  previewSpendingStatus?: components["schemas"]["Investor"]["spendingStatus"];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") ?? "";
  const teamId = searchParams.get("teamId") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const spendingStatus = searchParams.get("spendingStatus") ?? "UNSPENT";

  function updateFilter(name: string, value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  }

  const investors = (previewEmpty ? [] : previewInvestors).filter(
    (investor) =>
      (!query ||
        `${investor.alias} ${investor.id}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!teamId || investor.teamId === Number(teamId)) &&
      (!kind || investor.kind === kind) &&
      spendingStatus !== "COMPLETED",
  );
  // 기본 시안은 검색 결과 52명 중 6개 행만 그려져 있습니다.
  const resultCount =
    !previewEmpty && !query && !teamId && !kind && spendingStatus === "UNSPENT"
      ? 52
      : investors.length;

  return (
    <div className="flex flex-col gap-6.75">
      <header className="flex min-h-8.5 flex-wrap items-center justify-between gap-3 min-[1800px]:min-h-12.5 whitespace-nowrap">
        <h1 className="text-2xl leading-8.5 min-[1800px]:text-[36px] min-[1800px]:leading-12.5 font-bold text-[#111]">
          투자자 목록
        </h1>
        <p className="text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 text-[#777]">
          ● 2초 자동 갱신 · 필터 유지
        </p>
      </header>
      <div
        aria-label="투자자 검색 및 필터"
        className="flex flex-wrap items-center gap-3.75 text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75"
      >
        <input
          type="search"
          aria-label="별칭 또는 ID 검색"
          placeholder="별칭 · ID 검색"
          value={query}
          onChange={(event) => updateFilter("q", event.target.value)}
          maxLength={100}
          className="h-11 w-65 max-w-full min-[1800px]:h-16.5 min-[1800px]:w-97.5 rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-5.25 text-[#333] placeholder:text-[#999]"
        />
        <label className="relative block h-11 w-32.5 shrink-0 min-[1800px]:h-16.5 min-[1800px]:w-48.75">
          <select
            aria-label="소속 팀"
            value={teamId}
            onChange={(event) => updateFilter("teamId", event.target.value)}
            className="h-full w-full appearance-none rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-5.25 text-transparent [&>option]:text-[#555]"
          >
            <option value="">팀 전체</option>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((team) => (
              <option key={team} value={team}>
                TEAM {String(team).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap px-3.5 text-[#555] min-[1800px]:px-5.25"
          >
            {teamId ? `TEAM ${teamId.padStart(2, "0")}` : "팀 전체"} ▾
          </span>
        </label>
        <label className="relative block h-11 w-32.5 shrink-0 min-[1800px]:h-16.5 min-[1800px]:w-48.75">
          <select
            aria-label="역할"
            value={kind}
            onChange={(event) => updateFilter("kind", event.target.value)}
            className="h-full w-full appearance-none rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-5.25 text-transparent [&>option]:text-[#555]"
          >
            <option value="">역할 전체</option>
            <option value="PARTICIPANT">참가자</option>
            <option value="STAFF">운영팀</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap px-3.5 text-[#555] min-[1800px]:px-5.25"
          >
            {kind === "STAFF"
              ? "운영팀"
              : kind === "PARTICIPANT"
                ? "참가자"
                : "역할 전체"}{" "}
            ▾
          </span>
        </label>
        <div
          role="group"
          aria-label="투자금 소진 상태"
          className="flex overflow-hidden rounded-xl border-[1.5px] border-[#c4c4c4]"
        >
          {spendingFilters.map(({ value, label, width }) => (
            <button
              key={value}
              type="button"
              aria-pressed={spendingStatus === value}
              onClick={() => updateFilter("spendingStatus", value)}
              className={`${width} h-10.5 shrink-0 min-[1800px]:h-15.75 font-bold ${spendingStatus === value ? "bg-dark text-white" : "bg-white text-[#555]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p
        aria-live="polite"
        className="text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 text-[#777]"
      >
        {resultCount === 0 ? "검색 결과 없음" : `검색 결과 ${resultCount}명`}
      </p>
      <div className="overflow-x-auto rounded-xl border-[1.5px] border-[#d0d0d0]">
        <table
          aria-label="투자자 목록"
          className="w-full min-w-250 table-fixed border-separate border-spacing-0 text-left text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 whitespace-nowrap"
        >
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col />
          </colgroup>
          <thead className="bg-[#ededed] text-[#444]">
            <tr>
              {["별칭", "역할", "팀", "지급액", "투자액", "잔액", "상태"].map(
                (label) => (
                  <th
                    key={label}
                    scope="col"
                    className="border-b-[1.5px] border-[#e4e4e4] px-3.5 py-2.5 min-[1800px]:px-5.25 min-[1800px]:py-3.75 font-bold"
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {investors.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="h-[62.5px] border-b-[1.5px] border-[#e4e4e4] px-3.5 py-2.5 min-[1800px]:px-5.25 min-[1800px]:py-3.75 text-center"
                >
                  아직 투자자가 나오지 않았어요
                </td>
              </tr>
            )}
            {investors.map((investor) => (
              <tr
                key={investor.id}
                onClick={() => navigate(`/admin/investors/${investor.id}`)}
                className="h-15.75 cursor-pointer [&>td]:border-b-[1.5px] [&>td]:border-[#e4e4e4] [&>td]:px-3.5 [&>td]:py-2.5 min-[1800px]:[&>td]:px-5.25 min-[1800px]:[&>td]:py-3.75"
              >
                <td>
                  <Link
                    to={`/admin/investors/${investor.id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {investor.alias}
                  </Link>
                </td>
                <td>{investor.kind === "STAFF" ? "운영팀" : "참가자"}</td>
                <td>
                  {investor.teamId ? (
                    <span className="font-sans">
                      TEAM {String(investor.teamId).padStart(2, "0")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>1,000,000원</td>
                <td>{investor.investedAmount.toLocaleString("ko-KR")}원</td>
                <td>
                  {(1000000 - investor.investedAmount).toLocaleString("ko-KR")}
                  원
                </td>
                <td>
                  <SpendingStatusBadge status={previewSpendingStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
