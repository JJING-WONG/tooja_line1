import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, IsRestoringProvider } from "@tanstack/react-query";
import { AxiosError, CanceledError } from "axios";
import { createServer } from "vite";

// #16/#20 로컬 검증. 실제 서버의 투자 접수 상태를 바꾸지 않습니다.
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { apiClient } = await server.ssrLoadModule("/src/apis/client.ts");
  const { useAdminOverview, adminOverviewQueryKey } = await server.ssrLoadModule("/src/features/admin/hooks/useAdminOverview.ts");
  const { useUpdateInvestmentStatus } = await server.ssrLoadModule("/src/features/admin/hooks/useUpdateInvestmentStatus.ts");
  const { adminCooldownUntil } = await server.ssrLoadModule("/src/features/admin/utils/adminRequest.ts");
  const { default: Layout } = await server.ssrLoadModule("/src/layouts/AdminLayout.tsx");
  const { default: Overview } = await server.ssrLoadModule("/src/pages/admin/OverviewPage.tsx");
  const { default: Sidebar } = await server.ssrLoadModule("/src/features/admin/components/AdminSidebar.tsx");
  const sessionKey = ["auth", "admin", "session"], key = adminOverviewQueryKey("admin-1");
  const session = { admin: { adminId: "admin-1", role: "ADMIN" }, csrfToken: "admin-token", expiresAt: "2026-10-27T00:00:00Z" };
  const metrics = { registeredInvestorCount: 7, investedInvestorCount: 3, totalIssuedAmount: 7000000, totalInvestedAmount: 1700000, totalBalance: 5300000, completedCount: 1, unspentCount: 6 };
  const running = { status: "RUNNING", revision: 1, updatedAt: null };
  const paused = { status: "PAUSED", revision: 2, updatedAt: "2026-10-25T00:00:00Z" };
  const data = { total: metrics, participants: metrics, staff: { ...metrics, registeredInvestorCount: 0, investedInvestorCount: 0, totalIssuedAmount: 0, totalInvestedAmount: 0, totalBalance: 0, completedCount: 0, unspentCount: 0 }, asOf: "2026-10-25T16:05:06Z", snapshotVersion: 12, investmentStatus: running };
  const clients = [];
  function client(value = data) { const c = new QueryClient(); clients.push(c); c.setQueryData(sessionKey, session); c.setQueryData(["investor", "teams", "investor-1"], { keep: true }); if (value) c.setQueryData(key, value); return c; }
  function wrap(c, element) { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: c }, React.createElement(IsRestoringProvider, { value: true }, React.createElement(MemoryRouter, { initialEntries: ["/admin"] }, element)))); }
  function hook(c, useHook) { let value; function Harness() { value = useHook(); return null; } wrap(c, React.createElement(Harness)); return value; }
  function render(c) { return wrap(c, React.createElement(Routes, null, React.createElement(Route, { path: "/admin", element: React.createElement(Layout) }, React.createElement(Route, { index: true, element: React.createElement(Overview) })))); }
  function settle(c, action) { return new Promise((resolve, reject) => { const timeout = setTimeout(() => { off(); reject(Error("mutation timeout")); }, 3000); const off = c.getMutationCache().subscribe(e => { if (e.mutation && ["success", "error"].includes(e.mutation.state.status)) { clearTimeout(timeout); off(); resolve(e.mutation); } }); action(); }); }
  const failure = (status, code, headers = {}) => new AxiosError("test", undefined, undefined, undefined, { status, data: { error: { code } }, headers });
  let calls = [], steps = [];
  function scenario(next) { calls = []; steps = next; apiClient.defaults.adapter = async config => { calls.push(config); const step = steps.shift(); assert.ok(step, "unexpected request"); assert.equal(config.method, step.method); assert.equal(config.url, step.url); if (step.error) throw step.error; return { data: step.data, status: 200, statusText: "OK", headers: {}, config }; }; }
  const get = value => ({ method: "get", url: "/admin/overview", data: value });
  const patch = value => ({ method: "patch", url: "/admin/investment-status", data: value });

  const c = client(), html = render(c);
  for (const text of ["7명", "3명", "7,000,000원", "1,700,000원", "5,300,000원", "1명 / 6명", "01:05:06", "투자 진행 중"]) assert.ok(html.includes(text), text);
  assert.ok(!html.includes("4,000,000원"));
  assert.ok(render(client({ ...data, investmentStatus: paused })).includes("투자 중단됨"));
  assert.ok(render(client(null)).includes("LoadingArc.png"));
  const emptyError = client(); emptyError.getQueryCache().find({ queryKey: key }).setState({ data: undefined, status: "error", error: failure(500, "INTERNAL_ERROR"), fetchStatus: "idle" }); const initialError = render(emptyError); assert.ok(initialError.includes("정보를 불러오지 못했어요")); assert.ok(initialError.includes("<aside")); assert.ok(!initialError.includes("7,000,000원"));
  const backgroundError = client(); backgroundError.getQueryCache().find({ queryKey: key }).setState({ status: "error", error: failure(500, "INTERNAL_ERROR"), fetchStatus: "idle" }); const background = render(backgroundError); assert.ok(background.includes("7,000,000원")); assert.ok(background.includes("갱신하지 못했어요"));
  const unknownSidebar = wrap(client(), React.createElement(Sidebar, { isExpanded: true })); assert.equal((unknownSidebar.match(/disabled=""/g) || []).length, 2);

  hook(c, useAdminOverview); const query = c.getQueryCache().find({ queryKey: key }), options = query.options;
  assert.equal(options.refetchInterval(), 1000); assert.equal(options.refetchIntervalInBackground, false); assert.equal(options.retry, false);
  scenario([get(data)]); assert.deepEqual(await options.queryFn({ signal: new AbortController().signal }), data); assert.equal(calls[0].headers["X-CSRF-Token"], undefined); assert.equal(calls[0].timeout, 15000); assert.ok(calls[0].signal);
  scenario([{ ...get(data), error: failure(429, "RATE_LIMITED", { "retry-after": "10" }) }]); await assert.rejects(options.queryFn({ signal: new AbortController().signal })); assert.ok(adminCooldownUntil(c, "admin-1") > Date.now()); assert.ok(options.refetchInterval() > 9000); const before = calls.length; await assert.rejects(options.queryFn({ signal: new AbortController().signal })); assert.equal(calls.length, before);

  for (const status of [401, 403, 500]) { const q = client(); hook(q, useAdminOverview); const fn = q.getQueryCache().find({ queryKey: key }).options.queryFn; scenario([{ ...get(data), error: failure(status, status === 403 ? "FORBIDDEN" : "SESSION_EXPIRED") }]); await assert.rejects(fn({ signal: new AbortController().signal })); assert.equal(q.getQueryData(sessionKey) === null, status !== 500); }
  const changed = client(); hook(changed, useAdminOverview); const changedFn = changed.getQueryCache().find({ queryKey: key }).options.queryFn; changed.setQueryData(sessionKey, { ...session, admin: { adminId: "admin-2" } }); scenario([]); await assert.rejects(changedFn({ signal: new AbortController().signal })); assert.equal(calls.length, 0);

  const success = client(), update = hook(success, useUpdateInvestmentStatus); scenario([patch(paused)]); const result = await settle(success, () => { update.update("PAUSED"); update.update("PAUSED"); }); assert.equal(result.state.status, "success"); assert.equal(calls.length, 1); assert.deepEqual(JSON.parse(calls[0].data), { status: "PAUSED" }); assert.equal(calls[0].headers["X-CSRF-Token"], "admin-token"); assert.equal(calls[0].timeout, 15000); assert.equal(success.getQueryData(key).investmentStatus.status, "PAUSED"); assert.equal(success.getQueryCache().find({ queryKey: key }).state.isInvalidated, true); assert.deepEqual(success.getQueryData(["investor", "teams", "investor-1"]), { keep: true });
  const csrf = client(), csrfUpdate = hook(csrf, useUpdateInvestmentStatus); scenario([{ ...patch(paused), error: failure(403, "CSRF_INVALID") }, { method: "get", url: "/admin/csrf", data: { csrfToken: "new-admin-token" } }, patch(paused)]); assert.equal((await settle(csrf, () => csrfUpdate.update("PAUSED"))).state.status, "success"); assert.equal(calls[2].headers["X-CSRF-Token"], "new-admin-token"); assert.equal(csrf.getQueryData(sessionKey).csrfToken, "new-admin-token");
  const ambiguous = client(), ambiguousUpdate = hook(ambiguous, useUpdateInvestmentStatus); scenario([{ ...patch(paused), error: new AxiosError("network lost") }, get({ ...data, investmentStatus: paused })]); assert.equal((await settle(ambiguous, () => ambiguousUpdate.update("PAUSED"))).state.status, "success"); assert.equal(calls.length, 2); assert.equal(ambiguous.getQueryData(key).investmentStatus.status, "PAUSED");
  const unchanged = client(), unchangedUpdate = hook(unchanged, useUpdateInvestmentStatus); scenario([{ ...patch(paused), error: new AxiosError("network lost") }, get(data)]); assert.equal((await settle(unchanged, () => unchangedUpdate.update("PAUSED"))).state.status, "error"); assert.equal(unchanged.getQueryData(key).investmentStatus.status, "RUNNING");
  const limited = client(), limitedUpdate = hook(limited, useUpdateInvestmentStatus); scenario([{ ...patch(paused), error: failure(503, "SERVICE_UNAVAILABLE", { "retry-after": "5" }) }]); assert.equal((await settle(limited, () => limitedUpdate.update("PAUSED"))).state.status, "error"); assert.equal(calls.length, 1); assert.equal(limited.getQueryData(key).investmentStatus.status, "RUNNING");
  const expired = client(), expiredUpdate = hook(expired, useUpdateInvestmentStatus); scenario([{ ...patch(paused), error: failure(403, "FORBIDDEN") }]); await settle(expired, () => expiredUpdate.update("PAUSED")); assert.equal(expired.getQueryData(sessionKey), null);

  // 진행 중인 과거 조회를 취소한 뒤 PATCH가 실행되는지 검증합니다.
  const racing = client(); hook(racing, useAdminOverview); const raceOptions = racing.getQueryCache().find({ queryKey: key }).options; const raceUpdate = hook(racing, useUpdateInvestmentStatus); let aborted = false;
  apiClient.defaults.adapter = config => config.method === "get" ? new Promise((_resolve, reject) => { config.signal.addEventListener("abort", () => { aborted = true; reject(new CanceledError()); }, { once: true }); }) : Promise.resolve({ data: paused, status: 200, statusText: "OK", headers: {}, config });
  const oldRead = racing.fetchQuery(raceOptions).catch(() => undefined); await Promise.resolve(); assert.equal((await settle(racing, () => raceUpdate.update("PAUSED"))).state.status, "success"); await oldRead; assert.equal(aborted, true); assert.equal(racing.getQueryData(key).investmentStatus.status, "PAUSED");
  clients.forEach(q => q.clear());
  console.log("Admin overview/status checks passed: real metrics/KST, initial/background errors, request guards, polling options, cooldown, PATCH/CSRF/auth, duplicate submit, ambiguity recovery and stale-read cancellation. Browser timer/modal interactions remain to be verified.");
} finally { await server.close(); }
