import { Link, NavLink } from "react-router-dom";

// 관리자 공통 메뉴 UI. 접수 상태와 요청 동작은 AdminLayout에서 전달합니다.
export default function AdminSidebar({
  isExpanded = false,
  investmentStatus = "RUNNING",
  isUpdating = false,
  onStatusChange,
}: {
  isExpanded?: boolean;
  investmentStatus?: "RUNNING" | "PAUSED";
  isUpdating?: boolean;
  onStatusChange?: (status: "RUNNING" | "PAUSED") => void;
}) {
  const isRunning = investmentStatus === "RUNNING";

  return (
      <aside inert={isExpanded && isUpdating} className={`sticky top-0 flex h-dvh shrink-0 flex-col bg-[#f2f2f2] ${isExpanded ? "min-h-210 w-82.5 gap-2.25 px-6 py-9" : "min-h-140 w-55 gap-1.5 px-4 py-6"}`}>
        <p className={`font-bold text-[#222] ${isExpanded ? "text-[25.5px] leading-9" : "text-[17px] leading-6"}`}>
          1호선톤 관리자
        </p>
        <div className={`shrink-0 ${isExpanded ? "h-5.25" : "h-3.5"}`} />
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            ` ${isExpanded ? "rounded-xl px-5.25 py-3.75 text-[21px] leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"} ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          운영 현황
        </NavLink>
        <NavLink
          to="/admin/investors"
          className={({ isActive }) =>
            ` ${isExpanded ? "rounded-xl px-5.25 py-3.75 text-[21px] leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"} ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          투자자 목록
        </NavLink>
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[#555] ${isExpanded ? "rounded-xl px-5.25 py-3.75 text-[21px] leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"}`}
        >
          대형 대시보드 ↗
        </Link>
        {/* 관리자 API 연결 전: 시안의 제어 버튼만 표시합니다. */}
        <div className={`flex flex-1 flex-col justify-end ${isExpanded ? "min-h-35.25 gap-2.25" : "min-h-23.5 gap-1.5"}`}>
          <button
            type="button"
            disabled={isExpanded && (isRunning || isUpdating)}
            onClick={() => { if (isExpanded && !isRunning && !isUpdating) onStatusChange?.("RUNNING"); }}
            className={isExpanded ? "h-16.5 shrink-0 rounded-xl border border-secondary bg-white/20 text-[21px] leading-7.25 font-bold text-secondary transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-[#8b8b8b] disabled:bg-[#d3d3d3] disabled:text-[#8e8e8e]" : "h-11 shrink-0 rounded-lg bg-secondary text-sm leading-5 font-bold text-white"}
          >
            투자 시작
          </button>
          <button
            type="button"
            disabled={isExpanded && (!isRunning || isUpdating)}
            onClick={() => { if (isExpanded && isRunning && !isUpdating) onStatusChange?.("PAUSED"); }}
            className={isExpanded ? "h-16.5 shrink-0 rounded-xl border-[1.5px] border-secondary bg-white/20 text-[21px] leading-7.25 font-bold text-secondary transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-[#8e8e8e] disabled:bg-[#d3d3d3] disabled:text-[#8e8e8e]" : "h-11 shrink-0 rounded-lg border border-secondary bg-white/20 text-sm leading-5 font-bold text-secondary"}
          >
            {isExpanded ? "투자 중단" : "투자 종료"}
          </button>
        </div>
        <button
          type="button"
          className={`text-left text-[#888] ${isExpanded ? "rounded-xl px-5.25 py-4.5 text-[19.5px] leading-6.75" : "rounded-lg px-3.5 py-3 text-[13px] leading-4.5"}`}
        >
          로그아웃
        </button>
      </aside>
  );
}
