// The interactive agent console. Renders goal presets + input, drives an
// Agent run via hooks, and reflects the live event stream into a plan
// timeline and a scrolling log. This is the same Agent the tests exercise,
// so the on-screen behavior and the asserted behavior can never drift.

import { h, clear } from './dom.js';
import { Agent, EVENT, STATUS } from '../agent/index.js';
import { getTool } from '../agent/index.js';

const PRESETS = [
  'Add dark mode to the landing page',
  'Fix the flaky checkout test',
  'Deploy the API to production',
  'Research our competitors pricing',
  'Write the launch blog post',
  'Investigate the spike in 500 errors',
];

const STEP_STATE = {
  [EVENT.Start]: 'running',
  [EVENT.Complete]: 'done',
  [EVENT.Error]: 'failed',
  [EVENT.Cancelled]: 'cancelled',
};

const STATUS_META = {
  [STATUS.Success]: { label: 'Completed', cls: 'ok' },
  [STATUS.Failed]: { label: 'Failed', cls: 'err' },
  [STATUS.Cancelled]: { label: 'Cancelled', cls: 'warn' },
  [STATUS.Incomplete]: { label: 'Incomplete', cls: 'warn' },
};

export function wireDemo(mount) {
  const refs = buildShell(mount);
  let agent = null;
  let stepRows = new Map();

  function resetConsole() {
    clear(refs.plan);
    clear(refs.log);
    clear(refs.summary);
    refs.summaryWrap.classList.remove('show');
    refs.statusPill.className = 'status-pill idle';
    refs.statusPill.textContent = 'idle';
    refs.meta.textContent = 'No plan yet';
    stepRows = new Map();
    refs.logWrap.scrollTop = 0;
  }

  function setBusy(busy) {
    refs.run.disabled = busy;
    refs.stop.disabled = !busy;
    refs.input.disabled = busy;
  }

  function renderPlan(plan) {
    refs.meta.textContent = `${plan.intentTitle} · ${plan.steps.length} steps`;
    for (const step of plan.steps) {
      const icon = (getTool(step.tool) || {}).icon || '•';
      const row = h('li', { class: 'step pending', dataset: { id: step.id } },
        h('span', { class: 'step-icon' }, icon),
        h('div', { class: 'step-body' },
          h('span', { class: 'step-label' }, step.label),
          h('span', { class: 'step-tool' }, step.tool),
        ),
        h('span', { class: 'step-state' }, 'pending'),
      );
      stepRows.set(step.id, row);
      refs.plan.appendChild(row);
    }
  }

  function setState(stepId, state) {
    const row = stepRows.get(stepId);
    if (!row) return;
    const label = state === 'running' ? 'running'
      : state === 'done' ? 'done'
      : state === 'failed' ? 'failed'
      : state === 'cancelled' ? 'stopped'
      : state;
    row.className = `step ${state}`;
    const stateEl = row.querySelector('.step-state');
    if (stateEl) stateEl.textContent = label;
  }

  function addLog(text, tone = '') {
    const line = h('div', { class: `log-line ${tone}` }, text);
    refs.log.appendChild(line);
    refs.logWrap.scrollTop = refs.logWrap.scrollHeight;
  }

  function handleEvent(event) {
    if (event.type === EVENT.Start) {
      setState(event.step.id, 'running');
      refs.statusPill.className = 'status-pill running';
      refs.statusPill.textContent = 'running';
      addLog(`▶ ${event.step.label}`);
      return;
    }
    if (event.type === EVENT.Complete) {
      setState(event.step.id, 'done');
      addLog(`  ✓ ${event.step.tool} — ${event.result.summary}`, 'ok');
      return;
    }
    if (event.type === EVENT.Error) {
      setState(event.step.id, 'failed');
      addLog(`  ✕ ${event.step.label} failed: ${event.error}`, 'err');
      return;
    }
    if (event.type === EVENT.Cancelled) {
      setState(event.step.id, 'cancelled');
      addLog(`  ⊘ stopped at ${event.step.label}`, 'warn');
    }
  }

  function handleDone(result) {
    const { summary } = result;
    const meta = STATUS_META[summary.status] || STATUS_META[STATUS.Incomplete];
    refs.statusPill.className = `status-pill ${meta.cls}`;
    refs.statusPill.textContent = meta.label.toLowerCase();

    clear(refs.summary);
    refs.summary.appendChild(
      h('div', { class: `summary-card ${meta.cls}` },
        h('div', { class: 'summary-head' },
          h('span', { class: `summary-badge ${meta.cls}` }, meta.label),
          h('span', { class: 'summary-intent' }, summary.intentTitle),
        ),
        h('p', { class: 'summary-goal' }, summary.goal),
        h('div', { class: 'summary-stats' },
          stat('Steps', `${summary.completed}/${summary.stepCount}`),
          stat('Artifacts', String(result.artifacts.length)),
          stat('Failed', String(summary.failed)),
        ),
      ),
    );
    refs.summaryWrap.classList.add('show');
    addLog(`◆ run finished — ${meta.label.toLowerCase()}`, meta.cls);
  }

  async function run() {
    const goal = refs.input.value.trim() || PRESETS[0];
    refs.input.value = goal;
    resetConsole();
    setBusy(true);
    agent = new Agent({ delayMs: 220 });
    try {
      await agent.run(goal, {
        onPlan: renderPlan,
        onEvent: handleEvent,
        onDone: handleDone,
      });
    } catch (err) {
      addLog(`✕ ${err.message}`, 'err');
    } finally {
      setBusy(false);
      agent = null;
    }
  }

  function stop() {
    if (agent) agent.abort();
  }

  refs.run.addEventListener('click', run);
  refs.stop.addEventListener('click', stop);
  refs.clear.addEventListener('click', resetConsole);
  refs.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !refs.run.disabled) run();
  });
  refs.presetWrap.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    refs.input.value = chip.textContent.trim();
  });

  // Seed the input and run once so the page is alive on load.
  refs.input.value = PRESETS[0];
  run();
}

