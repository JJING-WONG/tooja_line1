import { Navigate, Outlet } from "react-router-dom";
import LoadingOverlay from "../../../components/ui/LoadingOverlay";
import DesktopErrorDialog from "../../../components/ui/DesktopErrorDialog";
import { useAdminSession } from "../hooks/useAdminSession";

export default function AdminProtectedRoute({ guestOnly = false }: { guestOnly?: boolean }) {
  const session = useAdminSession();
  if (session.isPending) return <LoadingOverlay variant="desktop" mode="initial" />;
  if (session.isError) {
    return <main className="min-h-dvh bg-white"><DesktopErrorDialog
      title={<>관리자 로그인 상태를<br />확인하지 못했어요</>}
      isRetrying={session.isFetching}
      onRetry={() => { if (!session.isFetching) void session.refetch(); }}
    /></main>;
  }
  if (guestOnly) return session.data ? <Navigate to="/admin" replace /> : <Outlet />;
  return session.data ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
