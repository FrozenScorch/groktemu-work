// The orchestrator. The Agent owns one AbortController for the lifetime of a
// run and stitches the planner + executor + tools together, collecting a
// trace and a roll-up summary. Callers pass hooks (onPlan / onEvent / onDone)
// to react to the stream — the UI uses these to render progress live.

import { EVENT, STATUS } from './constants.js';
import { plan } from './planner.js';
import { runSteps } from './executor.js';
import { executeTool } from './tools.js';

export function summarizeTrace(trace, builtPlan) {
  const started = trace.filter((t) => t.type === EVENT.Start).length;
  const completed = trace.filter((t) => t.type === EVENT.Complete).length;
  const errors = trace.filter((t) => t.type === EVENT.Error).length;
  const cancelled = trace.some((t) => t.type === EVENT.Cancelled);
  const done = trace.some((t) => t.type === EVENT.Done);

  let status = STATUS.Incomplete;
  if (cancelled) status = STATUS.Cancelled;
  else if (errors > 0 && !done) status = STATUS.Failed;
  else if (done) status = STATUS.Success;

  return {
    status,
    intent: builtPlan.intent,
    intentTitle: builtPlan.intentTitle,
    goal: builtPlan.goal,
    stepCount: builtPlan.steps.length,
    started,
    completed,
    failed: errors,
  };
}

export class Agent {
  constructor(options = {}) {
    this.delayMs = options.delayMs ?? 260;
    this.context = options.context ?? {};
    this._controller = new AbortController();
  }

  /** Request cancellation of the current (or next) run. */
  abort() {
    this._controller.abort();
  }

  /**
   * Run the agent against a goal.
   * @param {string} goal
   * @param {object} hooks  optional: { onPlan, onEvent, onDone }
   * @returns {Promise<{plan, trace, artifacts, summary}>}
   */
  async run(goal, hooks = {}) {
    const built = plan(goal);

    // Fresh controller for each run so a prior abort does not leak forward.
    this._controller = new AbortController();
    const ctx = {
      ...this.context,
      delayMs: this.delayMs,
      goal: built.goal,
      signal: hooks.signal ?? this._controller.signal,
    };

    const trace = [{ type: EVENT.Plan, plan: built }];
    const artifacts = [];

    hooks.onPlan?.(built);

    for await (const event of runSteps(built.steps, executeTool, ctx)) {
      trace.push(event);
      if (event.type === EVENT.Complete && Array.isArray(event.result?.artifacts)) {
        artifacts.push(...event.result.artifacts);
      }
      hooks.onEvent?.(event);
    }

    const summary = summarizeTrace(trace, built);
    const result = { plan: built, trace, artifacts, summary };
    hooks.onDone?.(result);
    return result;
  }
}
