import { useAdminLogin } from "../../features/auth/hooks/useAdminLogin";
import { useState } from "react";

export default function AdminLoginPage() {
  const { login, resetError, isPending: isSubmitting, errorMessage } = useAdminLogin();
  const [code, setCode] = useState("");
  const [hasCodeError, setHasCodeError] = useState(false);
  const message = hasCodeError ? "관리자 코드가 올바르지 않습니다." : errorMessage;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f6f6] p-4 font-['Noto_Sans_KR',sans-serif]">
      <form
        aria-busy={isSubmitting}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isSubmitting) return;
          const valid = /^[0-9]{4}$/.test(code);
          setHasCodeError(!valid);
          if (valid) login(code);
        }}
        className="flex w-full max-w-157.5 flex-col gap-6 rounded-3xl border-[1.5px] border-[#c4c4c4] bg-white p-6 sm:p-13.5"
      >
        <header className="flex flex-col gap-1.5">
          <h1 className="h-12.5 text-[36px] font-bold leading-12.5 text-[#111]">
            관리자 로그인
          </h1>
          <p className="text-[19.5px] leading-6.75 text-[#888]">운영진 전용</p>
        </header>
        <label htmlFor="admin-code" className="sr-only">
          관리자 코드
        </label>
        <input
          id="admin-code"
          name="code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          disabled={isSubmitting}
          maxLength={4}
          pattern="[0-9]{4}"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/[^0-9]/g, ""));
            setHasCodeError(false);
            resetError();
          }}
          placeholder="관리자 코드  ••••"
          aria-invalid={Boolean(message)}
          aria-describedby={message ? "admin-login-error" : undefined}
          className="h-18 w-full rounded-xl border-[1.5px] border-[#c4c4c4] bg-white px-5.25 py-4.5 text-[21px] leading-7.25 text-[#111] placeholder:text-[#888] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:bg-[#f4f4f4] disabled:text-[#888]"
        />
        <div className="min-h-6.25">
          {message && (
            <p
              id="admin-login-error"
              role="alert"
              className="text-[18px] leading-6.25 text-[#c53030]"
            >
              {message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="h-18.75 w-full cursor-pointer rounded-xl bg-dark text-[22.5px] font-bold leading-7.75 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait"
        >
          {isSubmitting ? "처리 중..." : "로그인"}
        </button>
        <p className="rounded-xl bg-[#f4f4f4] px-5.25 py-4.5 text-[18px] leading-6.25 text-[#777]">
          투자자 로그인과 별도 세션으로 동작 — 같은 브라우저에서 함께 사용 가능
        </p>
      </form>
    </main>
  );
}
