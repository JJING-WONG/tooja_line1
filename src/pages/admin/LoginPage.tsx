import { useState } from "react";

export default function AdminLoginPage() {
  const [code, setCode] = useState("");
  const [hasCodeError, setHasCodeError] = useState(false);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f6f6] p-4 font-['Noto_Sans_KR',sans-serif]">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          // UI 형식 검증만 수행합니다. 관리자 로그인 API는 아직 연결하지 않습니다.
          setHasCodeError(!/^[0-9]{4}$/.test(code));
        }}
        className="flex w-full max-w-105 flex-col gap-4 rounded-2xl border border-[#c4c4c4] bg-white p-9"
      >
        <header className="flex flex-col gap-1">
          <h1 className="h-8.5 text-[24px] font-bold leading-8.5 text-[#111]">
            관리자 로그인
          </h1>
          <p className="text-[13px] leading-4.5 text-[#888]">
            운영진 전용 · 조회 기능만 제공됩니다
          </p>
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
          maxLength={4}
          pattern="[0-9]{4}"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/[^0-9]/g, ""));
            setHasCodeError(false);
          }}
          placeholder="관리자 코드  ••••"
          aria-invalid={hasCodeError}
          aria-describedby={hasCodeError ? "admin-login-error" : undefined}
          className="h-12 w-full rounded-lg border border-[#c4c4c4] bg-white px-3.5 py-3 text-[14px] leading-5 text-[#111] placeholder:text-[#888] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <div className="min-h-4.25">
          {hasCodeError && (
            <p
              id="admin-login-error"
              role="alert"
              className="text-[12px] leading-4.25 text-[#c53030]"
            >
              관리자 코드가 올바르지 않습니다.
            </p>
          )}
        </div>
        <button
          type="submit"
          className="h-12.5 w-full cursor-pointer rounded-lg bg-dark text-[15px] font-bold leading-5.25 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          로그인
        </button>
        <p className="rounded-lg bg-[#f4f4f4] px-3.5 py-3 text-[12px] leading-4.25 text-[#777]">
          투자자 로그인과 별도 세션으로 동작 — 같은 브라우저에서 함께 사용 가능
        </p>
      </form>
    </main>
  );
}
