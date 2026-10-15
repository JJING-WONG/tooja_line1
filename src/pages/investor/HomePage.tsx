import { useInvestorLogout } from "../../features/auth/hooks/useInvestorLogout";

export default function HomePage() {
  const { logout, isPending, errorMessage } = useInvestorLogout();

  return (
    <main className="p-5 text-dark">
      <h1 className="mb-4 text-xl">투자 홈</h1>
      <button
        type="button"
        onClick={logout}
        disabled={isPending}
        aria-busy={isPending}
        className="cursor-pointer rounded-lg bg-dark px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "로그아웃 중…" : "로그아웃"}
      </button>
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-[#f68b8b]">
          {errorMessage}
        </p>
      )}
    </main>
  );
}
