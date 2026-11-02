import { accessBlockedMessage } from "../utils/authError";
import InvestmentFlowProvider from "../../investment/components/InvestmentFlowProvider";
import { Navigate, Outlet } from "react-router-dom";
import { useInvestorSession } from "../hooks/useInvestorSession";
import LoadingOverlay from "../../../components/ui/LoadingOverlay";
import ErrorDialog from "../../../components/ui/ErrorDialog";

export default function InvestorProtectedRoute({
  guestOnly = false,
}: {
  guestOnly?: boolean;
}) {
  const session = useInvestorSession();

  if (session.isPending) {
    return <main className="min-h-dvh bg-[#fafafa]"><LoadingOverlay mode="initial" /></main>;
  }

  if (session.isError) {
    return (
      <main className="min-h-dvh bg-[#fafafa]">
        <ErrorDialog
          title="로그인 상태를 확인하지 못했어요"
          message={accessBlockedMessage(session.error) ?? "잠시 후 다시 시도해 주세요."}
          confirmLabel="다시 시도"
          isBusy={session.isFetching}
          onConfirm={() => { if (!session.isFetching) void session.refetch(); }}
        />
      </main>
    );
  }

  if (guestOnly) {
    return session.data ? <Navigate to="/invest" replace /> : <Outlet />;
  }

  return session.data ? <InvestmentFlowProvider key={session.data.investor.investorId} investorId={session.data.investor.investorId}><Outlet /></InvestmentFlowProvider> : <Navigate to="/login" replace />;
}
