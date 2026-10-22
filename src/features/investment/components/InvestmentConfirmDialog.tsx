import { useEffect, useRef } from "react";

interface InvestmentConfirmDialogProps {
  teamId: string;
  amount: number;
  balanceAfter: number;
  onClose: () => void;
  onConfirm?: () => void;
  status?: "idle" | "submitting" | "checking";
}

export default function InvestmentConfirmDialog({
  teamId,
  amount,
  balanceAfter,
  onClose,
  onConfirm,
  status = "idle",
}: InvestmentConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const isBusy = status !== "idle";
  const isChecking = status === "checking";

  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="investment-confirm-title"
      aria-describedby={`investment-confirm-warning${isChecking ? " investment-result-status" : ""}`}
      aria-busy={isBusy}
      onCancel={(event) => {
        event.preventDefault();
        if (!isChecking) onClose();
      }}
      className="fixed inset-x-0 bottom-[21.5px] top-auto mx-auto my-0 w-[calc(100%-39px)] max-w-84 max-h-[calc(100dvh-43px)] overflow-y-auto border-0 bg-transparent p-0 text-[#222] backdrop:bg-black/[0.443] font-['Noto_Sans_KR',sans-serif]"
    >
      {isChecking && (
        <div
          id="investment-result-status"
          role="status"
          className="investment-result-notice mb-3 flex h-12 items-start rounded-[15px] bg-white px-5 pt-3 text-[15px] leading-5.25 font-medium text-[#111]/50"
        >
          처리 결과를 확인하고 있어요
        </div>
      )}
      <div className="flex flex-col gap-4 rounded-[20px] bg-white px-5 py-6">
        <h2
          id="investment-confirm-title"
          className="h-7 text-[20px] font-bold leading-7 text-[#111]"
        >
          투자를 확정할까요?
        </h2>
        <dl className="flex flex-col gap-2.5 rounded-lg bg-[#f4f4f4] px-4 py-3.5">
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">투자 팀</dt>
            <dd className="font-sans text-[15px] font-bold leading-5.25">
              TEAM {teamId.padStart(2, "0")}
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">투자 금액</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {amount.toLocaleString("ko-KR")}원
            </dd>
          </div>
          <div className="flex h-5.25 items-center justify-between">
            <dt className="text-[14px] leading-5 text-[#777]">투자 후 잔액</dt>
            <dd className="text-[15px] font-bold leading-5.25">
              {balanceAfter.toLocaleString("ko-KR")}원
            </dd>
          </div>
        </dl>
        <p
          id="investment-confirm-warning"
          className="rounded-lg bg-[#fdecec] px-3.5 py-3 text-[13px] leading-4.5 text-[#b42318]"
        >
          확정 후에는 취소·금액 변경이 불가하며,
          <br />이 팀에는 다시 투자할 수 없습니다.
        </p>
        <div className="flex gap-2">
          <button
            autoFocus
            type="button"
            disabled={isChecking}
            onClick={onClose}
            className="h-12.5 min-w-0 flex-1 cursor-pointer rounded-lg border border-[#bdbdbd] bg-white text-[15px] font-bold leading-5.25 text-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:bg-[#bdbdbd] disabled:text-[#333]/50"
          >
            돌아가기
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              if (!isBusy) onConfirm?.();
            }}
            className="h-12.5 w-[66.216%] cursor-pointer rounded-lg bg-dark text-[15px] font-bold leading-5.25 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait"
          >
            {isBusy ? "처리중..." : "투자 확정"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
