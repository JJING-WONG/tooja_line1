import { useEffect, useRef } from "react";

export default function DesktopErrorDialog({
  onRetry,
  onDismiss,
  isRetrying = false,
  title = <>오류가 발생해<br />갱신하지 못했어요</>,
  dimBackground = false,
  confirmLabel = "재시도",
}: {
  onRetry: () => void;
  onDismiss?: () => void;
  title?: import("react").ReactNode;
  dimBackground?: boolean;
  confirmLabel?: string;
  isRetrying?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function dismiss() {
    if (isRetrying || !onDismiss) return;
    ref.current?.close();
    onDismiss();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="admin-refresh-error-title"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      aria-busy={isRetrying}
      className={`fixed inset-0 m-auto w-[565.472px] max-w-[calc(100%-32px)] rounded-[23.187px] border-0 bg-white px-[23.187px] pb-[37.553px] pt-[37.1px] text-[#111] shadow-[0_4.189px_41.887px_2.792px_rgba(0,0,0,0.15)] ${dimBackground ? "backdrop:bg-[#1f2329]/60" : "backdrop:bg-transparent"} font-['Noto_Sans_KR',sans-serif]`}
    >
      <h2 id="admin-refresh-error-title" className="h-16 text-center text-[23.187px] font-bold leading-8">
        {title}
      </h2>
      <div className="mt-[24.347px] flex w-[521.275px] max-w-full gap-[9.275px] text-[17.39px] font-bold leading-6">
        {onDismiss && <button type="button" onClick={dismiss} disabled={isRetrying} className="h-14.75 w-34.75 shrink-0 rounded-[9.275px] border border-[#bdbdbd] text-[#333] focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">돌아가기</button>}
        <button type="button" onClick={() => { if (!isRetrying) onRetry(); }} disabled={isRetrying} className="h-14.75 min-w-0 flex-1 rounded-[9.275px] bg-dark text-white focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">{isRetrying ? "재시도 중..." : confirmLabel}</button>
      </div>
    </dialog>
  );
}
