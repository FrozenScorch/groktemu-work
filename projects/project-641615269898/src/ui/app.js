// Renders the static page shell (nav, hero, features, how-it-works, footer)
// and leaves an empty #demo mount that the demo controller takes over.

import { h } from './dom.js';

const FEATURES = [
  { icon: '⚡', title: 'Truly asynchronous', body: 'Steps run as async tasks with real await boundaries. Cancel mid-run, observe progress, never block the page.' },
  { icon: '🧭', title: 'Transparent planning', body: 'Every goal becomes an explicit, inspectable plan before any work starts. You always see what the agent intends to do.' },
  { icon: '🧰', title: 'Composable tools', body: 'A registry of small, typed tools — analyze, implement, test, deploy — that the planner sequences into a run.' },
  { icon: '🔭', title: 'Observable by default', body: 'A live event stream (start · complete · error · done) drives the console and any other consumer identically.' },
  { icon: '🎯', title: 'Deterministic', body: 'Same goal, same plan. No hidden randomness — the agent behaves the same every time, which makes it trustworthy.' },
  { icon: '🛑', title: 'Cancellable', body: 'An AbortSignal stops the run between steps. The agent reports exactly where it stopped and why.' },
];

const LOOP = [
  { n: '01', title: 'Plan', body: 'The planner maps a natural-language goal to an ordered, typed plan by detecting intent and selecting the right tool sequence.' },
  { n: '02', title: 'Execute', body: 'The executor walks the plan one step at a time, awaiting each tool and emitting lifecycle events into the stream.' },
  { n: '03', title: 'Observe', body: 'The console and any other subscriber render events live. A roll-up summary closes out every run with a clear status.' },
];

export function renderApp(root) {
  root.appendChild(
    h('div', { class: 'page' },
      nav(),
      hero(),
      demo(),
      features(),
      howItWorks(),
      footer(),
    ),
  );
}

function nav() {
  return h('header', { class: 'nav' },
    h('a', { class: 'brand', href: '#top' },
      h('span', { class: 'brand-mark' }, '◐'),
      h('span', {}, 'Async'),
    ),
    h('nav', { class: 'nav-links' },
      h('a', { href: '#demo' }, 'Live demo'),
      h('a', { href: '#features' }, 'Features'),
      h('a', { href: '#how' }, 'How it works'),
    ),
    h('a', { class: 'btn btn-ghost', href: '#demo' }, 'Try the agent'),
  );
}

function hero() {
  return h('section', { class: 'hero', id: 'top' },
    h('div', { class: 'hero-inner' },
      h('span', { class: 'eyebrow' }, 'Autonomous agent runtime'),
      h('h1', { class: 'hero-title' },
        'The AI agent that ',
        h('span', { class: 'grad' }, 'develops, asynchronously'),
        '.',
      ),
      h('p', { class: 'hero-sub' },
        'Async turns a one-line goal into a transparent plan, then executes it step by step as real async tasks — streaming progress as it goes. Watch it plan, run, and ship below.',
      ),
      h('div', { class: 'hero-cta' },
        h('a', { class: 'btn btn-primary', href: '#demo' }, 'Run a live task'),
        h('a', { class: 'btn btn-ghost', href: '#how' }, 'How it works'),
      ),
    ),
  );
}

function demo() {
  return h('section', { class: 'demo-section', id: 'demo' },
    h('div', { class: 'container' },
      h('h2', { class: 'section-title' }, 'Live agent console'),
      h('p', { class: 'section-lede' },
        'Pick a goal or write your own. The agent plans it instantly, then runs each step as an async task. This is the same runtime the tests exercise.',
      ),
      h('div', { id: 'demo', class: 'demo' }),
    ),
  );
}

function features() {
  return h('section', { class: 'features', id: 'features' },
    h('div', { class: 'container' },
      h('h2', { class: 'section-title' }, 'Built for transparent, async work'),
      h('div', { class: 'grid' },
        ...FEATURES.map((f) =>
          h('article', { class: 'card' },
            h('div', { class: 'card-icon' }, f.icon),
            h('h3', {}, f.title),
            h('p', {}, f.body),
          ),
        ),
      ),
    ),
  );
}

function howItWorks() {
  return h('section', { class: 'how', id: 'how' },
    h('div', { class: 'container' },
      h('h2', { class: 'section-title' }, 'Plan, execute, observe'),
      h('div', { class: 'loop' },
        ...LOOP.map((s) =>
          h('div', { class: 'loop-step' },
            h('span', { class: 'loop-n' }, s.n),
            h('h3', {}, s.title),
            h('p', {}, s.body),
          ),
        ),
      ),
    ),
  );
}

function footer() {
  return h('footer', { class: 'footer' },
    h('div', { class: 'container footer-inner' },
      h('span', {},
        h('span', { class: 'brand-mark' }, '◐'),
        ' Async — a demo AI development agent.',
      ),
      h('span', { class: 'footer-note' }, 'Runs entirely in your browser. No backend, no keys.'),
    ),
  );
}
