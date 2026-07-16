import test from 'node:test';
import assert from 'node:assert/strict';
import { runSteps } from '../src/agent/executor.js';
import { EVENT } from '../src/agent/constants.js';

// A fake tool runner used to drive the executor deterministically in tests.
const makeTools = (overrides = {}) => async (name, args, ctx) => {
  if (overrides[name]) return overrides[name](args, ctx);
  return { ok: true, summary: `ran ${name}`, artifacts: [] };
};

const collect = async (gen) => {
  const events = [];
  for await (const ev of gen) events.push(ev);
  return events;
};

test('executor emits start/complete for each step and ends with done', async () => {
  const steps = [
    { id: 'a-0', index: 0, tool: 'a', label: 'A', args: {} },
    { id: 'a-1', index: 1, tool: 'b', label: 'B', args: {} },
  ];
  const events = await collect(runSteps(steps, makeTools(), { delayMs: 0 }));
  assert.deepEqual(
    events.map((e) => e.type),
    [EVENT.Start, EVENT.Complete, EVENT.Start, EVENT.Complete, EVENT.Done],
  );
  assert.equal(events[0].step.id, 'a-0');
  assert.equal(events[1].result.summary, 'ran a');
});

test('executor stops on the first error by default', async () => {
  const steps = [
    { id: 'a-0', index: 0, tool: 'ok', label: 'OK', args: {} },
    { id: 'a-1', index: 1, tool: 'boom', label: 'Boom', args: {} },
    { id: 'a-2', index: 2, tool: 'never', label: 'Never', args: {} },
  ];
  const tools = makeTools({ boom: () => Promise.reject(new Error('kaboom')) });
  const events = await collect(runSteps(steps, tools, { delayMs: 0 }));
  const types = events.map((e) => e.type);
  assert.deepEqual(types, [EVENT.Start, EVENT.Complete, EVENT.Start, EVENT.Error]);
  assert.equal(events[3].error, 'kaboom');
  assert.equal(events[3].step.id, 'a-1');
});

test('executor continues past errors when stopOnError is false', async () => {
  const steps = [
    { id: 'a-0', index: 0, tool: 'boom', label: 'Boom', args: {} },
    { id: 'a-1', index: 1, tool: 'ok', label: 'OK', args: {} },
  ];
  const tools = makeTools({ boom: () => Promise.reject(new Error('nope')) });
  const events = await collect(runSteps(steps, tools, { delayMs: 0, stopOnError: false }));
  assert.deepEqual(
    events.map((e) => e.type),
    [EVENT.Start, EVENT.Error, EVENT.Start, EVENT.Complete, EVENT.Done],
  );
});

test('executor yields a single cancelled event when the signal is already aborted', async () => {
  const steps = [
    { id: 'a-0', index: 0, tool: 'a', label: 'A', args: {} },
    { id: 'a-1', index: 1, tool: 'b', label: 'B', args: {} },
  ];
  const controller = new AbortController();
  controller.abort();
  const events = await collect(runSteps(steps, makeTools(), { delayMs: 0, signal: controller.signal }));
  assert.deepEqual(events.map((e) => e.type), [EVENT.Cancelled]);
  assert.equal(events[0].step.id, 'a-0');
});

test('executor passes goal context through to tools', async () => {
  const steps = [{ id: 'a-0', index: 0, tool: 'echo', label: 'Echo', args: {} }];
  let captured;
  const tools = async (name, args) => {
    captured = args;
    return { ok: true, summary: '', artifacts: [] };
  };
  await collect(runSteps(steps, tools, { delayMs: 0, goal: 'my goal' }));
  assert.equal(captured.goal, 'my goal');
});
