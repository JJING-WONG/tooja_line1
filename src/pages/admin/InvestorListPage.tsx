import { accessBlockedMessage } from "../../features/auth/utils/authError";
import SpendingStatusBadge from "../../features/admin/components/SpendingStatusBadge";
import { useEffect, useState } from "react";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import AdminRefreshErrorDialog from "../../features/admin/components/AdminRefreshErrorDialog";
import { parseInvestorFilters, useAdminInvestors } from "../../features/admin/hooks/useAdminInvestors";
import type { AdminOverviewContext } from "../../layouts/AdminLayout";
import { Link, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";

const spendingFilters = [
  { value: "ALL", label: "전체", width: "w-22.5" },
  { value: "UNSPENT", label: "미소진", width: "w-27" },
  { value: "COMPLETED", label: "소진 완료", width: "w-[131px]" },
];

export default function InvestorListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const layout = useOutletContext<AdminOverviewContext>();
  const filters = parseInvestorFilters(searchParams);
  const query = filters.q ?? "";
  const teamId = filters.teamId ? String(filters.teamId) : "";
  const kind = filters.kind ?? "";
  const spendingStatus = filters.spendingStatus ?? "ALL";
  const [settledQuery, setSettledQuery] = useState(query);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const isDebouncing = query !== settledQuery;
  const list = useAdminInvestors(filters, !isDebouncing);
  const filterKey = JSON.stringify(filters);
  const [initialFilterKey] = useState(filterKey);
  const [dismissedError, setDismissedError] = useState<{ filterKey: string; updatedAt: number } | null>(null);
  const investors = isDebouncing ? [] : list.data?.items ?? [];
  const resultCount = list.data?.count ?? 0;
  const isLoading = isDebouncing || (!list.data && !list.isError && list.errorUpdatedAt === 0);
  const isInitialError = !isDebouncing && !list.data && (list.isError || list.errorUpdatedAt > 0);
  const showRefreshError = !isDebouncing && list.data !== undefined && list.isError &&
    (dismissedError?.filterKey !== filterKey || dismissedError.updatedAt !== list.dataUpdatedAt);
  const retry = () => {
    if (!isDebouncing && !list.isFetching && !layout?.isUpdating && !layout?.isLoggingOut) void list.refetch();
  };
  // 최초 진입은 공통 PC 로딩. 조건 변경 중에는 필터를 유지하고 표 영역만 조회 중으로 표시합니다.
  const showInitialLoading = !isDebouncing && isLoading && filterKey === initialFilterKey;

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
          aria-label="이름 또는 ID 검색"
          placeholder="이름 · ID 검색"
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
      {showInitialLoading && <LoadingOverlay variant="desktop" mode="initial" />}
      {isInitialError ? (
        <section aria-busy={list.isFetching} className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-center">
          <h2 role="alert" className="text-xl font-bold text-[#222] min-[1800px]:text-2xl">정보를 불러오지 못했어요</h2>
          <p className="text-sm text-[#777] min-[1800px]:text-base">{accessBlockedMessage(list.error) ?? "잠시 후 다시 시도해 주세요."}</p>
          <button type="button" disabled={list.isFetching || layout?.isUpdating || layout?.isLoggingOut} onClick={retry} className="min-h-11 rounded-lg bg-dark px-7 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 min-[1800px]:text-base">
            {list.isFetching ? "다시 불러오는 중..." : "재시도"}
          </button>
        </section>
      ) : <>
      <p
        aria-live="polite"
        className="text-[13px] leading-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75 text-[#777]"
      >
        {isLoading ? "목록을 불러오는 중..." : resultCount === 0 ? "검색 결과 없음" : `검색 결과 ${resultCount}명`}
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
              {["이름", "역할", "팀", "지급액", "투자액", "잔액", "상태"].map(
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
            {(isLoading || investors.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  className="h-[62.5px] border-b-[1.5px] border-[#e4e4e4] px-3.5 py-2.5 min-[1800px]:px-5.25 min-[1800px]:py-3.75 text-center"
                >
                  {isLoading ? "목록을 불러오는 중..." : "아직 투자자가 나오지 않았어요"}
                </td>
              </tr>
            )}
            {investors.map((investor) => (
              <tr
                key={investor.investorId}
                onClick={() => navigate(`/admin/investors/${encodeURIComponent(investor.investorId)}`)}
                className="h-15.75 cursor-pointer [&>td]:border-b-[1.5px] [&>td]:border-[#e4e4e4] [&>td]:px-3.5 [&>td]:py-2.5 min-[1800px]:[&>td]:px-5.25 min-[1800px]:[&>td]:py-3.75"
              >
                <td>
                  <Link
                    to={`/admin/investors/${encodeURIComponent(investor.investorId)}`}
                    title={investor.alias}
                    className="block truncate rounded focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {investor.alias}
                  </Link>
                </td>
                <td>{investor.kind === "STAFF" ? "운영팀" : "참가자"}</td>
                <td>
                  {investor.kind !== "STAFF" && investor.teamId ? (
                    <span className="font-sans">
                      TEAM {String(investor.teamId).padStart(2, "0")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{investor.issuedAmount.toLocaleString("ko-KR")}원</td>
                <td>{investor.investedAmount.toLocaleString("ko-KR")}원</td>
                <td>
                  {investor.balance.toLocaleString("ko-KR")}
                  원
                </td>
                <td>
                  <SpendingStatusBadge status={investor.spendingStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
      {showRefreshError && !layout?.isUpdating && !layout?.isStatusError && !layout?.isLoggingOut && <AdminRefreshErrorDialog
        title={accessBlockedMessage(list.error)}
        isRetrying={list.isFetching}
        onRetry={retry}
        onDismiss={() => setDismissedError({ filterKey, updatedAt: list.dataUpdatedAt })}
      />}
    </div>
  );
}
