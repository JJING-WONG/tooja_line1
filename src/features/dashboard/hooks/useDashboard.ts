import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { components } from "../../../apis/schema";
import { getDashboard } from "../apis/dashboard.api";

type Dashboard = components["schemas"]["Dashboard"];
type DashboardSnapshot = Dashboard & {
  changes: Record<number, { rankChange: number; amountIncrease: number }>;
};

export const dashboardQueryKey = ["public", "dashboard"] as const;

class DashboardCooldownError extends Error {
  readonly retryAt: number;

  constructor(retryAt: number, cause: unknown) {
    super("잠시 후 순위 정보를 다시 조회해 주세요.", { cause });
    this.retryAt = retryAt;
  }
}

// 첫 조회·같은 투자 버전에서는 갱신 강조를 만들지 않습니다.
export function dashboardSnapshot(data: Dashboard, previous?: DashboardSnapshot): DashboardSnapshot {
  const changes: DashboardSnapshot["changes"] = {};
  if (previous && previous.snapshotVersion !== data.snapshotVersion) {
    const oldTeams = new Map(previous.teams.map((team) => [team.teamId, team]));
    for (const team of data.teams) {
      const old = oldTeams.get(team.teamId);
      if (old) changes[team.teamId] = {
        rankChange: old.rank - team.rank,
        amountIncrease: Math.max(0, team.raisedAmount - old.raisedAmount),
      };
    }
  }
  return { ...data, changes };
}

function cooldownUntil(error: unknown, errorUpdatedAt: number) {
  if (error instanceof DashboardCooldownError) return error.retryAt;
  if (!isAxiosError(error) || ![429, 503].includes(error.response?.status ?? 0)) return 0;
  const value = error.response?.headers["retry-after"];
  const seconds = value === undefined ? NaN : Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return errorUpdatedAt + seconds * 1000;
  const date = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? date : errorUpdatedAt + 5000;
}

export function useDashboard() {
  const client = useQueryClient();
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: async ({ signal }) => {
      const state = client.getQueryState<DashboardSnapshot>(dashboardQueryKey);
      if (state && cooldownUntil(state.error, state.errorUpdatedAt) > Date.now()) throw state.error;
      try {
        const data = await getDashboard(signal);
        return dashboardSnapshot(data, client.getQueryData<DashboardSnapshot>(dashboardQueryKey));
      } catch (error) {
        const retryAt = cooldownUntil(error, Date.now());
        if (retryAt > Date.now()) throw new DashboardCooldownError(retryAt, error);
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    refetchInterval: (query) => Math.max(2000, cooldownUntil(query.state.error, query.state.errorUpdatedAt) - Date.now()),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
