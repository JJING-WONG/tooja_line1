import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { components } from "../../../apis/schema";
import { getInvestorCsrf } from "../../auth/apis/auth.api";
import { investorSessionQueryKey } from "../../auth/hooks/useInvestorSession";
import { clearPendingInvestment, createInvestmentRequestKey, InvestmentRequestKeyError, InvestmentFailure, readPendingInvestment, resolveInvestment, savePendingInvestment } from "../utils/investmentRequest";
import type { PendingInvestment } from "../utils/investmentRequest";

import { investmentStatusQueryKey, latestInvestmentStatus, useInvestmentStatus } from "../../dashboard/hooks/useInvestmentStatus";

type Session = components["schemas"]["InvestorSession"];
type Selection = { teamId: number; amount: number; balanceAfter: number };
type View = { selection: Selection | null; status: "idle" | "submitting" | "checking" | "error" | "unknown" | "paused"; message?: string };
export const InvestmentFlowContext = createContext<((selection: Selection) => void) | null>(null);
export function useInvestmentConfirmation() {
  const open = useContext(InvestmentFlowContext);
  if (!open) throw new Error("투자자 인증 영역에서 사용해야 합니다.");
  return open;
}

export function useCreateInvestment(investorId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lock = useRef(false);
  const [initial] = useState(() => {
    try { return { request: readPendingInvestment(investorId), error: undefined }; }
    catch { return { request: null, error: "진행 중인 투자 정보를 읽을 수 없어요. 브라우저 저장 공간을 확인해 주세요." }; }
  });
  const pending = useRef<PendingInvestment | null>(initial.request);
  const statusQuery = useInvestmentStatus();
  const canRetryPaused = statusQuery.isSuccess && statusQuery.data.status === "RUNNING";
  const [view, setView] = useState<View>({ selection: null, status: initial.error ? "error" : initial.request?.waitingForResume ? "paused" : initial.request ? "checking" : "idle", message: initial.error });
  const restored = useRef(false);
  function assertSession() {
    const session = queryClient.getQueryData<Session | null>(investorSessionQueryKey);
    if (session?.investor.investorId !== investorId || queryClient.isMutating({ mutationKey: ["auth", "investor", "logout"] }) > 0) {
      throw new InvestmentFailure("로그인 상태를 다시 확인해 주세요.", "auth");
    }
    return session;
  }
  function canSend() {
    const state = queryClient.getQueryState<components["schemas"]["InvestmentStatus"]>(investmentStatusQueryKey);
    return state?.status === "success" && state.data?.status === "RUNNING";
  }
  function isCurrent() { return queryClient.getQueryData<Session | null>(investorSessionQueryKey)?.investor.investorId === investorId; }
  async function invalidate(refetch = false) {
    await queryClient.cancelQueries({ queryKey: ["investor"] });
    await queryClient.invalidateQueries({ queryKey: ["investor"], refetchType: refetch ? "active" : "none" });
    await queryClient.invalidateQueries({ queryKey: investorSessionQueryKey, refetchType: "none" });
  }
  const { mutate, isPending } = useMutation({
    mutationKey: ["investor", "investment", "create", investorId],
    retry: false,
    mutationFn: async ({ request, recover, automatic = false }: { request: PendingInvestment; recover: boolean; automatic?: boolean }) => {
      pending.current = request;
      setView((previous) => ({ ...previous, status: recover ? "checking" : "submitting", message: undefined }));
      try {
        const receipt = await resolveInvestment(request, recover, async (refresh) => {
          const session = assertSession();
          if (!refresh) return session.csrfToken;
          try {
            const prepared = await getInvestorCsrf();
            const latest = assertSession();
            queryClient.setQueryData(investorSessionQueryKey, { ...latest, csrfToken: prepared.csrfToken });
            return prepared.csrfToken;
          } catch (error) {
            if (error instanceof InvestmentFailure) throw error;
            throw new InvestmentFailure("인증 정보를 갱신하지 못했어요. 결과를 다시 확인해 주세요.", "unknown");
          }
        }, () => setView((previous) => ({ ...previous, status: "checking" })), () => {
          if (automatic) throw new InvestmentFailure("보관한 요청의 결과가 없어요. 직접 다시 시도해 주세요.", "unknown");
          return canSend();
        });
        if (!isCurrent()) return;
        // 성공을 확인한 후에만 임시 요청을 지웁니다. 삭제 실패 시 같은 키로 복구할 수 있습니다.
        try { clearPendingInvestment(investorId); } catch { /* 다음 진입 시 동일 영수증 복구 */ }
        pending.current = null;
        setView({ selection: null, status: "idle" });
        // 먼저 이동해 새 상세 응답의 ALREADY_INVESTED 리다이렉트와 경합하지 않게 합니다.
        navigate(`/invest/success/${encodeURIComponent(receipt.investment.investmentId)}`, { replace: true });
        await invalidate();
      } catch (error) {
        if (!isCurrent()) return;
        const failure = error instanceof InvestmentFailure ? error : new InvestmentFailure("결과를 다시 확인해 주세요.", "unknown");
        if (failure.outcome === "auth") {
          // 불확실한 요청은 남겨 두고 같은 투자자가 재로그인하면 복구합니다.
          await queryClient.cancelQueries({ queryKey: investorSessionQueryKey });
          if (isCurrent()) queryClient.setQueryData(investorSessionQueryKey, null);
          return;
        }
        if (failure.outcome === "paused") {
          request.waitingForResume = true;
          request.retryAt = undefined;
          try { savePendingInvestment(request); } catch { /* 전송 전 보관한 키는 유지 */ }
          setView((previous) => ({ ...previous, status: "paused", message: failure.message }));
          void queryClient.invalidateQueries({ queryKey: investmentStatusQueryKey });
        } else if (failure.outcome === "rejected") {
          try { clearPendingInvestment(investorId); } catch { /* 보관 키는 다음 조회에서 재검증 */ }
          pending.current = null;
          setView((previous) => ({ ...previous, status: "error", message: failure.message }));
          void invalidate(true);
        } else {
          request.waitingForResume = false;
          request.retryAt = failure.retryAt;
          try { savePendingInvestment(request); } catch { /* 최초 전송 전 저장한 키는 유지 */ }
          setView((previous) => ({ ...previous, status: "unknown", message: failure.message }));
        }
      }
    },
    onSettled: () => { lock.current = false; },
  });
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (initial.request && !initial.request.waitingForResume) {
      lock.current = true;
      mutate({ request: initial.request, recover: true, automatic: true });
    }
  }, [initial, mutate]);

  function resume() {
    if (lock.current || !pending.current || (view.status === "paused" && !canSend())) return;
    lock.current = true;
    mutate({ request: pending.current, recover: true });
  }
  function confirm() {
    if (lock.current || !view.selection) return;
    try {
      assertSession();
      const detailQuery = queryClient.getQueryCache().find({ queryKey: ["investor", "team", investorId, view.selection.teamId] });
      const detail = detailQuery?.state.data as components["schemas"]["TeamDetail"] | undefined;
      const publicStatus = queryClient.getQueryState<components["schemas"]["InvestmentStatus"]>(investmentStatusQueryKey);
      const status = latestInvestmentStatus(publicStatus?.data, detail?.investmentStatus);
      if (publicStatus?.status === "error" || !detail || detailQuery?.state.fetchStatus !== "idle" || detailQuery.state.status !== "success" ||
        status?.status !== "RUNNING" || detail.team.investmentState !== "AVAILABLE" ||
        !detail.team.allowedAmounts.includes(view.selection.amount)) {
        setView((previous) => ({ ...previous, status: "error", message: "투자 가능 상태가 변경되었어요. 금액을 다시 선택해 주세요." }));
        void queryClient.invalidateQueries({ queryKey: ["investor", "team", investorId, view.selection.teamId] });
        return;
      }
      // 기존 복구 요청이 있으면 새 키로 덮어쓰지 않습니다.
      const existing = readPendingInvestment(investorId);
      const request = existing ?? { investorId, requestKey: createInvestmentRequestKey(), input: { teamId: view.selection.teamId, amount: view.selection.amount } };
      savePendingInvestment(request); // 저장할 수 없으면 전송하지 않습니다.
      lock.current = true;
      mutate({ request, recover: existing !== null });
    } catch (error) {
      if (error instanceof InvestmentFailure && error.outcome === "auth") {
        if (isCurrent()) queryClient.setQueryData(investorSessionQueryKey, null);
      } else {
        const message = error instanceof InvestmentRequestKeyError ? error.message : "투자 정보를 저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요.";
        setView((previous) => ({ ...previous, status: "error", message }));
      }
    }
  }
  return {
    view, isPending, confirm, resume, canRetryPaused,
    open: (selection: Selection) => {
      if (lock.current || pending.current) return;
      setView({ selection, status: "idle" });
    },
    close: () => { if (!lock.current && !pending.current) setView({ selection: null, status: "idle" }); },
  };
}
