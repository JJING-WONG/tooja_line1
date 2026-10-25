import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, IsRestoringProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { apiClient } = await server.ssrLoadModule("/src/apis/client.ts");
  const { useAdminLogin } = await server.ssrLoadModule("/src/features/auth/hooks/useAdminLogin.ts");
  const { useAdminLogout } = await server.ssrLoadModule("/src/features/auth/hooks/useAdminLogout.ts");
  const { useAdminSession, adminSessionQueryKey } = await server.ssrLoadModule("/src/features/auth/hooks/useAdminSession.ts");
  const { default: Guard } = await server.ssrLoadModule("/src/features/auth/components/AdminProtectedRoute.tsx");
  const session = { admin: { adminId: "admin-1", role: "ADMIN" }, csrfToken: "session-token", expiresAt: "2026-10-27T00:00:00Z" };
  const investorKey = ["auth", "investor", "session"];
  const investor = { investor: { investorId: "investor-1", kind: "STAFF" }, csrfToken: "investor-token" };
  let steps = [], calls = [];
  apiClient.defaults.adapter = async config => {
    calls.push(config); const step = steps.shift(); assert.ok(step, "unexpected request");
    assert.equal(config.method, step.method); assert.equal(config.url, step.url);
    if (step.error) throw step.error;
    return { data: step.data, status: step.method === "delete" ? 204 : 200, statusText: "OK", headers: {}, config };
  };
  const failure = (status, code) => new AxiosError("test", undefined, undefined, undefined, { status, data: { error: { code } }, headers: {} });
  function client() { const c = new QueryClient(); c.setQueryData(investorKey, investor); c.setQueryData(["investor", "teams", "investor-1"], { preserved: true }); c.setQueryData(["admin", "overview"], { stale: true }); return c; }
  function hook(c, useHook) { let value; function Harness() { value = useHook(); return null; } renderToStaticMarkup(React.createElement(QueryClientProvider, { client: c }, React.createElement(IsRestoringProvider, { value: true }, React.createElement(MemoryRouter, null, React.createElement(Harness))))); return value; }
  function settle(c, action) { return new Promise((resolve, reject) => { const timeout = setTimeout(() => { unsubscribe(); reject(Error("mutation timeout")); }, 3000); const unsubscribe = c.getMutationCache().subscribe(event => { if (event.mutation && ["success", "error"].includes(event.mutation.state.status)) { clearTimeout(timeout); unsubscribe(); resolve(event.mutation); } }); action(); }); }

  const c = client(); c.setQueryData(adminSessionQueryKey, null); c.setQueryData(["auth", "admin", "csrf"], { csrfToken: "old" });
  const login = hook(c, useAdminLogin);
  steps = [{ method: "get", url: "/admin/csrf", data: { csrfToken: "prepared-token" } }, { method: "post", url: "/admin/session", data: session }]; calls = [];
  const loggedIn = await settle(c, () => { login.login("0037"); login.login("0037"); });
  assert.equal(loggedIn.state.status, "success"); assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].data), { code: "0037" }); assert.equal(calls[1].headers["X-CSRF-Token"], "prepared-token");
  assert.deepEqual(c.getQueryData(adminSessionQueryKey), session); assert.equal(c.getQueryData(["auth", "admin", "csrf"]), undefined);
  assert.equal(c.getQueryData(["admin", "overview"]), undefined); assert.deepEqual(c.getQueryData(investorKey), investor);

  hook(c, useAdminSession); const sessionFn = c.getQueryCache().find({ queryKey: adminSessionQueryKey }).options.queryFn;
  steps = [{ method: "get", url: "/admin/session", data: session }]; assert.deepEqual(await sessionFn({ signal: new AbortController().signal }), session);
  assert.ok(calls.at(-1).signal); assert.equal(calls.at(-1).headers["X-CSRF-Token"], undefined);
  for (const status of [401, 403]) { steps = [{ method: "get", url: "/admin/session", error: failure(status, status === 401 ? "SESSION_EXPIRED" : "FORBIDDEN") }]; assert.equal(await sessionFn({ signal: new AbortController().signal }), null); }
  steps = [{ method: "get", url: "/admin/session", error: failure(500, "INTERNAL_ERROR") }]; await assert.rejects(sessionFn({ signal: new AbortController().signal })); assert.deepEqual(c.getQueryData(adminSessionQueryKey), session);

  const logout = hook(c, useAdminLogout); c.setQueryData(["admin", "investors"], { private: true });
  steps = [{ method: "delete", url: "/admin/session", error: failure(403, "CSRF_INVALID") }, { method: "get", url: "/admin/csrf", data: { csrfToken: "renewed" } }, { method: "delete", url: "/admin/session" }]; calls = [];
  const loggedOut = await settle(c, () => { logout.logout(); logout.logout(); });
  assert.equal(loggedOut.state.status, "success"); assert.equal(calls.length, 3); assert.equal(calls[0].headers["X-CSRF-Token"], "session-token"); assert.equal(calls[2].headers["X-CSRF-Token"], "renewed");
  assert.equal(c.getQueryData(adminSessionQueryKey), null); assert.equal(c.getQueryData(["admin", "investors"]), undefined); assert.deepEqual(c.getQueryData(investorKey), investor); assert.deepEqual(c.getQueryData(["investor", "teams", "investor-1"]), { preserved: true });

  const bad = client(); bad.setQueryData(adminSessionQueryKey, null); bad.setQueryData(["auth", "admin", "csrf"], { csrfToken: "prepared" }); const badLogin = hook(bad, useAdminLogin);
  steps = [{ method: "get", url: "/admin/csrf", data: { csrfToken: "prepared" } }, { method: "post", url: "/admin/session", error: failure(401, "AUTHENTICATION_FAILED") }]; assert.equal((await settle(bad, () => badLogin.login("9999"))).state.status, "error"); assert.equal(bad.getQueryData(adminSessionQueryKey), null);
  bad.setQueryData(adminSessionQueryKey, session); const badLogout = hook(bad, useAdminLogout); steps = [{ method: "delete", url: "/admin/session", error: failure(500, "INTERNAL_ERROR") }]; assert.equal((await settle(bad, () => badLogout.logout())).state.status, "error"); assert.deepEqual(bad.getQueryData(adminSessionQueryKey), session);

  function guard(value, guestOnly = false) { const q = client(); if (value !== undefined) q.setQueryData(adminSessionQueryKey, value); return renderToStaticMarkup(React.createElement(QueryClientProvider, { client: q }, React.createElement(IsRestoringProvider, { value: true }, React.createElement(MemoryRouter, { initialEntries: ["/test"] }, React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(Guard, { guestOnly }) }, React.createElement(Route, { path: "/test", element: React.createElement("p", null, "protected-content") }))))))); }
  assert.ok(guard(session).includes("protected-content")); assert.ok(!guard(null).includes("protected-content")); assert.ok(!guard(session, true).includes("protected-content")); assert.ok(guard(null, true).includes("protected-content")); assert.ok(guard(undefined).includes("LoadingArc.png"));
  console.log("Admin auth checks passed: CSRF/login/session/logout, duplicate submission, cache isolation, failure handling and route guard states. Browser navigation remains to be verified.");
} finally { await server.close(); }
