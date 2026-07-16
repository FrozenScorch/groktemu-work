import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTool, getTool, TOOL_NAMES } from '../src/agent/tools.js';

const CTX = { delayMs: 0 };

test('every declared tool runs and returns a structured result', async () => {
  for (const name of TOOL_NAMES) {
    const result = await executeTool(name, { goal: 'ship the thing' }, CTX);
    assert.equal(result.ok, true, `${name} reported ok`);
    assert.ok(typeof result.summary === 'string' && result.summary.length > 0, `${name} has a summary`);
    assert.ok(Array.isArray(result.artifacts), `${name} returns artifacts array`);
  }
});

test('executeTool throws on an unknown tool name', async () => {
  await assert.rejects(() => executeTool('nope', { goal: 'x' }, CTX), /Unknown tool: nope/);
});

test('getTool exposes icon metadata used by the UI', () => {
  const tool = getTool('implement');
  assert.ok(tool);
  assert.equal(tool.name, 'implement');
  assert.ok(typeof tool.icon === 'string' && tool.icon.length > 0);
});

test('tools are deterministic — same input yields same output', async () => {
  const a = await executeTool('implement', { goal: 'dark mode' }, CTX);
  const b = await executeTool('implement', { goal: 'dark mode' }, CTX);
  assert.deepEqual(a, b);
});

test('artifact-producing tools emit the expected kinds', async () => {
  const impl = await executeTool('implement', { goal: 'g' }, CTX);
  assert.equal(impl.artifacts[0].kind, 'code');
  assert.ok(impl.artifacts[0].body.includes('g'));

  const test = await executeTool('test', { goal: 'g' }, CTX);
  assert.equal(test.artifacts[0].kind, 'metrics');

  const deploy = await executeTool('deploy', { goal: 'g' }, CTX);
  assert.equal(deploy.artifacts[0].kind, 'release');
});
