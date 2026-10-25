import { useAdminLogout } from "../features/auth/hooks/useAdminLogout";
import { useState } from "react";
import type { components } from "../apis/schema";
import { useAdminOverview } from "../features/admin/hooks/useAdminOverview";
import { useUpdateInvestmentStatus } from "../features/admin/hooks/useUpdateInvestmentStatus";
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "../features/admin/components/AdminSidebar";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import DesktopErrorDialog from "../components/ui/DesktopErrorDialog";
import AdminRefreshErrorDialog from "../features/admin/components/AdminRefreshErrorDialog";

export type AdminOverviewContext = {
  investmentStatus?: components["schemas"]["InvestmentStatus"]["status"];
  overview?: components["schemas"]["Overview"];
  isRefreshing: boolean;
  isUpdating: boolean;
  isStatusError: boolean;
  isLoggingOut: boolean;
};

export default function AdminLayout() {
  const adminLogout = useAdminLogout();
  const overview = useAdminOverview();
  const statusUpdate = useUpdateInvestmentStatus();
  const [dismissedRefreshAt, setDismissedRefreshAt] = useState<number | null>(null);
  const pathname = useLocation().pathname;
  const isOverview = pathname === "/admin";
  const isExpanded = isOverview || pathname === "/admin/investors" || pathname.startsWith("/admin/investors/");
  const investmentStatus = overview.data?.investmentStatus.status;
  const isUpdating = statusUpdate.isPending;
  const failedStatusChange = statusUpdate.failedStatusChange;
  // 후속 정상 조회에서 목표 상태가 확인되면 불확실했던 실패 안내도 숨깁니다.
  const showStatusError = failedStatusChange !== null && (isUpdating || investmentStatus !== failedStatusChange);
  const isInitialError = isOverview && !overview.data && (overview.isError || overview.errorUpdatedAt > 0);
  const isInitialLoading = isOverview && !overview.data && !isInitialError;
  const showRefreshError = isOverview && overview.data !== undefined && overview.isError && dismissedRefreshAt !== overview.dataUpdatedAt;
  const retryOverview = () => { if (!overview.isFetching && !isUpdating) void overview.refetch(); };
  const onStatusChange = (status: NonNullable<AdminOverviewContext["investmentStatus"]>) => {
    if (!investmentStatus || overview.isError || isUpdating || adminLogout.isPending) return;
    statusUpdate.update(status);
  };
  if (isInitialLoading) return <LoadingOverlay variant="desktop" mode="initial" />;
  return (
    <div className={`flex min-h-dvh bg-white font-['Noto_Sans_KR',sans-serif] ${isExpanded ? "w-full min-w-0" : "min-w-319.25"}`}>
      <AdminSidebar
        isExpanded={isExpanded}
        investmentStatus={investmentStatus}
        isUpdating={isUpdating}
        isStatusUnavailable={!investmentStatus || overview.isError}
        onStatusChange={onStatusChange}
        onLogout={adminLogout.logout}
        isLoggingOut={adminLogout.isPending}
        logoutError={adminLogout.errorMessage}
      />
      <main inert={isUpdating || adminLogout.isPending} aria-busy={isUpdating || adminLogout.isPending} className={`min-w-0 flex-1 ${isExpanded ? "px-4 py-6 min-[1200px]:px-8 min-[1800px]:px-12 min-[1800px]:py-10.5" : "px-8 py-7"}`}>
        {isInitialError ? (
          <section
            aria-labelledby="admin-initial-error-title"
            aria-busy={overview.isFetching}
            className="flex min-h-[calc(100dvh-84px)] flex-col items-center justify-center gap-4 text-center"
          >
            <h1 id="admin-initial-error-title" role="alert" className="text-xl font-bold leading-7 text-[#222] min-[1800px]:text-2xl">
              정보를 불러오지 못했어요
            </h1>
            <p className="text-sm leading-5 text-[#777] min-[1800px]:text-base">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              disabled={overview.isFetching}
              onClick={() => { if (!overview.isFetching) retryOverview(); }}
              className="min-h-11 rounded-lg bg-dark px-7 py-3 text-sm font-bold leading-5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 min-[1800px]:text-base"
            >
              {overview.isFetching ? "다시 불러오는 중..." : "재시도"}
            </button>
          </section>
        ) : <Outlet context={{ investmentStatus, overview: overview.data, isRefreshing: overview.isFetching, isUpdating, isStatusError: showStatusError, isLoggingOut: adminLogout.isPending } satisfies AdminOverviewContext} />}
      </main>
      {isUpdating && !showStatusError && <LoadingOverlay variant="desktop" />}
      {showStatusError && (
        <DesktopErrorDialog
          title={<>투자를 {failedStatusChange === "RUNNING" ? "시작" : "중단"}하지 못했어요<br />{statusUpdate.errorMessage}</>}
          isRetrying={isUpdating}
          onDismiss={statusUpdate.dismissError}
          onRetry={() => {
            if (failedStatusChange && !isUpdating && !adminLogout.isPending) statusUpdate.update(failedStatusChange);
          }}
        />
      )}
      {!showStatusError && !isInitialError && showRefreshError && !isUpdating && <AdminRefreshErrorDialog isRetrying={overview.isFetching} onRetry={retryOverview} onDismiss={() => setDismissedRefreshAt(overview.dataUpdatedAt)} />}
    </div>
  );
}
