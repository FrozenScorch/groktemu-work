import test from 'node:test';
import assert from 'node:assert/strict';
import { Agent, summarizeTrace, EVENT, STATUS } from '../src/agent/index.js';

const FAST = { delayMs: 0 };

test('agent runs a goal to completion and reports success', async () => {
  const agent = new Agent(FAST);
  const result = await agent.run('add dark mode to the landing page');

  assert.equal(result.summary.status, STATUS.Success);
  assert.equal(result.summary.intent, 'feature');
  assert.equal(result.summary.completed, result.summary.stepCount);
  assert.equal(result.summary.failed, 0);
  assert.ok(result.artifacts.length >= 1, 'run collected artifacts');
  assert.equal(result.trace[0].type, EVENT.Plan);
  assert.equal(result.trace[result.trace.length - 1].type, EVENT.Done);
});

test('agent fires onPlan before any step events', async () => {
  const agent = new Agent(FAST);
  const calls = [];
  await agent.run('fix the bug', {
    onPlan: () => calls.push('plan'),
    onEvent: () => { if (!calls.includes('event')) calls.push('event'); },
  });
  assert.deepEqual(calls.slice(0, 2), ['plan', 'event'], 'onEvent fires after onPlan');
});

test('agent onDone delivers the final result object', async () => {
  const agent = new Agent(FAST);
  let delivered;
  await agent.run('research the market', { onDone: (r) => { delivered = r; } });
  assert.ok(delivered);
  assert.equal(delivered.summary.status, STATUS.Success);
  assert.equal(delivered.summary.intent, 'research');
});

test('agent abort cancels the run before the next step', async () => {
  const agent = new Agent({ delayMs: 12 });
  let cancelledSeen = false;

  const runPromise = agent.run('build a big feature', {
    onEvent: (ev) => {
      if (ev.type === EVENT.Complete && !cancelledSeen) {
        // Abort after the first step completes; the next iteration must stop.
        agent.abort();
      }
      if (ev.type === EVENT.Cancelled) cancelledSeen = true;
    },
  });

  const result = await runPromise;
  assert.ok(cancelledSeen, 'a cancelled event was emitted');
  assert.equal(result.summary.status, STATUS.Cancelled);
  assert.ok(result.summary.completed < result.summary.stepCount, 'did not finish all steps');
});

test('agent rejects an empty goal before running', async () => {
  const agent = new Agent(FAST);
  await assert.rejects(() => agent.run('   '), /non-empty/);
});

test('summarizeTrace classifies traces correctly', () => {
  const plan = { intent: 'feature', intentTitle: 'Feature build', goal: 'g', steps: new Array(3) };
  const complete = (extra = {}) => ({ type: EVENT.Complete, ...extra });

  const okTrace = [
    { type: EVENT.Plan, plan },
    { type: EVENT.Start }, complete(),
    { type: EVENT.Start }, complete(),
    { type: EVENT.Start }, complete(),
    { type: EVENT.Done },
  ];
  assert.equal(summarizeTrace(okTrace, { ...plan, steps: okTrace.filter((t) => t.type === EVENT.Start) }).status, STATUS.Success);

  const errTrace = [
    { type: EVENT.Plan, plan },
    { type: EVENT.Start }, complete(),
    { type: EVENT.Start }, { type: EVENT.Error, step: {} },
  ];
  assert.equal(summarizeTrace(errTrace, { ...plan, steps: errTrace.filter((t) => t.type === EVENT.Start) }).status, STATUS.Failed);

  const cancelTrace = [{ type: EVENT.Plan, plan }, { type: EVENT.Cancelled, step: {} }];
  assert.equal(summarizeTrace(cancelTrace, plan).status, STATUS.Cancelled);
});