function stat(label, value) {
  return h('div', { class: 'stat' },
    h('span', { class: 'stat-value' }, value),
    h('span', { class: 'stat-label' }, label),
  );
}

function buildShell(mount) {
  const input = h('input', {
    class: 'goal-input',
    type: 'text',
    placeholder: 'Describe a task for the agent…',
    'aria-label': 'Agent goal',
  });
  const run = h('button', { class: 'btn btn-primary', type: 'button' }, 'Run agent');
  const stop = h('button', { class: 'btn btn-warn', type: 'button', disabled: true }, 'Stop');
  const clearBtn = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Clear');
  const presetWrap = h('div', { class: 'chips' },
    ...PRESETS.map((p) => h('button', { class: 'chip', type: 'button' }, p)),
  );

  const statusPill = h('span', { class: 'status-pill idle' }, 'idle');
  const meta = h('span', { class: 'console-meta' }, 'No plan yet');
  const plan = h('ol', { class: 'plan' });
  const log = h('div', { class: 'log' });
  const logWrap = h('div', { class: 'log-wrap' }, log);
  const summary = h('div', {});
  const summaryWrap = h('div', { class: 'summary-wrap' }, summary);

  mount.appendChild(
    h('div', { class: 'console' },
      h('div', { class: 'console-controls' },
        h('div', { class: 'goal-row' }, input, run, stop, clearBtn),
        presetWrap,
      ),
      h('div', { class: 'console-head' },
        h('span', { class: 'console-title' }, 'Agent console'),
        meta,
        statusPill,
      ),
      h('div', { class: 'console-body' },
        h('div', { class: 'console-col' },
          h('div', { class: 'col-title' }, 'Plan'),
          plan,
        ),
        h('div', { class: 'console-col' },
          h('div', { class: 'col-title' }, 'Live log'),
          logWrap,
        ),
      ),
      summaryWrap,
    ),
  );

  return {
    input, run, stop, clear: clearBtn, presetWrap,
    plan, log, logWrap, meta, statusPill, summary, summaryWrap,
  };
}
