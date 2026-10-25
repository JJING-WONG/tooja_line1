import { Link, NavLink } from "react-router-dom";

// 관리자 공통 메뉴 UI. 접수 상태와 요청 동작은 AdminLayout에서 전달합니다.
export default function AdminSidebar({
  isExpanded = false,
  investmentStatus,
  isStatusUnavailable = false,
  isUpdating = false,
  onStatusChange,
  onLogout,
  isLoggingOut = false,
  logoutError,
}: {
  isExpanded?: boolean;
  isStatusUnavailable?: boolean;
  investmentStatus?: "RUNNING" | "PAUSED";
  isUpdating?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  logoutError?: string;
  onStatusChange?: (status: "RUNNING" | "PAUSED") => void;
}) {
  const isRunning = investmentStatus === "RUNNING";
  const isStatusDisabled = isStatusUnavailable || !investmentStatus || isUpdating || isLoggingOut;

  return (
      <aside inert={(isExpanded && isUpdating) || isLoggingOut} className={`sticky top-0 flex h-dvh shrink-0 flex-col bg-[#f2f2f2] ${isExpanded ? "min-h-140 w-55 gap-1.5 px-4 py-6 min-[1800px]:min-h-210 min-[1800px]:w-82.5 min-[1800px]:gap-2.25 min-[1800px]:px-6 min-[1800px]:py-9" : "min-h-140 w-55 gap-1.5 px-4 py-6"}`}>
        <p className={`font-bold text-[#222] ${isExpanded ? "text-[17px] leading-6 min-[1800px]:text-[25.5px] min-[1800px]:leading-9" : "text-[17px] leading-6"}`}>
          1호선톤 관리자
        </p>
        <div className={`shrink-0 ${isExpanded ? "h-3.5 min-[1800px]:h-5.25" : "h-3.5"}`} />
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            ` ${isExpanded ? "rounded-lg px-3.5 py-2.5 text-sm leading-5 min-[1800px]:rounded-xl min-[1800px]:px-5.25 min-[1800px]:py-3.75 min-[1800px]:text-[21px] min-[1800px]:leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"} ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          운영 현황
        </NavLink>
        <NavLink
          to="/admin/investors"
          className={({ isActive }) =>
            ` ${isExpanded ? "rounded-lg px-3.5 py-2.5 text-sm leading-5 min-[1800px]:rounded-xl min-[1800px]:px-5.25 min-[1800px]:py-3.75 min-[1800px]:text-[21px] min-[1800px]:leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"} ${isActive ? "bg-primary font-bold text-white" : "text-[#555]"}`
          }
        >
          투자자 목록
        </NavLink>
        <Link
          to="/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[#555] ${isExpanded ? "rounded-lg px-3.5 py-2.5 text-sm leading-5 min-[1800px]:rounded-xl min-[1800px]:px-5.25 min-[1800px]:py-3.75 min-[1800px]:text-[21px] min-[1800px]:leading-7.25" : "rounded-lg px-3.5 py-2.5 text-sm leading-5"}`}
        >
          대형 대시보드 ↗
        </Link>
        {/* 공통 현황 조회에서 확인한 현재 상태로 제어합니다. */}
        <div className={`flex flex-1 flex-col justify-end ${isExpanded ? "min-h-23.5 gap-1.5 min-[1800px]:min-h-35.25 min-[1800px]:gap-2.25" : "min-h-23.5 gap-1.5"}`}>
          <button
            type="button"
            disabled={isStatusDisabled || isRunning}
            onClick={() => { if (!isRunning && !isStatusDisabled) onStatusChange?.("RUNNING"); }}
            className={isExpanded ? "h-11 shrink-0 rounded-lg min-[1800px]:h-16.5 min-[1800px]:rounded-xl border border-secondary bg-white/20 text-sm leading-5 font-bold min-[1800px]:text-[21px] min-[1800px]:leading-7.25 text-secondary transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-[#8b8b8b] disabled:bg-[#d3d3d3] disabled:text-[#8e8e8e]" : "h-11 shrink-0 rounded-lg bg-secondary text-sm leading-5 font-bold text-white"}
          >
            투자 시작
          </button>
          <button
            type="button"
            disabled={isStatusDisabled || !isRunning}
            onClick={() => { if (isRunning && !isStatusDisabled) onStatusChange?.("PAUSED"); }}
            className={isExpanded ? "h-11 shrink-0 rounded-lg min-[1800px]:h-16.5 min-[1800px]:rounded-xl border-[1.5px] border-secondary bg-white/20 text-sm leading-5 font-bold min-[1800px]:text-[21px] min-[1800px]:leading-7.25 text-secondary transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-[#8e8e8e] disabled:bg-[#d3d3d3] disabled:text-[#8e8e8e]" : "h-11 shrink-0 rounded-lg border border-secondary bg-white/20 text-sm leading-5 font-bold text-secondary"}
          >
            {isExpanded ? "투자 중단" : "투자 종료"}
          </button>
        </div>
        {logoutError && <p role="alert" className="text-sm leading-5 text-[#b42318]">{logoutError}</p>}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          className={`disabled:cursor-wait disabled:opacity-60 text-left text-[#888] ${isExpanded ? "rounded-lg px-3.5 py-3 text-[13px] leading-4.5 min-[1800px]:rounded-xl min-[1800px]:px-5.25 min-[1800px]:py-4.5 min-[1800px]:text-[19.5px] min-[1800px]:leading-6.75" : "rounded-lg px-3.5 py-3 text-[13px] leading-4.5"}`}
        >
          {isLoggingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      </aside>
  );
}
