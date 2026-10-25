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
  const { useAdminInvestors, parseInvestorFilters, adminInvestorsQueryKey } = await server.ssrLoadModule("/src/features/admin/hooks/useAdminInvestors.ts");
  const { default: Page } = await server.ssrLoadModule("/src/pages/admin/InvestorListPage.tsx");
  const sessionKey = ["auth", "admin", "session"], adminId = "admin-1";
  const session = { admin: { adminId, role: "ADMIN" }, csrfToken: "admin-token" };
  const filters = parseInvestorFilters(new URLSearchParams("spendingStatus=ALL"));
  const key = adminInvestorsQueryKey(adminId, filters);
  const base = { alias: "서버 참가자", investorId: "inv/01", kind: "PARTICIPANT", teamId: 5, issuedAmount: 1000000, investedAmount: 300000, balance: 700000, spendingStatus: "UNSPENT", hasLoggedIn: true };
  const data = { items: [base, { ...base, investorId: "staff-02", alias: "서버 운영팀", kind: "STAFF", teamId: undefined, investedAmount: 1000000, balance: 0, spendingStatus: "COMPLETED" }, { ...base, investorId: "unpaid-03", alias: "서버 미지급", issuedAmount: 0, investedAmount: 0, balance: 0, spendingStatus: "NOT_ACTIVATED", hasLoggedIn: false }], count: 3, asOf: "2026-10-25T00:00:00Z" };
  function client() { const c = new QueryClient(); clients.push(c); c.setQueryData(sessionKey, session); return c; }
  function wrap(c, element, path = "/admin/investors?spendingStatus=ALL", restoring = true) { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: c }, React.createElement(IsRestoringProvider, { value: restoring }, React.createElement(MemoryRouter, { initialEntries: [path] }, element)))); }
  function capture(c, params = filters, enabled = true) { function Harness() { useAdminInvestors(params, enabled); return null; } wrap(c, React.createElement(Harness)); return c.getQueryCache().find({ queryKey: adminInvestorsQueryKey(adminId, params) }).options; }
  function render(c, context = {}, restoring = true) { return wrap(c, React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(Outlet, { context }) }, React.createElement(Route, { path: "/admin/investors", element: React.createElement(Page) }))), undefined, restoring); }
  const failure = (status, headers = {}) => new AxiosError("test", undefined, undefined, undefined, { status, data: { error: { code: status === 403 ? "FORBIDDEN" : status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR" } }, headers });

  assert.equal(parseInvestorFilters(new URLSearchParams()).spendingStatus, "UNSPENT");
  const combined = parseInvestorFilters(new URLSearchParams("q=팀%2003&teamId=03&kind=PARTICIPANT&spendingStatus=COMPLETED"));
  assert.deepEqual(combined, { q: "팀 03", teamId: 3, kind: "PARTICIPANT", spendingStatus: "COMPLETED" });
  const invalid = parseInvestorFilters(new URLSearchParams("teamId=999&kind=ADMIN&spendingStatus=WRONG")); assert.equal(invalid.teamId, undefined); assert.equal(invalid.kind, undefined); assert.equal(invalid.spendingStatus, "UNSPENT");
  assert.equal(parseInvestorFilters(new URLSearchParams({ q: "a".repeat(120) })).q.length, 100);
  assert.equal(parseInvestorFilters(new URLSearchParams("spendingStatus=NOT_ACTIVATED")).spendingStatus, "NOT_ACTIVATED");

  const c = client(); c.setQueryData(key, data); const html = render(c);
  for (const text of ["검색 결과 3명", "서버 참가자", "서버 운영팀", "서버 미지급", "300,000", "700,000", "소진 완료", "미지급", "미소진", "/admin/investors/inv%2F01"]) assert.ok(html.includes(text), text);
  assert.equal((html.match(/<tbody[\s\S]*?<\/tbody>/)[0].match(/<tr/g) || []).length, 3);
  assert.ok(!html.includes("검색 결과 52명"));
  const empty = client(); empty.setQueryData(key, { ...data, items: [], count: 0 }); assert.ok(render(empty).includes("검색 결과 없음")); assert.ok(render(empty).includes("아직 투자자가 나오지 않았어요"));
  assert.ok(render(client()).includes("LoadingArc.png"));
  const initialError = client(); initialError.setQueryData(key, data); initialError.getQueryCache().find({ queryKey: key }).setState({ data: undefined, status: "error", error: failure(500), errorUpdatedAt: Date.now(), fetchStatus: "idle" }); assert.ok(render(initialError).includes("정보를 불러오지 못했어요")); assert.ok(!render(initialError).includes("서버 참가자"));
  const background = client(); background.setQueryData(key, data); background.getQueryCache().find({ queryKey: key }).setState({ status: "error", error: failure(500), fetchStatus: "idle" }); assert.ok(render(background).includes("서버 참가자")); assert.ok(render(background).includes("갱신하지 못했어요")); assert.ok(!render(background, { isStatusError: true }).includes("갱신하지 못했어요")); assert.ok(!render(background, { isUpdating: true }).includes("갱신하지 못했어요"));

  const options = capture(c, combined); let calls = [];
  apiClient.defaults.adapter = async config => { calls.push(config); return { data, status: 200, statusText: "OK", headers: {}, config }; };
  assert.deepEqual(await options.queryFn({ signal: new AbortController().signal }), data); assert.equal(calls[0].url, "/admin/investors"); assert.equal(calls[0].method, "get"); assert.deepEqual(calls[0].params, combined); assert.ok(calls[0].signal); assert.equal(calls[0].timeout, 15000); assert.equal(calls[0].headers["X-CSRF-Token"], undefined);
  await capture(c).queryFn({ signal: new AbortController().signal }); const uri = apiClient.getUri(calls.at(-1)); assert.ok(!uri.includes("ALL")); assert.ok(!uri.includes("spendingStatus"));
  assert.equal(options.refetchInterval(), 2000); assert.equal(options.refetchIntervalInBackground, false); assert.equal(options.retry, false); assert.equal(options.placeholderData, undefined);
  assert.equal(capture(c, combined, false).enabled, false); assert.equal(capture(c, combined, false).refetchInterval(), false);

  for (const status of [401, 403, 500]) { const q = client(), opts = capture(q); apiClient.defaults.adapter = async () => { throw failure(status); }; await assert.rejects(opts.queryFn({ signal: new AbortController().signal })); assert.equal(q.getQueryData(sessionKey) === null, status !== 500); }
  const limited = client(), limitedOptions = capture(limited); let limitedCalls = 0; apiClient.defaults.adapter = async () => { limitedCalls++; throw failure(429, { "retry-after": "10" }); }; await assert.rejects(limitedOptions.queryFn({ signal: new AbortController().signal })); assert.ok(limitedOptions.refetchInterval() > 9000); await assert.rejects(limitedOptions.queryFn({ signal: new AbortController().signal })); assert.equal(limitedCalls, 1);
  const changed = client(), changedOptions = capture(changed); changed.setQueryData(sessionKey, { ...session, admin: { adminId: "admin-2" } }); apiClient.defaults.adapter = async () => { throw Error("must not send"); }; await assert.rejects(changedOptions.queryFn({ signal: new AbortController().signal }), /로그인 상태/);

  // 필터를 바꾸는 실제 QueryObserver가 이전 signal을 취소하고 현재 결과를 유지하는지 확인합니다.
  const racing = client(), oldFilters = { ...filters, q: "old" }, newFilters = { ...filters, q: "new" };
  const oldOptions = capture(racing, oldFilters), newOptions = capture(racing, newFilters); let aborted = false;
  apiClient.defaults.adapter = config => config.params.q === "old" ? new Promise((_resolve, reject) => { config.signal.addEventListener("abort", () => { aborted = true; reject(new CanceledError()); }, { once: true }); }) : Promise.resolve({ data: { ...data, items: [{ ...base, alias: "새 조건 결과" }], count: 1 }, status: 200, statusText: "OK", headers: {}, config });
  const observer = new QueryObserver(racing, oldOptions); const unsubscribe = observer.subscribe(() => {}); await Promise.resolve(); observer.setOptions(newOptions); const newest = await racing.fetchQuery(newOptions); assert.equal(aborted, true); assert.equal(newest.items[0].alias, "새 조건 결과"); assert.equal(observer.getCurrentResult().data.items[0].alias, "새 조건 결과"); unsubscribe();
  await racing.invalidateQueries({ queryKey: ["admin"], refetchType: "none" }); assert.equal(racing.getQueryCache().find({ queryKey: adminInvestorsQueryKey(adminId, newFilters) }).state.isInvalidated, true);
  console.log("Admin investor list checks passed: URL filters, API params, real amounts/badges/IDs, empty/loading/errors, 2s polling options, cooldown/auth isolation, filter cancellation and cache invalidation. Browser debounce/history/modal interactions remain to be verified.");
} finally { clients.forEach(c => c.clear()); await server.close(); }
