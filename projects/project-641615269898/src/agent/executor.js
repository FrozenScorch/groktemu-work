// The executor walks a plan's steps one at a time, emitting lifecycle events
// as an async generator. It owns the runtime concerns the planner does not:
// cancellation (via AbortSignal), error policy, and per-step ordering. The
// agent orchestrator and the UI both consume the same stream of events, so
// the live demo and the test harness see identical behavior.

import { EVENT } from './constants.js';

/**
 * @param {Array} steps          Ordered steps produced by the planner.
 * @param {Function} executeTool  (toolName, args, ctx) => Promise<result>
 * @param {object} ctx           Runtime context: { goal, delayMs, signal, stopOnError }
 */
export async function* runSteps(steps, executeTool, ctx = {}) {
  const signal = ctx.signal;
  const stopOnError = ctx.stopOnError !== false; // default: stop on first error

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];

    if (signal && signal.aborted) {
      yield { type: EVENT.Cancelled, step, index };
      return;
    }

    yield { type: EVENT.Start, step, index };

    try {
      const result = await executeTool(step.tool, { goal: ctx.goal, ...step.args }, ctx);
      yield { type: EVENT.Complete, step, index, result };
    } catch (err) {
      yield { type: EVENT.Error, step, index, error: err && err.message ? err.message : String(err) };
      if (stopOnError) {
        return;
      }
    }
  }

  yield { type: EVENT.Done };
}
