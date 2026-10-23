import { useEffect, useRef } from "react";

export default function ErrorDialog({
  onConfirm,
  title = "오류가 발생했어요",
  message = "나중에 다시 시도해주세요",
  confirmLabel = "확인",
  onBack,
  isBusy = false,
}: {
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onBack?: () => void;
  isBusy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

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
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-message"
      aria-busy={isBusy}
      onCancel={(event) => {
        event.preventDefault();
        if (!isBusy) (onBack ?? onConfirm)();
      }}
      className="fixed inset-0 m-auto w-69.75 max-w-[calc(100%-32px)] rounded-[16.607px] border-0 bg-white px-[16.607px] pb-[19.929px] pt-[26.571px] text-[#111] shadow-[0_3px_30px_2px_rgba(0,0,0,0.15)] backdrop:bg-transparent font-['Noto_Sans_KR', sans-serif]"
    >
      <h2
        id="error-dialog-title"
        className="text-center text-[16.607px] font-bold leading-5.75"
      >
        {title}
      </h2>
      <p id="error-dialog-message" className="text-center text-[16.607px] font-bold leading-5.75 wrap-break-word">{message}</p>
      <div className="mt-[17.438px] flex gap-[4.37px]">
      {onBack && <button
        type="button"
        disabled={isBusy}
        onClick={() => { if (!isBusy) onBack(); }}
        className="h-[41.518px] min-w-0 flex-[139] rounded-[6.643px] border border-[#bdbdbd] text-[12.455px] font-bold text-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
      >돌아가기</button>}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => { if (!isBusy) onConfirm(); }}
        className="block h-[41.518px] min-w-0 flex-[373] cursor-pointer rounded-[6.643px] bg-dark text-[12.455px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
      >
        {isBusy ? "불러오는 중…" : confirmLabel}
      </button>
      </div>
    </dialog>
  );
}
