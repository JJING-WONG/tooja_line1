import type { ReactNode } from "react";
import ErrorDialog from "../../../components/ui/ErrorDialog";
import InvestmentConfirmDialog from "./InvestmentConfirmDialog";
import { InvestmentFlowContext, useCreateInvestment } from "../hooks/useCreateInvestment";

// 팀 상세 재조회·라우트 이동으로 투자 진행 상태가 사라지지 않도록 인증 영역에서 한 번 관리합니다.
export default function InvestmentFlowProvider({ investorId, children }: { investorId: string; children: ReactNode }) {
  const flow = useCreateInvestment(investorId);
  const { view } = flow;
  const isBusy = flow.isPending || view.status === "submitting" || view.status === "checking";
  return <InvestmentFlowContext value={flow.open}>
    <div inert={isBusy || view.status === "unknown" || view.status === "error" || view.status === "paused" || view.selection !== null}>{children}</div>
    {view.status === "paused" ? <ErrorDialog
      title="지금은 투자가 일시정지되어 있어요"
      message={flow.canRetryPaused ? "투자가 재개되었어요. 보관한 요청으로 다시 시도해 주세요." : "요청을 보관했어요. 재개가 확인되면 다시 시도할 수 있어요."}
      confirmLabel={flow.canRetryPaused ? "투자 재시도" : "재개 대기 중"}
      confirmDisabled={!flow.canRetryPaused}
      onConfirm={flow.resume}
    /> : view.status === "unknown" ? <ErrorDialog
      title="투자 결과를 확인하지 못했어요"
      message={view.message}
      confirmLabel="결과 다시 확인"
      onConfirm={flow.resume}
    /> : view.status === "error" ? <ErrorDialog title="투자하지 못했어요" message={view.message} confirmLabel="돌아가기" isBusy={flow.isPending} onConfirm={flow.close} />
      : !view.selection && isBusy ? <ErrorDialog title="처리 결과를 확인하고 있어요" message="잠시만 기다려 주세요." isBusy onConfirm={flow.resume} />
      : view.selection && <InvestmentConfirmDialog
        teamId={String(view.selection?.teamId ?? "")}
        amount={view.selection?.amount ?? 0}
        balanceAfter={view.selection?.balanceAfter ?? 0}
        status={view.status === "idle" && !flow.isPending ? "idle" : "checking" === view.status ? "checking" : "submitting"}
        onClose={flow.close}
        onConfirm={flow.confirm}
      />}
  </InvestmentFlowContext>;
}
