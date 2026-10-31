import { Link } from "react-router-dom";
import loginLogo from "../../assets/Line1LoginLogo.png";
import wordmark from "../../assets/MALLAGE_LoginPage.svg";

export default function WelcomePage() {
  return (
    <main className="min-h-dvh bg-[#fafafa] px-[19.5px] text-dark">
      <div className="mx-auto flex min-h-dvh w-full max-w-84 flex-col pb-8 pt-12">
        <header className="flex flex-col items-center gap-3">
          <img src={loginLogo} alt="1호선톤" width={127} height={127} />
          <img src={wordmark} alt="MALLAGE" width={207} height={32} />
        </header>

        <section
          aria-labelledby="welcome-title"
          className="mt-10 rounded-[14px] border border-primary/20 bg-white px-5 py-6"
        >
          <h1 id="welcome-title" className="text-[21px] font-bold leading-8">
            시작하기 전에 잠깐! 🚉
          </h1>
          <ul className="mt-5 list-disc space-y-4 pl-4 text-[14px] leading-6 text-[#555] marker:text-primary">
            <li>
              팀들의 서비스를 체험하고 마음에 드는 팀에 가상 코인으로 투자해
              주세요.
            </li>
            <li>가상 코인은 실제 돈이 아닌 행사 참여용 코인이에요.</li>
            <li>이용 중 문제가 생기면 가까운 운영진에게 알려 주세요.</li>
          </ul>
        </section>

        <p className="mt-6 text-center text-[15px] font-medium leading-7 text-secondary">
          여러분의 투자로 다음 역의 주인공을 골라 주세요!
        </p>

        <div className="min-h-10 flex-1" />
        <Link
          to="/login"
          className="flex min-h-13.5 shrink-0 items-center justify-center rounded-lg bg-dark px-4 py-4 text-[16px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          로그인하러 가기
        </Link>
      </div>
    </main>
  );
}
