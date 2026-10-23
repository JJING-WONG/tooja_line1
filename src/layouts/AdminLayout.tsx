import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "../features/admin/components/AdminSidebar";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import AdminRefreshErrorDialog from "../features/admin/components/AdminRefreshErrorDialog";

export type AdminOverviewContext = { investmentStatus: "RUNNING" | "PAUSED" };

export default function AdminLayout({
  investmentStatus = "RUNNING",
  isUpdating = false,
  showRefreshError = false,
  onStatusChange,
  onRetry,
  onDismissError,
}: {
  investmentStatus?: AdminOverviewContext["investmentStatus"];
  isUpdating?: boolean;
  showRefreshError?: boolean;
  onStatusChange?: (status: AdminOverviewContext["investmentStatus"]) => void;
  onRetry?: () => void;
  onDismissError?: () => void;
}) {
  const pathname = useLocation().pathname;
  const isOverview = pathname === "/admin";
  const isExpanded = isOverview || pathname === "/admin/investors";
  return (
    <div className={`flex min-h-dvh bg-white font-['Noto_Sans_KR',sans-serif] ${isExpanded ? "w-full min-w-0" : "min-w-319.25"}`}>
      <AdminSidebar
        isExpanded={isExpanded}
        investmentStatus={investmentStatus}
        isUpdating={isUpdating}
        onStatusChange={onStatusChange}
      />
      <main inert={isOverview && isUpdating} aria-busy={isOverview && isUpdating} className={`min-w-0 flex-1 ${isExpanded ? "px-4 py-6 min-[1200px]:px-8 min-[1800px]:px-12 min-[1800px]:py-10.5" : "px-8 py-7"}`}>
        <Outlet context={{ investmentStatus } satisfies AdminOverviewContext} />
      </main>
      {isOverview && isUpdating && <LoadingOverlay variant="desktop" />}
      {isOverview && showRefreshError && !isUpdating && <AdminRefreshErrorDialog onRetry={() => onRetry?.()} onDismiss={() => onDismissError?.()} />}
    </div>
  );
}
