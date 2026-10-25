import InvestmentFlowProvider from "../../investment/components/InvestmentFlowProvider";
import { Navigate, Outlet } from "react-router-dom";
import { useInvestorSession } from "../hooks/useInvestorSession";

export default function InvestorProtectedRoute({
  guestOnly = false,
}: {
  guestOnly?: boolean;
}) {
  const session = useInvestorSession();

  if (session.isPending) {
    return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  }

  if (session.isError) {
    return (
      <div role="alert">
        <p>로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={() => void session.refetch()}
          disabled={session.isFetching}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (guestOnly) {
    return session.data ? <Navigate to="/invest" replace /> : <Outlet />;
  }

  return session.data ? <InvestmentFlowProvider key={session.data.investor.investorId} investorId={session.data.investor.investorId}><Outlet /></InvestmentFlowProvider> : <Navigate to="/login" replace />;
}
