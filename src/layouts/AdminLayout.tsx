import { useAdminLogout } from "../features/auth/hooks/useAdminLogout";
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "../features/admin/components/AdminSidebar";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import DesktopErrorDialog from "../components/ui/DesktopErrorDialog";
import AdminRefreshErrorDialog from "../features/admin/components/AdminRefreshErrorDialog";

export type AdminOverviewContext = { investmentStatus: "RUNNING" | "PAUSED" };

export default function AdminLayout({
  investmentStatus = "RUNNING",
  isUpdating = false,
  isInitialLoading = false,
  isInitialError = false,
  isRetryingInitial = false,
  showRefreshError = false,
  isRetryingRefresh = false,
  failedStatusChange = null,
  isRetryingStatusChange = false,
  onDismissStatusError,
  onStatusChange,
  onRetry,
  onDismissError,
}: {
  investmentStatus?: AdminOverviewContext["investmentStatus"];
  isUpdating?: boolean;
  isInitialLoading?: boolean;
  isInitialError?: boolean;
  isRetryingInitial?: boolean;
  showRefreshError?: boolean;
  isRetryingRefresh?: boolean;
  // 실패한 요청의 목표 상태. 현재 investmentStatus는 성공 전까지 유지합니다.
  failedStatusChange?: AdminOverviewContext["investmentStatus"] | null;
  isRetryingStatusChange?: boolean;
  onDismissStatusError?: () => void;
  onStatusChange?: (status: AdminOverviewContext["investmentStatus"]) => void;
  onRetry?: () => void;
  onDismissError?: () => void;
}) {
  const adminLogout = useAdminLogout();
  const pathname = useLocation().pathname;
  const isOverview = pathname === "/admin";
  const supportsAutoRefresh = isOverview || pathname === "/admin/investors";
  const isExpanded = isOverview || pathname === "/admin/investors" || pathname.startsWith("/admin/investors/");
  const showStatusError = isOverview && !isInitialError && failedStatusChange !== null;
  // A02·A03·A04 공통 최초 조회 상태. 아직 데이터가 없을 때 본문·사이드바를 렌더링하지 않습니다.
  if (isInitialLoading) {
    return <LoadingOverlay variant="desktop" mode="initial" />;
  }
  return (
    <div className={`flex min-h-dvh bg-white font-['Noto_Sans_KR',sans-serif] ${isExpanded ? "w-full min-w-0" : "min-w-319.25"}`}>
      <AdminSidebar
        isExpanded={isExpanded}
        investmentStatus={investmentStatus}
        isUpdating={isUpdating}
        onStatusChange={onStatusChange}
        onLogout={adminLogout.logout}
        isLoggingOut={adminLogout.isPending}
        logoutError={adminLogout.errorMessage}
      />
      <main inert={isOverview && isUpdating} aria-busy={isOverview && isUpdating} className={`min-w-0 flex-1 ${isExpanded ? "px-4 py-6 min-[1200px]:px-8 min-[1800px]:px-12 min-[1800px]:py-10.5" : "px-8 py-7"}`}>
        {isInitialError ? (
          <section
            aria-labelledby="admin-initial-error-title"
            aria-busy={isRetryingInitial}
            className="flex min-h-[calc(100dvh-84px)] flex-col items-center justify-center gap-4 text-center"
          >
            <h1 id="admin-initial-error-title" role="alert" className="text-xl font-bold leading-7 text-[#222] min-[1800px]:text-2xl">
              정보를 불러오지 못했어요
            </h1>
            <p className="text-sm leading-5 text-[#777] min-[1800px]:text-base">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              disabled={isRetryingInitial}
              onClick={() => { if (!isRetryingInitial) onRetry?.(); }}
              className="min-h-11 rounded-lg bg-dark px-7 py-3 text-sm font-bold leading-5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 min-[1800px]:text-base"
            >
              {isRetryingInitial ? "다시 불러오는 중..." : "재시도"}
            </button>
          </section>
        ) : <Outlet context={{ investmentStatus } satisfies AdminOverviewContext} />}
      </main>
      {isOverview && isUpdating && !showStatusError && <LoadingOverlay variant="desktop" />}
      {showStatusError && (
        <DesktopErrorDialog
          title={<>투자를 {failedStatusChange === "RUNNING" ? "시작" : "중단"}하지 못했어요<br />잠시 후 다시 시도해 주세요</>}
          isRetrying={isRetryingStatusChange || isUpdating}
          onDismiss={() => onDismissStatusError?.()}
          onRetry={() => {
            if (failedStatusChange && !isRetryingStatusChange && !isUpdating) onStatusChange?.(failedStatusChange);
          }}
        />
      )}
      {supportsAutoRefresh && !showStatusError && !isInitialError && showRefreshError && !isUpdating && <AdminRefreshErrorDialog isRetrying={isRetryingRefresh} onRetry={() => onRetry?.()} onDismiss={() => onDismissError?.()} />}
    </div>
  );
}
