import assert from "node:assert/strict";
import { createServer } from "vite";
import { AxiosError } from "axios";

// 실제 서버·쿠키를 사용하지 않는 #8/#11 복구 프로토콜 회귀 검증.
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { apiClient } = await server.ssrLoadModule("/src/apis/client.ts");
  const { resolveInvestment, InvestmentFailure, readPendingInvestment, savePendingInvestment, clearPendingInvestment } = await server.ssrLoadModule("/src/features/investment/utils/investmentRequest.ts");
  const request = { investorId: "investor-a", requestKey: "12345678-1234-4123-8123-123456789abc", input: { teamId: 5, amount: 500000 } };
  const receipt = { investment: { investmentId: "trade-1", teamId: 5, serviceName: "test", amount: 500000, confirmedAt: "2026-10-25T00:00:00Z" }, balanceAfterInvestment: 500000, snapshotVersion: 1 };
  const httpError = (status, code, headers = {}) => new AxiosError("test error", undefined, undefined, undefined, { status, data: { error: { code } }, headers });
  let calls, tokens, checking;
  function scenario(steps) {
    calls = []; tokens = []; checking = 0;
    apiClient.defaults.adapter = async config => {
      calls.push(config);
      const step = steps.shift();
      assert.ok(step, "unexpected extra request");
      assert.equal(config.method, step.method);
      assert.equal(config.timeout, 15000);
      if (step.error) throw step.error;
      return { data: step.data, status: step.method === "post" ? 201 : 200, statusText: "OK", headers: {}, config };
    };
  }
  const token = async refresh => { tokens.push(refresh); return refresh ? "new-token" : "token"; };
  const run = (recover = false, value = request) => resolveInvestment(value, recover, token, () => checking++);
  scenario([{ method: "post", data: receipt }]);
  assert.deepEqual(await run(), receipt);
  assert.equal(calls[0].url, "/investor/investments");
  assert.deepEqual(JSON.parse(calls[0].data), request.input);
  assert.equal(calls[0].headers["Idempotency-Key"], request.requestKey);
  assert.equal(calls[0].headers["X-CSRF-Token"], "token");

  scenario([{ method: "post", error: new AxiosError("network") }, { method: "get", data: { status: "SUCCEEDED", requestKey: request.requestKey, result: receipt } }]);
  assert.deepEqual(await run(), receipt); assert.equal(checking, 1); assert.equal(calls.length, 2);
  assert.equal(calls[1].url, `/investor/investment-requests/${request.requestKey}`);

  scenario([{ method: "post", error: httpError(500, "INTERNAL_ERROR") }, { method: "get", error: httpError(404, "REQUEST_RESULT_NOT_FOUND") }, { method: "post", data: receipt }]);
  assert.deepEqual(await run(), receipt);
  assert.equal(calls[0].data, calls[2].data);
  assert.equal(calls[0].headers["Idempotency-Key"], calls[2].headers["Idempotency-Key"]);

  scenario([{ method: "get", data: { status: "SUCCEEDED", result: receipt } }]);
  assert.deepEqual(await run(true), receipt); assert.equal(calls.length, 1);
  scenario([{ method: "get", data: { status: "REJECTED", error: { code: "INSUFFICIENT_BALANCE" } } }]);
  await assert.rejects(run(true), e => e instanceof InvestmentFailure && e.outcome === "rejected" && e.message.includes("잔액"));

  for (const code of ["ALREADY_INVESTED", "INSUFFICIENT_BALANCE", "SELF_INVESTMENT_FORBIDDEN"]) {
    scenario([{ method: "post", error: httpError(code === "SELF_INVESTMENT_FORBIDDEN" ? 403 : 409, code) }]);
    await assert.rejects(run(), e => e.outcome === "rejected"); assert.equal(calls.length, 1);
  }
  scenario([{ method: "post", error: httpError(409, "INVESTMENT_PAUSED") }]);
  await assert.rejects(run(), e => e.outcome === "paused"); assert.equal(calls.length, 1);
  scenario([{ method: "get", error: httpError(404, "REQUEST_RESULT_NOT_FOUND") }]);
  await assert.rejects(resolveInvestment(request, true, token, () => checking++, () => false), e => e.outcome === "paused"); assert.equal(calls.length, 1);
  scenario([{ method: "get", data: { status: "SUCCEEDED", result: receipt } }]);
  assert.deepEqual(await resolveInvestment(request, true, token, () => {}, () => false), receipt); assert.equal(calls.length, 1);
  scenario([{ method: "get", error: httpError(404, "REQUEST_RESULT_NOT_FOUND") }, { method: "post", data: receipt }]);
  assert.deepEqual(await run(true, { ...request, waitingForResume: true }), receipt);
  assert.equal(calls[1].headers["Idempotency-Key"], request.requestKey); assert.deepEqual(JSON.parse(calls[1].data), request.input);
  scenario([{ method: "post", error: httpError(403, "CSRF_INVALID") }, { method: "post", data: receipt }]);
  assert.deepEqual(await run(), receipt); assert.deepEqual(tokens, [false, true]);
  assert.equal(calls[1].headers["X-CSRF-Token"], "new-token");
  assert.equal(calls[0].headers["Idempotency-Key"], calls[1].headers["Idempotency-Key"]);
  for (const [status, code] of [[401, "SESSION_EXPIRED"], [403, "FORBIDDEN"]]) {
    scenario([{ method: "post", error: httpError(status, code) }]);
    await assert.rejects(run(), e => e.outcome === "auth");
  }
  scenario([{ method: "get", error: httpError(500, "INTERNAL_ERROR") }]);
  await assert.rejects(run(true), e => e.outcome === "unknown"); assert.equal(calls.length, 1);
  scenario([{ method: "get", error: httpError(404, "REQUEST_RESULT_NOT_FOUND") }, { method: "post", error: new AxiosError("lost again") }]);
  await assert.rejects(run(true), e => e.outcome === "unknown"); assert.equal(calls.length, 2);
  for (const status of [429, 503]) {
    scenario([{ method: "post", error: httpError(status, "RATE_LIMITED", { "retry-after": "10" }) }]);
    await assert.rejects(run(), e => e.outcome === "unknown" && e.retryAt > Date.now()); assert.equal(calls.length, 1);
  }
  scenario([]);
  await assert.rejects(run(true, { ...request, retryAt: Date.now() + 10000 }), e => e.outcome === "unknown");
  assert.equal(calls.length, 0);

  const memory = new Map();
  globalThis.sessionStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
  savePendingInvestment({ ...request, waitingForResume: true });
  assert.equal(readPendingInvestment(request.investorId).waitingForResume, true);
  savePendingInvestment(request);
  assert.deepEqual(readPendingInvestment(request.investorId), request);
  assert.equal(readPendingInvestment("another-investor"), null);
  clearPendingInvestment(request.investorId); assert.equal(readPendingInvestment(request.investorId), null);
  console.log("Investment request regression checks passed (success, ambiguity, same-key replay, recovery, rejection, CSRF, auth, cooldown, storage isolation).");
} finally { await server.close(); }
