import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { components } from "../../../apis/schema";
import { getInvestmentStatus } from "../apis/dashboard.api";

type InvestmentStatus = components["schemas"]["InvestmentStatus"];
export const investmentStatusQueryKey = ["public", "investment-status"] as const;

// 목록·상세가 더 최근에 조회한 상태를 오래된 공개 캐시로 덮어쓰지 않습니다.
export function latestInvestmentStatus(publicStatus?: InvestmentStatus, detailStatus?: InvestmentStatus) {
  return !publicStatus || (detailStatus && detailStatus.revision > publicStatus.revision)
    ? detailStatus : publicStatus;
}

class StatusCooldownError extends Error {
  readonly retryAt: number;
  constructor(retryAt: number, cause: unknown) {
    super("접수 상태를 잠시 후 다시 확인해 주세요.", { cause });
    this.retryAt = retryAt;
  }
}

function retryAt(error: unknown) {
  return error instanceof StatusCooldownError ? error.retryAt : 0;
}

export function useInvestmentStatus() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: investmentStatusQueryKey,
    queryFn: async ({ signal }) => {
      const error = client.getQueryState(investmentStatusQueryKey)?.error;
      if (retryAt(error) > Date.now()) throw error;
      try { return await getInvestmentStatus(signal); }
      catch (error) {
        if (isAxiosError(error) && [429, 503].includes(error.response?.status ?? 0)) {
          const value = error.response?.headers["retry-after"];
          const seconds = value === undefined ? NaN : Number(value);
          const date = typeof value === "string" ? Date.parse(value) : NaN;
          const until = Number.isFinite(seconds) && seconds >= 0 ? Date.now() + seconds * 1000
            : Number.isFinite(date) ? date : Date.now() + 5000;
          if (until > Date.now()) throw new StatusCooldownError(until, error);
        }
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
    retryOnMount: false,
    refetchInterval: (query) => Math.max(2000, retryAt(query.state.error) - Date.now()),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const revision = query.data?.revision;
  useEffect(() => {
    if (revision === undefined) return;
    // 재개 후에도 과거 PAUSED 응답의 허용 금액을 쓰지 않도록 팀 데이터를 갱신합니다.
    void client.invalidateQueries({
      queryKey: ["investor"],
      predicate: (cached) => {
        if (cached.queryKey[1] !== "team" && cached.queryKey[1] !== "teams") return false;
        const data = cached.state.data as { investmentStatus?: InvestmentStatus } | undefined;
        return Boolean(data?.investmentStatus && data.investmentStatus.revision < revision);
      },
    });
  }, [client, revision]);
  return query;
}
