import { Link, NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-dvh min-w-319.25 bg-white font-['Noto_Sans_KR',sans-serif]">
      <aside className="sticky top-0 flex h-dvh min-h-140 w-55 shrink-0 flex-col gap-1.5 bg-[#f2f2f2] px-4 py-6">
        <p className="text-[17px] leading-6 font-bold text-[#222]">
          1호선톤 관리자
        </p>
        <div className="h-3.5 shrink-0" />
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `rounded-lg px-3.5 py-2.5 text-sm leading-5 ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          운영 현황
        </NavLink>
        <NavLink
          to="/admin/investors"
          className={({ isActive }) =>
            `rounded-lg px-3.5 py-2.5 text-sm leading-5 ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          투자자 목록
        </NavLink>
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3.5 py-2.5 text-sm leading-5 text-[#555]"
        >
          대형 대시보드 ↗
        </Link>
        {/* 관리자 API 연결 전: 시안의 제어 버튼만 표시합니다. */}
        <div className="flex min-h-23.5 flex-1 flex-col justify-end gap-1.5">
          <button
            type="button"
            className="h-11 shrink-0 rounded-lg bg-secondary text-sm leading-5 font-bold text-white"
          >
            투자 시작
          </button>
          <button
            type="button"
            className="h-11 shrink-0 rounded-lg border border-secondary bg-white/20 text-sm leading-5 font-bold text-secondary"
          >
            투자 종료
          </button>
        </div>
        <button
          type="button"
          className="rounded-lg px-3.5 py-3 text-left text-[13px] leading-4.5 text-[#888]"
        >
          로그아웃
        </button>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}
