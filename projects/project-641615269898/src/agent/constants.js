// Shared event and status enumerations for the agent runtime.
// Keeping these in one place avoids import cycles between the
// planner, executor, and orchestrator.

export const EVENT = Object.freeze({
  Plan: 'plan',
  Start: 'start',
  Complete: 'complete',
  Error: 'error',
  Cancelled: 'cancelled',
  Done: 'done',
});

export const STATUS = Object.freeze({
  Success: 'success',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Incomplete: 'incomplete',
});

// Ordered most-specific first. The planner walks this list top to bottom and
// picks the first intent whose keywords appear in the goal, so put narrower
// intents (deploy, debug) above broader ones (feature) that would otherwise
// swallow them.
export const INTENTS = [
  {
    id: 'deploy',
    title: 'Deployment',
    keywords: ['deploy', 'release', 'rollout', 'ship to prod', 'publish to production', 'go live'],
    steps: [
      { tool: 'analyze', label: 'Analyze the deployment target' },
      { tool: 'implement', label: 'Build the release artifact' },
      { tool: 'test', label: 'Run the pre-deploy test suite' },
      { tool: 'deploy', label: 'Deploy to production' },
      { tool: 'verify', label: 'Run production smoke checks' },
      { tool: 'summarize', label: 'Publish a release summary' },
    ],
  },
  {
    id: 'debug',
    title: 'Debugging',
    keywords: ['bug', 'fix', 'debug', 'broken', 'crash', 'flaky', 'error', 'regression', 'not working'],
    steps: [
      { tool: 'research', label: 'Reproduce the reported issue' },
      { tool: 'analyze', label: 'Investigate the root cause' },
      { tool: 'patch', label: 'Implement the fix' },
      { tool: 'test', label: 'Cover the fix with tests' },
      { tool: 'verify', label: 'Confirm the issue is resolved' },
    ],
  },
  {
    id: 'research',
    title: 'Research',
    keywords: ['research', 'investigate', 'explore', 'compare', 'analyze', 'evaluate', 'survey'],
    steps: [
      { tool: 'research', label: 'Gather relevant sources' },
      { tool: 'analyze', label: 'Analyze the findings' },
      { tool: 'summarize', label: 'Distill the key insights' },
      { tool: 'report', label: 'Compile the final report' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    keywords: ['blog', 'article', 'write', 'draft', 'post', 'essay', 'newsletter', 'copy'],
    steps: [
      { tool: 'spec', label: 'Outline the piece' },
      { tool: 'design', label: 'Draft the content' },
      { tool: 'document', label: 'Edit and refine' },
      { tool: 'publish', label: 'Publish the content' },
    ],
  },
  {
    id: 'feature',
    title: 'Feature build',
    keywords: ['feature', 'build', 'add', 'implement', 'create', 'make', 'develop', 'integrate', 'support'],
    steps: [
      { tool: 'spec', label: 'Define the specification' },
      { tool: 'design', label: 'Design the approach' },
      { tool: 'implement', label: 'Implement the change' },
      { tool: 'test', label: 'Write and run tests' },
      { tool: 'document', label: 'Update the documentation' },
      { tool: 'verify', label: 'Verify the outcome' },
    ],
  },
];

export const FALLBACK_INTENT = {
  id: 'general',
  title: 'General task',
  keywords: [],
  steps: [
    { tool: 'research', label: 'Understand the request' },
    { tool: 'analyze', label: 'Plan the approach' },
    { tool: 'implement', label: 'Execute the work' },
    { tool: 'test', label: 'Validate the result' },
    { tool: 'verify', label: 'Review and confirm' },
  ],
};
