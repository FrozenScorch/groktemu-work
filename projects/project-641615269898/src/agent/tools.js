// The tool registry. Each tool simulates a unit of asynchronous work the
// agent can perform, returning a short summary plus optional "artifacts".
// Tools are pure functions of their arguments — no randomness — so their
// outputs are stable and assertable. The simulated latency is driven by
// ctx.delayMs so tests can run at full speed and the UI can stream visibly.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const wait = (ctx) => (ctx && ctx.delayMs ? delay(ctx.delayMs) : Promise.resolve());

const pickGoal = (args) => args?.goal ?? 'the request';

const esc = (s) => String(s).replace(/"/g, "'");

function artifact(kind, body) {
  return { kind, body };
}

const TOOLS = [
  {
    name: 'spec',
    icon: '📋',
    title: 'Spec',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Drafted a specification for "${esc(goal)}".`,
        artifacts: [
          artifact('spec', `Goal: ${goal}\nScope: client + api\nAcceptance: meets the stated objective`),
        ],
      };
    },
  },
  {
    name: 'research',
    icon: '🔍',
    title: 'Research',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Gathered 5 sources relevant to "${esc(goal)}".`,
        artifacts: [artifact('sources', '1. internal docs\n2. upstream changelog\n3. community thread\n4. benchmark\n5. prior incident')],
      };
    },
  },
  {
    name: 'analyze',
    icon: '🧠',
    title: 'Analyze',
    async run(args, ctx) {
      await wait(ctx);
      return { ok: true, summary: 'Identified 3 key factors and ranked them by impact.', artifacts: [] };
    },
  },
  {
    name: 'design',
    icon: '🎨',
    title: 'Design',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Proposed an approach for "${esc(goal)}".`,
        artifacts: [artifact('design', `Approach: incremental, behind a feature flag.\nRisks: rollback path documented.`)],
      };
    },
  },
  {
    name: 'implement',
    icon: '⚙️',
    title: 'Implement',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Wrote the implementation for "${esc(goal)}".`,
        artifacts: [artifact('code', `// ${goal}\nexport function handle() {\n  return { ok: true };\n}`)],
      };
    },
  },
  {
    name: 'patch',
    icon: '🩹',
    title: 'Patch',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Applied a patch addressing "${esc(goal)}".`,
        artifacts: [artifact('patch', `diff --git a/src/handler.js\n-  throw new Error()\n+  return recover()`)],
      };
    },
  },
  {
    name: 'test',
    icon: '🧪',
    title: 'Test',
    async run(args, ctx) {
      await wait(ctx);
      return {
        ok: true,
        summary: 'Ran the test suite — 12 passed, 0 failed.',
        artifacts: [artifact('metrics', 'passed: 12\nfailed: 0\nduration: 1.4s')],
      };
    },
  },
  {
    name: 'document',
    icon: '📝',
    title: 'Document',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return { ok: true, summary: `Updated the documentation for "${esc(goal)}".`, artifacts: [] };
    },
  },
  {
    name: 'deploy',
    icon: '🚀',
    title: 'Deploy',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Deployed "${esc(goal)}" to production.`,
        artifacts: [artifact('release', 'region: global\nversion: 1.4.0\nstrategy: blue-green')],
      };
    },
  },
  {
    name: 'verify',
    icon: '✅',
    title: 'Verify',
    async run(args, ctx) {
      await wait(ctx);
      return { ok: true, summary: 'Verification passed — all checks green.', artifacts: [] };
    },
  },
  {
    name: 'summarize',
    icon: '📌',
    title: 'Summarize',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return { ok: true, summary: `Summarized the work on "${esc(goal)}" for stakeholders.`, artifacts: [] };
    },
  },
  {
    name: 'publish',
    icon: '📤',
    title: 'Publish',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return { ok: true, summary: `Published "${esc(goal)}".`, artifacts: [artifact('url', 'https://example.com/posts/latest')] };
    },
  },
  {
    name: 'report',
    icon: '📊',
    title: 'Report',
    async run(args, ctx) {
      await wait(ctx);
      const goal = pickGoal(args);
      return {
        ok: true,
        summary: `Compiled a report on "${esc(goal)}".`,
        artifacts: [artifact('report', 'Sections: summary, findings, recommendations, appendix.')],
      };
    },
  },
];

const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

export const TOOL_NAMES = TOOLS.map((t) => t.name);

export function getTool(name) {
  return TOOL_MAP.get(name);
}

export async function executeTool(name, args, ctx) {
  const tool = TOOL_MAP.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.run(args, ctx);
}
