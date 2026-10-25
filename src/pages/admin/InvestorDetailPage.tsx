import SpendingStatusBadge from "../../features/admin/components/SpendingStatusBadge";
import { isAxiosError } from "axios";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import { useAdminInvestor } from "../../features/admin/hooks/useAdminInvestor";
import type { AdminOverviewContext } from "../../layouts/AdminLayout";
import DesktopErrorDialog from "../../components/ui/DesktopErrorDialog";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";

const confirmedAtFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function formatConfirmedAt(value: string) {
  const parts = confirmedAtFormatter.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export default function InvestorDetailPage() {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const layout = useOutletContext<AdminOverviewContext>();
  const query = useAdminInvestor(investorId);
  const isNotFound = !investorId || (isAxiosError(query.error) && query.error.response?.status === 404);
  if (isNotFound) {
    if (layout?.isUpdating || layout?.isStatusError || layout?.isLoggingOut) return null;
    return <DesktopErrorDialog
      title={<>투자자를 찾을 수 없어요<br />투자자 목록에서 다시 확인해 주세요</>}
      confirmLabel="투자자 목록으로"
      onRetry={() => navigate("/admin/investors")}
    />;
  }
  if (query.isError || (!query.data && query.errorUpdatedAt > 0)) {
    return <section aria-busy={query.isFetching} className="flex min-h-[calc(100dvh-84px)] flex-col items-center justify-center gap-4 text-center">
      <h1 role="alert" className="text-xl font-bold text-[#222] min-[1800px]:text-2xl">정보를 불러오지 못했어요</h1>
      <p className="text-sm text-[#777] min-[1800px]:text-base">잠시 후 다시 시도해 주세요.</p>
      <button type="button" disabled={query.isFetching || layout?.isUpdating || layout?.isLoggingOut} onClick={() => { if (!query.isFetching) void query.refetch(); }} className="min-h-11 rounded-lg bg-dark px-7 py-3 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 min-[1800px]:text-base">
        {query.isFetching ? "다시 불러오는 중..." : "재시도"}
      </button>
      <Link to="/admin/investors" className="rounded text-sm text-secondary underline focus-visible:outline-2 focus-visible:outline-primary">투자자 목록으로</Link>
    </section>;
  }
  if (!query.data) return <LoadingOverlay variant="desktop" mode="initial" />;
  const { investor, investments: transactions } = query.data;
  const isStaff = investor.kind === "STAFF";
  const alias = investor.alias;
  const isCompleted = investor.spendingStatus === "COMPLETED";
  const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
  const metrics = [
    { label: "지급액", value: won(investor.issuedAmount), background: "bg-[#f6f6f6]" },
    { label: "투자액", value: won(investor.investedAmount), background: "bg-[#f6f6f6]" },
    { label: "남은 잔액", value: isCompleted ? "마일리지가 전부 소진되었어요" : won(investor.balance), background: isCompleted ? "bg-[#fdecec]" : "bg-primary/20" },
  ];
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
        <span aria-current="page" className="min-w-0 wrap-anywhere font-bold text-[#333]">
          {alias}
        </span>
      </nav>

      <header className="flex min-h-8.5 flex-wrap items-center gap-3 whitespace-nowrap min-[1800px]:min-h-12.5 min-[1800px]:gap-4.5">
        <h1 className="min-w-0 max-w-full whitespace-normal wrap-break-word text-2xl leading-8.5 min-[1800px]:text-[36px] min-[1800px]:leading-12.5 font-bold text-[#111]">
          {alias}
        </h1>
        <span className="flex shrink-0 items-center rounded-full bg-[#ededed] px-2.5 py-1 text-xs leading-4.25 min-[1800px]:px-3.75 min-[1800px]:py-1.5 min-[1800px]:text-[18px] min-[1800px]:leading-6.25 text-[#555]">
          {isStaff ? "운영팀" : <>참가자{investor.teamId && <> · <span className="font-sans">TEAM {String(investor.teamId).padStart(2, "0")}</span></>}</>}
        </span>
        <SpendingStatusBadge status={investor.spendingStatus} />
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
            {transactions.map(({ investmentId, confirmedAt, teamId, serviceName, amount }) => (
              <tr
                key={investmentId}
                className="[&>td]:border-b [&>td]:border-[#e4e4e4] [&>td]:px-3.5 [&>td]:py-2.5 min-[1800px]:[&>td]:border-b-[1.5px] min-[1800px]:[&>td]:px-5.25 min-[1800px]:[&>td]:py-3.75"
              >
                <td>{formatConfirmedAt(confirmedAt)}</td>
                <td>
                  <div className="flex h-4.5 min-w-0 items-center min-[1800px]:h-6.75">
                    <span className="shrink-0 font-sans">TEAM {String(teamId).padStart(2, "0")}</span>
                    <span title={serviceName} className="truncate whitespace-pre"> · {serviceName}</span>
                  </div>
                </td>
                <td>{won(amount)}</td>
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
