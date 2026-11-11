import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// DOM 위치·시간을 제어해 행 이동과 재생 억제 규칙을 확인합니다. 실제 API 호출 없음.
const source = readFileSync('src/features/dashboard/hooks/useDashboardAnimation.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText;
const refs = [], effects = [], listeners = new Map(), timers = new Map(), animations = [];
let cursor = 0, mounted = false, reduced = false, timerId = 0;
const eventTarget = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
const document = { ...eventTarget, hidden: false };
const context = vm.createContext({
  exports: {}, document,
  window: { ...eventTarget, requestAnimationFrame: () => 1, cancelAnimationFrame: () => {}, matchMedia: () => ({ ...eventTarget, matches: reduced }) },
  setTimeout: fn => { timers.set(++timerId, fn); return timerId; },
  clearTimeout: id => timers.delete(id),
  require: () => ({
    useRef: value => { const i = cursor++; return refs[i] ??= { current: value }; },
    useEffect: fn => { if (!mounted) effects.push(fn()); },
    useLayoutEffect: fn => fn(),
  }),
});
vm.runInContext(code, context);
const row = (id, y) => ({
  dataset: { teamId: String(id) }, offsetTop: y, offsetWidth: 100, badge: { textContent: '' },
  querySelector() { return this.badge; },
  animate(frames, options) {
    const animation = { effect: { getComputedTiming: () => ({ progress: this.progress ?? 0 }) }, cancel() { this.canceled = true; } };
    animations.push({ id, frames, options, animation }); return animation;
  },
});
const rows = [row(1, 0), row(2, 35), row(3, 70)];
function render(version, amounts, time, { scale = 1, paused = false } = {}) {
  cursor = 0;
  const data = version === undefined ? undefined : { snapshotVersion: version, teams: rows.map(r => ({ teamId: +r.dataset.teamId, raisedAmount: amounts[+r.dataset.teamId] })) };
  const result = context.exports.useDashboardAnimation(data, scale, paused, time);
  mounted = true; result.current = { querySelectorAll: () => rows };
}
render(undefined, {}, 0);
render(1, { 1: 100, 2: 100, 3: 0 }, 1);
assert.equal(animations.length, 0);
rows[0].offsetTop = 35; rows[1].offsetTop = 70; rows[2].offsetTop = 0;
render(2, { 1: 100, 2: 100, 3: 200 }, 2);
assert.equal(animations.length, 3);
assert.equal(animations[2].frames[0].transform, 'translateY(70px)');
assert.equal(animations[2].options.duration, 800);
assert.equal(rows[2].dataset.updated, 'true');
assert.equal(rows[2].badge.textContent, '+200원 갱신');
const timer = [...timers.values()][0];
render(2, { 1: 100, 2: 100, 3: 200 }, 3);
assert.equal(animations.length, 3); assert.equal(rows[2].dataset.updated, 'true');
timer(); timers.clear(); assert.equal(rows[2].dataset.updated, undefined);
// 연속 응답은 화면의 진행 중 위치부터 새 이동을 시작합니다.
rows[2].progress = 0.5; rows[2].offsetTop = 70;
render(3, { 1: 100, 2: 100, 3: 300 }, 4);
assert.equal(animations.at(-1).frames[0].transform, 'translateY(-35px)');

assert.equal(animations[2].animation.canceled, true);
const beforePause = animations.length;
render(3, { 1: 100, 2: 100, 3: 300 }, 4, { paused: true });
assert.ok(animations.every(a => a.animation.canceled));
assert.ok(rows.every(r => !r.dataset.updated && r.dataset.motion === 'off'));
render(4, { 1: 100, 2: 100, 3: 400 }, 5);
assert.equal(animations.length, beforePause);
assert.equal(rows[2].dataset.updated, undefined);
// 탭 복귀/재연결 이후 첫 응답은 바로 표시하고 그 다음 변화부터 재생합니다.
listeners.get('online')();
render(5, { 1: 100, 2: 100, 3: 500 }, 6);
assert.equal(rows[2].dataset.updated, undefined);
render(6, { 1: 100, 2: 100, 3: 600 }, 7);
assert.equal(rows[2].dataset.updated, 'true');
reduced = true;
render(7, { 1: 100, 2: 100, 3: 700 }, 8);
assert.equal(rows[2].dataset.updated, undefined);
reduced = false;
render(8, { 1: 100, 2: 100, 3: 800 }, 9, { scale: 0.5 });
assert.ok(rows.every(r => r.dataset.motion === 'off'));
effects.forEach(cleanup => cleanup?.());
assert.equal(timers.size, 0);
assert.equal(listeners.size, 0);
console.log('Dashboard animation checks passed: initial/same-version suppression, positions, interrupted movement, highlight expiry, pause/recovery, reduced motion, scale reset, cleanup.');
