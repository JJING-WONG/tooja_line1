import { useEffect, useLayoutEffect, useRef } from "react";
import type { components } from "../../../apis/schema";

type Dashboard = components["schemas"]["Dashboard"];

export function useDashboardAnimation(
  data: Dashboard | undefined,
  scale: number,
  suspended: boolean,
  receivedAt: number,
) {
  const rowsRef = useRef<HTMLDivElement>(null);
  const previous = useRef<{ version: number; positions: Map<number, number>; amounts: Map<number, number>; scale: number; receivedAt: number } | null>(null);
  const moves = useRef(new Map<HTMLElement, { animation: Animation; from: number }>());
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const skipNext = useRef(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reset = () => {
      skipNext.current = true;
      moves.current.forEach(({ animation }) => animation.cancel());
      moves.current.clear();
      clearTimeout(highlightTimer.current);
      rowsRef.current?.querySelectorAll<HTMLElement>("[data-team-id]").forEach(row => {
        row.dataset.motion = "off";
        delete row.dataset.updated;
      });
    };
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("focus", reset);
    window.addEventListener("online", reset);
    window.addEventListener("offline", reset);
    window.addEventListener("resize", reset);
    document.addEventListener("fullscreenchange", reset);
    motion.addEventListener("change", reset);
    const activeMoves = moves.current;
    return () => {
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("focus", reset);
      window.removeEventListener("online", reset);
      window.removeEventListener("offline", reset);
      window.removeEventListener("resize", reset);
      document.removeEventListener("fullscreenchange", reset);
      motion.removeEventListener("change", reset);
      activeMoves.forEach(({ animation }) => animation.cancel());
      activeMoves.clear();
      clearTimeout(highlightTimer.current);
    };
  }, []);

  // DOM 커밋 직후 처리합니다. offsetTop은 부모 scale의 영향을 받지 않는 좌표입니다.
  useLayoutEffect(() => {
    if (!data || !rowsRef.current) return;
    const rows = Array.from(rowsRef.current.querySelectorAll<HTMLElement>("[data-team-id]"));
    const old = previous.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (suspended) skipNext.current = true;
    const reset = suspended || reduced || document.hidden || !old || old.scale !== scale || skipNext.current;
    const changed = old !== null && old.version !== data.snapshotVersion;

    if (reset || changed) {
      clearTimeout(highlightTimer.current);
      for (const row of rows) {
        const id = Number(row.dataset.teamId);
        const running = moves.current.get(row);
        const progress = running?.animation.effect?.getComputedTiming().progress ?? 0;
        const currentOffset = running ? running.from * (1 - progress) : 0;
        running?.animation.cancel();
        moves.current.delete(row);
        delete row.dataset.updated;
        row.dataset.motion = reset ? "off" : "on";

        if (!reset && changed && old) {
          const from = (old.positions.get(id) ?? row.offsetTop) + currentOffset - row.offsetTop;
          if (Math.abs(from) > 0.5 && typeof row.animate === "function") {
            const animation = row.animate(
              [{ transform: `translateY(${from}px)` }, { transform: "translateY(0)" }],
              { duration: 800, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
            );
            moves.current.set(row, { animation, from });
            animation.onfinish = () => {
              if (moves.current.get(row)?.animation === animation) moves.current.delete(row);
            };
          }
          const amount = data.teams.find(team => team.teamId === id)?.raisedAmount ?? 0;
          const increase = Math.max(0, amount - (old.amounts.get(id) ?? amount));
          if (increase > 0) {
            // 연속 갱신에서도 이전 강조 효과를 처음부터 다시 시작합니다.
            void row.offsetWidth;
            row.dataset.updated = "true";
            const badge = row.querySelector<HTMLElement>("[data-increase]");
            if (badge) badge.textContent = `+${increase.toLocaleString("ko-KR")}원 갱신`;
          }
        }
      }
      if (!reset && changed) {
        highlightTimer.current = setTimeout(() => {
          rows.forEach(row => { delete row.dataset.updated; });
        }, 1500);
      }
    }
    previous.current = {
      version: data.snapshotVersion,
      positions: new Map(rows.map(row => [Number(row.dataset.teamId), row.offsetTop])),
      amounts: new Map(data.teams.map(team => [team.teamId, team.raisedAmount])),
      scale,
      receivedAt,
    };
    // 복구 응답이 도착할 때까지 억제 상태를 유지합니다(상태 조회만으로 풀리지 않음).
    if (!suspended && !document.hidden && old && old.receivedAt !== receivedAt) skipNext.current = false;
    if (!old) skipNext.current = false;
  });

  return rowsRef;
}
