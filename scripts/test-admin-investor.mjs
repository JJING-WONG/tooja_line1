import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider, IsRestoringProvider, QueryObserver } from "@tanstack/react-query";
import { AxiosError, CanceledError } from "axios";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
const clients = [];
try {
  const { apiClient } = await server.ssrLoadModule("/src/apis/client.ts");
  const { useAdminInvestor, adminInvestorQueryKey } = await server.ssrLoadModule("/src/features/admin/hooks/useAdminInvestor.ts");
  const { default: Page } = await server.ssrLoadModule("/src/pages/admin/InvestorDetailPage.tsx");
  const sessionKey = ["auth", "admin", "session"], adminId = "admin-1", investorId = "investor-a";
  const key = adminInvestorQueryKey(adminId, investorId);
  const session = { admin: { adminId, role: "ADMIN" }, csrfToken: "token" };
  const investor = { investorId, alias: "서버 투자자 별칭", kind: "PARTICIPANT", teamId: 9, issuedAmount: 1000000, investedAmount: 700000, balance: 300000, spendingStatus: "UNSPENT", hasLoggedIn: true };
  const investments = [{ investmentId: "new", teamId: 5, serviceName: "서버 최신 서비스", amount: 500000, confirmedAt: "2026-10-25T16:05:00Z" }, { investmentId: "old", teamId: 2, serviceName: "서버 이전 서비스", amount: 200000, confirmedAt: "2026-10-25T00:00:00Z" }];
  const data = { investor, investments, asOf: "2026-10-25T16:05:00Z" };
  const failure = (status, headers = {}) => new AxiosError("test", undefined, undefined, undefined, { status, data: { error: { code: status === 403 ? "FORBIDDEN" : status === 404 ? "RESOURCE_NOT_FOUND" : status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR" } }, headers });
  function client(value = data) { const c = new QueryClient(); clients.push(c); c.setQueryData(sessionKey, session); if (value) c.setQueryData(key, value); return c; }
  function wrap(c, element, path = `/admin/investors/${investorId}`, restoring = true) { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: c }, React.createElement(IsRestoringProvider, { value: restoring }, React.createElement(MemoryRouter, { initialEntries: [path] }, element)))); }
  function render(c, context = {}, restoring = true) { return wrap(c, React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(Outlet, { context }) }, React.createElement(Route, { path: "/admin/investors/:investorId", element: React.createElement(Page) }))), undefined, restoring); }
  function capture(c, id = investorId) { function Harness() { useAdminInvestor(id); return null; } wrap(c, React.createElement(Harness)); return c.getQueryCache().find({ queryKey: adminInvestorQueryKey(adminId, id) }).options; }
  const normal = client(), html = render(normal);
  for (const text of ["서버 투자자 별칭", "TEAM 09", "1,000,000원", "700,000원", "300,000원", "미소진", "서버 최신 서비스", "서버 이전 서비스", "10.26 01:05"]) assert.ok(html.includes(text), text);
  assert.ok(html.indexOf("서버 최신 서비스") < html.indexOf("서버 이전 서비스"));
  const staff = render(client({ ...data, investor: { ...investor, alias: "실제 운영팀 별칭", kind: "STAFF", teamId: undefined } })); assert.ok(staff.includes("실제 운영팀 별칭")); assert.ok(staff.includes("운영팀")); assert.ok(!staff.includes("참가자")); assert.ok(!staff.includes("TEAM undefined"));
  const unpaid = render(client({ ...data, investor: { ...investor, issuedAmount: 0, investedAmount: 0, balance: 0, spendingStatus: "NOT_ACTIVATED" }, investments: [] })); assert.equal((unpaid.match(/>0원</g) || []).length, 3); assert.ok(unpaid.includes("미지급")); assert.ok(unpaid.includes("아직 투자한 팀이 없어요")); assert.ok(!unpaid.includes("전부 소진"));
  const completed = render(client({ ...data, investor: { ...investor, investedAmount: 1000000, balance: 0, spendingStatus: "COMPLETED" } })); assert.ok(completed.includes("마일리지가 전부 소진되었어요")); assert.ok(completed.includes("소진 완료"));
  assert.ok(render(client({ ...data, investments: [] })).includes("아직 투자한 팀이 없어요")); assert.ok(render(client(null)).includes("LoadingArc.png"));
  for (const status of [404, 500]) { const q = client(); q.getQueryCache().find({ queryKey: key }).setState({ status: "error", error: failure(status), errorUpdatedAt: Date.now(), fetchStatus: "idle" }); const h = render(q); assert.ok(h.includes(status === 404 ? "투자자를 찾을 수 없어요" : "정보를 불러오지 못했어요")); assert.ok(h.includes("투자자 목록으로")); assert.ok(!h.includes("서버 투자자 별칭")); if (status === 404) assert.ok(!render(q, { isStatusError: true }).includes("<dialog")); }
  const retrying = client(null); retrying.setQueryData(key, data); retrying.getQueryCache().find({ queryKey: key }).setState({ data: undefined, status: "error", error: failure(500), errorUpdatedAt: Date.now(), fetchStatus: "fetching" }); const retry = render(retrying, {}, false); assert.ok(retry.includes("다시 불러오는 중...")); assert.ok(retry.includes('disabled=""'));

  const options = capture(normal, "inv/a b"); let calls = [];
  apiClient.defaults.adapter = async config => { calls.push(config); return { data, status: 200, statusText: "OK", headers: {}, config }; };
  assert.deepEqual(await options.queryFn({ signal: new AbortController().signal }), data); assert.equal(calls[0].url, "/admin/investors/inv%2Fa%20b"); assert.equal(calls[0].method, "get"); assert.equal(calls[0].headers["X-CSRF-Token"], undefined); assert.equal(calls[0].params, undefined); assert.ok(calls[0].signal); assert.equal(calls[0].timeout, 15000);
  assert.equal(options.refetchInterval, undefined); assert.equal(options.refetchOnWindowFocus, true); assert.equal(options.refetchOnReconnect, true); assert.equal(options.retry, false); assert.equal(options.placeholderData, undefined);
  for (const status of [401, 403, 500]) { const c = client(), opt = capture(c); apiClient.defaults.adapter = async () => { throw failure(status); }; await assert.rejects(opt.queryFn({ signal: new AbortController().signal })); assert.equal(c.getQueryData(sessionKey) === null, status !== 500); }
  const limited = client(), limitedOptions = capture(limited); let limitedCalls = 0; apiClient.defaults.adapter = async () => { limitedCalls++; throw failure(429, { "retry-after": "10" }); }; await assert.rejects(limitedOptions.queryFn({ signal: new AbortController().signal })); await assert.rejects(limitedOptions.queryFn({ signal: new AbortController().signal })); assert.equal(limitedCalls, 1);
  const changed = client(), changedOptions = capture(changed); changed.setQueryData(sessionKey, { ...session, admin: { adminId: "other-admin" } }); apiClient.defaults.adapter = async () => { throw Error("must not send"); }; await assert.rejects(changedOptions.queryFn({ signal: new AbortController().signal }), /로그인 상태/);

  const racing = client(null), oldOptions = capture(racing, "old-investor"), newOptions = capture(racing, "new-investor"); let aborted = false;
  apiClient.defaults.adapter = config => config.url.endsWith("old-investor") ? new Promise((_resolve, reject) => { config.signal.addEventListener("abort", () => { aborted = true; reject(new CanceledError()); }, { once: true }); }) : Promise.resolve({ data: { ...data, investor: { ...investor, investorId: "new-investor", alias: "새 투자자" } }, status: 200, statusText: "OK", headers: {}, config });
  const observer = new QueryObserver(racing, oldOptions); const off = observer.subscribe(() => {}); await Promise.resolve(); observer.setOptions(newOptions); const fresh = await racing.fetchQuery(newOptions); assert.equal(aborted, true); assert.equal(fresh.investor.alias, "새 투자자"); assert.equal(observer.getCurrentResult().data.investor.alias, "새 투자자"); off();
  console.log("Admin investor detail checks passed: live fields, roles/statuses, KST/order/empty, loading/404/error/retry, encoded GET, cooldown/auth, no polling, investor-change cancellation. Browser interactions remain to be verified.");
} finally { clients.forEach(c => c.clear()); await server.close(); }
