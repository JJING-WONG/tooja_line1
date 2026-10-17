import { useEffect, useRef } from "react";

export default function ErrorDialog({ onConfirm }: { onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="error-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onConfirm();
      }}
      className="fixed inset-0 m-auto h-[159.429px] w-69.75 max-w-[calc(100%-32px)] rounded-[16.607px] border-0 bg-white px-[16.607px] pb-[19.929px] pt-[26.571px] text-[#111] shadow-[0_3px_30px_2px_rgba(0,0,0,0.15)] backdrop:bg-transparent font-['Noto_Sans_KR', sans-serif]"
    >
      <h2
        id="error-dialog-title"
        className="h-11.5 text-center text-[16.607px] font-bold leading-5.75"
      >
        오류가 발생했어요
        <br />
        나중에 다시 시도해주세요
      </h2>
      <button
        type="button"
        onClick={onConfirm}
        className="mt-[17.438px] block h-[41.518px] w-full cursor-pointer rounded-[6.643px] bg-dark text-[12.455px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        확인
      </button>
    </dialog>
  );
}
