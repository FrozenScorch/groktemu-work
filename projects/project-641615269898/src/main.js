// App entry point. Renders the static page shell, then wires the interactive
// agent demo into its mount. Loaded as an ES module; the production build
// bundles this (and everything it imports) into a single file.

import { renderApp } from './ui/app.js';
import { wireDemo } from './ui/demo.js';

const root = document.getElementById('app');
renderApp(root);
wireDemo(document.getElementById('demo'));
