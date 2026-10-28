import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInvestorLogin } from "../../features/auth/hooks/useInvestorLogin";
import loginLogo from "../../assets/Line1LoginLogo.png";
import wordmark from "../../assets/MALLAGE_LoginPage.svg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, resetError, isPending, errorMessage } = useInvestorLogin();
  const [code, setCode] = useState("");
  const [hasCodeError, setHasCodeError] = useState(false);
  const displayedError = hasCodeError
    ? "비밀코드가 올바르지 않습니다."
    : errorMessage;

  return (
    <main className="min-h-dvh bg-[#fafafa] px-[19.5px] pb-10 pt-[128.5px] text-dark">
      <div className="mx-auto w-full max-w-84">
        <header className="flex flex-col items-center text-center">
          <div className="flex h-26 w-full items-center justify-center">
            {/* Figma 원본 104.213px 로고와 바깥 그림자를 포함한 이미지 크기 */}
            <img
              src={loginLogo}
              alt="1호선톤"
              width={127}
              height={127}
              className="h-[127px] w-[127px] shrink-0"
            />
          </div>
          <div className="mt-3 flex h-13 w-full items-end justify-center pb-1">
            <img
              src={wordmark}
              alt="MALLAGE"
              className="h-8 w-51.75 max-w-full"
            />
          </div>
          <p className="mt-3 flex h-6.5 w-full items-end justify-center whitespace-nowrap text-[14px] leading-[1.4] text-[#939393] max-[360px]:text-[12px]">
            부스를 체험하고 당신의 마일리지를 배분하세요!
          </p>
        </header>

        <div className="flex h-12 items-center" aria-hidden="true">
          <div className="h-[0.5px] w-full bg-[#c4c4c4]" />
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!isPending) {
              const isValid = /^[0-9]{4}$/.test(code);
              setHasCodeError(!isValid);
              if (isValid) {
                login(code, {
                  onSuccess: () => navigate("/invest", { replace: true }),
                });
              }
            }
          }}
        >
          <label htmlFor="investor-code" className="sr-only">
            비밀코드
          </label>
          <input
            id="investor-code"
            name="code"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="비밀코드  ••••"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/[^0-9]/g, ""));
              setHasCodeError(false);
              resetError();
            }}
            disabled={isPending}
            aria-invalid={Boolean(displayedError)}
            aria-describedby={displayedError ? "login-error" : undefined}
            className="h-13 w-full rounded-lg border-[0.5px] border-[#c4c4c4] bg-white px-3.5 text-[15px] leading-[1.4] placeholder:text-[#888] focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          />
          <div className="my-3 flex h-4.5 items-center">
            {displayedError && (
              <p
                id="login-error"
                role="alert"
                className="text-[13px] leading-[1.4] text-[#f68b8b]"
              >
                {displayedError}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="flex h-13.5 w-full cursor-pointer items-center justify-center rounded-lg bg-dark text-[16px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
          >
            로그인
          </button>
        </form>

        <div className="mt-16.25 flex h-4.5 items-center justify-center text-center">
          <Link
            to="/admin/login"
            className="rounded text-[13px] leading-[1.4] text-[#989898] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            관리자 로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
