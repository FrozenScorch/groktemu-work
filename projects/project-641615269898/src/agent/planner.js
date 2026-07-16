// The planner turns a natural-language goal into an ordered, typed plan.
// It is intentionally deterministic: the same goal always yields the same
// sequence of steps, which makes the agent's behavior easy to test and
// reason about. The "intelligence" is keyword-based intent detection —
// good enough for a transparent, inspectable demo agent.

import { INTENTS, FALLBACK_INTENT } from './constants.js';

let planCounter = 0;

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'task';

/**
 * Return the first intent whose keywords appear in the goal, else the
 * fallback intent. Exported for testing and for surfacing in the UI.
 */
export function detectIntent(goal) {
  const haystack = String(goal).toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some((kw) => haystack.includes(kw))) {
      return intent;
    }
  }
  return FALLBACK_INTENT;
}

/**
 * Build a plan for a goal. Throws if the goal is empty so callers cannot
 * accidentally start a run with nothing to do.
 */
export function plan(goal) {
  const trimmed = typeof goal === 'string' ? goal.trim() : '';
  if (!trimmed) {
    throw new Error('Goal must be a non-empty string');
  }

  const intent = detectIntent(trimmed);
  planCounter += 1;

  const steps = intent.steps.map((step, index) => ({
    id: `${intent.id}-${index + 1}`,
    index,
    tool: step.tool,
    label: step.label,
    args: { goal: trimmed },
  }));

  return {
    id: `plan-${slugify(trimmed)}-${planCounter}`,
    goal: trimmed,
    intent: intent.id,
    intentTitle: intent.title,
    steps,
  };
}

export function resetPlanCounter() {
  // Helper used by tests to keep plan ids stable within a suite.
  planCounter = 0;
}
